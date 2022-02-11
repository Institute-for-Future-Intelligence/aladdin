/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Circle, Cylinder, Line, Sphere, useTexture } from '@react-three/drei';
import { AdditiveBlending, BackSide, CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
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

const ParabolicDish = ({
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
  selected = false,
  showLabel = false,
  locked = false,
  parentId,
}: ParabolicDishModel) => {
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

  const {
    gl: { domElement },
  } = useThree();

  const [hovered, setHovered] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
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
  const radialSegments = 32;
  const depthSegments = 8;

  const hx = lx / 2; // lx and ly both represent the diameter of the dish, so they are identical
  const hy = ly / 2;
  const hz = lz / 2;
  const actualPoleHeight = poleHeight + hx;

  if (parentId) {
    const p = getElementById(parentId);
    if (p) {
      switch (p.type) {
        case ObjectType.Foundation:
          cz = actualPoleHeight + hz + p.lz;
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

  const depth = (hx * hx) / latusRectum; // the distance from the bottom to the aperture plane
  const focalLength = 0.25 * latusRectum;
  const positionLL = new Vector3(-hx, -hy, hz + depth);
  const positionUL = new Vector3(-hx, hy, hz + depth);
  const positionLR = new Vector3(hx, -hy, hz + depth);
  const positionUR = new Vector3(hx, hy, hz + depth);
  const dish = getElementById(id) as ParabolicDishModel;
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
      (dish?.label ? dish.label : i18n.t('shared.ParabolicDishElement', lang)) +
      (dish.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (dish?.label
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
  }, [dish?.label, locked, language, cx, cy, cz]);

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
      const r = Math.sqrt(Math.pow(rotatedSunDirection.x, 2) + Math.pow(rotatedSunDirection.y, 2));
      return new Euler(
        Math.atan2(r, rotatedSunDirection.z),
        0,
        Math.atan2(rotatedSunDirection.y, rotatedSunDirection.x) + HALF_PI,
        'ZXY',
      );
    }
    return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
  }, [sunDirection, tiltAngle, relativeAzimuth]);

  const poleZ = -(actualPoleHeight + lz) / 2;

  const wireframeLines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
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
    return array;
  }, [hx, latusRectum]);

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

  return (
    <group name={'Parabolic Dish Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
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
            selectMe(id, e, ActionType.Select);
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
          // position={[0, 0, -hz]}
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
          onPointerOut={(e) => {
            setHovered(false);
            domElement.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial attach="material" side={BackSide} color={color} />
        </Paraboloid>

        {wireframeLines &&
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
          args={[receiverRadius, receiverRadius, 0.5, 12, 2]}
          rotation={[HALF_PI, 0, 0]}
          position={[0, 0, focalLength - 0.1]}
          receiveShadow={false}
          castShadow={true}
        >
          <meshBasicMaterial color={color} />
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
            args={[receiverPoleRadius, receiverPoleRadius, focalLength, 6, 2]}
            rotation={[HALF_PI, 0, 0]}
            position={[0, 0, focalLength / 2]}
            receiveShadow={false}
            castShadow={true}
          >
            <meshBasicMaterial color={color} />
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
                  color={color}
                />
                <Sphere
                  position={new Vector3(lineData.points[0].x, lineData.points[0].y, lineData.points[0].z)}
                  args={[receiverPoleRadius / 2, 4, 4]}
                  name={'Parabolic Dish Tripod Joint'}
                >
                  <meshBasicMaterial attach="material" color={color} />
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
                  color={color}
                />
                <Sphere
                  position={new Vector3(lineData.points[0].x, lineData.points[0].y, lineData.points[0].z)}
                  args={[receiverPoleRadius / 2, 4, 4]}
                  name={'Parabolic Dish Quadrupod Joint'}
                >
                  <meshBasicMaterial attach="material" color={color} />
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

      {/* draw poles */}
      {actualPoleHeight > 0 && (
        <Cylinder
          userData={{ unintersectable: true }}
          name={'Pole'}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          args={[poleRadius, poleRadius, actualPoleHeight + lz, 6, 2]}
          position={[0, 0, poleZ]}
          rotation={[HALF_PI, 0, 0]}
        >
          <meshStandardMaterial attach="material" color={color} />
        </Cylinder>
      )}

      {/* draw sun beam */}
      {drawSunBeam && sunDirection.z > 0 && (
        <group rotation={[-euler.x, 0, -euler.z]}>
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(-0.3 * hx, 0, 0.09 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam -0.3'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(-0.6 * hx, 0, 0.36 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam -0.6'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(-0.9 * hx, 0, 0.81 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam -0.9'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam 0.0'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(0.3 * hx, 0, 0.09 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam 0.3'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(0.6 * hx, 0, 0.36 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam 0.6'}
            lineWidth={0.25}
            color={'white'}
          />
          <Line
            userData={{ unintersectable: true }}
            points={[
              new Vector3(0, 0, focalLength).applyEuler(relativeEuler),
              new Vector3(0.9 * hx, 0, 0.81 * depth).applyEuler(relativeEuler),
              sunDirection.clone().multiplyScalar(sunBeamLength),
            ]}
            name={'Sun Beam 0.9'}
            lineWidth={0.25}
            color={'white'}
          />
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
          position={[0, 0, Math.max(hy * Math.abs(Math.sin(dish.tiltAngle)) + 0.1, 0.2)]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default ParabolicDish;
