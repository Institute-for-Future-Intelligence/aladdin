/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import { useStoreRef } from '../stores/commonRef';
import * as Selector from '../stores/selector';
import { Plane } from '@react-three/drei';
import { DoubleSide, Euler, Group, Intersection, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  GROUND_ID,
  HALF_PI,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  ORIGIN_VECTOR2,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from '../constants';
import { Util } from '../Util';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableRotate } from '../undo/UndoableRotate';
import { UndoableAdd } from '../undo/UndoableAdd';
import { WallModel } from 'src/models/WallModel';
import { PolygonModel } from '../models/PolygonModel';
import { WallAbsPos } from './wall/WallAbsPos';
import { Point2 } from '../models/Point2';

const Ground = () => {
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getChildren = useStore(Selector.getChildren);
  const selectNone = useStore(Selector.selectNone);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const moveHandleType = useStore(Selector.moveHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const setElementRotation = useStore(Selector.updateElementRotationById);
  const addElement = useStore(Selector.addElement);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const addUndoable = useStore(Selector.addUndoable);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundColor = useStore(Selector.viewState.groundColor);
  const groundModel = useStore((state) => state.world.ground);
  const deletedFoundationId = useStore(Selector.deletedFoundationId);
  const deletedCuboidId = useStore(Selector.deletedCuboidId);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);

  const {
    camera,
    gl: { domElement },
    scene,
    invalidate,
  } = useThree();
  const groundPlaneRef = useRef<Mesh>();
  const intersectionPlaneRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const oldPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const newPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldRotationRef = useRef<number[]>([0, 0, 1]);
  const newRotationRef = useRef<number[]>([0, 0, 1]);
  const absPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const polygonsAbsPosMapRef = useRef<Map<string, Vector2[]>>(new Map());
  const wallsAbsPosMapRef = useRef<Map<string, WallAbsPos>>(new Map());
  const isSettingFoundationStartPointRef = useRef(false);
  const isSettingFoundationEndPointRef = useRef(false);
  const isSettingCuboidStartPointRef = useRef(false);
  const isSettingCuboidEndPointRef = useRef(false);

  const [isHumanOrTreeMoved, setIsHumanOrTreeMoved] = useState(false);

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deletedFoundationId) {
      setCommonStore((state) => {
        state.addedFoundationId = null;
        state.deletedFoundationId = null;
      });
      isSettingFoundationStartPointRef.current = false;
      isSettingFoundationEndPointRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedFoundationId]);

  useEffect(() => {
    if (deletedCuboidId) {
      setCommonStore((state) => {
        state.addedCuboidId = null;
        state.deletedCuboidId = null;
      });
      isSettingCuboidStartPointRef.current = false;
      isSettingCuboidEndPointRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedCuboidId]);

  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const cosAngle = grabRef.current ? Math.cos(grabRef.current.rotation[2]) : 1;
  const sinAngle = grabRef.current ? Math.sin(grabRef.current.rotation[2]) : 0;
  let intersectionPlaneType = IntersectionPlaneType.Ground;
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);
  const elementParentRotation = useMemo(() => new Euler(), []);

  if (grabRef.current) {
    if (moveHandleType === MoveHandleType.Top) {
      intersectionPlaneType = IntersectionPlaneType.Horizontal;
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, grabRef.current.lz + MOVE_HANDLE_OFFSET);
      intersectionPlaneAngle.set(0, 0, 0);
    } else if (
      moveHandleType === MoveHandleType.Left ||
      moveHandleType === MoveHandleType.Right ||
      moveHandleType === MoveHandleType.Lower ||
      moveHandleType === MoveHandleType.Upper ||
      resizeHandleType === ResizeHandleType.LowerLeft ||
      (resizeHandleType === ResizeHandleType.UpperLeft && grabRef.current.type !== ObjectType.Wall) ||
      resizeHandleType === ResizeHandleType.LowerRight ||
      (resizeHandleType === ResizeHandleType.UpperRight && grabRef.current.type !== ObjectType.Wall) ||
      rotateHandleType === RotateHandleType.Lower ||
      rotateHandleType === RotateHandleType.Upper
    ) {
      intersectionPlaneType = IntersectionPlaneType.Horizontal;
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, MOVE_HANDLE_RADIUS);
      intersectionPlaneAngle.set(0, 0, 0);
    } else if (resizeHandleType) {
      intersectionPlaneType = IntersectionPlaneType.Vertical;
      const handlePosition = getResizeHandlePosition(grabRef.current, resizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y);
      intersectionPlanePosition.set(handlePosition.x, handlePosition.y, 0);
      intersectionPlaneAngle.set(-HALF_PI, 0, rotation, 'ZXY');
    }
  }

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getIntersectionToStand = (intersections: Intersection[]) => {
    for (const intersection of intersections) {
      if (intersection.object.userData.stand) {
        return intersection;
      }
    }
    return null;
  };

  const setParentIdById = (parentId: string, elementId: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elementId) {
          e.parentId = parentId;
          break;
        }
      }
    });
  };

  const getObjectId = (obj: Object3D | null): string => {
    if (!obj) return '';

    const nameArray = obj.name.split(' ');
    if (nameArray[2]) {
      return nameArray[2];
    }

    return getObjectId(obj.parent);
  };

  const getObjectChildById = (object: Object3D | null | undefined, id: string) => {
    if (object === null || object === undefined) return null;
    for (const obj of object.children) {
      if (obj.name.includes(`${id}`)) {
        return obj;
      }
    }
    return null;
  };

  const handleTreeOrHumanRefMove = (elementRef: RefObject<Group> | null, e: ThreeEvent<PointerEvent>) => {
    if (elementRef && elementRef.current) {
      const intersection = getIntersectionToStand(e.intersections);
      if (intersection) {
        const intersectionObj = intersection.object; // Mesh
        const elementParentRef = elementRef.current.parent;

        // stand on ground
        if (intersectionObj.name === 'Ground') {
          // change parent: attach dom, set parentId
          if (elementParentRef && elementParentRef.name !== 'Content') {
            const contentRef = useStoreRef.getState().contentRef;
            if (contentRef && contentRef.current) {
              contentRef.current.add(elementRef.current);
              setParentIdById(GROUND_ID, getObjectId(elementRef.current));
            }
          }
          elementRef.current.position.copy(intersection.point); // world position
          invalidate();
        }
        // stand on standable elements
        else if (intersectionObj.userData.stand) {
          const intersectionObjGroup = intersectionObj.parent; // Group
          if (intersectionObjGroup) {
            // change parent: attach dom, set parentId;
            if (elementParentRef && elementParentRef.uuid !== intersectionObjGroup.uuid) {
              intersectionObjGroup.add(elementRef.current); // attach to Group
              setParentIdById(getObjectId(intersectionObjGroup), getObjectId(elementRef.current));
            }
            elementParentRotation.set(0, 0, -intersectionObjGroup.rotation.z);
            const relPos = new Vector3()
              .subVectors(intersection.point, intersectionObjGroup.position)
              .applyEuler(elementParentRotation);
            elementRef.current.position.copy(relPos); // relative abs position
            invalidate();
          }
        }

        if (!isHumanOrTreeMoved) {
          setIsHumanOrTreeMoved(true);
        }
      }
    }
  };

  // for tree and human for now
  const handleSetElementState = (elemId: string, standObjId: string, position: Vector3) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          e.parentId = standObjId;
          e.cx = position.x;
          e.cy = position.y;
          e.cz = position.z;
          break;
        }
      }
    });
  };

  const handleDetachParent = (elem: ElementModel, e: ElementModel) => {
    const contentRef = useStoreRef.getState().contentRef;
    const parentObject = getObjectChildById(contentRef?.current, elem.id);
    if (parentObject) {
      for (const obj of parentObject.children) {
        if (obj.name.includes(`${e.id}`)) {
          useStoreRef.getState().contentRef?.current?.add(obj);
          break;
        }
      }
    }
    e.parentId = GROUND_ID;
    const absPos = new Vector3(e.cx, e.cy, e.cz)
      .applyEuler(new Euler(0, 0, elem.rotation[2]))
      .add(oldPositionRef.current);
    e.cx = absPos.x;
    e.cy = absPos.y;
    e.cz = 0;
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0) {
      const groundClicked = e.intersections[0].object === groundPlaneRef.current;
      if (groundClicked) {
        selectNone();
        setCommonStore((state) => {
          state.pastePoint.copy(e.intersections[0].point);
          state.clickObjectType = ObjectType.Ground;
          state.contextMenuObjectType = ObjectType.Ground;
          state.pasteNormal = UNIT_VECTOR_POS_Z;
        });
      }
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (e.button === 2) return;
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        // adding foundation end point
        if (isSettingFoundationEndPointRef.current) {
          isSettingFoundationStartPointRef.current = false;
          isSettingFoundationEndPointRef.current = false;
          setCommonStore((state) => {
            state.addedFoundationId = null;
            state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
          });
          if (elem.lx <= 0.1 || elem.ly <= 0.1) {
            removeElementById(elem.id, false);
          } else {
            const undoableAdd = {
              name: 'Add',
              timestamp: Date.now(),
              addedElement: elem,
              undo: () => {
                removeElementById(undoableAdd.addedElement.id, false);
                setCommonStore((state) => {
                  state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                });
              },
              redo: () => {
                setCommonStore((state) => {
                  state.elements.push(undoableAdd.addedElement);
                  state.selectedElement = undoableAdd.addedElement;
                  state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                });
              },
            } as UndoableAdd;
            addUndoable(undoableAdd);
          }
        }
        // adding cuboid end point
        else if (isSettingCuboidEndPointRef.current) {
          isSettingCuboidStartPointRef.current = false;
          isSettingCuboidEndPointRef.current = false;
          setCommonStore((state) => {
            state.addedCuboidId = null;
            state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
          });
          if (elem.lx <= 0.1 || elem.ly <= 0.1) {
            removeElementById(elem.id, false);
          } else {
            const undoableAdd = {
              name: 'Add',
              timestamp: Date.now(),
              addedElement: elem,
              undo: () => {
                removeElementById(undoableAdd.addedElement.id, false);
                setCommonStore((state) => {
                  state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                });
              },
              redo: () => {
                setCommonStore((state) => {
                  state.elements.push(undoableAdd.addedElement);
                  state.selectedElement = undoableAdd.addedElement;
                  state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                });
              },
            } as UndoableAdd;
            addUndoable(undoableAdd);
          }
        }
        //
        else {
          if (resizeHandleType) {
            newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
            newDimensionRef.current.set(elem.lx, elem.ly, elem.lz);
            if (
              newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE &&
              newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > ZERO_TOLERANCE
            ) {
              // store the new positions of the children if the selected element may be a parent
              if (elem.type === ObjectType.Foundation || elem.type === ObjectType.Cuboid) {
                const children = getChildren(elem.id);
                newChildrenPositionsMapRef.current.clear();
                if (children.length > 0) {
                  for (const c of children) {
                    if (c.type === ObjectType.Polygon) {
                      newPolygonVerticesMapRef.current.set(
                        c.id,
                        (c as PolygonModel).vertices.map((v) => ({ ...v })),
                      );
                    } else {
                      newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
                    }
                  }
                }
              }
              const undoableResize = {
                name: 'Resize',
                timestamp: Date.now(),
                resizedElementId: grabRef.current.id,
                oldCx: oldPositionRef.current.x,
                oldCy: oldPositionRef.current.y,
                oldCz: oldPositionRef.current.z,
                newCx: newPositionRef.current.x,
                newCy: newPositionRef.current.y,
                newCz: newPositionRef.current.z,
                oldLx: oldDimensionRef.current.x,
                oldLy: oldDimensionRef.current.y,
                oldLz: oldDimensionRef.current.z,
                newLx: newDimensionRef.current.x,
                newLy: newDimensionRef.current.y,
                newLz: newDimensionRef.current.z,
                oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
                newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
                oldPolygonVerticesMap: new Map(oldPolygonVerticesMapRef.current),
                newPolygonVerticesMap: new Map(newPolygonVerticesMapRef.current),
                undo: () => {
                  setElementPosition(
                    undoableResize.resizedElementId,
                    undoableResize.oldCx,
                    undoableResize.oldCy,
                    undoableResize.oldCz,
                  );
                  setElementSize(
                    undoableResize.resizedElementId,
                    undoableResize.oldLx,
                    undoableResize.oldLy,
                    undoableResize.oldLz,
                  );
                  if (undoableResize.oldChildrenPositionsMap.size > 0) {
                    for (const [id, p] of undoableResize.oldChildrenPositionsMap.entries()) {
                      const elem = getElementById(id);
                      if (elem?.type !== ObjectType.Polygon) {
                        setElementPosition(id, p.x, p.y, p.z);
                      }
                    }
                  }
                  if (undoableResize.oldPolygonVerticesMap.size > 0) {
                    for (const [id, vertices] of undoableResize.oldPolygonVerticesMap.entries()) {
                      const elem = getElementById(id);
                      if (elem?.type === ObjectType.Polygon) {
                        updatePolygonVerticesById(id, vertices);
                      }
                    }
                  }
                },
                redo: () => {
                  setElementPosition(
                    undoableResize.resizedElementId,
                    undoableResize.newCx,
                    undoableResize.newCy,
                    undoableResize.newCz,
                  );
                  setElementSize(
                    undoableResize.resizedElementId,
                    undoableResize.newLx,
                    undoableResize.newLy,
                    undoableResize.newLz,
                  );
                  if (undoableResize.newChildrenPositionsMap.size > 0) {
                    for (const [id, p] of undoableResize.newChildrenPositionsMap.entries()) {
                      setElementPosition(id, p.x, p.y, p.z);
                    }
                  }
                  if (undoableResize.newPolygonVerticesMap.size > 0) {
                    for (const [id, vertices] of undoableResize.newPolygonVerticesMap.entries()) {
                      const elem = getElementById(id);
                      if (elem?.type === ObjectType.Polygon) {
                        updatePolygonVerticesById(id, vertices);
                      }
                    }
                  }
                },
              } as UndoableResize;
              addUndoable(undoableResize);
            }
            setCommonStore((state) => {
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
              state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
              // set ref children state
              for (const e of state.elements) {
                if (e.type === ObjectType.Human || e.type === ObjectType.Tree) {
                  if (e.parentId === elem.id) {
                    // top face
                    if (Math.abs(oldDimensionRef.current.z / 2 - e.cz) < 0.01) {
                      // fixed position
                      const newRelativePos = new Vector3(e.cx, e.cy, e.cz)
                        .applyEuler(new Euler(0, 0, elem.rotation[2]))
                        .add(oldPositionRef.current)
                        .sub(newPositionRef.current)
                        .applyEuler(new Euler(0, 0, -elem.rotation[2]));
                      // detach parent dom if falls on ground
                      if (
                        Math.abs(newRelativePos.x) > Math.abs(newDimensionRef.current.x / 2) + 0.01 ||
                        Math.abs(newRelativePos.y) > Math.abs(newDimensionRef.current.y / 2) + 0.01
                      ) {
                        handleDetachParent(elem, e);
                      } else {
                        e.cx = newRelativePos.x;
                        e.cy = newRelativePos.y;
                      }
                    }
                    // side faces
                    else {
                      const oldRelativePos = new Vector3(e.cx, e.cy, e.cz);
                      const d = new Vector3().subVectors(newPositionRef.current, oldPositionRef.current);
                      const v = new Vector3().subVectors(oldRelativePos, d);
                      // west and east face
                      if (Math.abs(oldRelativePos.x / oldDimensionRef.current.x) > 0.49) {
                        if (Math.abs(v.y) > elem.ly / 2 + 0.5) {
                          handleDetachParent(elem, e);
                        } else {
                          e.cx = (oldRelativePos.x > 0 ? elem.lx : -elem.lx) / 2;
                          e.cy = v.y;
                        }
                      }
                      // north and south face
                      else if (Math.abs(oldRelativePos.y / oldDimensionRef.current.y) > 0.49) {
                        if (Math.abs(v.x) > elem.lx / 2 + 0.5) {
                          handleDetachParent(elem, e);
                        } else {
                          e.cx = v.x;
                          e.cy = (oldRelativePos.y > 0 ? elem.ly : -elem.ly) / 2;
                        }
                      }
                    }
                  }
                }
              }
            });
          } else if (rotateHandleType) {
            newRotationRef.current = [...elem.rotation];
            const oldRotation = new Vector3().fromArray(oldRotationRef.current);
            const newRotation = new Vector3().fromArray(newRotationRef.current);
            if (newRotation.distanceToSquared(oldRotation) > ZERO_TOLERANCE) {
              const undoableRotate = {
                name: 'Rotate',
                timestamp: Date.now(),
                rotatedElementId: grabRef.current.id,
                oldRotation: oldRotationRef.current,
                newRotation: newRotationRef.current,
                undo: () => {
                  setElementRotation(
                    undoableRotate.rotatedElementId,
                    undoableRotate.oldRotation[0],
                    undoableRotate.oldRotation[1],
                    undoableRotate.oldRotation[2],
                  );
                },
                redo: () => {
                  setElementRotation(
                    undoableRotate.rotatedElementId,
                    undoableRotate.newRotation[0],
                    undoableRotate.newRotation[1],
                    undoableRotate.newRotation[2],
                  );
                },
              } as UndoableRotate;
              addUndoable(undoableRotate);
            }
          } else {
            newPositionRef.current.set(elem.cx, elem.cy, elem.cz);

            // elements modified by reference
            let elementRef: Group | null | undefined = null;
            switch (grabRef.current.type) {
              case ObjectType.Tree:
                elementRef = useStoreRef.getState().treeRef?.current;
                break;
              case ObjectType.Human:
                elementRef = useStoreRef.getState().humanRef?.current;
                break;
            }
            if (elementRef && isHumanOrTreeMoved) {
              setRayCast(e);
              const intersections = ray.intersectObjects(scene.children, true);
              const intersection = getIntersectionToStand(intersections); // could simplify???
              if (intersection) {
                const p = intersection.point;
                // on ground
                if (intersection.object.name === 'Ground') {
                  handleSetElementState(elem.id, GROUND_ID, p);
                }
                // on other standable elements
                else if (intersection.object.userData.stand) {
                  const intersectionObjId = getObjectId(intersection.object);
                  const intersectionObjGroup = intersection.object.parent;

                  if (intersectionObjGroup) {
                    const relPos = new Vector3()
                      .subVectors(p, intersectionObjGroup.position)
                      .applyEuler(elementParentRotation);
                    handleSetElementState(elem.id, intersectionObjId, relPos);

                    // todo: should also handle parent change
                    newPositionRef.current.set(relPos.x, relPos.y, relPos.z);
                  }
                }
              }
              setIsHumanOrTreeMoved(false);
            }

            if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE) {
              const undoableMove = {
                name: 'Move',
                timestamp: Date.now(),
                movedElementId: elem.id,
                oldCx: oldPositionRef.current.x,
                oldCy: oldPositionRef.current.y,
                oldCz: oldPositionRef.current.z,
                newCx: newPositionRef.current.x,
                newCy: newPositionRef.current.y,
                newCz: newPositionRef.current.z,
                undo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.oldCx,
                    undoableMove.oldCy,
                    undoableMove.oldCz,
                  );
                },
                redo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.newCx,
                    undoableMove.newCy,
                    undoableMove.newCz,
                  );
                },
              } as UndoableMove;
              addUndoable(undoableMove);
              setCommonStore((state) => {
                state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
              });
            }
          }
        }
      }
      grabRef.current = null;
    }

    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.rotateHandleType = null;
    });

    useStoreRef.setState((state) => {
      state.humanRef = null;
      state.treeRef = null;
      state.setEnableOrbitController(true);
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    if (e.intersections.length === 0 || !groundPlaneRef.current) return;
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    // adding foundation start point
    if (isSettingFoundationStartPointRef.current) {
      setRayCast(e);
      const intersects = ray.intersectObjects([groundPlaneRef.current]);
      useStoreRef.getState().setEnableOrbitController(false);
      setCommonStore((state) => {
        state.moveHandleType = null;
        state.resizeHandleType = ResizeHandleType.LowerRight;
        state.resizeAnchor.copy(intersects[0].point);
      });
      isSettingFoundationStartPointRef.current = false;
      isSettingFoundationEndPointRef.current = true;
      return;
    }
    // adding cuboid start point
    else if (isSettingCuboidStartPointRef.current) {
      setRayCast(e);
      const intersects = ray.intersectObjects([groundPlaneRef.current]);
      useStoreRef.getState().setEnableOrbitController(false);
      setCommonStore((state) => {
        state.moveHandleType = null;
        state.resizeHandleType = ResizeHandleType.LowerRight;
        state.resizeAnchor.copy(intersects[0].point);
      });
      isSettingCuboidStartPointRef.current = false;
      isSettingCuboidEndPointRef.current = true;
      return;
    }

    const groundClicked = e.intersections[0].object === groundPlaneRef.current;
    if (groundClicked) {
      setCommonStore((state) => {
        state.clickObjectType = ObjectType.Ground;
        state.selectedElement = null;
      });
      selectNone();
      if (legalOnGround(objectTypeToAdd)) {
        const position = e.intersections[0].point;
        const addedElement = addElement(groundModel, position);
        const undoableAdd = {
          name: 'Add',
          timestamp: Date.now(),
          addedElement: addedElement,
          undo: () => {
            removeElementById(undoableAdd.addedElement.id, false);
            setCommonStore((state) => {
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(undoableAdd.addedElement);
              state.selectedElement = undoableAdd.addedElement;
              state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
            });
          },
        } as UndoableAdd;
        addUndoable(undoableAdd);
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
        });
      }
    } else {
      const selectedElement = getSelectedElement();
      const wallResizeHandle = useStore.getState().resizeHandleType;
      if (selectedElement) {
        if (legalOnGround(selectedElement.type)) {
          grabRef.current = selectedElement;
          // save info for undo
          oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
          oldRotationRef.current = [...selectedElement.rotation];

          // store the positions of the children if the selected element may be a parent
          if (selectedElement.type === ObjectType.Foundation || selectedElement.type === ObjectType.Cuboid) {
            const children = getChildren(selectedElement.id);
            oldChildrenPositionsMapRef.current.clear();
            if (children.length > 0) {
              for (const c of children) {
                if (c.type === ObjectType.Polygon) {
                  oldPolygonVerticesMapRef.current.set(
                    c.id,
                    (c as PolygonModel).vertices.map((v) => ({ ...v })),
                  );
                } else {
                  oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
                }
              }
            }
          }
          switch (selectedElement.type) {
            case ObjectType.Cuboid:
              // getting ready for resizing even though it may not happen
              absPosMapRef.current.clear();
              const cuboidCenter = new Vector3(selectedElement.cx, selectedElement.cy, selectedElement.cz);
              const cuboidChildren = getChildren(selectedElement.id);
              if (cuboidChildren.length > 0) {
                const a = selectedElement.rotation[2];
                for (const e of cuboidChildren) {
                  switch (e.type) {
                    case ObjectType.Tree:
                    case ObjectType.Human: {
                      const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, a));
                      centerAbsPos.add(cuboidCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    }
                    case ObjectType.SolarPanel:
                    case ObjectType.Sensor:
                      if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                        const centerAbsPos = new Vector3(
                          e.cx * selectedElement.lx,
                          e.cy * selectedElement.ly,
                          e.cz * selectedElement.lz,
                        ).applyEuler(new Euler(0, 0, a));
                        centerAbsPos.add(cuboidCenter);
                        absPosMapRef.current.set(e.id, centerAbsPos);
                      }
                      break;
                    case ObjectType.Polygon:
                      if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                        const polygon = e as PolygonModel;
                        const vertexAbsPosArray: Vector2[] = [];
                        for (const v of polygon.vertices) {
                          const vertexAbsPos = new Vector2(
                            v.x * selectedElement.lx,
                            v.y * selectedElement.ly,
                          ).rotateAround(ORIGIN_VECTOR2, a);
                          vertexAbsPos.add(new Vector2(cuboidCenter.x, cuboidCenter.y));
                          vertexAbsPosArray.push(vertexAbsPos);
                        }
                        polygonsAbsPosMapRef.current.set(polygon.id, vertexAbsPosArray);
                      }
                      break;
                  }
                }
              }
              break;
            case ObjectType.Foundation:
              // getting ready for resizing even though it may not happen
              absPosMapRef.current.clear();
              polygonsAbsPosMapRef.current.clear();
              wallsAbsPosMapRef.current.clear();
              const foundationCenterV2 = new Vector2(selectedElement.cx, selectedElement.cy);
              const foundationCenter = new Vector3(selectedElement.cx, selectedElement.cy, selectedElement.cz);
              const foundationChildren = getChildren(selectedElement.id);
              if (foundationChildren.length > 0) {
                const a = selectedElement.rotation[2];
                for (const e of foundationChildren) {
                  switch (e.type) {
                    case ObjectType.Wall:
                      const wall = e as WallModel;
                      const centerPointAbsPos = new Vector2(wall.cx, wall.cy).rotateAround(ORIGIN_VECTOR2, a);
                      centerPointAbsPos.add(foundationCenterV2);
                      const leftPointAbsPos = new Vector2(wall.leftPoint[0], wall.leftPoint[1]).rotateAround(
                        ORIGIN_VECTOR2,
                        a,
                      );
                      leftPointAbsPos.add(foundationCenterV2);
                      const rightPointAbsPos = new Vector2(wall.rightPoint[0], wall.rightPoint[1]).rotateAround(
                        ORIGIN_VECTOR2,
                        a,
                      );
                      rightPointAbsPos.add(foundationCenterV2);
                      wallsAbsPosMapRef.current.set(wall.id, {
                        centerPointAbsPos,
                        leftPointAbsPos,
                        rightPointAbsPos,
                      });
                      break;
                    case ObjectType.Tree:
                    case ObjectType.Human: {
                      const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, a));
                      centerAbsPos.add(foundationCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    }
                    case ObjectType.SolarPanel:
                    case ObjectType.Sensor:
                      const centerAbsPos = new Vector3(
                        e.cx * selectedElement.lx,
                        e.cy * selectedElement.ly,
                        e.cz * selectedElement.lz,
                      ).applyEuler(new Euler(0, 0, a));
                      centerAbsPos.add(foundationCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    case ObjectType.Polygon:
                      const polygon = e as PolygonModel;
                      const vertexAbsPosArray: Vector2[] = [];
                      for (const v of polygon.vertices) {
                        const vertexAbsPos = new Vector2(
                          v.x * selectedElement.lx,
                          v.y * selectedElement.ly,
                        ).rotateAround(ORIGIN_VECTOR2, a);
                        vertexAbsPos.add(foundationCenterV2);
                        vertexAbsPosArray.push(vertexAbsPos);
                      }
                      polygonsAbsPosMapRef.current.set(polygon.id, vertexAbsPosArray);
                      break;
                  }
                }
              }
              break;
          }
        } else if (
          selectedElement.type === ObjectType.Wall &&
          (wallResizeHandle === ResizeHandleType.UpperLeft || wallResizeHandle === ResizeHandleType.UpperRight)
        ) {
          grabRef.current = selectedElement;
        }
      }
    }
  };

  const handleGroundPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      setRayCast(e);
      let intersects;
      switch (grabRef.current.type) {
        case ObjectType.Human:
          const humanRef = useStoreRef.getState().humanRef;
          handleTreeOrHumanRefMove(humanRef, e);
          break;
        case ObjectType.Tree:
          const treeRef = useStoreRef.getState().treeRef;
          handleTreeOrHumanRefMove(treeRef, e);
          break;
        case ObjectType.Foundation:
          if (intersectionPlaneRef.current) {
            intersects = ray.intersectObjects([intersectionPlaneRef.current]);
            if (intersects.length > 0) {
              if (moveHandleType) {
                handleMove(intersects[0].point);
              } else if (resizeHandleType) {
                handleResize(intersects[0].point);
              } else if (rotateHandleType) {
                handleRotate(intersects[0].point);
              }
            }
          }
          break;
        case ObjectType.Cuboid:
          if (intersectionPlaneRef.current) {
            if (intersectionPlaneType === IntersectionPlaneType.Horizontal) {
              intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects.length > 0) {
                const p = intersects[0].point;
                if (moveHandleType) {
                  if (moveHandleType === MoveHandleType.Top) {
                    setElementPosition(grabRef.current.id, p.x, p.y);
                  } else {
                    handleMove(p);
                  }
                } else if (resizeHandleType) {
                  handleResize(p);
                } else if (rotateHandleType) {
                  handleRotate(p);
                }
              }
            }
          }
          break;
      }
    }

    // add drag and draw element
    if (groundPlaneRef.current) {
      // add new element
      if (objectTypeToAdd !== ObjectType.None) {
        setRayCast(e);
        const intersects = ray.intersectObjects([groundPlaneRef.current]);
        const p = intersects[0].point;

        switch (objectTypeToAdd) {
          case ObjectType.Foundation: {
            const foundation = addElement(groundModel, p);
            if (foundation) {
              setCommonStore((state) => {
                state.addedFoundationId = foundation.id;
                state.objectTypeToAdd = ObjectType.None;
              });
              grabRef.current = foundation;
              isSettingFoundationStartPointRef.current = true;
            }
            break;
          }
          case ObjectType.Cuboid: {
            const cuboid = addElement(groundModel, p);
            if (cuboid) {
              setCommonStore((state) => {
                state.addedCuboidId = cuboid.id;
                state.objectTypeToAdd = ObjectType.None;
              });
              grabRef.current = cuboid;
              isSettingCuboidStartPointRef.current = true;
            }
            break;
          }
        }
      }

      // setting start point
      if (grabRef.current && (isSettingFoundationStartPointRef.current || isSettingCuboidStartPointRef.current)) {
        setRayCast(e);
        const intersects = ray.intersectObjects([groundPlaneRef.current]);
        const p = intersects[0].point;
        setElementPosition(grabRef.current.id, p.x, p.y);
      }
    }
  };

  const handleGroundPointerOut = () => {
    const addedFoundationID = useStore.getState().addedFoundationId;
    const addedCuboidID = useStore.getState().addedCuboidId;
    if (addedFoundationID) {
      removeElementById(addedFoundationID, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Foundation;
        state.addedFoundationId = null;
      });
      useStoreRef.getState().setEnableOrbitController(true);
      grabRef.current = null;
      isSettingFoundationStartPointRef.current = false;
      isSettingFoundationEndPointRef.current = false;
    }
    if (addedCuboidID) {
      removeElementById(addedCuboidID, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Cuboid;
        state.addedCuboidId = null;
      });
      useStoreRef.getState().setEnableOrbitController(true);
      grabRef.current = null;
      isSettingCuboidStartPointRef.current = false;
      isSettingCuboidEndPointRef.current = false;
    }
  };

  const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      setRayCast(e);
      let intersects;
      if (intersectionPlaneRef.current && intersectionPlaneType === IntersectionPlaneType.Vertical) {
        intersects = ray.intersectObjects([intersectionPlaneRef.current]);
        if (intersects && intersects.length > 0) {
          const p = intersects[0].point;
          switch (grabRef.current.type) {
            case ObjectType.Cuboid:
              if (
                resizeHandleType === ResizeHandleType.LowerLeftTop ||
                resizeHandleType === ResizeHandleType.UpperLeftTop ||
                resizeHandleType === ResizeHandleType.LowerRightTop ||
                resizeHandleType === ResizeHandleType.UpperRightTop
              ) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                });
                const cuboidRef = useStoreRef.getState().cuboidRef;
                if (cuboidRef?.current) {
                  for (const obj of cuboidRef.current.children) {
                    if (obj.name.includes('Human') || obj.name.includes('Tree')) {
                      const absPos = absPosMapRef.current.get(getObjectId(obj));
                      if (absPos) {
                        // stand on top face
                        if (Math.abs(oldDimensionRef.current.z - absPos.z) < 0.01) {
                          obj.position.setZ(Math.max(p.z / 2, 0.5));
                        }
                        // stand on side faces
                        else {
                          obj.position.setZ(absPos.z - cuboidRef.current.position.z);
                        }
                      }
                    }
                  }
                }
              }
              break;
            case ObjectType.Wall:
              if (resizeHandleType === ResizeHandleType.UpperLeft || resizeHandleType === ResizeHandleType.UpperRight) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                });
              }
          }
        }
      }
    }
  };

  const handleIntersectionPointerUp = () => {
    if (!grabRef.current) return;
    const elem = getElementById(grabRef.current.id);
    if (elem) {
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.parentId === elem.id) {
            if (e.type === ObjectType.Human || e.type === ObjectType.Tree) {
              // stand on top face
              if (Math.abs(oldDimensionRef.current.z / 2 - e.cz) < 0.01) {
                e.cz = elem.lz / 2;
              }
              // stand on side faces
              else {
                const newRelZ = e.cz + oldPositionRef.current.z - elem.cz;
                if (Math.abs(newRelZ) > elem.lz / 2 + 0.5) {
                  handleDetachParent(elem, e);
                } else {
                  e.cz = newRelZ;
                }
              }
            }
          }
        }
      });
    }
  };

  // only these elements are allowed to be on the ground
  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  // The snapping of foundations and cuboids are really unnecessary because they can have arbitrary azimuths.
  // So if we have one vertex snapping to the grid, the other three most likely will be knocked off if the azimuth
  // is not 0, 90, 180, or 270 degrees. Snapping is only useful in those special cases. I decided not to bother
  // to make it work for those cases because the gain is too small to complicate the code.
  //
  // const positionOnGrid = (p: Vector3) => {
  //   return useStore.getState().enableFineGrid ? snapToFineGrid(p) : snapToNormalGrid(p);
  // };
  //
  // const snapToNormalGrid = (v: Vector3) => {
  //   const scale = Math.floor(useStore.getState().sceneRadius / 50) + 1;
  //   return new Vector3(Math.round(v.x / scale) * scale, Math.round(v.y / scale) * scale, v.z);
  // };
  //
  // const snapToFineGrid = (v: Vector3) => {
  //   const scale = (Math.floor(useStore.getState().sceneRadius / 50) + 1) * FINE_GRID_SCALE;
  //   const x = parseFloat((Math.round(v.x / scale) * scale).toFixed(1));
  //   const y = parseFloat((Math.round(v.y / scale) * scale).toFixed(1));
  //   return new Vector3(x, y, v.z);
  // };

  const handleHumanAndTreePositionFixedOnParent = (object: Object3D | null | undefined, lx: number, ly: number) => {
    if (!object) return;
    for (const obj of object.children) {
      if (obj.name.includes('Human') || obj.name.includes('Tree')) {
        const worldPos = absPosMapRef.current.get(getObjectId(obj));
        if (worldPos) {
          // top face
          if (Math.abs(oldDimensionRef.current.z / 2 - obj.position.z) < 0.01) {
            const relativePos = new Vector3()
              .subVectors(worldPos, object.position)
              .applyEuler(new Euler(0, 0, -object.rotation.z));
            obj.position.setX(relativePos.x);
            obj.position.setY(relativePos.y);
          }
          // side face
          else {
            const relativePos = new Vector3()
              .subVectors(worldPos, oldPositionRef.current)
              .applyEuler(new Euler(0, 0, -object.rotation.z));
            const d = new Vector3().subVectors(object.position, oldPositionRef.current);
            const v = new Vector3().subVectors(relativePos, d);
            // west and east face
            if (Math.abs(relativePos.x / oldDimensionRef.current.x) > 0.49) {
              obj.position.setX((relativePos.x > 0 ? lx : -lx) / 2);
              obj.position.setY(v.y);
            }
            // north and south face
            else if (Math.abs(relativePos.y / oldDimensionRef.current.y) > 0.49) {
              obj.position.setX(v.x);
              obj.position.setY((relativePos.y > 0 ? ly : -ly) / 2);
            }
          }
        }
      }
    }
  };

  const handleResize = (p: Vector3) => {
    if (!grabRef.current) return;
    const point = new Vector2(p.x, p.y);
    const anchor = new Vector2(resizeAnchor.x, resizeAnchor.y);
    const distance = anchor.distanceTo(point);
    const angle = Math.atan2(point.x - resizeAnchor.x, point.y - resizeAnchor.y) + grabRef.current.rotation[2];
    const lx = Math.abs(distance * Math.sin(angle));
    const ly = Math.abs(distance * Math.cos(angle));
    const center = new Vector2().addVectors(point, anchor).multiplyScalar(0.5);
    setCommonStore((state) => {
      if (!grabRef.current) return;
      let sizeOk = false;
      for (const e of state.elements) {
        if (e.id === grabRef.current.id) {
          switch (e.type) {
            case ObjectType.Cuboid: // we can only deal with the top surface of a cuboid now
            case ObjectType.Foundation:
              const children = getChildren(e.id);
              if (children.length > 0) {
                // basically, we have to create a copy of parent and children, set them to the new values,
                // check if the new values are OK, proceed to change the original elements in
                // the common store only when they are OK.
                const childrenClone: ElementModel[] = [];
                for (const c of children) {
                  if (c.type === ObjectType.Human || c.type === ObjectType.Tree) {
                    continue;
                  }
                  const childClone = JSON.parse(JSON.stringify(c));
                  childrenClone.push(childClone);
                  if (Util.isIdentical(childClone.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                    if (c.type === ObjectType.Wall) {
                      const wallAbsPos = wallsAbsPosMapRef.current.get(c.id);
                      if (wallAbsPos) {
                        const a = -e.rotation[2];
                        const { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos } = wallAbsPos;
                        const centerPointRelativePos = new Vector2()
                          .subVectors(centerPointAbsPos, center)
                          .rotateAround(ORIGIN_VECTOR2, a);
                        const leftPointRelativePos = new Vector2()
                          .subVectors(leftPointAbsPos, center)
                          .rotateAround(ORIGIN_VECTOR2, a);
                        const rightPointRelativePos = new Vector2()
                          .subVectors(rightPointAbsPos, center)
                          .rotateAround(ORIGIN_VECTOR2, a);
                        childClone.cx = centerPointRelativePos.x;
                        childClone.cy = centerPointRelativePos.y;
                        childClone.leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, e.lz];
                        childClone.rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, e.lz];
                      }
                    } else {
                      const centerAbsPos = absPosMapRef.current.get(c.id);
                      if (centerAbsPos) {
                        const a = -e.rotation[2];
                        const relativePos = new Vector2()
                          .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                          .rotateAround(ORIGIN_VECTOR2, a);
                        childClone.cx = relativePos.x / lx;
                        childClone.cy = relativePos.y / ly;
                      }
                    }
                  }
                }
                const parentClone = JSON.parse(JSON.stringify(e)) as ElementModel;
                parentClone.lx = lx;
                parentClone.ly = ly;
                parentClone.cx = center.x;
                parentClone.cy = center.y;
                if (Util.doesParentContainAllChildren(parentClone, childrenClone)) {
                  e.lx = lx;
                  e.ly = ly;
                  e.cx = center.x;
                  e.cy = center.y;
                  sizeOk = true;
                }
              } else {
                // any size is okay for a childless parent
                if (lx > 0.99 && ly > 0.99) {
                  e.lx = lx;
                  e.ly = ly;
                  e.cx = center.x;
                  e.cy = center.y;
                  sizeOk = true;
                }
              }
              break;
          }
          break;
        }
      }
      // if the new size is okay, we can then change the relative positions of the children.
      if (sizeOk) {
        for (const e of state.elements) {
          if (e.parentId === grabRef.current!.id) {
            switch (e.type) {
              case ObjectType.Wall:
                const wall = e as WallModel;
                const wallAbsPos = wallsAbsPosMapRef.current.get(e.id);
                if (wallAbsPos) {
                  const a = -grabRef.current!.rotation[2];
                  const { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos } = wallAbsPos;
                  const centerPointRelativePos = new Vector2()
                    .subVectors(centerPointAbsPos, center)
                    .rotateAround(ORIGIN_VECTOR2, a);
                  const leftPointRelativePos = new Vector2()
                    .subVectors(leftPointAbsPos, center)
                    .rotateAround(ORIGIN_VECTOR2, a);
                  const rightPointRelativePos = new Vector2()
                    .subVectors(rightPointAbsPos, center)
                    .rotateAround(ORIGIN_VECTOR2, a);
                  e.cx = centerPointRelativePos.x;
                  e.cy = centerPointRelativePos.y;
                  wall.leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, grabRef.current!.lz];
                  wall.rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, grabRef.current!.lz];
                }
                break;
              case ObjectType.SolarPanel:
              case ObjectType.Sensor:
                if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                  const centerAbsPos = absPosMapRef.current.get(e.id);
                  if (centerAbsPos) {
                    const relativePos = new Vector2()
                      .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                      .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
                    e.cx = relativePos.x / lx;
                    e.cy = relativePos.y / ly;
                  }
                }
                break;
              case ObjectType.Polygon:
                if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                  const polygon = e as PolygonModel;
                  const verticesAbsPos = polygonsAbsPosMapRef.current.get(polygon.id);
                  if (verticesAbsPos) {
                    const newVertices: Point2[] = [];
                    verticesAbsPos.forEach((v) => {
                      const relativePos = new Vector2()
                        .subVectors(v, center)
                        .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
                      newVertices.push({ x: relativePos.x / lx, y: relativePos.y / ly } as Point2);
                    });
                    polygon.vertices = newVertices;
                  }
                }
                break;
            }
          }
        }
      }
    });

    switch (grabRef.current.type) {
      case ObjectType.Foundation:
        const foundationRef = useStoreRef.getState().foundationRef;
        handleHumanAndTreePositionFixedOnParent(foundationRef?.current, lx, ly);
        break;
      case ObjectType.Cuboid:
        const cuboidRef = useStoreRef.getState().cuboidRef;
        handleHumanAndTreePositionFixedOnParent(cuboidRef?.current, lx, ly);
        break;
    }
  };

  const handleRotate = (p: Vector3) => {
    const { cx, cy } = grabRef.current!;
    const rotation = Math.atan2(cx - p.x, p.y - cy) + (rotateHandleType === RotateHandleType.Upper ? 0 : Math.PI);
    const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0;
    setElementRotation(grabRef.current!.id, 0, 0, rotation + offset);
  };

  const handleMove = (p: Vector3) => {
    let x0, y0;
    const hx = grabRef.current!.lx / 2;
    const hy = grabRef.current!.ly / 2;
    switch (moveHandleType) {
      case MoveHandleType.Upper:
        x0 = p.x + sinAngle * hy;
        y0 = p.y - cosAngle * hy;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Lower:
        x0 = p.x - sinAngle * hy;
        y0 = p.y + cosAngle * hy;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Left:
        x0 = p.x + cosAngle * hx;
        y0 = p.y + sinAngle * hx;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
      case MoveHandleType.Right:
        x0 = p.x - cosAngle * hx;
        y0 = p.y - sinAngle * hx;
        setElementPosition(grabRef.current!.id, x0, y0);
        break;
    }
  };

  return (
    <>
      {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Ground && (
        <Plane
          ref={intersectionPlaneRef}
          visible={false}
          name={'Ground Intersection Plane'}
          rotation={intersectionPlaneAngle}
          position={intersectionPlanePosition}
          args={[100000, 100000]}
          onPointerMove={handleIntersectionPointerMove}
          onPointerUp={handleIntersectionPointerUp}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
      <Plane
        receiveShadow={shadowEnabled}
        ref={groundPlaneRef}
        name={'Ground'}
        userData={{ stand: true }}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
        args={[10000, 10000]}
        renderOrder={-2}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handleGroundPointerMove}
        onPointerOut={handleGroundPointerOut}
      >
        <meshStandardMaterial depthTest={false} color={groundColor} />
      </Plane>
    </>
  );
};

export default React.memo(Ground);
