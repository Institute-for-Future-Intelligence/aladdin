/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Group, Mesh, RepeatWrapping, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Box, Cone, Line, Plane, Sphere, useTexture } from '@react-three/drei';
import {
  DEFAULT_LEAF_OFF_DAY,
  DEFAULT_LEAF_OUT_DAY,
  GROUND_ID,
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  TWO_PI,
} from '../constants';
import { TreeModel } from '../models/TreeModel';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType, TreeType } from '../types';
import i18n from '../i18n/i18n';
import { useRefStore } from 'src/stores/commonRef';
import { Util } from '../Util';
import { TreeData } from '../TreeData';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage, useSelected } from '../hooks';
import { FoundationModel } from 'src/models/FoundationModel';

const Tree = React.memo((treeModel: TreeModel) => {
  const {
    parentId,
    id,
    cx,
    cy,
    cz,
    lx,
    lz,
    name = TreeType.Pine,
    flip = false,
    locked = false,
    showModel = false,
    showLabel = false,
  } = treeModel;

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
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const leafDayOfYear1 = useStore(Selector.world.leafDayOfYear1) ?? DEFAULT_LEAF_OUT_DAY;
  const leafDayOfYear2 = useStore(Selector.world.leafDayOfYear2) ?? DEFAULT_LEAF_OFF_DAY;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const selectMe = useStore(Selector.selectMe);
  const moveHandleType = useStore(Selector.moveHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const selected = useSelected(id);

  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();

  const contentRef = useRefStore((state) => state.contentRef);
  const groupRef = useRef<Group>(null);
  const solidTreeRef = useRef<Group>(null);
  const shadowTreeRef = useRef<Group>(null);
  const trunkMeshRef = useRef<Mesh>(null);
  const interactionPlaneRef = useRef<Group>(null);
  const resizeHandleTopRef = useRef<Mesh>(null);
  const resizeHandleLeftRef = useRef<Mesh>(null);
  const resizeHandleRightRef = useRef<Mesh>(null);
  const resizeHandleLowerRef = useRef<Mesh>(null);
  const resizeHandleUpperRef = useRef<Mesh>(null);

  const lang = useLanguage();

  const dayOfYear = useMemo(() => {
    return Util.dayOfYear(new Date(date));
  }, [date]);

  const noLeaves = useMemo(() => {
    return (
      !TreeData.isEvergreen(treeModel ? treeModel.name : TreeType.Dogwood) &&
      (latitude > 0
        ? dayOfYear < leafDayOfYear1 || dayOfYear > leafDayOfYear2
        : dayOfYear >= leafDayOfYear1 && dayOfYear <= leafDayOfYear2)
    );
  }, [dayOfYear, leafDayOfYear1, leafDayOfYear2, latitude, treeModel?.name]);

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
  }, [fileChangedState]);

  // attach parent dom element if parent is not Ground
  useEffect(() => {
    const parentObject = getParentObject();
    if (parentObject && groupRef.current) {
      parentObject.add(groupRef.current);
    }
  }, [contentRef]);

  // useTexture use same texture on all different element with same texture type, so we have to clone each one for different flip state.
  const texture = useTexture(TreeData.fetchTextureImage(name, dayOfYear, latitude, leafDayOfYear1, leafDayOfYear2));
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
      (treeModel?.label ? treeModel.label : TreeData.fetchLabel(name, lang)) +
      (locked ? ' (🔒)' : '') +
      (treeModel?.label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          cx.toFixed(1) +
          ', ' +
          cy.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang))
    );
  }, [treeModel?.label, name, cx, cy, locked, lang]);

  const theta = useMemo(() => {
    return TreeData.fetchTheta(name);
  }, [name]);

  const hx = lx / 2;
  const hz = lz / 2;
  const positionTop = useMemo(() => new Vector3(0, 0, hz), [hz]);
  const positionLeft = useMemo(() => new Vector3(-hx, 0, 0), [hx]);
  const positionRight = useMemo(() => new Vector3(hx, 0, 0), [hx]);
  const positionLower = useMemo(() => new Vector3(0, -hx, 0), [hx]);
  const positionUpper = useMemo(() => new Vector3(0, hx, 0), [hx]);

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
            state.selectedElementHeight = treeModel.lz;
          });
          if (Util.isMoveHandle(handle)) {
            gl.domElement.style.cursor = 'move';
          } else {
            gl.domElement.style.cursor = 'pointer';
          }
        }
      }
    },
    [treeModel?.lz],
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

  useFrame(({ camera }) => {
    // rotation
    if (solidTreeRef.current && groupRef.current && shadowTreeRef.current && interactionPlaneRef.current) {
      const { rot: parentWorldRotation } = Util.getWorldDataById(parentId);
      const { x: cameraX, y: cameraY } = camera.position;
      const { x: currX, y: currY } = groupRef.current.position;
      const { x: sunlightX, y: sunlightY } = useStore.getState().sunlightDirection;
      const parentObject = getParentObject();
      if (parentObject) {
        const worldPosition = groupRef.current.localToWorld(new Vector3());
        const e = Math.atan2(cameraX - worldPosition.x, cameraY - worldPosition.y) + parentWorldRotation;
        solidTreeRef.current.rotation.set(HALF_PI, -e, 0);
        interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
        shadowTreeRef.current.rotation.set(HALF_PI, -Math.atan2(sunlightX, sunlightY) - parentWorldRotation, 0);
      } else {
        const e = Math.atan2(cameraX - currX, cameraY - currY);
        solidTreeRef.current.rotation.set(HALF_PI, -e, 0);
        interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
        shadowTreeRef.current.rotation.set(HALF_PI, -Math.atan2(sunlightX, sunlightY), 0);
      }
    }
  });

  const handleSize = MOVE_HANDLE_RADIUS * 3;

  return (
    <>
      {isRender ? (
        <group ref={groupRef} name={'Tree Group ' + id} userData={{ aabb: true }} position={[cx, cy, _cz ?? 0]}>
          <group position={[0, 0, lz / 2]}>
            <Billboard ref={solidTreeRef} uuid={id} name={name} follow={false}>
              <Plane args={[lx, lz]}>
                <meshToonMaterial map={_texture} side={DoubleSide} alphaTest={0.5} />
              </Plane>
            </Billboard>

            {/* cast shadow */}
            <Billboard ref={shadowTreeRef} name={name + ' Shadow Billboard'} follow={false}>
              <Plane args={[lx, lz]} castShadow={shadowEnabled}>
                <meshBasicMaterial map={_texture} side={DoubleSide} alphaTest={0.5} opacity={0} />
              </Plane>
            </Billboard>

            {/* simulation model. use double side as some rays may intersect from backside */}
            {TreeData.isConic(name) ? (
              <Cone
                visible={showModel || orthographic}
                name={name + ' Model'}
                userData={{ isTree: true, treeType: name, simulation: true }}
                position={[0, 0, name === TreeType.Spruce ? 0 : lz * 0.06]}
                args={[lx / 2, lz, 8, 8, true]}
                scale={[1, 1, 1]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75} />
              </Cone>
            ) : (
              <Sphere
                visible={showModel || orthographic}
                userData={{ isTree: true, treeType: name, simulation: !noLeaves }}
                name={name + ' Model'}
                args={[lx / 2, 8, 8, 0, TWO_PI, 0, theta]}
                scale={[1, lz / lx, 1]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" side={DoubleSide} transparent={true} opacity={0.75} />
              </Sphere>
            )}

            {/* billboard for interactions (don't use a plane as it may become unselected at some angle) */}
            <Billboard
              ref={interactionPlaneRef}
              name={'Interaction Billboard'}
              visible={false}
              position={[0, 0, -lz / 2 + 0.5]}
            >
              <Plane
                ref={trunkMeshRef}
                renderOrder={3}
                name={name + ' plane'}
                args={[lx / 2, lz / 3]}
                rotation={[orthographic ? HALF_PI : 0, 0, 0]}
                onContextMenu={(e) => {
                  selectMe(id, e, ActionType.ContextMenu);
                  setCommonStore((state) => {
                    if (e.intersections.length > 0) {
                      const intersected = e.intersections[0].object === trunkMeshRef.current;
                      if (intersected) {
                        state.contextMenuObjectType = ObjectType.Tree;
                      }
                    }
                  });
                }}
                onPointerDown={(e) => {
                  if (e.button === 2) return; // ignore right-click
                  if (e.eventObject === e.intersections[0].eventObject) {
                    selectMe(id, e, ActionType.Move);
                    useRefStore.setState({
                      treeRef: groupRef,
                    });
                  }
                }}
                onPointerOver={(e) => {
                  if (e.intersections.length > 0) {
                    const intersected = e.intersections[0].object === trunkMeshRef.current;
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
                  [-lx / 2, -lz / 2, 0],
                  [-lx / 2, lz / 2, 0],
                  [-lx / 2, lz / 2, 0],
                  [lx / 2, lz / 2, 0],
                  [lx / 2, -lz / 2, 0],
                  [lx / 2, lz / 2, 0],
                  [lx / 2, -lz / 2, 0],
                  [-lx / 2, -lz / 2, 0],
                ]}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.5}
                rotation={solidTreeRef.current?.rotation}
                color={LOCKED_ELEMENT_SELECTION_COLOR}
              />
            )}

            {/* draw handles */}
            {selected && !locked && (
              <>
                {/* move handle */}
                <Sphere
                  position={new Vector3(0, 0, -lz / 2)}
                  args={[handleSize, 6, 6, 0, Math.PI]}
                  name={MoveHandleType.Default}
                  renderOrder={2}
                  onPointerDown={(e) => {
                    if (e.button !== 2 && e.eventObject === e.intersections[0].eventObject) {
                      selectMe(id, e, ActionType.Move);
                      useRefStore.setState({
                        treeRef: groupRef,
                      });
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
                {!orthographic && (
                  <>
                    {/* handle for resizing height */}
                    <Box
                      ref={resizeHandleTopRef}
                      name={ResizeHandleType.Top}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionTop}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerEnter={(e) => {
                        hoverHandle(e, ResizeHandleType.Top);
                      }}
                      onPointerLeave={noHoverHandle}
                    >
                      <meshBasicMaterial
                        attach="material"
                        color={
                          hoveredHandle === ResizeHandleType.Top || resizeHandleType === ResizeHandleType.Top
                            ? HIGHLIGHT_HANDLE_COLOR
                            : RESIZE_HANDLE_COLOR
                        }
                      />
                    </Box>
                    {/* left handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleLeftRef}
                      name={ResizeHandleType.Left}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionLeft}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerEnter={(e) => {
                        hoverHandle(e, ResizeHandleType.Left);
                      }}
                      onPointerLeave={noHoverHandle}
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
                    {/* right handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleRightRef}
                      name={ResizeHandleType.Right}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionRight}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerEnter={(e) => {
                        hoverHandle(e, ResizeHandleType.Right);
                      }}
                      onPointerLeave={noHoverHandle}
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
                    {/* lower handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleLowerRef}
                      name={ResizeHandleType.Lower}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionLower}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerEnter={(e) => {
                        hoverHandle(e, ResizeHandleType.Lower);
                      }}
                      onPointerLeave={noHoverHandle}
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
                    {/* upper handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleUpperRef}
                      name={ResizeHandleType.Upper}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionUpper}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerEnter={(e) => {
                        hoverHandle(e, ResizeHandleType.Upper);
                      }}
                      onPointerLeave={noHoverHandle}
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
                  </>
                )}
              </>
            )}
            {(hovered || showLabel) && !selected && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label'}
                fontFace={'Roboto'}
                text={labelText}
                color={treeModel?.labelColor ?? 'white'}
                fontSize={treeModel?.labelFontSize ?? 20}
                textHeight={treeModel?.labelSize ?? 0.2}
                position={[0, 0, lz / 2 + (treeModel?.labelHeight ?? 0.4)]}
              />
            )}
          </group>
        </group>
      ) : null}
    </>
  );
});

export default Tree;
