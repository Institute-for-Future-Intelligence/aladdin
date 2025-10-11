/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Group, Mesh, RepeatWrapping, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Line, Plane, Sphere, useTexture } from '@react-three/drei';
import {
  DEFAULT_LEAF_OFF_DAY,
  DEFAULT_LEAF_OUT_DAY,
  GROUND_ID,
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_RADIUS,
} from '../constants';
import { ActionType, FlowerType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import i18n from '../i18n/i18n';
import { useRefStore } from 'src/stores/commonRef';
import { Util } from '../Util';
import { FlowerModel } from '../models/FlowerModel';
import { FlowerData } from '../FlowerData';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useSelected } from '../hooks';
import { FoundationModel } from 'src/models/FoundationModel';

const Flower = React.memo((flowerModel: FlowerModel) => {
  const { parentId, id, cx, cy, cz, name = FlowerType.WhiteFlower, flip = false, locked = false } = flowerModel;

  let isRender = false;
  const parent = useStore((state) => {
    if (parentId === GROUND_ID) {
      isRender = true;
      return null;
    } else {
      for (const e of state.elements) {
        if (e.id === parentId) {
          isRender = true;
          return e;
        }
      }
    }
  });

  let _cz = cz;
  if (parent && parent.type === ObjectType.Foundation) {
    const foundation = parent as FoundationModel;
    if (foundation.enableSlope) {
      _cz = foundation.cz + Util.getZOnSlope(foundation.lx, foundation.slope, cx);
    }
  }

  const removeElementById = useStore(Selector.removeElementById);
  useEffect(() => {
    if (!isRender) {
      removeElementById(id, false);
    }
  }, [isRender]);

  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const leafDayOfYear1 = useStore(Selector.world.leafDayOfYear1) ?? DEFAULT_LEAF_OUT_DAY;
  const leafDayOfYear2 = useStore(Selector.world.leafDayOfYear2) ?? DEFAULT_LEAF_OFF_DAY;
  const selectMe = useStore(Selector.selectMe);
  const moveHandleType = useStore(Selector.moveHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);

  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();
  const selected = useSelected(id);

  const contentRef = useRefStore((state) => state.contentRef);
  const groupRef = useRef<Group>(null);
  const flowerRef = useRef<Group>(null);
  const interactionMeshRef = useRef<Mesh>(null);
  const interactionPlaneRef = useRef<Group>(null);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const noLeaves = useMemo(() => {
    const dayOfYear = Util.dayOfYear(new Date(date));
    return latitude > 0
      ? dayOfYear < leafDayOfYear1 || dayOfYear > leafDayOfYear2
      : dayOfYear >= leafDayOfYear1 && dayOfYear <= leafDayOfYear2;
  }, [date, leafDayOfYear1, leafDayOfYear2, latitude]);

  const fileChangedRef = useRef(false);
  const fileChangedState = useStore(Selector.fileChanged);

  if (fileChangedState !== fileChangedRef.current) {
    fileChangedRef.current = fileChangedState;
    if (contentRef?.current && groupRef.current) {
      contentRef.current.add(groupRef.current);
    }
  }

  useEffect(() => {
    if (parentId !== GROUND_ID) {
      const obj = getParentObject();
      if (obj && groupRef.current) {
        obj.add(groupRef.current);
      }
    }
  }, [fileChangedState, parentId]);

  // attach parent dom element if parent is not Ground
  useEffect(() => {
    const parentObject = getParentObject();
    if (parentObject && groupRef.current) {
      parentObject.add(groupRef.current);
    }
  }, [contentRef]);

  // useTexture use same texture on all different element with same texture type, so we have to clone each one for different flip state.
  const texture = useTexture(FlowerData.fetchTextureImage(name, noLeaves));
  const _texture = useMemo(() => {
    const cloned = texture.clone();
    if (flip) {
      cloned.wrapS = RepeatWrapping;
      cloned.repeat.x = -1;
      cloned.needsUpdate = true;
    } else {
      cloned.repeat.x = 1;
    }
    return cloned;
  }, [texture, flip]);

  const labelText = useMemo(() => {
    return (
      FlowerData.fetchLabel(name, lang) +
      (locked ? ' (🔒)' : '') +
      '\n' +
      i18n.t('word.Coordinates', lang) +
      ': (' +
      cx.toFixed(1) +
      ', ' +
      cy.toFixed(1) +
      ') ' +
      i18n.t('word.MeterAbbreviation', lang)
    );
  }, [name, cx, cy, locked, lang]);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (usePrimitiveStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          setCommonStore((state) => {
            state.hoveredHandle = handle;
            state.selectedElementHeight = flowerModel.lz;
          });
          if (Util.isMoveHandle(handle)) {
            gl.domElement.style.cursor = 'move';
          } else {
            gl.domElement.style.cursor = 'pointer';
          }
        }
      }
    },
    [flowerModel.lz],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  // return null if parent is Ground
  const getParentObject = () => {
    if (parentId !== GROUND_ID && contentRef?.current) {
      return Util.getObjectChildById(contentRef.current, parentId);
    }
    return null;
  };

  const width = useMemo(() => {
    return FlowerData.fetchSpread(name);
  }, [name]);

  const height = useMemo(() => {
    return FlowerData.fetchHeight(name);
  }, [name]);

  useFrame(({ camera }) => {
    // rotation
    if (groupRef.current) {
      const { rot: parentWorldRotation } = Util.getWorldDataById(parentId);

      if (!orthographic) {
        if (flowerRef.current && interactionPlaneRef.current) {
          const { x: cameraX, y: cameraY } = camera.position;
          const { x: currX, y: currY } = groupRef.current.position;
          const parentObject = getParentObject();
          if (parentObject) {
            const worldPosition = groupRef.current.localToWorld(new Vector3());
            const e = Math.atan2(cameraX - worldPosition.x, cameraY - worldPosition.y) + parentWorldRotation;
            flowerRef.current.rotation.set(HALF_PI, -e, 0);
            interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
          } else {
            const e = Math.atan2(cameraX - currX, cameraY - currY);
            flowerRef.current.rotation.set(HALF_PI, -e, 0);
            interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
          }
        }
        groupRef.current.rotation.set(0, 0, 0);
      } else {
        if (flowerRef.current && interactionPlaneRef.current) {
          flowerRef.current.rotation.set(HALF_PI, 0, 0);
          interactionPlaneRef.current.rotation.set(0, 0, 0);
        }
        groupRef.current.rotation.set(-HALF_PI, 0, 0);
      }
    }
  });

  const handleSize = MOVE_HANDLE_RADIUS * 3;

  return (
    <>
      {isRender ? (
        // in orthographic mode, we need to lift it up a bit so that it can be more easily picked
        <group
          ref={groupRef}
          name={'Flower Group ' + id}
          userData={{ aabb: true }}
          position={[cx, cy, (_cz ?? 0) + (orthographic ? 0.25 : 0)]}
        >
          <group position={[0, 0, height / 2]}>
            <Billboard ref={flowerRef} uuid={id} name={name} follow={false} rotation={[HALF_PI, 0, 0]}>
              <Plane args={[width, height]} receiveShadow={!showSolarRadiationHeatmap}>
                <meshToonMaterial map={_texture} side={DoubleSide} alphaTest={0.5} />
              </Plane>
            </Billboard>

            {/* billboard for interactions (don't use a plane as it may become unselected at some angle) */}
            <Billboard
              ref={interactionPlaneRef}
              name={'Interaction Billboard'}
              visible={false}
              position={[0, 0, -height / 2]}
            >
              <Plane
                ref={interactionMeshRef}
                renderOrder={3}
                name={name + ' plane'}
                args={[width / 2, height * 2]}
                rotation={[orthographic ? HALF_PI : 0, 0, 0]}
                onContextMenu={(e) => {
                  selectMe(id, e, ActionType.ContextMenu);
                  setCommonStore((state) => {
                    if (e.intersections.length > 0) {
                      const intersected = e.intersections[0].object === interactionMeshRef.current;
                      if (intersected) {
                        state.contextMenuObjectType = ObjectType.Flower;
                      }
                    }
                  });
                }}
                onPointerDown={(e) => {
                  if (e.button === 2) return; // ignore right-click
                  if (e.eventObject === e.intersections[0].eventObject) {
                    selectMe(id, e, ActionType.Move);
                    useRefStore.setState({
                      flowerRef: groupRef,
                    });
                  }
                }}
                onPointerOver={(e) => {
                  if (e.intersections.length > 0) {
                    const intersected = e.intersections[0].object === interactionMeshRef.current;
                    if (intersected) {
                      setHovered(true);
                    }
                  }
                }}
                onPointerOut={() => {
                  setHovered(false);
                }}
              />
            </Billboard>

            {/* highlight it when it is selected but locked */}
            {selected && locked && (
              <Line
                name={'Selection highlight lines'}
                userData={{ unintersectable: true }}
                points={[
                  [-width / 2, -height / 2, 0],
                  [-width / 2, height / 2, 0],
                  [-width / 2, height / 2, 0],
                  [width / 2, height / 2, 0],
                  [width / 2, -height / 2, 0],
                  [width / 2, height / 2, 0],
                  [width / 2, -height / 2, 0],
                  [-width / 2, -height / 2, 0],
                ]}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.5}
                rotation={flowerRef.current?.rotation}
                color={LOCKED_ELEMENT_SELECTION_COLOR}
              />
            )}

            {/* draw handles */}
            {selected && !locked && (
              <>
                {/* move handle */}
                <Sphere
                  position={new Vector3(0, 0, -height / 2)}
                  args={[handleSize, 6, 6, 0, Math.PI]}
                  name={MoveHandleType.Default}
                  renderOrder={2}
                  onPointerDown={(e) => {
                    if (e.eventObject === e.intersections[0].eventObject) {
                      if (e.button === 2) {
                        // right click
                        setCommonStore((state) => {
                          state.contextMenuObjectType = ObjectType.Flower;
                        });
                      } else {
                        selectMe(id, e, ActionType.Move);
                        useRefStore.setState({
                          flowerRef: groupRef,
                        });
                      }
                    }
                  }}
                  onPointerEnter={(e) => {
                    hoverHandle(e, MoveHandleType.Default);
                  }}
                  onPointerLeave={noHoverHandle}
                >
                  <meshBasicMaterial
                    attach="material"
                    color={
                      hoveredHandle === MoveHandleType.Default || moveHandleType === MoveHandleType.Default
                        ? HIGHLIGHT_HANDLE_COLOR
                        : MOVE_HANDLE_COLOR_1
                    }
                  />
                </Sphere>
              </>
            )}
            {hovered && !selected && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label'}
                fontFace={'Roboto'}
                text={labelText}
                color={flowerModel?.labelColor ?? 'white'}
                fontSize={flowerModel?.labelFontSize ?? 20}
                textHeight={flowerModel?.labelSize ?? 0.2}
                position={[0, 0, height / 2 + (flowerModel?.labelHeight ?? 0.4)]}
              />
            )}
          </group>
        </group>
      ) : null}
    </>
  );
});

export default Flower;
