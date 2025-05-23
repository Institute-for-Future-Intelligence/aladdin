/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Circle, Cylinder, Line, Sphere, useTexture } from '@react-three/drei';
import { AdditiveBlending, BackSide, CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  ParabolicDishStructureType,
  ResizeHandleType,
  RotateHandleType,
} from '../types';
import { Util } from '../Util';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { getSunDirection } from '../analysis/sunTools';
import i18n from '../i18n/i18n';
import { LineData } from './LineData';
import { Paraboloid } from './shapes';
import GlowImage from '../resources/glow.png';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useSelected } from '../hooks';
import { FoundationModel } from 'src/models/FoundationModel';

const ParabolicDish = React.memo((dish: ParabolicDishModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz = 0.1,
    reflectance = 0.9,
    structureType = ParabolicDishStructureType.CentralPole,
    receiverRadius = 0.25,
    receiverPoleRadius = 0.1,
    latusRectum = 2,
    tiltAngle,
    relativeAzimuth,
    poleHeight,
    poleRadius = 0.2,
    drawSunBeam,
    rotation = [0, 0, 0],
    color = 'white',
    lineColor = 'black',
    lineWidth = 0.25,
    showLabel = false,
    locked = false,
    parentId,
  } = dish;

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

  const selected = useSelected(id);

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const frontSideRef = useRef<Mesh>(null);
  const backSideRef = useRef<Mesh>(null);
  const moveHandleRef = useRef<Mesh>(null);
  const resizeHandleLowerRef = useRef<Mesh>(null);
  const resizeHandleUpperRef = useRef<Mesh>(null);
  const resizeHandleLeftRef = useRef<Mesh>(null);
  const resizeHandleRightRef = useRef<Mesh>(null);
  const pointerDown = useRef<boolean>(false);

  const sunBeamLength = Math.max(100, 10 * sceneRadius);
  const radialSegments = 32;
  const depthSegments = 8;
  const night = sunlightDirection.z <= 0;

  let rx = cx;
  let ry = cy;
  let rz = cz;

  const hx = lx / 2; // lx and ly both represent the diameter of the dish, so they are identical
  const hy = ly / 2;
  const hz = lz / 2;
  const actualPoleHeight = poleHeight + hx;

  const lang = useLanguage();

  // be sure to get the updated parent so that this memorized element can move with it
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

  // set relative position
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

  const depth = (hx * hx) / latusRectum; // the distance from the bottom to the aperture plane
  const focalLength = 0.25 * latusRectum;
  const positionLL = new Vector3(-hx, -hy, hz + depth);
  const positionUL = new Vector3(-hx, hy, hz + depth);
  const positionLR = new Vector3(hx, -hy, hz + depth);
  const positionUR = new Vector3(hx, hy, hz + depth);
  const glowTexture = useTexture(GlowImage);
  const haloRadius = receiverRadius + 1;

  useEffect(() => {
    if (dish && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(dish.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

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
      (dish?.label ? dish.label : i18n.t('shared.ParabolicDishElement', lang)) +
      (dish?.locked ? ' (🔒)' : '') +
      (dish?.label
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
  }, [dish?.label, dish?.locked, lang, rx, ry, rz]);

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
  const rot = useMemo(() => parent?.rotation[2] ?? 0, [parent?.rotation[2]]);

  const relativeEuler = useMemo(() => {
    if (sunDirection.z > 0) {
      const r = Math.hypot(sunDirection.x, sunDirection.y);
      return new Euler(
        Math.atan2(r, sunDirection.z),
        0,
        Math.atan2(sunDirection.y, sunDirection.x) + HALF_PI - rot,
        'ZXY',
      );
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [sunDirection, tiltAngle, relativeAzimuth, sunDirection.x, sunDirection.y, sunDirection.z, rot]);

  const poleZ = -(actualPoleHeight + lz) / 2;
  const detailed = elements.length < 50;

  const wireframeLines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    if (detailed) {
      // draw rim lines
      const outer: Vector3[] = [];
      const inner: Vector3[] = [];
      let angle, cos, sin;
      const depth4 = 0.25 * depth;
      for (let i = 0; i <= radialSegments; i++) {
        angle = (TWO_PI * i) / radialSegments;
        cos = Math.cos(angle);
        sin = Math.sin(angle);
        outer.push(new Vector3(hx * cos, hx * sin, depth));
        inner.push(new Vector3((hx * cos) / 2, (hx * sin) / 2, depth4));
      }
      array.push({ points: outer } as LineData);
      array.push({ points: inner } as LineData);
      // draw radial lines
      for (let i = 0; i < 12; i++) {
        angle = (TWO_PI * i) / 12;
        cos = Math.cos(angle);
        sin = Math.sin(angle);
        const line: Vector3[] = [];
        for (let j = 0; j <= depthSegments; j++) {
          const dx = j === 0 ? 0 : (j / depthSegments) * hx;
          line.push(new Vector3(dx * cos, dx * sin, (dx * dx) / latusRectum + 0.01));
        }
        array.push({ points: line } as LineData);
      }
    }
    return array;
  }, [hx, latusRectum, detailed]);

  const tripodLines = useMemo<LineData[] | undefined>(() => {
    if (structureType === ParabolicDishStructureType.CentralPoleWithTripod) {
      const array: LineData[] = [];
      let angle;
      for (let i = 0; i < 3; i++) {
        angle = (TWO_PI * i) / 3;
        const line: Vector3[] = [];
        line.push(new Vector3(hx * Math.cos(angle), hx * Math.sin(angle), depth));
        line.push(new Vector3(0, 0, focalLength));
        array.push({ points: line } as LineData);
      }
      return array;
    }
    return undefined;
  }, [hx, latusRectum, structureType]);

  const quadrupodLines = useMemo<LineData[] | undefined>(() => {
    if (structureType === ParabolicDishStructureType.Quadrupod) {
      const array: LineData[] = [];
      let angle;
      for (let i = 0; i < 4; i++) {
        angle = (TWO_PI * i) / 4;
        const line: Vector3[] = [];
        line.push(new Vector3(hx * Math.cos(angle), hx * Math.sin(angle), depth));
        line.push(new Vector3(0, 0, focalLength));
        array.push({ points: line } as LineData);
      }
      return array;
    }
    return undefined;
  }, [hx, latusRectum, structureType]);

  const baseSize = Math.max(1, (lx + ly) / 16);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
  const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 3;
  const sunPoint = sunDirection.clone().multiplyScalar(sunBeamLength);
  const focalEuler = useMemo(() => new Euler(relativeEuler.x, 0, relativeEuler.z + rot, 'ZXY'), [relativeEuler, rot]);
  const focalPoint = useMemo(() => new Vector3(0, 0, focalLength).applyEuler(focalEuler), [focalLength, focalEuler]);

  return (
    <group name={'Parabolic Dish Group ' + id} rotation={euler} position={[rx, ry, rz + hz]}>
      <group rotation={relativeEuler}>
        {/* draw front side parabolic dish */}
        <Paraboloid
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id}
          ref={frontSideRef}
          args={[latusRectum / 2, hx, radialSegments, depthSegments]}
          name={'Parabolic Dish Front Side'}
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
                  state.contextMenuObjectType = ObjectType.ParabolicDish;
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
        </Paraboloid>

        {/* draw back side parabolic dish */}
        <Paraboloid
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
          uuid={id + ' backside'}
          ref={backSideRef}
          args={[latusRectum / 2, hx, radialSegments, depthSegments]}
          name={'Parabolic Dish Back Side'}
          position={[0, 0, -hz / 4]}
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
                  state.contextMenuObjectType = ObjectType.ParabolicDish;
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
          <meshStandardMaterial attach="material" side={BackSide} color={color} />
        </Paraboloid>

        {wireframeLines &&
          wireframeLines.length > 0 &&
          wireframeLines.map((lineData, index) => {
            return (
              <React.Fragment key={index}>
                <Line
                  name={'Parabolic Dish Wireframe'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={lineWidth}
                  color={lineColor}
                />
              </React.Fragment>
            );
          })}

        {/* receiver at the focus (focal length = latus rectum / 4) */}
        <Cylinder
          name={'Parabolic Dish Receiver'}
          uuid={id}
          args={[receiverRadius, receiverRadius, 0.5, detailed ? 12 : 4, 1]}
          rotation={[HALF_PI, 0, 0]}
          position={[0, 0, focalLength - 0.1]}
          receiveShadow={false}
          castShadow={true}
        >
          <meshStandardMaterial attach="material" color={color} />
        </Cylinder>
        {/* simple glow effect to create a halo */}
        {sunDirection.z > 0 && (
          <mesh position={[0, 0, focalLength - 0.1]}>
            <sprite scale={[haloRadius, haloRadius, haloRadius]}>
              <spriteMaterial
                map={glowTexture}
                transparent={false}
                color={0xffffff}
                blending={AdditiveBlending}
                depthWrite={false} // this must be set to hide the rectangle of the texture image
              />
            </sprite>
          </mesh>
        )}
        {(structureType === ParabolicDishStructureType.CentralPole ||
          structureType === ParabolicDishStructureType.CentralPoleWithTripod) && (
          <Cylinder
            name={'Parabolic Dish Receiver Pole'}
            uuid={id}
            args={[receiverPoleRadius, receiverPoleRadius, focalLength, detailed ? 6 : 2, 1]}
            rotation={[HALF_PI, 0, 0]}
            position={[0, 0, focalLength / 2]}
            receiveShadow={false}
            castShadow={true}
          >
            <meshStandardMaterial attach="material" color={color} />
          </Cylinder>
        )}
        {structureType === ParabolicDishStructureType.CentralPoleWithTripod &&
          tripodLines &&
          tripodLines.map((lineData, index) => {
            return (
              <React.Fragment key={index}>
                <Line
                  name={'Parabolic Dish Tripod Lines'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={1}
                  color={night ? 'dimgray' : color}
                />
                <Sphere
                  position={new Vector3(lineData.points[0].x, lineData.points[0].y, lineData.points[0].z)}
                  args={[receiverPoleRadius / 2, 4, 4]}
                  name={'Parabolic Dish Tripod Joint'}
                >
                  <meshStandardMaterial attach="material" color={color} />
                </Sphere>
              </React.Fragment>
            );
          })}
        {structureType === ParabolicDishStructureType.Quadrupod &&
          quadrupodLines &&
          quadrupodLines.map((lineData, index) => {
            return (
              <React.Fragment key={index}>
                <Line
                  name={'Parabolic Dish Quadrupod Lines'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={2}
                  color={night ? 'dimgray' : color}
                />
                <Sphere
                  position={new Vector3(lineData.points[0].x, lineData.points[0].y, lineData.points[0].z)}
                  args={[receiverPoleRadius / 2, 4, 4]}
                  name={'Parabolic Dish Quadrupod Joint'}
                >
                  <meshStandardMaterial attach="material" color={color} />
                </Sphere>
              </React.Fragment>
            );
          })}

        {/* simulation element */}
        <Circle
          name={'Parabolic Dish Simulation Circle'}
          uuid={id}
          args={[lx / 2, radialSegments]}
          position={[0, 0, depth]}
          userData={{ simulation: true }}
          receiveShadow={false}
          castShadow={false}
          visible={false}
        >
          <meshBasicMaterial side={DoubleSide} />
        </Circle>

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
      {actualPoleHeight > 0 && (
        <Cylinder
          userData={{ unintersectable: true }}
          name={'Pole'}
          castShadow={false}
          receiveShadow={false}
          args={[poleRadius, poleRadius, actualPoleHeight + lz, detailed ? 4 : 2, 1]}
          position={[0, 0, poleZ]}
          rotation={[HALF_PI, 0, 0]}
        >
          <meshStandardMaterial attach="material" color={color} />
        </Cylinder>
      )}

      {/* draw sun beam */}
      {drawSunBeam && sunDirection.z > 0 && (
        <Line
          rotation={[-euler.x, 0, -euler.z]}
          userData={{ unintersectable: true }}
          points={[
            focalPoint,
            new Vector3(-0.3 * hx, 0, 0.09 * depth).applyEuler(focalEuler),
            sunPoint,
            new Vector3(-0.6 * hx, 0, 0.36 * depth).applyEuler(focalEuler),
            focalPoint,
            new Vector3(-0.9 * hx, 0, 0.81 * depth).applyEuler(focalEuler),
            sunPoint,
            focalPoint,
            new Vector3(0.3 * hx, 0, 0.09 * depth).applyEuler(focalEuler),
            sunPoint,
            new Vector3(0.6 * hx, 0, 0.36 * depth).applyEuler(focalEuler),
            focalPoint,
            new Vector3(0.9 * hx, 0, 0.81 * depth).applyEuler(focalEuler),
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
          color={dish?.labelColor ?? 'white'}
          fontSize={dish?.labelFontSize ?? 20}
          textHeight={dish?.labelSize ?? 0.2}
          position={[0, 0, dish?.labelHeight ?? Math.max(hy * Math.abs(Math.sin(dish.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
});

export default ParabolicDish;
