/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, Euler, FrontSide, Mesh, Vector3 } from 'three';
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
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../constants';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType, SolarStructure } from '../types';
import { Util } from '../Util';
import { getSunDirection } from '../analysis/sunTools';
import i18n from '../i18n/i18n';
import { LineData } from './LineData';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { FoundationModel } from '../models/FoundationModel';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useSelected } from '../hooks';

const FresnelReflector = React.memo(
  ({
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz = 0.1,
    reflectance = 0.9,
    tiltAngle,
    relativeAzimuth,
    moduleLength,
    poleHeight,
    poleRadius = 0.1,
    drawSunBeam,
    rotation = [0, 0, 0],
    color = 'white',
    lineColor = 'black',
    lineWidth = 0.5,
    showLabel = false,
    locked = false,
    parentId,
    receiverId,
  }: FresnelReflectorModel) => {
    const setCommonStore = useStore(Selector.set);
    const language = useStore(Selector.language);
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

    const selected = useSelected(id);

    const {
      gl: { domElement },
    } = useThree();

    const [hovered, setHovered] = useState(false);
    const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(
      null,
    );
    const [numberOfModules, setNumberOfModules] = useState(1);
    const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
    const baseRef = useRef<Mesh>(null);
    const moveHandleRef = useRef<Mesh>(null);
    const resizeHandleLowerRef = useRef<Mesh>(null);
    const resizeHandleUpperRef = useRef<Mesh>(null);
    const resizeHandleLeftRef = useRef<Mesh>(null);
    const resizeHandleRightRef = useRef<Mesh>(null);
    const pointerDown = useRef<boolean>(false);

    const sunBeamLength = Math.max(100, 10 * sceneRadius);
    const lang = useMemo(() => {
      return { lng: language };
    }, [language]);

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

    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          cz = actualPoleHeight + hz + parent.lz;
          if (Util.isZero(rotation[2])) {
            cx = parent.cx + cx * parent.lx;
            cy = parent.cy + cy * parent.ly;
          } else {
            // we must rotate the real length, not normalized length
            const v = new Vector3(cx * parent.lx, cy * parent.ly, 0);
            v.applyAxisAngle(UNIT_VECTOR_POS_Z, rotation[2]);
            cx = parent.cx + v.x;
            cy = parent.cy + v.y;
          }
          break;
      }
    }

    const positionLL = new Vector3(-hx, -hy, hz);
    const positionUL = new Vector3(-hx, hy, hz);
    const positionLR = new Vector3(hx, -hy, hz);
    const positionUR = new Vector3(hx, hy, hz);
    const fresnelReflector = useMemo(() => getElementById(id) as FresnelReflectorModel, [id]);

    useEffect(() => {
      if (fresnelReflector && showSolarRadiationHeatmap) {
        const heatmap = getHeatmap(fresnelReflector.id);
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
        (fresnelReflector?.label ? fresnelReflector.label : i18n.t('shared.FresnelReflectorElement', lang)) +
        (fresnelReflector?.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
        (fresnelReflector?.label
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
    }, [fresnelReflector?.label, fresnelReflector?.locked, lang, cx, cy, cz]);

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
    const rot = parent?.rotation[2];

    // TODO: how to get an updated version of the memorized receiver
    const receiver = receiverId && receiverId !== parentId ? getElementById(receiverId) : null;

    const receiverCenter = useMemo(() => {
      if (receiver) {
        if (receiver.type === ObjectType.Foundation) {
          const foundation = receiver as FoundationModel;
          if (foundation.solarStructure === SolarStructure.FocusPipe && foundation.solarAbsorberPipe) {
            // convert the receiver's coordinates into those relative to the center of this reflector
            return new Vector3(
              (foundation.cx - cx) * (rot ? Math.cos(rot) : 1),
              (foundation.cy - cy) * (rot ? Math.sin(rot) : 0),
              foundation.cz - cz + foundation.lz / 2 + (foundation.solarAbsorberPipe.absorberHeight ?? 10),
            );
          }
        }
      } else {
        if (parent) {
          if (parent.type === ObjectType.Foundation) {
            const foundation = parent as FoundationModel;
            if (foundation.solarStructure === SolarStructure.FocusPipe && foundation.solarAbsorberPipe) {
              // convert the receiver's coordinates into those relative to the center of this reflector
              return new Vector3(
                (foundation.cx - cx) * (rot ? Math.cos(rot) : 1),
                (foundation.cy - cy) * (rot ? Math.sin(rot) : 0),
                foundation.cz - cz + foundation.lz / 2 + (foundation.solarAbsorberPipe.absorberHeight ?? 10),
              );
            }
          }
        }
      }
      return null;
    }, [receiver, parent, cx, cy, cz, rot]);

    const shiftedReceiverCenter = useRef<Vector3>(new Vector3());

    const relativeEuler = useMemo(() => {
      if (receiverCenter && sunDirection.z > 0) {
        // the rotation axis is in the north-south direction, so the relative azimuth is zero, which maps to (0, 1, 0)
        const rotationAxis = rot ? new Vector3(Math.sin(rot), Math.cos(rot), 0) : new Vector3(0, 1, 0);
        shiftedReceiverCenter.current.set(receiverCenter.x, receiverCenter.y, receiverCenter.z);
        // how much the reflected light should shift in the direction of the receiver pipe?
        const shift =
          sunDirection.z < ZERO_TOLERANCE
            ? 0
            : (-receiverCenter.z * (sunDirection.y * rotationAxis.y + sunDirection.x * rotationAxis.x)) /
              sunDirection.z;
        shiftedReceiverCenter.current.x += shift * rotationAxis.x;
        shiftedReceiverCenter.current.y -= shift * rotationAxis.y;
        const reflectorToReceiver = shiftedReceiverCenter.current.clone().normalize();
        let normalVector = reflectorToReceiver.add(sunDirection).normalize();
        if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
          normalVector = new Vector3(-0.001, 0, 1).normalize();
        }
        const sunDirectionClone = sunDirection.clone();
        if (rot) {
          normalVector.applyAxisAngle(UNIT_VECTOR_POS_Z, -rot);
          sunDirectionClone.applyAxisAngle(UNIT_VECTOR_POS_Z, -rot);
        }
        const delta = (sunDirectionClone.y / sunDirectionClone.z) * receiverCenter.z;
        shiftedReceiverCenter.current.x -= (shift - delta) * rotationAxis.x;
        shiftedReceiverCenter.current.y += (shift - delta) * rotationAxis.y;
        return new Euler(0, Math.atan2(normalVector.x, normalVector.z), 0, 'ZXY');
      }
      return new Euler(tiltAngle, 0, relativeAzimuth, 'ZXY');
    }, [receiverCenter, sunDirection, tiltAngle, relativeAzimuth, rot]);

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
      for (let i = 0; i <= numberOfModules; i++) {
        const line: Vector3[] = [];
        line.push(new Vector3(-hx, -hy + i * dy, hz));
        line.push(new Vector3(hx, -hy + i * dy, hz));
        array.push({ points: line } as LineData);
      }
      return array;
    }, [lx, ly, hz, numberOfModules]);

    const baseSize = Math.max(1, Math.min(lx * 5, ly * 5, (lx + ly) / 16));
    const resizeHandleSize = RESIZE_HANDLE_SIZE * baseSize * 1.5;
    const moveHandleSize = MOVE_HANDLE_RADIUS * baseSize * 2;

    return (
      <group name={'Fresnel Reflector Group ' + id} rotation={euler} position={[cx, cy, cz + hz]}>
        <group rotation={relativeEuler}>
          {/* draw the upper side of the reflector */}
          <Box
            receiveShadow={shadowEnabled}
            castShadow={shadowEnabled}
            uuid={id}
            ref={baseRef}
            args={[lx, ly, lz]}
            name={'Fresnel Reflector'}
            onPointerDown={(e) => {
              if (e.button === 2) return; // ignore right-click
              selectMe(id, e, ActionType.Select);
            }}
            onContextMenu={(e) => {
              selectMe(id, e, ActionType.ContextMenu);
              setCommonStore((state) => {
                if (e.intersections.length > 0) {
                  const intersected = e.intersections[0].object === baseRef.current;
                  if (intersected) {
                    state.contextMenuObjectType = ObjectType.FresnelReflector;
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
            onPointerOut={() => {
              setHovered(false);
              domElement.style.cursor = 'default';
            }}
          >
            <meshStandardMaterial attach="material-0" color={color} />
            <meshStandardMaterial attach="material-1" color={color} />
            <meshStandardMaterial attach="material-2" color={color} />
            <meshStandardMaterial attach="material-3" color={color} />
            {showSolarRadiationHeatmap && heatmapTexture ? (
              <meshBasicMaterial attach="material-4" side={FrontSide} map={heatmapTexture} />
            ) : (
              <meshPhongMaterial
                attach="material-4"
                specular={new Color('white')}
                shininess={100 * reflectance}
                side={FrontSide}
                color={'lightskyblue'}
              />
            )}
            <meshStandardMaterial attach="material-5" color={color} />
          </Box>

          {moduleLines &&
            moduleLines.map((lineData, index) => {
              return (
                <Line
                  key={index}
                  name={'Fresnel Reflector Module Line'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={lineWidth}
                  color={lineColor}
                />
              );
            })}
          <Line
            name={'Fresnel Reflector Outline 1'}
            userData={{ unintersectable: true }}
            points={[
              [-hx, -hy, hz],
              [-hx, hy, hz],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={lineWidth}
            color={lineColor}
          />
          <Line
            name={'Fresnel Reflector Outline 2'}
            userData={{ unintersectable: true }}
            points={[
              [hx, -hy, hz],
              [hx, hy, hz],
            ]}
            castShadow={false}
            receiveShadow={false}
            lineWidth={lineWidth}
            color={lineColor}
          />

          {/* simulation element */}
          <Plane
            name={'Fresnel Reflector Simulation Plane'}
            uuid={id}
            args={[lx, ly]}
            position={[0, 0, hz]}
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
                [-hx, -hy, hz],
                [-hx, hy, hz],
                [hx, hy, hz],
                [hx, -hy, hz],
                [-hx, -hy, hz],
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
                castShadow={false}
                receiveShadow={false}
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
                  position={[(positionLL.x + positionLR.x) / 2, positionLL.y, positionLL.z - hz]}
                  args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                  name={ResizeHandleType.Lower}
                  castShadow={false}
                  receiveShadow={false}
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
                  position={[(positionUL.x + positionUR.x) / 2, positionUL.y, positionUL.z - hz]}
                  args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
                  name={ResizeHandleType.Upper}
                  castShadow={false}
                  receiveShadow={false}
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
                  castShadow={false}
                  receiveShadow={false}
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
                  castShadow={false}
                  receiveShadow={false}
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
            const radialSegments = elements.length < 100 ? 4 : 2;
            return (
              <Cylinder
                userData={{ unintersectable: true }}
                key={i}
                name={'Pole ' + i}
                castShadow={false}
                receiveShadow={false}
                args={[poleRadius, poleRadius, actualPoleHeight + (p.z - poleZ) * 2 + lz, radialSegments, 1]}
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
            rotation={[-euler.x, 0, -euler.z]}
            userData={{ unintersectable: true }}
            points={
              receiverCenter
                ? [
                    shiftedReceiverCenter.current,
                    new Vector3(0, 0, hz),
                    sunDirection.clone().multiplyScalar(sunBeamLength),
                  ]
                : [new Vector3(0, 0, hz), sunDirection.clone().multiplyScalar(sunBeamLength)]
            }
            name={'Sun Beam'}
            lineWidth={0.25}
            color={'white'}
            castShadow={false}
            receiveShadow={false}
          />
        )}

        {/* draw label */}
        {(hovered || showLabel) && !selected && (
          <textSprite
            userData={{ unintersectable: true }}
            name={'Label'}
            fontFace={'Roboto'}
            text={labelText}
            color={fresnelReflector?.labelColor ?? 'white'}
            fontSize={fresnelReflector?.labelFontSize ?? 20}
            textHeight={fresnelReflector?.labelSize ?? 0.2}
            castShadow={false}
            receiveShadow={false}
            position={[
              0,
              0,
              fresnelReflector?.labelHeight ?? Math.max(hy * Math.abs(Math.sin(fresnelReflector.tiltAngle)) + 0.1, 0.2),
            ]}
          />
        )}
      </group>
    );
  },
);

export default FresnelReflector;
