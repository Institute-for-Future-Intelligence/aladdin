/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cone, Cylinder, Line, Plane, Ring, Sphere } from '@react-three/drei';
import {
  CanvasTexture,
  DoubleSide,
  Euler,
  Mesh,
  Raycaster,
  RepeatWrapping,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { useStore } from '../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../constants';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  TrackerType,
} from '../types';
import { Util } from '../Util';
import { SolarPanelModel } from '../models/SolarPanelModel';
import SolarPanelBlueLandscapeImage from '../resources/solar-panel-blue-landscape.png';
import SolarPanelBluePortraitImage from '../resources/solar-panel-blue-portrait.png';
import SolarPanelBlackLandscapeImage from '../resources/solar-panel-black-landscape.png';
import SolarPanelBlackPortraitImage from '../resources/solar-panel-black-portrait.png';
import { getSunDirection } from '../analysis/sunTools';
import RotateHandle from '../components/rotateHandle';
import Wireframe from '../components/wireframe';
import { UndoableChange } from '../undo/UndoableChange';
import i18n from '../i18n/i18n';
import { LineData } from './LineData';

const SolarPanel = ({
  id,
  pvModelName,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz,
  tiltAngle,
  relativeAzimuth,
  trackerType = TrackerType.NO_TRACKER,
  poleHeight,
  poleRadius,
  poleSpacing,
  drawSunBeam,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.1,
  selected = false,
  showLabel = false,
  locked = false,
  parentId,
  orientation = Orientation.portrait,
}: SolarPanelModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const getPvModule = useStore(Selector.getPvModule);
  const sceneRadius = useStore(Selector.sceneRadius);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const addUndoable = useStore(Selector.addUndoable);

  const {
    gl: { domElement },
    camera,
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [nx, setNx] = useState(1);
  const [ny, setNy] = useState(1);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [faceUp, setFaceUp] = useState<boolean>();
  const [updateFlag, setUpdateFlag] = useState(false);
  const baseRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const tiltHandleRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);
  const oldTiltAngleRef = useRef<number>(0);
  const newTiltAngleRef = useRef<number>(0);
  const solarPanelLinesRef = useRef<LineData[]>();
  const ray = useMemo(() => new Raycaster(), []);

  const sunBeamLength = Math.max(100, 5 * sceneRadius);
  const panelNormal = new Vector3().fromArray(normal);
  const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');
  const lang = { lng: language };

  if (parentId) {
    const p = getElementById(parentId);
    if (p) {
      switch (p.type) {
        case ObjectType.Foundation:
          cz = poleHeight + lz / 2 + p.lz;
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, 0);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
          }
          break;
        case ObjectType.Cuboid:
          if (Util.isZero(rotation[2])) {
            cx = p.cx + cx * p.lx;
            cy = p.cy + cy * p.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * p.lx, cy * p.ly, cz * p.lz);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = p.cx + v.x;
            cy = p.cy + v.y;
          }
          if (Util.isSame(panelNormal, UNIT_VECTOR_POS_Z)) {
            cz = poleHeight + lz / 2 + p.lz;
          } else {
            cz = p.cz + cz * p.lz;
          }
          break;
      }
    }
  }

  if (pvModel) {
    lz = pvModel.thickness;
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = new Vector3(-hx, -hy, hz);
  const positionUL = new Vector3(-hx, hy, hz);
  const positionLR = new Vector3(hx, -hy, hz);
  const positionUR = new Vector3(hx, hy, hz);
  const solarPanel = getElementById(id) as SolarPanelModel;

  useEffect(() => {
    if (solarPanel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(solarPanel.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    if (pvModel) {
      let mx, my;
      if (orientation === Orientation.portrait) {
        mx = Math.max(1, Math.round(lx / pvModel.width));
        my = Math.max(1, Math.round(ly / pvModel.length));
      } else {
        mx = Math.max(1, Math.round(lx / pvModel.length));
        my = Math.max(1, Math.round(ly / pvModel.width));
      }
      setNx(mx);
      setNy(my);
      solarPanelLinesRef.current = [];
      const dx = lx / mx;
      const dy = ly / my;
      for (let i = 1; i < mx; i++) {
        solarPanelLinesRef.current.push({
          points: [new Vector3(-hx + i * dx, -hy, lz), new Vector3(-hx + i * dx, hy, lz)],
        } as LineData);
      }
      for (let i = 1; i < my; i++) {
        solarPanelLinesRef.current.push({
          points: [new Vector3(-hx, -hy + i * dy, lz), new Vector3(hx, -hy + i * dy, lz)],
        } as LineData);
      }
    }
  }, [orientation, pvModelName, lx, ly, lz]);

  useEffect(() => {
    const handlePointerUp = () => {
      useStoreRef.getState().setEnableOrbitController(true);
      pointerDown.current = false;
      setShowTiltAngle(false);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    setFaceUp(Util.isSame(panelNormal, UNIT_VECTOR_POS_Z));
  }, [normal]);

  const labelText = useMemo(() => {
    return (
      (solarPanel?.label ? solarPanel.label : i18n.t('shared.SolarPanelElement', lang)) +
      (solarPanel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (solarPanel?.label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          cx.toFixed(1) +
          ', ' +
          cy.toFixed(1) +
          ', ' +
          cz.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang))
    );
  }, [solarPanel?.label, locked, language, cx, cy, cz]);

  const texture = useMemo(() => {
    const loader = new TextureLoader();
    let tex;
    switch (orientation) {
      case Orientation.portrait:
        tex = loader.load(
          pvModel?.color === 'Blue' ? SolarPanelBluePortraitImage : SolarPanelBlackPortraitImage,
          (t) => {
            t.wrapS = t.wrapT = RepeatWrapping;
            t.offset.set(0, 0);
            t.repeat.set(nx, ny);
            setUpdateFlag(!updateFlag);
          },
        );
        break;
      default:
        tex = loader.load(
          pvModel?.color === 'Blue' ? SolarPanelBlueLandscapeImage : SolarPanelBlackLandscapeImage,
          (t) => {
            t.wrapS = t.wrapT = RepeatWrapping;
            t.offset.set(0, 0);
            t.repeat.set(nx, ny);
            setUpdateFlag(!updateFlag);
          },
        );
    }
    return tex;
  }, [orientation, pvModel?.color, nx, ny]);

  const euler = useMemo(() => {
    // east face in model coordinate system
    if (Util.isSame(panelNormal, UNIT_VECTOR_POS_X)) {
      return new Euler(HALF_PI, 0, rotation[2] + HALF_PI, 'ZXY');
    }
    // west face in model coordinate system
    if (Util.isSame(panelNormal, UNIT_VECTOR_NEG_X)) {
      return new Euler(HALF_PI, 0, rotation[2] - HALF_PI, 'ZXY');
    }
    // north face in the model coordinate system
    if (Util.isSame(panelNormal, UNIT_VECTOR_POS_Y)) {
      return new Euler(HALF_PI, 0, rotation[2] + Math.PI, 'ZXY');
    }
    // south face in the model coordinate system
    if (Util.isSame(panelNormal, UNIT_VECTOR_NEG_Y)) {
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    // top face in model coordinate system
    return new Euler(0, 0, rotation[2], 'ZXY');
  }, [normal, rotation]);

  const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        setHoveredHandle(handle);
        if (handle === MoveHandleType.Top) {
          domElement.style.cursor = 'move';
        } else if (
          handle === RotateHandleType.Lower ||
          handle === RotateHandleType.Upper ||
          handle === RotateHandleType.Tilt
        ) {
          domElement.style.cursor = 'grab';
        } else {
          domElement.style.cursor = 'pointer';
        }
      }
    }
  };

  const noHoverHandle = () => {
    setHoveredHandle(null);
    domElement.style.cursor = 'default';
  };

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);
  const rot = getElementById(parentId)?.rotation[2];
  const rotatedSunDirection = rot ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot) : sunDirection;

  const relativeEuler = useMemo(() => {
    if (Util.isSame(panelNormal, UNIT_VECTOR_POS_Z)) {
      if (sunDirection.z > 0) {
        switch (trackerType) {
          case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
            const r = Math.hypot(rotatedSunDirection.x, rotatedSunDirection.y);
            return new Euler(
              Math.atan2(r, rotatedSunDirection.z),
              0,
              Math.atan2(rotatedSunDirection.y, rotatedSunDirection.x) + HALF_PI,
              'ZXY',
            );
          case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
            return new Euler(0, Math.atan2(rotatedSunDirection.x, rotatedSunDirection.z), 0, 'ZXY');
          case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
            return new Euler(tiltAngle, 0, Math.atan2(rotatedSunDirection.y, rotatedSunDirection.x) + HALF_PI, 'ZXY');
        }
      }
      return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
    }
    return new Euler();
  }, [trackerType, sunDirection, tiltAngle, relativeAzimuth, normal]);

  const normalVector = useMemo(() => {
    const v = new Vector3();
    return drawSunBeam
      ? v
          .fromArray(normal)
          .applyEuler(new Euler(relativeEuler.x, relativeEuler.y, relativeEuler.z + rotation[2], 'ZXY'))
      : v;
  }, [drawSunBeam, normal, euler, relativeEuler]);

  const poleZ = -poleHeight / 2 - lz / 2;

  const poles = useMemo<Vector3[]>(() => {
    const poleArray: Vector3[] = [];
    const poleNx = Math.floor((0.5 * lx) / poleSpacing);
    const poleNy = Math.floor((0.5 * ly * Math.abs(Math.cos(tiltAngle))) / poleSpacing);
    const sinTilt = 0.5 * Math.sin(tiltAngle);
    const cosAz = Math.cos(relativeAzimuth) * poleSpacing;
    const sinAz = Math.sin(relativeAzimuth) * poleSpacing;
    for (let ix = -poleNx; ix <= poleNx; ix++) {
      for (let iy = -poleNy; iy <= poleNy; iy++) {
        const xi = ix * cosAz - iy * sinAz;
        const yi = ix * sinAz + iy * cosAz;
        poleArray.push(new Vector3(xi, yi, poleZ + sinTilt * poleSpacing * iy));
      }
    }
    return poleArray;
  }, [relativeAzimuth, tiltAngle, poleSpacing, lx, ly, poleZ]);

  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const rotateHandleSize = (baseSize * 2) / 3;
  const tiltHandleSize = rotateHandleSize;

  const degree = new Array(13).fill(0);
  const [showTiltAngle, setShowTiltAngle] = useState(false);

  return (
    <group name={'Solar Panel Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw panel */}
        <Box
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={baseRef}
          args={[lx, ly, lz]}
          name={'Solar Panel'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.Select);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === baseRef.current;
                if (intersected) {
                  state.contextMenuObjectType = ObjectType.SolarPanel;
                }
              }
            });
          }}
          onPointerOver={(e) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                setHovered(true);
                domElement.style.cursor = 'move';
              }
            }
          }}
          onPointerOut={(e) => {
            setHovered(false);
            domElement.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          <meshStandardMaterial attachArray="material" color={color} />
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial attachArray="material" map={heatmapTexture} />
          ) : (
            <meshStandardMaterial attachArray="material" map={texture} />
          )}
          <meshStandardMaterial attachArray="material" color={color} />
        </Box>

        {showSolarRadiationHeatmap &&
          heatmapTexture &&
          solarPanelLinesRef.current &&
          solarPanelLinesRef.current.map((lineData, index) => {
            return (
              <Line
                name={'Solar Panel Lines'}
                key={index}
                userData={{ unintersectable: true }}
                points={lineData.points}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.2}
                color={'black'}
              />
            );
          })}

        {/* simulation panel */}
        <Plane
          name={'Solar Panel Simulation Plane'}
          uuid={id}
          args={[lx, ly]}
          userData={{ simulation: true }}
          receiveShadow={false}
          castShadow={false}
          visible={false}
        >
          <meshBasicMaterial side={DoubleSide} />
        </Plane>

        {/* highlight it when it is selected but locked */}
        {selected && locked && (
          <Line
            name={'Selection highlight lines'}
            userData={{ unintersectable: true }}
            points={[
              [-hx, -hy, 0],
              [-hx, hy, 0],
              [hx, hy, 0],
              [hx, -hy, 0],
              [-hx, -hy, 0],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={2}
            color={LOCKED_ELEMENT_SELECTION_COLOR}
          />
        )}

        {/* move & resize handles */}
        {selected && !locked && (
          <>
            {/* draw move handle */}
            <Sphere
              ref={moveHandleRef}
              position={new Vector3(0, 0, 0)}
              args={[moveHandleSize, 6, 6]}
              name={MoveHandleType.Default}
              onPointerOver={(e) => {
                hoverHandle(e, MoveHandleType.Top);
              }}
              onPointerOut={(e) => {
                noHoverHandle();
              }}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Move);
              }}
            >
              <meshStandardMaterial attach="material" color={'orange'} />
            </Sphere>

            {/* draw resize handles */}
            <group>
              <Box
                ref={resizeHandleLowerRef}
                position={[(positionLL.x + positionLR.x) / 2, positionLL.y, positionLL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Lower}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleLowerRef.current!.localToWorld(new Vector3(0, ly, -positionLL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Lower);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Lower || resizeHandleType === ResizeHandleType.Lower
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleUpperRef}
                position={[(positionUL.x + positionUR.x) / 2, positionUL.y, positionUL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Upper}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleUpperRef.current!.localToWorld(new Vector3(0, -ly, -positionUL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Upper);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Upper || resizeHandleType === ResizeHandleType.Upper
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleLeftRef}
                position={[positionLL.x, (positionLL.y + positionUL.y) / 2, positionLL.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Left}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleLeftRef.current!.localToWorld(new Vector3(lx, 0, -positionLL.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Left);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Left
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
              <Box
                ref={resizeHandleRightRef}
                position={[positionLR.x, (positionLR.y + positionUR.y) / 2, positionLR.z]}
                args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                name={ResizeHandleType.Right}
                onPointerDown={(e) => {
                  selectMe(id, e, ActionType.Resize);
                  if (resizeHandleLeftRef.current) {
                    setCommonStore((state) => {
                      const anchor = resizeHandleRightRef.current!.localToWorld(new Vector3(-lx, 0, -positionLR.z));
                      state.resizeAnchor.copy(anchor);
                    });
                  }
                }}
                onPointerOver={(e) => {
                  hoverHandle(e, ResizeHandleType.Right);
                }}
                onPointerOut={(e) => {
                  noHoverHandle();
                }}
              >
                <meshStandardMaterial
                  attach="material"
                  color={
                    hoveredHandle === ResizeHandleType.Right || resizeHandleType === ResizeHandleType.Right
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                />
              </Box>
            </group>
          </>
        )}

        {/* wireframe */}
        {!selected && <Wireframe hx={hx} hy={hy} hz={hz} lineColor={lineColor} lineWidth={lineWidth} />}
      </group>

      {/* draw rotate handles */}
      {selected && !locked && trackerType === TrackerType.NO_TRACKER && faceUp && (
        <group position={[0, 0, -poleHeight]} rotation={[0, 0, relativeEuler.z]}>
          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={[0, -hy - rotateHandleSize / 2, poleHeight]}
            color={
              hoveredHandle === RotateHandleType.Upper || rotateHandleType === RotateHandleType.Upper
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={[0, hy + rotateHandleSize / 2, poleHeight]}
            color={
              hoveredHandle === RotateHandleType.Lower || rotateHandleType === RotateHandleType.Lower
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Lower}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </group>
      )}

      {/* draw tilt handles */}
      {selected && !locked && trackerType === TrackerType.NO_TRACKER && faceUp && Math.abs(poleHeight) > 0.1 && (
        <>
          {/* ring handles */}
          <Ring
            name={RotateHandleType.Tilt}
            args={[tiltHandleSize, 1.1 * tiltHandleSize, 18, 2, -HALF_PI, Math.PI]}
            rotation={[0, -HALF_PI, relativeEuler.z, 'ZXY']}
            onPointerOver={(e) => {
              hoverHandle(e, RotateHandleType.Tilt);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
            onPointerDown={(e) => {
              setShowTiltAngle(true);
              if (hoveredHandle) {
                useStoreRef.getState().setEnableOrbitController(false);
                pointerDown.current = true;
                const sp = getElementById(id) as SolarPanelModel;
                oldTiltAngleRef.current = sp.tiltAngle;
              }
              setCommonStore((state) => {
                state.rotateHandleType = RotateHandleType.Tilt;
              });
            }}
          >
            <meshStandardMaterial
              side={DoubleSide}
              color={
                hoveredHandle === RotateHandleType.Tilt || showTiltAngle ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
              }
            />
          </Ring>
          {showTiltAngle && (
            <>
              {/* intersection plane */}
              <Ring
                ref={tiltHandleRef}
                name={'Solar panel tilt handle'}
                args={[tiltHandleSize, 2 * tiltHandleSize, 18, 2, -HALF_PI, Math.PI]}
                rotation={[0, -HALF_PI, relativeEuler.z, 'ZXY']}
                onPointerDown={(e) => {}}
                onPointerUp={(e) => {
                  if (Math.abs(newTiltAngleRef.current - oldTiltAngleRef.current) > ZERO_TOLERANCE) {
                    const undoableChange = {
                      name: 'Set Solar Panel Array Tilt Angle',
                      timestamp: Date.now(),
                      oldValue: oldTiltAngleRef.current,
                      newValue: newTiltAngleRef.current,
                      changedElementId: id,
                      undo: () => {
                        updateSolarPanelTiltAngleById(
                          undoableChange.changedElementId,
                          undoableChange.oldValue as number,
                        );
                      },
                      redo: () => {
                        updateSolarPanelTiltAngleById(
                          undoableChange.changedElementId,
                          undoableChange.newValue as number,
                        );
                      },
                    } as UndoableChange;
                    addUndoable(undoableChange);
                  }
                }}
                onPointerMove={(e) => {
                  if (pointerDown.current) {
                    const mouse = new Vector2();
                    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                    ray.setFromCamera(mouse, camera);
                    if (tiltHandleRef.current) {
                      const intersects = ray.intersectObjects([tiltHandleRef.current]);
                      if (intersects.length > 0) {
                        const p = intersects[0].point;
                        const parent = tiltHandleRef.current.parent;
                        if (parent) {
                          const ov = parent.position; // rotate point in world coordinate
                          const cv = new Vector3().subVectors(p, ov);
                          let angle = cv.angleTo(UNIT_VECTOR_POS_Z);
                          const touch = 0.5 * solarPanel.ly * Math.abs(Math.sin(angle)) > solarPanel.poleHeight;
                          if (!touch) {
                            const wr = relativeAzimuth + rotation[2];
                            const sign =
                              wr % Math.PI === 0
                                ? Math.sign(-cv.y) * Math.sign(Math.cos(wr))
                                : Math.sign(cv.x) * Math.sign(Math.sin(wr));
                            angle *= sign;
                            updateSolarPanelTiltAngleById(id, angle);
                            newTiltAngleRef.current = angle;
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <meshStandardMaterial depthTest={false} transparent={true} opacity={0.5} side={DoubleSide} />
              </Ring>
              {/* pointer */}
              <Line
                points={[
                  [0, 0, tiltHandleSize],
                  [0, 0, 1.75 * tiltHandleSize],
                ]}
                rotation={new Euler(tiltAngle, 0, relativeEuler.z, 'ZXY')}
                lineWidth={1}
              />
              {/* scale */}
              {degree.map((e, i) => {
                return (
                  <group key={i} rotation={new Euler((Math.PI / 12) * i - HALF_PI, 0, relativeEuler.z, 'ZXY')}>
                    <Line
                      points={[
                        [0, 0, 1.8 * tiltHandleSize],
                        [0, 0, 2 * tiltHandleSize],
                      ]}
                      color={'white'}
                      transparent={true}
                      opacity={0.5}
                    />
                    <textSprite
                      userData={{ unintersectable: true }}
                      text={`${i * 15 - 90}°`}
                      fontSize={20 * tiltHandleSize}
                      fontFace={'Times Roman'}
                      textHeight={0.15 * tiltHandleSize}
                      position={[0, 0, 1.6 * tiltHandleSize]}
                    />
                  </group>
                );
              })}
              {/* show current degree */}
              <group rotation={new Euler(tiltAngle, 0, relativeEuler.z, 'ZXY')}>
                <textSprite
                  userData={{ unintersectable: true }}
                  text={`${Math.floor((tiltAngle / Math.PI) * 180)}°`}
                  fontSize={20 * tiltHandleSize}
                  fontFace={'Times Roman'}
                  textHeight={0.2 * tiltHandleSize}
                  position={[0, 0, 0.75 * tiltHandleSize]}
                />
              </group>
            </>
          )}
        </>
      )}

      {/* draw poles */}
      {poleHeight > 0 &&
        faceUp &&
        poles.map((p, i) => {
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Pole ' + i}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              args={[poleRadius, poleRadius, poleHeight + (p.z - poleZ) * 2 + lz, 6, 2]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}

      {/*draw sun beam*/}
      {drawSunBeam && sunDirection.z > 0 && (
        <group rotation={[-euler.x, 0, -euler.z]}>
          <Line
            userData={{ unintersectable: true }}
            points={[[0, 0, 0], sunDirection.clone().multiplyScalar(sunBeamLength)]}
            name={'Sun Beam'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[[0, 0, 0], normalVector.clone().multiplyScalar(0.75)]}
            name={'Normal Vector'}
            lineWidth={0.5}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[sunDirection.clone().multiplyScalar(0.5), normalVector.clone().multiplyScalar(0.5)]}
            name={'Angle'}
            lineWidth={0.5}
            color={'white'}
          />
          <textSprite
            userData={{ unintersectable: true }}
            name={'Angle Value'}
            text={Util.toDegrees(sunDirection.angleTo(normalVector)).toFixed(1) + '°'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.1}
            position={sunDirection
              .clone()
              .multiplyScalar(0.75)
              .add(normalVector.clone().multiplyScalar(0.75))
              .multiplyScalar(0.5)}
          />
          <group
            position={normalVector.clone().multiplyScalar(0.75)}
            rotation={[HALF_PI + euler.x + relativeEuler.x, 0, euler.z + relativeEuler.z, 'ZXY']}
          >
            <Cone
              userData={{ unintersectable: true }}
              args={[0.04, 0.2, 4, 2]}
              name={'Normal Vector Arrow Head'}
              rotation={[0, 0, -relativeEuler.y]}
            >
              <meshStandardMaterial attach="material" color={'white'} />
            </Cone>
          </group>
        </group>
      )}

      {/*draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          text={labelText}
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, Math.max(hy * Math.abs(Math.sin(solarPanel.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default SolarPanel;
