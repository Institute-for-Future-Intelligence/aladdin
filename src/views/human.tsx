/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, Group, Mesh, RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { HumanModel } from '../models/HumanModel';
import { Billboard, Cylinder, Line, Plane, Sphere } from '@react-three/drei';
import {
  GROUND_ID,
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_RADIUS,
  TWO_PI,
} from '../constants';
import {
  ActionType,
  Gender,
  HumanName,
  MoveHandleType,
  ObjectType,
  ResizeHandleType,
  RotateHandleType,
} from '../types';
import i18n from '../i18n/i18n';
import { useRefStore } from 'src/stores/commonRef';
import { HumanData } from '../HumanData';
import { Util } from '../Util';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage, useSelected } from './hooks';

const Human = React.memo(
  ({ id, cx, cy, cz, name = HumanName.Jack, locked = false, flip = false, observer = false, parentId }: HumanModel) => {
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
    useEffect(() => {
      if (!isRender) {
        removeElementById(id, false);
      }
    }, [isRender, id]);

    const setCommonStore = useStore(Selector.set);
    const orthographic = useStore(Selector.viewState.orthographic) ?? false;
    const selectMe = useStore(Selector.selectMe);
    const getElementById = useStore(Selector.getElementById);
    const moveHandleType = useStore(Selector.moveHandleType);
    const hoveredHandle = useStore(Selector.hoveredHandle);

    const selected = useSelected(id);

    const { gl } = useThree();
    const [hovered, setHovered] = useState(false);

    const contentRef = useRefStore((state) => state.contentRef);
    const groupRef = useRef<Group>(null);
    const planeRef = useRef<Mesh>(null);

    const lang = useLanguage();

    const humanModel = useMemo(() => getElementById(id) as HumanModel, [id]);

    const fileChangedRef = useRef(false);
    const fileChangedState = useStore(Selector.fileChanged);

    // after we delete their parent(change file), we have to add the ref to content immediately,
    // because their new parent may not be mounted yet.
    if (fileChangedState !== fileChangedRef.current) {
      fileChangedRef.current = fileChangedState;
      if (contentRef?.current && groupRef.current) {
        contentRef.current.add(groupRef.current);
      }
    }

    // once useEffect detect state change, that means their parent is now mounted, then we add ref to their new parent.
    useEffect(() => {
      if (parentId !== GROUND_ID) {
        const obj = getParentObject();
        if (obj && groupRef.current) {
          obj.add(groupRef.current);
        }
      }
    }, [fileChangedState, parentId]);

    const loadedTexture = useMemo(() => {
      return new TextureLoader().load(HumanData.fetchTextureImage(name), (texture) => {
        if (flip) {
          texture.wrapS = RepeatWrapping;
          texture.repeat.x = -1;
        }
        setTexture(texture);
      });
    }, [name, flip]);
    const [texture, setTexture] = useState(loadedTexture);

    const width = useMemo(() => {
      return HumanData.fetchWidth(name);
    }, [name]);

    const height = useMemo(() => {
      return HumanData.fetchHeight(name);
    }, [name]);

    const labelText = useMemo(() => {
      return (
        HumanData.fetchLabel(name, lang) +
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
    }, [name, locked, cx, cy, lang]);

    // attach parent dom element if parent is not Ground
    useEffect(() => {
      const parentObject = getParentObject();
      if (parentObject && groupRef.current) {
        parentObject.add(groupRef.current);
      }
    }, [contentRef]);

    // return null if parent is Ground
    const getParentObject = () => {
      if (parentId !== GROUND_ID && contentRef?.current) {
        return Util.getObjectChildById(contentRef.current, parentId);
      }
      return null;
    };

    useFrame(({ camera }) => {
      // rotation
      if (groupRef.current) {
        const { rot: parentWorldRotation } = Util.getWorldDataById(parentId);
        if (!orthographic) {
          const { x: cameraX, y: cameraY } = camera.position;
          const { x: currX, y: currY } = groupRef.current.localToWorld(new Vector3());
          groupRef.current.rotation.set(0, 0, -Math.atan2(cameraX - currX, cameraY - currY) - parentWorldRotation);
        } else {
          groupRef.current.rotation.set(HALF_PI, Math.PI - parentWorldRotation, 0);
        }
      }
    });

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
      [humanModel.lz],
    );

    const noHoverHandle = useCallback(() => {
      setCommonStore((state) => {
        state.hoveredHandle = null;
      });
      gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
    }, []);

    const gender = observer ? HumanData.fetchGender(humanModel.name) : Gender.Male;
    const hatOffsetX = observer ? (humanModel.flip ? -1 : 1) * HumanData.fetchHatOffsetX(humanModel.name) : 0;
    const hatOffsetY = observer ? HumanData.fetchHatOffsetY(humanModel.name) : 0;

    if (!isRender) return null;

    return (
      <group ref={groupRef} name={'Human Group ' + id} userData={{ aabb: true }} position={[cx, cy, cz ?? 0]}>
        <group position={[0, 0.1, height / 2]}>
          <Billboard rotation={[HALF_PI, 0, 0]} uuid={id} name={name} follow={false}>
            <Plane
              ref={planeRef}
              renderOrder={3}
              receiveShadow={true}
              name={`Human ${name} plane`}
              args={[width, height]}
              onContextMenu={(e) => {
                selectMe(id, e, ActionType.ContextMenu);
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
                  useRefStore.setState({
                    humanRef: groupRef,
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
              onPointerOut={() => {
                setHovered(false);
              }}
            >
              <meshToonMaterial map={texture} alphaTest={0.5} side={DoubleSide} />
            </Plane>
          </Billboard>

          {/* highlight this person when he or she is selected but locked */}
          {selected && locked && (
            <Line
              name={'Selection highlight lines'}
              userData={{ unintersectable: true }}
              points={[
                [-width / 2, 0, -height / 2],
                [-width / 2, 0, height / 2],
                [-width / 2, 0, height / 2],
                [width / 2, 0, height / 2],
                [width / 2, 0, -height / 2],
                [width / 2, 0, height / 2],
                [width / 2, 0, -height / 2],
                [-width / 2, 0, -height / 2],
              ]}
              castShadow={false}
              receiveShadow={false}
              lineWidth={0.5}
              rotation={planeRef.current?.rotation}
              color={LOCKED_ELEMENT_SELECTION_COLOR}
            />
          )}

          {/* mark this person with a hat when he or she is an observer */}
          {observer && (
            <>
              <Sphere
                uuid={id}
                visible={false}
                userData={{ eyeball: true }}
                name={name + ' eyeball'}
                args={[width / 5, 4, 4, 0, TWO_PI, 0, TWO_PI]}
                position={[0, 0, humanModel.lz / 2]}
              >
                <meshBasicMaterial attach="material" side={DoubleSide} />
              </Sphere>
              <Cylinder
                name={'Observer hat 1'}
                userData={{ unintersectable: true }}
                castShadow={false}
                receiveShadow={false}
                args={[0.1, 0.1, 0.1, 16, 2]}
                position={[hatOffsetX, 0, humanModel.lz / 2 - 0.05 + hatOffsetY]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={gender === Gender.Male ? 'gray' : 'hotpink'} />
              </Cylinder>
              <Cylinder
                name={'Observer hat 2'}
                userData={{ unintersectable: true }}
                castShadow={false}
                receiveShadow={false}
                args={[0.2, 0.2, 0.01, 16, 2]}
                position={[hatOffsetX, 0, humanModel.lz / 2 - 0.1 + hatOffsetY]}
                rotation={[HALF_PI, 0, 0]}
              >
                <meshStandardMaterial attach="material" color={gender === Gender.Male ? 'gray' : 'hotpink'} />
              </Cylinder>
            </>
          )}

          {/* draw handle */}
          {selected && !locked && (
            <Sphere
              position={[0, 0, -height / 2]}
              args={[MOVE_HANDLE_RADIUS * 4, 6, 6, 0, Math.PI]}
              name={MoveHandleType.Default}
              onPointerDown={(e) => {
                if (e.button !== 2 && e.eventObject === e.intersections[0].eventObject) {
                  selectMe(id, e, ActionType.Move);
                  useRefStore.setState({
                    humanRef: groupRef,
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
          )}
          {hovered && !selected && (
            <textSprite
              userData={{ unintersectable: true }}
              name={'Label'}
              fontFace={'Roboto'}
              text={labelText}
              color={humanModel?.labelColor ?? 'white'}
              fontSize={humanModel?.labelFontSize ?? 20}
              textHeight={humanModel?.labelSize ?? 0.2}
              position={[0, 0, height / 2 + (humanModel?.labelHeight ?? 0.4)]}
            />
          )}
        </group>
      </group>
    );
  },
);

export default Human;
