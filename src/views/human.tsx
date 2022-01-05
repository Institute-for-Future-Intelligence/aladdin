/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Euler, Group, Mesh, Object3D, TextureLoader, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { invalidate, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { HumanModel } from '../models/HumanModel';
import { Billboard, Plane, Sphere } from '@react-three/drei';
import { GROUND_ID, HALF_PI, HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_COLOR_1, MOVE_HANDLE_RADIUS } from '../constants';
import { ActionType, HumanName, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import i18n from '../i18n/i18n';
import { useStoreRef } from 'src/stores/commonRef';
import { HumanData } from '../HumanData';
import { Util } from '../Util';

const Human = ({ id, cx, cy, cz, name = HumanName.Jack, selected = false, locked = false, parentId }: HumanModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const selectMe = useStore(Selector.selectMe);
  const getElementById = useStore(Selector.getElementById);
  const moveHandleType = useStore(Selector.moveHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  const contentRef = useStoreRef((state) => state.contentRef);
  const parentRef = useRef<Object3D | null>(null);
  const groupRef = useRef<Group>(null);
  const planeRef = useRef<Mesh>(null);

  const lang = { lng: language };
  const humanModel = getElementById(id) as HumanModel;

  const textureLoader = useMemo(() => {
    return new TextureLoader().load(HumanData.fetchTextureImage(name), (texture) => {
      setTexture(texture);
      setUpdateFlag(!updateFlag);
    });
  }, [name]);
  const [texture, setTexture] = useState(textureLoader);

  const width = useMemo(() => {
    return HumanData.fetchWidth(name);
  }, [name]);

  const height = useMemo(() => {
    return HumanData.fetchHeight(name);
  }, [name]);

  const labelText = useMemo(() => {
    return HumanData.fetchLabel(name, lang);
  }, [name]);

  // attach parent dom element if parent is not Ground
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
    // rotation
    if (groupRef.current) {
      if (!orthographic) {
        const { x: cameraX, y: cameraY } = camera.position;
        const { x: currX, y: currY } = groupRef.current.position;
        if (parentRef.current) {
          parentRotation.set(0, 0, parentRef.current.rotation.z);
          worldPosition.addVectors(
            groupRef.current.position.clone().applyEuler(parentRotation),
            parentRef.current.position,
          );
          groupRef.current.rotation.set(
            0,
            0,
            -Math.atan2(cameraX - worldPosition.x, cameraY - worldPosition.y) - parentRotation.z,
          );
        } else {
          groupRef.current.rotation.set(0, 0, -Math.atan2(cameraX - currX, cameraY - currY));
        }
      } else {
        groupRef.current.rotation.set(HALF_PI, Math.PI, 0);
      }
    }
  });

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
            state.selectedElementHeight = humanModel.lz;
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

  return (
    <group ref={groupRef} name={'Human Group ' + id} userData={{ aabb: true }} position={[cx, cy, cz ?? 0]}>
      <group position={[0, 0.1, height / 2]}>
        <Billboard rotation={[HALF_PI, 0, 0]} uuid={id} name={name} follow={false}>
          <Plane
            ref={planeRef}
            renderOrder={3}
            name={`Human ${name} plane`}
            args={[width, height]}
            onContextMenu={(e) => {
              selectMe(id, e);
              setCommonStore((state) => {
                if (e.intersections.length > 0) {
                  const intersected = e.intersections[0].object === planeRef.current;
                  if (intersected) {
                    state.contextMenuObjectType = ObjectType.Human;
                  }
                }
              });
            }}
            onPointerDown={(e) => {
              if (e.button === 2) return; // ignore right-click
              if (e.eventObject === e.intersections[0].eventObject) {
                selectMe(id, e, ActionType.Move);
                useStoreRef.setState((state) => {
                  state.humanRef = groupRef;
                });
              }
            }}
            onPointerOver={(e) => {
              if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === planeRef.current;
                if (intersected) {
                  setHovered(true);
                }
              }
            }}
            onPointerOut={(e) => {
              setHovered(false);
            }}
          >
            <meshBasicMaterial map={texture} alphaTest={0.5} side={DoubleSide} />
          </Plane>
        </Billboard>

        {/* draw handle */}
        {selected && !locked && (
          <Sphere
            position={[0, 0, -height / 2]}
            args={[MOVE_HANDLE_RADIUS * 4, 6, 6, 0, Math.PI]}
            name={MoveHandleType.Default}
            onPointerDown={(e) => {
              if (e.eventObject === e.intersections[0].eventObject) {
                selectMe(id, e, ActionType.Move);
                useStoreRef.setState((state) => {
                  state.humanRef = groupRef;
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
        )}
        {hovered && !selected && (
          <textSprite
            name={'Label'}
            text={labelText + (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[0, 0, height / 2 + 0.4]}
          />
        )}
      </group>
    </group>
  );
};

export default React.memo(Human);
