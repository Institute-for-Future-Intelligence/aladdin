/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cone, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import { BackSide, CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
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
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { Util } from '../Util';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
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
  absorberTubeRadius = 0.05,
  latusRectum = 2,
  tiltAngle,
  relativeAzimuth,
  moduleLength,
  poleHeight,
  poleRadius,
  drawSunBeam,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'white',
  lineColor = 'black',
  lineWidth = 0.5,
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
  const frontSideRef = useRef<Mesh>();
  const backSideRef = useRef<Mesh>();
  const moveHandleRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const pointerDown = useRef<boolean>(false);

  const sunBeamLength = Math.max(100, 5 * sceneRadius);
  const lang = { lng: language };
  const parabolaSegments = 16;

  const actualPoleHeight = poleHeight + ly / 2;

  if (parentId) {
    const p = getElementById(parentId);
    if (p) {
      switch (p.type) {
        case ObjectType.Foundation:
          cz = actualPoleHeight + lz / 2 + p.lz;
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

  const hx = ly / 2;
  const hy = lx / 2;
  const hz = lz / 2;
  const depth = (hx * hx) / latusRectum; // the distance from the bottom to the aperture plane
  const positionLL = new Vector3(-hx, -hy, hz + depth);
  const positionUL = new Vector3(-hx, hy, hz + depth);
  const positionLR = new Vector3(hx, -hy, hz + depth);
  const positionUR = new Vector3(hx, hy, hz + depth);
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
  }, [lx, moduleLength]);

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

  // in model coordinate system
  const euler = useMemo(() => {
    return new Euler(0, 0, rotation[2], 'ZXY');
  }, [rotation]);

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
    if (sunDirection.z > 0) {
      return new Euler(0, Math.atan2(rotatedSunDirection.x, rotatedSunDirection.z), 0, 'ZXY');
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [sunDirection, tiltAngle, relativeAzimuth]);

  const normalVector = useMemo(() => {
    const v = new Vector3();
    return drawSunBeam
      ? v
          .fromArray(normal)
          .applyEuler(new Euler(relativeEuler.x, relativeEuler.y, relativeEuler.z + rotation[2], 'ZXY'))
      : v;
  }, [drawSunBeam, normal, euler, relativeEuler]);

  const poleZ = -(actualPoleHeight + lz) / 2;

  const poles = useMemo<Vector3[]>(() => {
    const array: Vector3[] = [];
    const cosAz = Math.cos(relativeAzimuth) * moduleLength;
    const sinAz = Math.sin(relativeAzimuth) * moduleLength;
    const i2 = numberOfModules / 2 - 0.5;
    for (let i = 0; i < numberOfModules; i++) {
      array.push(new Vector3(-(i - i2) * sinAz, (i - i2) * cosAz, poleZ));
    }
    return array;
  }, [numberOfModules, moduleLength, poleZ, relativeAzimuth]);

  const moduleLines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    const dx = lx / numberOfModules;
    const t0 = -ly / latusRectum;
    const dt = (-2 * t0) / parabolaSegments;
    for (let i = 0; i <= numberOfModules; i++) {
      const line: Vector3[] = [];
      for (let j = 0; j <= parabolaSegments; j++) {
        const t = t0 + j * dt;
        line.push(new Vector3((latusRectum * t) / 2, -lx / 2 + i * dx, (latusRectum * t * t) / 4));
      }
      array.push({ points: line } as LineData);
    }
    return array;
  }, [lx, ly, numberOfModules, latusRectum]);

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
          args={[latusRectum / 2, ly, lx, parabolaSegments, 4]}
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
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial attach="material" side={FrontSide} map={heatmapTexture} />
          ) : (
            <meshPhongMaterial
              attach="material"
              specular={new Color('white')}
              shininess={10}
              side={FrontSide}
              color={'skyblue'}
            />
          )}
        </ParabolicCylinder>

        {/* draw back side parabolic cylinder */}
        <ParabolicCylinder
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id + ' backside'}
          ref={backSideRef}
          args={[latusRectum / 2, ly, lx, parabolaSegments, 4]}
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

        {moduleLines &&
          moduleLines.map((lineData, index) => {
            return (
              <React.Fragment key={index}>
                <Line
                  name={'Parabolic Trough Rim Lines'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={lineWidth}
                  color={lineColor}
                />
                <Line
                  name={'Parabolic Trough Focal Liines'}
                  userData={{ unintersectable: true }}
                  points={[
                    lineData.points[parabolaSegments / 2].clone(),
                    lineData.points[parabolaSegments / 2].clone().add(new Vector3(0, 0, 0.25 * latusRectum)),
                  ]}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={1}
                  color={'white'}
                />
              </React.Fragment>
            );
          })}
        <Line
          name={'Parabolic Trough Outline 1'}
          userData={{ unintersectable: true }}
          points={[
            [-ly / 2, -lx / 2, depth],
            [-ly / 2, lx / 2, depth],
          ]}
          castShadow={false}
          receiveShadow={false}
          lineWidth={lineWidth}
          color={lineColor}
        />
        <Line
          name={'Parabolic Trough Outline 2'}
          userData={{ unintersectable: true }}
          points={[
            [ly / 2, -lx / 2, depth],
            [ly / 2, lx / 2, depth],
          ]}
          castShadow={false}
          receiveShadow={false}
          lineWidth={lineWidth}
          color={lineColor}
        />

        {/* absorber tube along the focal line */}
        <Cylinder
          name={'Parabolic Trough Absorber Tube'}
          uuid={id}
          args={[absorberTubeRadius, absorberTubeRadius, lx, 6, 2]}
          position={[0, 0, 0.25 * latusRectum]}
          receiveShadow={false}
          castShadow={true}
        >
          <meshBasicMaterial color={'white'} />
        </Cylinder>

        {/* simulation panel */}
        <Plane
          name={'Parabolic Trough Simulation Plane'}
          uuid={id}
          args={[ly, lx]}
          position={[0, 0, depth]}
          userData={{ simulation: true }}
          receiveShadow={false}
          castShadow={false}
          visible={false}
        >
          {/*{showSolarRadiationHeatmap && heatmapTexture ? (*/}
          {/*  <meshBasicMaterial attach="material" side={FrontSide} map={heatmapTexture}/>*/}
          {/*) : (*/}
          {/*  <meshPhongMaterial*/}
          {/*    attach="material"*/}
          {/*    specular={new Color('white')}*/}
          {/*    shininess={10}*/}
          {/*    side={FrontSide}*/}
          {/*    color={'skyblue'}*/}
          {/*  />*/}
          {/*)}*/}
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
                position={[(positionLL.x + positionLR.x) / 2, positionLL.y, positionLL.z - depth]}
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
                position={[(positionUL.x + positionUR.x) / 2, positionUL.y, positionUL.z - depth]}
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
        <group position={[0, 0, -actualPoleHeight]} rotation={[0, 0, relativeEuler.z]}>
          {/* rotate handles */}
          <RotateHandle
            id={id}
            position={[0, -lx / 2 - rotateHandleSize / 2, actualPoleHeight]}
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
            position={[0, lx / 2 + rotateHandleSize / 2, actualPoleHeight]}
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
      {actualPoleHeight > 0 &&
        poles.map((p, i) => {
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Pole ' + i}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              args={[poleRadius, poleRadius, actualPoleHeight + (p.z - poleZ) * 2 + lz, 6, 2]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}

      {/* draw sun beam */}
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

      {/* draw label */}
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
