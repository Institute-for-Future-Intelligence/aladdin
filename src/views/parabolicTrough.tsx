/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cylinder, Line, Plane, Sphere, useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  Euler,
  FrontSide,
  Group,
  Mesh,
  Vector3,
} from 'three';
import { useStore } from '../stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
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
import i18n from '../i18n/i18n';
import { LineData } from './LineData';
import { ParabolicCylinder } from './shapes';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useSelected } from '../hooks';
import GlowImage_Cylinderic from '../resources/glow_cylinderic.png';
import GlowImage_Corner from '../resources/glow_corner.png';
import { FoundationModel } from 'src/models/FoundationModel';

const ParabolicTrough = React.memo((trough: ParabolicTroughModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz = 0.1,
    reflectance = 0.9,
    absorberTubeRadius = 0.05,
    latusRectum = 2,
    tiltAngle,
    relativeAzimuth,
    moduleLength,
    poleHeight,
    poleRadius,
    drawSunBeam,
    rotation = [0, 0, 0],
    color = 'white',
    lineColor = 'black',
    lineWidth = 0.5,
    showLabel = false,
    locked = false,
    parentId,
  } = trough;

  const setCommonStore = useStore(Selector.set);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const elements = useStore(Selector.elements);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const sceneRadius = useStore(Selector.sceneRadius);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const glowTexture = useTexture(GlowImage_Cylinderic);
  const glowTexture_2 = useTexture(GlowImage_Corner);

  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [numberOfModules, setNumberOfModules] = useState(1);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const frontSideRef = useRef<Mesh>(null);
  const backSideRef = useRef<Mesh>(null);
  const moveHandleRef = useRef<Mesh>(null);
  const resizeHandleLowerRef = useRef<Mesh>(null);
  const resizeHandleUpperRef = useRef<Mesh>(null);
  const resizeHandleLeftRef = useRef<Mesh>(null);
  const resizeHandleRightRef = useRef<Mesh>(null);
  const pointerDown = useRef<boolean>(false);
  const haloGroupRef = useRef<Group>(null!);

  const sunBeamLength = Math.max(100, 10 * sceneRadius);
  const parabolaSegments = 16;
  const night = sunlightDirection.z <= 0;

  const lang = useLanguage();

  let rx = cx;
  let ry = cy;
  let rz = cz;

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const actualPoleHeight = poleHeight + hx;

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });
  if (parentId) {
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          rz = actualPoleHeight + hz + parent.lz;
          const foundation = parent as FoundationModel;
          if (foundation.enableSlope) {
            rz = rz + Util.getZOnSlope(foundation.lx, foundation.slope, cx * foundation.lx);
          }
          if (Util.isZero(rotation[2])) {
            rx = parent.cx + cx * parent.lx;
            ry = parent.cy + cy * parent.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * parent.lx, cy * parent.ly, 0);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            rx = parent.cx + v.x;
            ry = parent.cy + v.y;
          }
          break;
      }
    }
  }

  const depth = (hx * hx) / latusRectum; // the distance from the bottom to the aperture plane
  const focalLength = 0.25 * latusRectum;
  const positionLL = new Vector3(-hx, -hy, hz + depth);
  const positionUL = new Vector3(-hx, hy, hz + depth);
  const positionLR = new Vector3(hx, -hy, hz + depth);
  const positionUR = new Vector3(hx, hy, hz + depth);

  useEffect(() => {
    if (trough && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(trough.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    setNumberOfModules(Math.max(1, Math.round(ly / moduleLength)));
  }, [ly, moduleLength]);

  useEffect(() => {
    const handlePointerUp = () => {
      useRefStore.getState().setEnableOrbitController(true);
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
      (trough?.locked ? ' (🔒)' : '') +
      (trough?.label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          rx.toFixed(1) +
          ', ' +
          ry.toFixed(1) +
          ', ' +
          rz.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang))
    );
  }, [trough?.label, trough?.locked, rx, ry, rz, lang]);

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
  const rot = useMemo(() => getElementById(parentId)?.rotation[2], [parentId]);
  const rotatedSunDirection = rot ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot) : sunDirection;

  const relativeEuler = useMemo(() => {
    if (sunDirection.z > 0) {
      return new Euler(0, Math.atan2(rotatedSunDirection.x, rotatedSunDirection.z), 0, 'ZXY');
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [sunDirection, tiltAngle, relativeAzimuth, rotatedSunDirection.x, rotatedSunDirection.z]);

  // FIXME: This only works when the foundation has zero azimuth or the time is at noon
  const reflectedLightShift = useMemo(() => {
    if (sunDirection.z > 0) {
      const cosRot = rot ? Math.cos(rot) : 1;
      const sinRot = rot ? Math.sin(rot) : 0;
      // how much the reflected light should shift in the direction of the receiver tube?
      return (
        (-focalLength * (sunDirection.x * sinRot + sunDirection.y * cosRot)) /
        Math.hypot(sunDirection.x, sunDirection.z)
      );
    }
    return 0;
  }, [sunDirection, rot, focalLength]);

  const focusPoint = new Vector3(0, reflectedLightShift, focalLength).applyEuler(relativeEuler);
  const sunPoint = sunDirection.clone().multiplyScalar(sunBeamLength).applyEuler(new Euler(-euler.x, 0, -euler.z));

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
    const dy = ly / numberOfModules;
    const t0 = -lx / latusRectum;
    const dt = (-2 * t0) / parabolaSegments;
    for (let i = 0; i <= numberOfModules; i++) {
      const line: Vector3[] = [];
      for (let j = 0; j <= parabolaSegments; j++) {
        const t = t0 + j * dt;
        line.push(new Vector3((latusRectum * t) / 2, -hy + i * dy, (latusRectum * t * t) / 4));
      }
      array.push({ points: line } as LineData);
    }
    return array;
  }, [lx, ly, numberOfModules, latusRectum]);

  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;
  const detailed = elements.length < 50 && moduleLines.length < 10;
  const radialSegmentsPole = detailed ? 4 : 2;
  const haloSize = absorberTubeRadius * 6;

  useFrame(({ camera }) => {
    if (!haloGroupRef.current || !parent) return;
    const worldPosition = haloGroupRef.current.localToWorld(new Vector3(0, 0, 0));
    const cameraLocalPosition = new Vector3()
      .subVectors(camera.position, worldPosition)
      .applyEuler(new Euler(0, 0, -parent?.rotation[2] - relativeAzimuth));
    const rot = Math.atan2(cameraLocalPosition.z, cameraLocalPosition.x);
    haloGroupRef.current.rotation.y = -Math.PI / 2 - rot;
  });

  return (
    <group name={'Parabolic Trough Group ' + id} rotation={euler} position={[rx, ry, rz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw front side parabolic cylinder */}
        <ParabolicCylinder
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={frontSideRef}
          args={[latusRectum / 2, lx, ly, parabolaSegments, 4]}
          name={'Parabolic Trough Front Side'}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.ContextMenu);
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
          onPointerOut={() => {
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
              shininess={100 * reflectance}
              side={FrontSide}
              color={'lightskyblue'}
            />
          )}
        </ParabolicCylinder>

        {/* draw back side parabolic cylinder */}
        <ParabolicCylinder
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id + ' backside'}
          ref={backSideRef}
          args={[latusRectum / 2, lx, ly, parabolaSegments, 4]}
          name={'Parabolic Trough Back Side'}
          position={[0, 0, -hz / 2]}
          onPointerDown={(e) => {
            if (e.button === 2) return; // ignore right-click
            selectMe(id, e, ActionType.Select);
          }}
          onContextMenu={(e) => {
            selectMe(id, e, ActionType.ContextMenu);
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
          onPointerOut={() => {
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
                {detailed && (
                  <Line
                    name={'Parabolic Trough Rim Lines'}
                    userData={{ unintersectable: true }}
                    points={lineData.points}
                    castShadow={false}
                    receiveShadow={false}
                    lineWidth={lineWidth}
                    color={lineColor}
                  />
                )}
                {(index === 0 || index === moduleLines.length - 1 || detailed) && (
                  <Line
                    name={'Parabolic Trough Focal Lines'}
                    userData={{ unintersectable: true }}
                    points={[
                      lineData.points[parabolaSegments / 2].clone(),
                      lineData.points[parabolaSegments / 2].clone().add(new Vector3(0, 0, focalLength)),
                    ]}
                    castShadow={false}
                    receiveShadow={false}
                    lineWidth={lineWidth}
                    color={night ? 'dimgray' : 'white'}
                  />
                )}
              </React.Fragment>
            );
          })}
        {detailed && (
          <Line
            name={'Parabolic Trough Outline 1'}
            userData={{ unintersectable: true }}
            points={[
              [-hx, -hy, depth],
              [-hx, hy, depth],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={lineWidth}
            color={lineColor}
          />
        )}
        {detailed && (
          <Line
            name={'Parabolic Trough Outline 2'}
            userData={{ unintersectable: true }}
            points={[
              [hx, -hy, depth],
              [hx, hy, depth],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={lineWidth}
            color={lineColor}
          />
        )}

        {/* absorber tube along the focal line (focal length = latus rectum / 4) */}
        <Cylinder
          name={'Parabolic Trough Absorber Tube'}
          uuid={id}
          args={[absorberTubeRadius, absorberTubeRadius, ly, detailed ? 6 : 2, 1]}
          position={[0, 0, focalLength]}
          receiveShadow={false}
          castShadow={true}
        >
          {night ? (
            <meshStandardMaterial color={'white'} />
          ) : (
            <meshBasicMaterial color={[1, 1, 1]} toneMapped={false} />
          )}
        </Cylinder>

        {sunDirection.z > 0 && (
          <group ref={haloGroupRef} position={[0, 0, focalLength]}>
            <Plane args={[haloSize, ly]}>
              <meshBasicMaterial
                side={DoubleSide}
                map={glowTexture}
                color={'white'}
                blending={AdditiveBlending}
                transparent
              />
            </Plane>
            <Plane
              args={[haloSize / 2, haloSize / 2]}
              rotation={[0, 0, Math.PI]}
              position={[haloSize / 4, haloSize / 4 + ly / 2, 0]}
            >
              <meshBasicMaterial
                side={DoubleSide}
                map={glowTexture_2}
                color={'white'}
                blending={AdditiveBlending}
                transparent
              />
            </Plane>
            <Plane
              args={[haloSize / 2, haloSize / 2]}
              rotation={[0, 0, -Math.PI / 2]}
              position={[-haloSize / 4, haloSize / 4 + ly / 2, 0]}
            >
              <meshBasicMaterial
                side={DoubleSide}
                map={glowTexture_2}
                color={'white'}
                blending={AdditiveBlending}
                transparent
              />
            </Plane>
            <Plane
              args={[haloSize / 2, haloSize / 2]}
              rotation={[0, 0, Math.PI / 2]}
              position={[haloSize / 4, -haloSize / 4 - ly / 2, 0]}
            >
              <meshBasicMaterial
                side={DoubleSide}
                map={glowTexture_2}
                color={'white'}
                blending={AdditiveBlending}
                transparent
              />
            </Plane>
            <Plane args={[haloSize / 2, haloSize / 2]} position={[-haloSize / 4, -haloSize / 4 - ly / 2, 0]}>
              <meshBasicMaterial
                side={DoubleSide}
                map={glowTexture_2}
                color={'white'}
                blending={AdditiveBlending}
                transparent
              />
            </Plane>
          </group>
        )}

        {/* simulation element */}
        <Plane
          name={'Parabolic Trough Simulation Plane'}
          uuid={id}
          args={[lx, ly]}
          position={[0, 0, depth]}
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
              [-hx, -hy, depth],
              [-hx, hy, depth],
              [hx, hy, depth],
              [hx, -hy, depth],
              [-hx, -hy, depth],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={1}
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
              onPointerOut={() => {
                noHoverHandle();
              }}
              onPointerDown={(e) => {
                if (e.button === 2) return;
                selectMe(id, e, ActionType.Move);
              }}
            >
              <meshBasicMaterial attach="material" color={'orange'} />
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
                onPointerOut={() => {
                  noHoverHandle();
                }}
              >
                <meshBasicMaterial
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
                onPointerOut={() => {
                  noHoverHandle();
                }}
              >
                <meshBasicMaterial
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
                onPointerOut={() => {
                  noHoverHandle();
                }}
              >
                <meshBasicMaterial
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
                onPointerOut={() => {
                  noHoverHandle();
                }}
              >
                <meshBasicMaterial
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

      {/* draw poles */}
      {actualPoleHeight > 0 &&
        poles.map((p, i) => {
          if (i % 5 !== 0 && !detailed) return <React.Fragment key={i} />;
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Pole ' + i}
              castShadow={false}
              receiveShadow={false}
              args={[poleRadius, poleRadius, actualPoleHeight + (p.z - poleZ) * 2 + lz, radialSegmentsPole, 1]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={color} />
            </Cylinder>
          );
        })}

      {/* draw sun beam */}
      {drawSunBeam && sunDirection.z > 0 && (
        <Line
          userData={{ unintersectable: true }}
          points={[
            focusPoint,
            new Vector3(-0.3 * hx, 0, 0.09 * depth).applyEuler(relativeEuler),
            sunPoint,
            new Vector3(-0.6 * hx, 0, 0.36 * depth).applyEuler(relativeEuler),
            focusPoint,
            new Vector3(-0.9 * hx, 0, 0.81 * depth).applyEuler(relativeEuler),
            sunPoint,
            new Vector3(0, 0, 0),
            focusPoint,
            new Vector3(0.3 * hx, 0, 0.09 * depth).applyEuler(relativeEuler),
            sunPoint,
            new Vector3(0.6 * hx, 0, 0.36 * depth).applyEuler(relativeEuler),
            focusPoint,
            new Vector3(0.9 * hx, 0, 0.81 * depth).applyEuler(relativeEuler),
            sunPoint,
          ]}
          name={'Sun Beams'}
          lineWidth={0.25}
          color={'white'}
        />
      )}

      {/* draw label */}
      {(hovered || showLabel) && !selected && (
        <textSprite
          userData={{ unintersectable: true }}
          name={'Label'}
          fontFace={'Roboto'}
          text={labelText}
          color={trough?.labelColor ?? 'white'}
          fontSize={trough?.labelFontSize ?? 20}
          textHeight={trough?.labelSize ?? 0.2}
          position={[0, 0, trough?.labelHeight ?? Math.max(hy * Math.abs(Math.sin(trough.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
});

export default ParabolicTrough;
