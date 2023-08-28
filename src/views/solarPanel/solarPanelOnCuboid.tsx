import { Box, Cone, Cylinder, Line, Plane, Ring, Sphere } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getSunDirection } from 'src/analysis/sunTools';
import RotateHandle from 'src/components/rotateHandle';
import {
  DEFAULT_SOLAR_PANEL_SHININESS,
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  SOLAR_PANEL_BLACK_SPECULAR,
  SOLAR_PANEL_BLUE_SPECULAR,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from 'src/constants';
import i18n from 'src/i18n/i18n';
import { ElementModel } from 'src/models/ElementModel';
import { PvModel } from 'src/models/PvModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useRefStore } from 'src/stores/commonRef';
import {
  ActionType,
  BoxArgs,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  TrackerType,
} from 'src/types';
import { UndoableChange } from 'src/undo/UndoableChange';
import { Util } from 'src/Util';
import { Euler, Vector3, Mesh, DoubleSide, Color, FrontSide } from 'three';
import * as Selector from '../../stores/selector';
import { LineData } from '../LineData';
import { useSolarPanelHeatmapTexture, useSolarPanelTexture } from './hooks';

interface SolarPanelBoxGroupProps {
  solarPanelModel: SolarPanelModel;
  groupRotation: Euler;
  panelRotation: Euler;
}

interface SunbeamProps {
  sunDirection: Vector3;
}

const HANDLE_GROUP_NAME = 'Handle Group Move & Resize';

const SolarPanelOnCuboid = (solarPanelModel: SolarPanelModel) => {
  const {
    id,
    parentId,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz,
    normal,
    selected,
    locked,
    trackerType,
    tiltAngle,
    relativeAzimuth,
    poleHeight,
    poleRadius,
    poleSpacing,
    color = 'white',
  } = solarPanelModel;

  const isTop = isSolarPanelOnTopFace(normal);

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const actualPoleHeight = isTop ? poleHeight : 0;
  const baseSize = Math.max(1, (lx + ly) / 16);
  const rotateHandleSize = (baseSize * 2) / 3;
  const tiltHandleSize = (baseSize * 2) / 3;
  const poleZ = -poleHeight / 2 - lz / 2;

  const setCommonStore = useStore(Selector.set);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const addUndoable = useStore(Selector.addUndoable);

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);

  const {
    gl: { domElement },
    camera,
    raycaster,
    mouse,
  } = useThree();

  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [showTiltAngle, setShowTiltAngle] = useState(false);

  const pointerDown = useRef<boolean>(false);
  const oldTiltAngleRef = useRef<number>(0);
  const newTiltAngleRef = useRef<number>(0);
  const parentWorldPositionRef = useRef<Vector3 | null>(null);
  const parentWorldRotationRef = useRef<number | null>(null);

  const tiltHandleRef = useRef<Mesh>();

  const degree = useMemo(() => new Array(13).fill(0), []);
  const dateObject = useMemo(() => new Date(date), [date]);

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

  const groupRotation = useMemo(() => getRotationFromNormal(normal), [normal]);

  const panelRotation = useMemo(() => {
    if (isTop) {
      if (trackerType === TrackerType.NO_TRACKER) {
        return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
      }
      const sunDirection = getSunDirection(dateObject, latitude);
      const rot = getWorldRotationZ(parentId, groupRotation.z) - groupRotation.z;
      switch (trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
          const r = Math.hypot(sunDirection.x, sunDirection.y);
          return new Euler(
            Math.atan2(r, sunDirection.z),
            0,
            Math.atan2(sunDirection.y, sunDirection.x) + HALF_PI - rot,
            'ZXY',
          );
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
          return new Euler(0, Math.atan2(sunDirection.x, sunDirection.z), -rot + (lx < ly ? 0 : HALF_PI), 'XYZ');
        case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
          return new Euler(tiltAngle, 0, Math.atan2(sunDirection.y, sunDirection.x) + HALF_PI - rot, 'ZXY');
      }
    }
    return new Euler();
  }, [isTop, tiltAngle, relativeAzimuth, trackerType, dateObject, latitude]);

  const showRotateHandle = selected && !locked && trackerType === TrackerType.NO_TRACKER && isTop;
  const showTiltHandle =
    selected && !locked && trackerType === TrackerType.NO_TRACKER && isTop && Math.abs(actualPoleHeight) > 0.1;
  const showPoles = actualPoleHeight > 0 && isTop;

  // handle pointer up
  useEffect(() => {
    const handlePointerUp = () => {
      useRefStore.getState().setEnableOrbitController(true);
      pointerDown.current = false;
      setShowTiltAngle(false);
      setCommonStore((state) => {
        state.rotateHandleType = null;
        state.moveHandleType = null;
        state.resizeHandleType = null;
      });
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

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

  const getRotateHandleColor = (rotateHandleType: RotateHandleType) => {
    return hoveredHandle === rotateHandleType || useStore.getState().rotateHandleType === rotateHandleType
      ? HIGHLIGHT_HANDLE_COLOR
      : RESIZE_HANDLE_COLOR;
  };

  return (
    <group name="Solar Panel Group" position={[cx, cy, actualPoleHeight + cz]} rotation={groupRotation}>
      <SolarPanelBoxGroup
        solarPanelModel={solarPanelModel}
        groupRotation={groupRotation}
        panelRotation={panelRotation}
      />

      {/* draw rotate handles */}
      {showRotateHandle && (
        <group position={[0, 0, -actualPoleHeight]} rotation={[0, 0, panelRotation.z]}>
          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={[0, -hy - rotateHandleSize / 2, actualPoleHeight]}
            color={getRotateHandleColor(RotateHandleType.Upper)}
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={[0, hy + rotateHandleSize / 2, actualPoleHeight]}
            color={getRotateHandleColor(RotateHandleType.Lower)}
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Lower}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </group>
      )}

      {/* draw tilt handles */}
      {showTiltHandle && (
        <>
          {/* ring handles */}
          <Ring
            name={RotateHandleType.Tilt}
            args={[tiltHandleSize, 1.1 * tiltHandleSize, 18, 2, -HALF_PI, Math.PI]}
            rotation={[0, -HALF_PI, panelRotation.z, 'ZXY']}
            onPointerOver={(e) => {
              hoverHandle(e, RotateHandleType.Tilt);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
            onPointerDown={(e) => {
              setShowTiltAngle(true);
              if (hoveredHandle) {
                useRefStore.getState().setEnableOrbitController(false);
                pointerDown.current = true;
                // const sp = getElementById(id) as SolarPanelModel;
                oldTiltAngleRef.current = tiltAngle;
                const { rot } = Util.getWorldDataById(parentId);
                parentWorldRotationRef.current = rot;
              }
              setCommonStore((state) => {
                state.rotateHandleType = RotateHandleType.Tilt;
              });
            }}
          >
            <meshBasicMaterial
              attach="material"
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
                rotation={[0, -HALF_PI, panelRotation.z, 'ZXY']}
                onPointerUp={(e) => {
                  if (Math.abs(newTiltAngleRef.current - oldTiltAngleRef.current) > ZERO_TOLERANCE) {
                    const undoableChange = {
                      name: 'Set Solar Panel Tilt Angle',
                      timestamp: Date.now(),
                      oldValue: oldTiltAngleRef.current,
                      newValue: newTiltAngleRef.current,
                      changedElementId: id,
                      changedElementType: ObjectType.SolarPanel,
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
                    raycaster.setFromCamera(mouse, camera);
                    if (tiltHandleRef.current) {
                      const intersects = raycaster.intersectObjects([tiltHandleRef.current]);
                      if (intersects.length > 0) {
                        const p = intersects[0].point;
                        const parent = tiltHandleRef.current.parent;
                        if (parent) {
                          const ov = parent.localToWorld(new Vector3()); // rotate point in world coordinate
                          const cv = new Vector3().subVectors(p, ov);
                          let angle = cv.angleTo(UNIT_VECTOR_POS_Z);
                          const touch = 0.5 * ly * Math.abs(Math.sin(angle)) > actualPoleHeight;
                          if (!touch) {
                            const wr = relativeAzimuth + (parentWorldRotationRef.current ?? 0);
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
                <meshBasicMaterial
                  attach="material"
                  depthTest={false}
                  transparent={true}
                  opacity={0.5}
                  side={DoubleSide}
                />
              </Ring>
              {/* pointer */}
              <Line
                points={[
                  [0, 0, tiltHandleSize],
                  [0, 0, 1.75 * tiltHandleSize],
                ]}
                rotation={new Euler(tiltAngle, 0, panelRotation.z, 'ZXY')}
                lineWidth={1}
              />
              {/* scale */}
              {degree.map((e, i) => {
                return (
                  <group key={i} rotation={new Euler((Math.PI / 12) * i - HALF_PI, 0, panelRotation.z, 'ZXY')}>
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
              <group rotation={new Euler(tiltAngle, 0, panelRotation.z, 'ZXY')}>
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
      {showPoles &&
        poles.map((p, i) => {
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Pole ' + i}
              castShadow={false}
              receiveShadow={false}
              args={[poleRadius, poleRadius, poleHeight + (p.z - poleZ) * 2 + lz, 4, 1]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}
    </group>
  );
};

const SolarPanelBoxGroup = ({ solarPanelModel, groupRotation, panelRotation }: SolarPanelBoxGroupProps) => {
  let {
    id,
    parentId,
    lx,
    ly,
    lz,
    cx,
    cy,
    cz,
    normal,
    tiltAngle,
    relativeAzimuth,
    trackerType,
    drawSunBeam,
    selected,
    locked,
    showLabel,
    label,
    pvModelName,
    orientation,
    frameColor,
    backsheetColor,
    color,
  } = solarPanelModel;

  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const language = useStore(Selector.language);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const pvModules = useStore(Selector.pvModules);
  const solarPanelShininess = useStore(Selector.viewState.solarPanelShininess);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const isTop = isSolarPanelOnTopFace(normal);
  const actualTiltAngle = isTop ? tiltAngle : 0;
  const actualRelativeAzimuth = isTop ? relativeAzimuth : 0;
  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const [hx, hy, hz] = [lx, ly, lz].map((v) => v / 2);
  const resizeHandleArgs = [resizeHandleSize, resizeHandleSize, lz * 1.2] as BoxArgs;
  const pvModel = pvModules[pvModelName] as PvModel;

  if (pvModel) {
    lz = Math.max(pvModel.thickness, 0.02);
  }

  const dateObject = useMemo(() => new Date(date), [date]);
  const labelText = useMemo(() => {
    return (
      (label ? label : i18n.t('shared.SolarPanelElement', lang)) +
      (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (label
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
  }, [label, locked, language, cx, cy, cz]);

  const solarPanelLines = useMemo(() => {
    const lines: LineData[] = [];
    if (pvModel) {
      let mx, my;
      if (orientation === Orientation.portrait) {
        mx = Math.max(1, Math.round(lx / pvModel.width));
        my = Math.max(1, Math.round(ly / pvModel.length));
      } else {
        mx = Math.max(1, Math.round(lx / pvModel.length));
        my = Math.max(1, Math.round(ly / pvModel.width));
      }
      const dx = lx / mx;
      const dy = ly / my;
      for (let i = 0; i <= mx; i++) {
        lines.push({
          points: [new Vector3(-hx + i * dx, -hy, lz), new Vector3(-hx + i * dx, hy, lz)],
        } as LineData);
      }
      for (let i = 0; i <= my; i++) {
        lines.push({
          points: [new Vector3(-hx, -hy + i * dy, lz), new Vector3(hx, -hy + i * dy, lz)],
        } as LineData);
      }
    }
    return lines;
  }, [pvModel, orientation, pvModelName, lx, ly, lz]);

  const [relativeSunDirection, setRelativeSunDirection] = useState(getRelativeSunDirection());
  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);

  const baseRef = useRef<Mesh>(null);

  const { gl } = useThree();
  const texture = useSolarPanelTexture(lx, ly, pvModel, orientation, frameColor, backsheetColor);
  const heatmapTexture = useSolarPanelHeatmapTexture(id);

  useFrame(() => {
    const newRelativeSunDirection = getRelativeSunDirection();
    if (!newRelativeSunDirection.equals(relativeSunDirection)) {
      setRelativeSunDirection(newRelativeSunDirection);
    }
  });

  function getRelativeSunDirection(): Vector3 {
    const euler = new Euler();
    const worldRotationZ = getWorldRotationZ(parentId, groupRotation.z);
    if (trackerType === TrackerType.NO_TRACKER) {
      euler.set(-groupRotation.x - actualTiltAngle, 0, -worldRotationZ - actualRelativeAzimuth);
    } else {
      euler.set(-groupRotation.x - panelRotation.x, -panelRotation.y, -worldRotationZ - panelRotation.z);
    }
    return getSunDirection(dateObject, latitude).applyEuler(euler);
  }

  function getResizeHandleColor(handleType: ResizeHandleType) {
    return hoveredHandle === handleType || resizeHandleType === handleType
      ? HIGHLIGHT_HANDLE_COLOR
      : RESIZE_HANDLE_COLOR;
  }

  function hoverHandle(e: ThreeEvent<MouseEvent>) {
    if (e.intersections.length > 0) {
      const intersected = e.eventObject.name.includes(HANDLE_GROUP_NAME);
      if (intersected) {
        const handle = e.object.name as MoveHandleType | ResizeHandleType | RotateHandleType | null;
        setHoveredHandle(handle);
        if (handle === MoveHandleType.Top) {
          gl.domElement.style.cursor = 'move';
        } else if (
          handle === RotateHandleType.Lower ||
          handle === RotateHandleType.Upper ||
          handle === RotateHandleType.Tilt
        ) {
          gl.domElement.style.cursor = 'grab';
        } else {
          gl.domElement.style.cursor = 'pointer';
        }
      }
    }
  }

  function noHoverHandle() {
    setHoveredHandle(null);
    gl.domElement.style.cursor = 'default';
  }

  function onClickResizeHandle(handleType: ResizeHandleType, anchor: Vector3) {
    useRefStore.getState().setEnableOrbitController(false);
    setCommonStore((state) => {
      state.resizeHandleType = handleType;
      state.selectedElement = state.elements.find((e) => e.selected) as ElementModel;
      state.resizeAnchor.copy(anchor);
    });
  }

  function clickHandle(e: ThreeEvent<PointerEvent>) {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === HANDLE_GROUP_NAME) {
      const handleType = e.object.name;
      switch (handleType) {
        case MoveHandleType.Default: {
          useRefStore.getState().setEnableOrbitController(false);
          setCommonStore((state) => {
            state.moveHandleType = handleType;
            state.selectedElement = state.elements.find((e) => e.selected) as ElementModel;
          });
          break;
        }
        case ResizeHandleType.Left: {
          const anchor = e.object.localToWorld(new Vector3(lx, 0, 0));
          onClickResizeHandle(handleType, anchor);
          break;
        }
        case ResizeHandleType.Right: {
          const anchor = e.object.localToWorld(new Vector3(-lx, 0, 0));
          onClickResizeHandle(handleType, anchor);
          break;
        }
        case ResizeHandleType.Lower: {
          const anchor = e.object.localToWorld(new Vector3(0, ly, 0));
          onClickResizeHandle(handleType, anchor);
          break;
        }
        case ResizeHandleType.Upper: {
          const anchor = e.object.localToWorld(new Vector3(0, -ly, 0));
          onClickResizeHandle(handleType, anchor);
          break;
        }
      }
    }
  }

  function renderTextureMaterial() {
    if (showSolarRadiationHeatmap && heatmapTexture) {
      return <meshBasicMaterial attachArray="material" map={heatmapTexture} />;
    }
    if (!texture) return <meshStandardMaterial attachArray="material" color={color} />;
    if (orthographic || solarPanelShininess === 0) {
      return <meshStandardMaterial attachArray="material" map={texture} color={color} />;
    }
    return (
      <meshPhongMaterial
        attachArray="material"
        specular={new Color(pvModel?.color === 'Blue' ? SOLAR_PANEL_BLUE_SPECULAR : SOLAR_PANEL_BLACK_SPECULAR)}
        shininess={solarPanelShininess ?? DEFAULT_SOLAR_PANEL_SHININESS}
        side={FrontSide}
        map={texture}
        color={color}
      />
    );
  }

  return (
    <>
      <group name="Solar Panel Box Group" rotation={panelRotation}>
        <Box
          uuid={id}
          ref={baseRef}
          args={[lx, ly, lz]}
          position={[0, 0, hz]}
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
                gl.domElement.style.cursor = 'move';
              }
            }
          }}
          onPointerOut={(e) => {
            setHovered(false);
            gl.domElement.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial attachArray="material" color={'white'} />
          <meshStandardMaterial attachArray="material" color={'white'} />
          <meshStandardMaterial attachArray="material" color={'white'} />
          <meshStandardMaterial attachArray="material" color={'white'} />
          {renderTextureMaterial()}
          <meshStandardMaterial attachArray="material" color={'white'} />
        </Box>

        {/* move & resize handles */}
        {selected && !locked && (
          <group
            name={HANDLE_GROUP_NAME}
            onPointerDown={clickHandle}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          >
            <Sphere args={[moveHandleSize, 6, 6]} name={MoveHandleType.Default}>
              <meshBasicMaterial color={'orange'} />
            </Sphere>
            <Box position={[0, -hy, hz]} args={resizeHandleArgs} name={ResizeHandleType.Lower}>
              <meshBasicMaterial color={getResizeHandleColor(ResizeHandleType.Lower)} />
            </Box>
            <Box position={[0, hy, hz]} args={resizeHandleArgs} name={ResizeHandleType.Upper}>
              <meshBasicMaterial color={getResizeHandleColor(ResizeHandleType.Upper)} />
            </Box>
            <Box position={[-hx, 0, hz]} args={resizeHandleArgs} name={ResizeHandleType.Left}>
              <meshBasicMaterial color={getResizeHandleColor(ResizeHandleType.Left)} />
            </Box>
            <Box position={[hx, 0, hz]} args={resizeHandleArgs} name={ResizeHandleType.Right}>
              <meshBasicMaterial color={getResizeHandleColor(ResizeHandleType.Right)} />
            </Box>
          </group>
        )}

        {/* sun beam */}
        {drawSunBeam && relativeSunDirection.z > 0 && <Sunbeam sunDirection={relativeSunDirection} />}

        {showSolarRadiationHeatmap &&
          heatmapTexture &&
          solarPanelLines.map((lineData, index) => {
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
      </group>

      {/*draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          fontFace={'Roboto'}
          text={labelText}
          color={solarPanelModel.labelColor ?? 'white'}
          fontSize={solarPanelModel.labelFontSize ?? 20}
          textHeight={solarPanelModel.labelSize ?? 0.2}
          position={[0, 0, solarPanelModel.labelHeight ?? Math.max(hy * Math.abs(Math.sin(tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </>
  );
};

const Sunbeam = React.memo(({ sunDirection }: SunbeamProps) => {
  const sceneRadius = useStore(Selector.sceneRadius);

  const sunBeamLength = useMemo(() => Math.max(100, 10 * sceneRadius), [sceneRadius]);

  return (
    <group name="Sun Beam Group">
      <Line
        userData={{ unintersectable: true }}
        points={[
          UNIT_VECTOR_POS_Z.clone().multiplyScalar(0.75),
          [0, 0, 0],
          sunDirection.clone().multiplyScalar(sunBeamLength),
        ]}
        name={'Sun Beam'}
        lineWidth={0.5}
        color={'white'}
      />
      <Line
        userData={{ unintersectable: true }}
        points={[sunDirection.clone().multiplyScalar(0.5), UNIT_VECTOR_POS_Z.clone().multiplyScalar(0.5)]}
        name={'Angle'}
        lineWidth={0.5}
        color={'white'}
      />
      <textSprite
        userData={{ unintersectable: true }}
        name={'Angle Value'}
        text={Util.toDegrees(sunDirection.angleTo(UNIT_VECTOR_POS_Z)).toFixed(1) + '°'}
        fontSize={20}
        fontFace={'Times Roman'}
        textHeight={0.1}
        position={sunDirection
          .clone()
          .multiplyScalar(0.75)
          .add(UNIT_VECTOR_POS_Z.clone().multiplyScalar(0.75))
          .multiplyScalar(0.5)}
      />
      <group position={UNIT_VECTOR_POS_Z.clone().multiplyScalar(0.75)} rotation={[HALF_PI, 0, 0]}>
        <Cone userData={{ unintersectable: true }} args={[0.04, 0.2, 4, 2]} name={'Normal Vector Arrow Head'}>
          <meshBasicMaterial attach="material" color={'white'} />
        </Cone>
      </group>
    </group>
  );
});

export function getRotationFromNormal(normal: number[]) {
  const [x, y, z] = normal;
  if (z === 1) {
    return new Euler(0, 0, 0);
  }
  if (x !== 0) {
    return new Euler(HALF_PI, 0, x * HALF_PI, 'ZXY');
  }
  if (y !== 0) {
    return new Euler(-y * HALF_PI, 0, 0);
  }
  return new Euler();
}

export function isSolarPanelOnTopFace(normal: number[]) {
  return Math.abs(normal[2] - 1) < 0.01;
}

function getWorldRotationZ(parentId: string, selfRotation: number) {
  const { rot } = Util.getWorldDataById(parentId);
  return rot + selfRotation;
}

export default React.memo(SolarPanelOnCuboid);
