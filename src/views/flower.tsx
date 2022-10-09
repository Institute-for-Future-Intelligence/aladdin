/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshDepthMaterial,
  Object3D,
  RGBADepthPacking,
  TextureLoader,
  Vector3,
} from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { invalidate, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Box, Line, Plane, Sphere } from '@react-three/drei';
import {
  GROUND_ID,
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
} from '../constants';
import { ActionType, FlowerType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import i18n from '../i18n/i18n';
import { useStoreRef } from 'src/stores/commonRef';
import { Util } from '../Util';
import { FlowerModel } from '../models/FlowerModel';
import { FlowerData } from '../FlowerData';

const Flower = ({
  parentId,
  id,
  cx,
  cy,
  cz,
  lx,
  lz,
  name = FlowerType.Daylily,
  selected = false,
  locked = false,
}: FlowerModel) => {
  let isRender = false;
  useStore((state) => {
    if (parentId === GROUND_ID) {
      isRender = true;
    } else {
      for (const e of state.elements) {
        if (e.id === parentId) {
          isRender = true;
          break;
        }
      }
    }
  });
  const removeElementById = useStore(Selector.removeElementById);
  if (!isRender) {
    removeElementById(id, false);
  }

  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const date = useStore(Selector.world.date);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const selectMe = useStore(Selector.selectMe);
  const getElementById = useStore(Selector.getElementById);
  const moveHandleType = useStore(Selector.moveHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const sunlightDirection = useStore(Selector.sunlightDirection);

  const now = new Date(date);
  const [hovered, setHovered] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const { gl } = useThree();

  const contentRef = useStoreRef((state) => state.contentRef);
  const parentRef = useRef<Object3D | null>(null);
  const groupRef = useRef<Group>(null);
  const solidFlowerRef = useRef<Mesh>(null);
  const shadowFlowerRef = useRef<Mesh>(null);
  const trunkMeshRef = useRef<Mesh>(null);
  const interactionPlaneRef = useRef<Mesh>(null);
  const resizeHandleTopRef = useRef<Mesh>();
  const resizeHandleLeftRef = useRef<Mesh>();
  const resizeHandleRightRef = useRef<Mesh>();
  const resizeHandleLowerRef = useRef<Mesh>();
  const resizeHandleUpperRef = useRef<Mesh>();

  const flowerModel = getElementById(id) as FlowerModel;
  const month = now.getMonth() + 1;
  const noLeaves = month < 4 || month > 10; // TODO: This needs to depend on location
  const lang = { lng: language };
  const night = sunlightDirection.z <= 0;

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

  const textureLoader = useMemo(() => {
    return new TextureLoader().load(FlowerData.fetchTextureImage(name, noLeaves), (texture) => {
      setTexture(texture);
      setUpdateFlag(!updateFlag);
    });
  }, [name, noLeaves]);
  const [texture, setTexture] = useState(textureLoader);

  const labelText = useMemo(() => {
    return (
      FlowerData.fetchLabel(name, lang) +
      (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      '\n' +
      i18n.t('word.Coordinates', lang) +
      ': (' +
      cx.toFixed(1) +
      ', ' +
      cy.toFixed(1) +
      ') ' +
      i18n.t('word.MeterAbbreviation', lang)
    );
  }, [name, cx, cy, locked, language]);

  const customDepthMaterial = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    map: texture,
    alphaTest: 0.1,
  });

  const hx = lx / 2;
  const hz = lz / 2;
  const positionTop = useMemo(() => new Vector3(0, 0, hz), [hz]);
  const positionLeft = useMemo(() => new Vector3(-hx, 0, 0), [hx]);
  const positionRight = useMemo(() => new Vector3(hx, 0, 0), [hx]);
  const positionLower = useMemo(() => new Vector3(0, -hx, 0), [hx]);
  const positionUpper = useMemo(() => new Vector3(0, hx, 0), [hx]);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (useStore.getState().duringCameraInteraction) return;
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
    [],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  useEffect(() => {
    parentRef.current = getParentObject();
    if (parentRef.current && groupRef.current) {
      parentRef.current.add(groupRef.current);
    }
  }, [contentRef]);

  useEffect(() => {
    parentRef.current = getParentObject();
    invalidate();
  }, [parentId]);

  const getObjectId = (obj: Object3D) => {
    return obj.name.split(' ')[2];
  };

  // return null if parent is Ground
  const getParentObject = () => {
    if (parentId !== GROUND_ID && contentRef?.current) {
      for (const object of contentRef.current.children) {
        if (parentId === getObjectId(object)) {
          return object;
        }
      }
    }
    return null;
  };

  const worldPosition = useMemo(() => new Vector3(), []);
  const parentRotation = useMemo(() => new Euler(), []);

  useFrame(({ camera }) => {
    // parent resizing
    // if (parentRef.current && groupRef.current) {
    //   const { plx, ply, plz } = getObjectParameters(parentRef.current.children[0] as Mesh);
    //   if (parent && parent.lz !== plz) {
    //     groupRef.current.position.setZ((plz / parent.lz) * cz);
    //   }
    // }

    // rotation
    if (solidFlowerRef.current && groupRef.current && shadowFlowerRef.current && interactionPlaneRef.current) {
      const { x: cameraX, y: cameraY } = camera.position;
      const { x: currX, y: currY } = groupRef.current.position;
      const { x: sunlightX, y: sunlightY } = useStore.getState().sunlightDirection;
      if (parentRef.current) {
        parentRotation.set(0, 0, parentRef.current.rotation.z);
        worldPosition.addVectors(
          groupRef.current.position.clone().applyEuler(parentRotation),
          parentRef.current.position,
        );
        const e = Math.atan2(cameraX - worldPosition.x, cameraY - worldPosition.y) + parentRotation.z;
        solidFlowerRef.current.rotation.set(HALF_PI, -e, 0);
        interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
        shadowFlowerRef.current.rotation.set(HALF_PI, -Math.atan2(sunlightX, sunlightY) - parentRotation.z, 0);
      } else {
        const e = Math.atan2(cameraX - currX, cameraY - currY);
        solidFlowerRef.current.rotation.set(HALF_PI, -e, 0);
        interactionPlaneRef.current.rotation.set(-HALF_PI, e, 0);
        shadowFlowerRef.current.rotation.set(HALF_PI, -Math.atan2(sunlightX, sunlightY), 0);
      }
    }
  });

  const handleSize = MOVE_HANDLE_RADIUS * 3;

  return (
    <>
      {isRender ? (
        <group ref={groupRef} name={'Flower Group ' + id} userData={{ aabb: true }} position={[cx, cy, cz ?? 0]}>
          <group position={[0, 0, lz / 2]}>
            <Billboard ref={solidFlowerRef} uuid={id} name={name} follow={false}>
              <Plane args={[lx, lz]}>
                {night ? (
                  <meshStandardMaterial map={texture} side={DoubleSide} alphaTest={0.5} />
                ) : (
                  <meshBasicMaterial map={texture} side={DoubleSide} alphaTest={0.5} />
                )}
              </Plane>
            </Billboard>

            {/* cast shadow */}
            <Billboard ref={shadowFlowerRef} name={name + ' Shadow Billboard'} follow={false}>
              <Plane castShadow={shadowEnabled} args={[lx, lz]} customDepthMaterial={customDepthMaterial}>
                <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0} depthTest={false} />
              </Plane>
            </Billboard>

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
                  selectMe(id, e);
                  setCommonStore((state) => {
                    if (e.intersections.length > 0) {
                      const intersected = e.intersections[0].object === trunkMeshRef.current;
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
                    useStoreRef.setState((state) => {
                      state.flowerRef = groupRef;
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
                onPointerOut={(e) => {
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
                rotation={solidFlowerRef.current?.rotation}
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
                    if (e.eventObject === e.intersections[0].eventObject) {
                      selectMe(id, e, ActionType.Move);
                      useStoreRef.setState((state) => {
                        state.flowerRef = groupRef;
                      });
                    }
                  }}
                  onPointerOver={(e) => {
                    hoverHandle(e, MoveHandleType.Default);
                  }}
                  onPointerOut={noHoverHandle}
                >
                  <meshStandardMaterial
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
                      onPointerOver={(e) => {
                        hoverHandle(e, ResizeHandleType.Top);
                      }}
                      onPointerOut={noHoverHandle}
                    >
                      <meshStandardMaterial
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
                      onPointerOver={(e) => {
                        hoverHandle(e, ResizeHandleType.Left);
                      }}
                      onPointerOut={noHoverHandle}
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
                    {/* right handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleRightRef}
                      name={ResizeHandleType.Right}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionRight}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerOver={(e) => {
                        hoverHandle(e, ResizeHandleType.Right);
                      }}
                      onPointerOut={noHoverHandle}
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
                    {/* lower handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleLowerRef}
                      name={ResizeHandleType.Lower}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionLower}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerOver={(e) => {
                        hoverHandle(e, ResizeHandleType.Lower);
                      }}
                      onPointerOut={noHoverHandle}
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
                    {/* upper handle for resizing crown spread */}
                    <Box
                      ref={resizeHandleUpperRef}
                      name={ResizeHandleType.Upper}
                      args={[handleSize, handleSize, handleSize]}
                      position={positionUpper}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                      }}
                      onPointerOver={(e) => {
                        hoverHandle(e, ResizeHandleType.Upper);
                      }}
                      onPointerOut={noHoverHandle}
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
                  </>
                )}
              </>
            )}
            {hovered && !selected && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label'}
                text={labelText}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[0, 0, lz / 2 + 0.4]}
              />
            )}
          </group>
        </group>
      ) : null}
    </>
  );
};

export default React.memo(Flower);
