/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cone, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import {
  BackSide,
  CanvasTexture,
  DoubleSide,
  Euler,
  FrontSide,
  Mesh,
  RepeatWrapping,
  TextureLoader,
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
} from '../constants';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { Util } from '../Util';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import ParabolicTroughMirrorImage from '../resources/trough_mirror.png';
import { getSunDirection } from '../analysis/sunTools';
import RotateHandle from '../components/rotateHandle';
import i18n from '../i18n/i18n';
import { LineData } from './LineData';
import { ParabolicCylinder } from './shapes';

const ParabolicTrough = ({
  id,
  cx,
  cy,
  cz,
  lx,
  ly,
  lz = 0.1,
  tiltAngle,
  relativeAzimuth,
  moduleLength,
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
}: ParabolicTroughModel) => {
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
  const sceneRadius = useStore(Selector.sceneRadius);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [numberOfModules, setNumberOfModules] = useState(1);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [updateFlag, setUpdateFlag] = useState(false);
  const frontSideRef = useRef<Mesh>();
  const backSideRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);
  const moduleLinesRef = useRef<LineData[]>();

  const sunBeamLength = Math.max(100, 5 * sceneRadius);
  const troughNormal = new Vector3().fromArray(normal);
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
      }
    }
  }

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = new Vector3(-hx, -hy, hz);
  const positionUL = new Vector3(-hx, hy, hz);
  const positionLR = new Vector3(hx, -hy, hz);
  const positionUR = new Vector3(hx, hy, hz);
  const trough = getElementById(id) as ParabolicTroughModel;

  useEffect(() => {
    if (trough && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(trough.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    setNumberOfModules(Math.max(1, Math.round(lx / moduleLength)));
    moduleLinesRef.current = [];
    const dx = lx / numberOfModules;
    for (let i = 1; i < numberOfModules; i++) {
      moduleLinesRef.current.push({
        point1: new Vector3(-lx / 2 + i * dx, -ly / 2, lz),
        point2: new Vector3(-lx / 2 + i * dx, ly / 2, lz),
      } as LineData);
    }
  }, [lx, ly]);

  useEffect(() => {
    const handlePointerUp = () => {
      useStoreRef.getState().setEnableOrbitController(true);
      pointerDown.current = false;
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const labelText = useMemo(() => {
    return (
      (trough?.label ? trough.label : i18n.t('shared.ParabolicTroughElement', lang)) +
      (trough.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (trough?.label
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
  }, [trough?.label, locked, language, cx, cy, cz]);

  const texture = useMemo(() => {
    return new TextureLoader().load(ParabolicTroughMirrorImage, (t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.offset.set(0, 0);
      t.repeat.set(1, 1);
      setUpdateFlag(!updateFlag);
    });
  }, []);

  const euler = useMemo(() => {
    // east face in model coordinate system
    if (Util.isSame(troughNormal, UNIT_VECTOR_POS_X)) {
      return new Euler(HALF_PI, 0, rotation[2] + HALF_PI, 'ZXY');
    }
    // west face in model coordinate system
    if (Util.isSame(troughNormal, UNIT_VECTOR_NEG_X)) {
      return new Euler(HALF_PI, 0, rotation[2] - HALF_PI, 'ZXY');
    }
    // north face in the model coordinate system
    if (Util.isSame(troughNormal, UNIT_VECTOR_POS_Y)) {
      return new Euler(HALF_PI, 0, rotation[2] + Math.PI, 'ZXY');
    }
    // south face in the model coordinate system
    if (Util.isSame(troughNormal, UNIT_VECTOR_NEG_Y)) {
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
    if (Util.isSame(troughNormal, UNIT_VECTOR_POS_Z)) {
      if (sunDirection.z > 0) {
        return new Euler(0, Math.atan2(rotatedSunDirection.x, rotatedSunDirection.z), 0, 'ZXY');
      }
      return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
    }
    return new Euler();
  }, [sunDirection, tiltAngle, relativeAzimuth, normal]);

  const normalVector = useMemo(() => {
    const v = new Vector3();
    return drawSunBeam
      ? v
          .fromArray(normal)
          .applyEuler(new Euler(relativeEuler.x, relativeEuler.y, relativeEuler.z + rotation[2], 'ZXY'))
      : v;
  }, [drawSunBeam, normal, euler, relativeEuler]);

  const poles: Vector3[] = [];
  const poleZ = -poleHeight / 2 - lz / 2;
  const poleNx = Math.floor((0.5 * ly) / poleSpacing);
  const poleNy = Math.floor((0.5 * lx * Math.abs(Math.cos(tiltAngle))) / poleSpacing);
  const sinTilt = 0.5 * Math.sin(tiltAngle);
  const cosAz = Math.cos(relativeAzimuth) * poleSpacing;
  const sinAz = Math.sin(relativeAzimuth) * poleSpacing;
  for (let ix = -poleNx; ix <= poleNx; ix++) {
    for (let iy = -poleNy; iy <= poleNy; iy++) {
      const xi = ix * cosAz - iy * sinAz;
      const yi = ix * sinAz + iy * cosAz;
      poles.push(new Vector3(xi, yi, poleZ + sinTilt * poleSpacing * iy));
    }
  }

  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const rotateHandleSize = (baseSize * 2) / 3;

  return (
    <group name={'Parabolic Trough Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw front side parabolic cylinder */}
        <ParabolicCylinder
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={frontSideRef}
          args={[1, ly, lx, 16, 4]}
          name={'Parabolic Trough Front Side'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.Select);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === frontSideRef.current;
                if (intersected) {
                  state.contextMenuObjectType = ObjectType.ParabolicTrough;
                }
              }
            });
          }}
          onPointerOver={(e) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === frontSideRef.current;
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
          <meshStandardMaterial
            attach="material"
            side={FrontSide}
            map={showSolarRadiationHeatmap && heatmapTexture ? heatmapTexture : texture}
          />
        </ParabolicCylinder>

        {/* draw back side parabolic cylinder */}
        <ParabolicCylinder
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id + ' backside'}
          ref={backSideRef}
          args={[1, ly, lx, 16, 4]}
          name={'Parabolic Trough Back Side'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.Select);
            setCommonStore((state) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === backSideRef.current;
                if (intersected) {
                  state.contextMenuObjectType = ObjectType.ParabolicTrough;
                }
              }
            });
          }}
          onPointerOver={(e) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === backSideRef.current;
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
          <meshStandardMaterial attach="material" side={BackSide} color={'white'} />
        </ParabolicCylinder>

        {showSolarRadiationHeatmap &&
          heatmapTexture &&
          moduleLinesRef.current &&
          moduleLinesRef.current.map((lineData, index) => {
            return (
              <Line
                name={'Parabolic Trough Lines'}
                key={index}
                userData={{ unintersectable: true }}
                points={[lineData.point1, lineData.point2]}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.2}
                color={'black'}
              />
            );
          })}

        {/* simulation panel */}
        <Plane
          name={'Parabolic Trough Simulation Plane'}
          uuid={id}
          args={[ly, lx]}
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
              [-lx / 2, -ly / 2, 0],
              [-lx / 2, ly / 2, 0],
              [lx / 2, ly / 2, 0],
              [lx / 2, -ly / 2, 0],
              [-lx / 2, -ly / 2, 0],
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
      </group>

      {/* draw rotate handles */}
      {selected && !locked && (
        <group position={[0, 0, -poleHeight]} rotation={[0, 0, relativeEuler.z]}>
          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={[0, -ly / 2 - rotateHandleSize / 2, poleHeight]}
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
            position={[0, ly / 2 + rotateHandleSize / 2, poleHeight]}
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

      {/* draw poles */}
      {poleHeight > 0 &&
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
          position={[0, 0, Math.max((ly / 2) * Math.abs(Math.sin(trough.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default ParabolicTrough;
