/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { RefObject, useEffect, useMemo, useRef } from 'react';
import { CommonStoreState, useStore } from '../stores/common';
import { useRefStore } from '../stores/commonRef';
import * as Selector from '../stores/selector';
import { Plane } from '@react-three/drei';
import { DoubleSide, Euler, Group, Intersection, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import {
  IntersectionPlaneType,
  MoveHandleType,
  ObjectType,
  ResizeHandleType,
  RotateHandleType,
  WallAbsPos,
} from '../types';
import { ElementModel } from '../models/ElementModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  GROUND_ID,
  HALF_PI,
  MOVE_HANDLE_RADIUS,
  ORIGIN_VECTOR2,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from '../constants';
import { Util } from '../Util';
import { UndoableMove, UndoableMoveFoundationGroup } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableRotate } from '../undo/UndoableRotate';
import { UndoableAdd } from '../undo/UndoableAdd';
import { WallModel } from 'src/models/WallModel';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { TreeModel } from '../models/TreeModel';
import { UndoableChange } from '../undo/UndoableChange';
import { showError } from '../helpers';
import i18n from '../i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { InnerCommonStoreState } from 'src/stores/InnerCommonState';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { GroupableModel, isGroupable } from 'src/models/Groupable';
import { WindowModel } from 'src/models/WindowModel';

const Ground = () => {
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getChildren = useStore(Selector.getChildren);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementRotation = useStore(Selector.updateElementRotationById);
  const addElement = useStore(Selector.addElement);
  const getElementById = useStore(Selector.getElementById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const removeElementById = useStore(Selector.removeElementById);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const addUndoable = useStore(Selector.addUndoable);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const updateSceneRadius = useStore(Selector.updateSceneRadius);

  const language = useStore(Selector.language);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const moveHandleType = useStore(Selector.moveHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundColor = useStore(Selector.viewState.groundColor);
  const waterSurface = useStore(Selector.viewState.waterSurface);
  const groundModel = useStore((state) => state.world.ground);
  const deletedFoundationId = useStore(Selector.deletedFoundationId);
  const deletedCuboidId = useStore(Selector.deletedCuboidId);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const groupMasterId = useStore(Selector.groupMasterId);

  const { get: getThree, scene, invalidate } = useThree();
  const groundPlaneRef = useRef<Mesh>();
  const intersectionPlaneRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const oldPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const newPolygonVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const oldWallPointsMapRef = useRef<Map<string, Vector2[]>>(new Map<string, Vector2[]>());
  const newWallPointsMapRef = useRef<Map<string, Vector2[]>>(new Map<string, Vector2[]>());
  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldRotationRef = useRef<number[]>([0, 0, 1]);
  const newRotationRef = useRef<number[]>([0, 0, 1]);
  const oldHumanOrPlantParentIdRef = useRef<string | null>(null);
  const oldCuboidParentIdRef = useRef<string | null>(null);
  const absPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const polygonsAbsPosMapRef = useRef<Map<string, Vector2[]>>(new Map());
  const wallsAbsPosMapRef = useRef<Map<string, WallAbsPos>>(new Map());
  const isSettingFoundationStartPointRef = useRef(false);
  const isSettingFoundationEndPointRef = useRef(false);
  const isSettingCuboidStartPointRef = useRef(false);
  const isSettingCuboidEndPointRef = useRef(false);
  const isHumanOrPlantMovedRef = useRef(false);
  const baseGroupRelPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const baseGroupOldPosMapRef = useRef<Map<string, number[]>>(new Map());
  const baseGroupNewPosMapRef = useRef<Map<string, number[]>>(new Map());
  const moveHandleWorldDiffV3Ref = useRef(new Vector3());
  const isMultipleMoveRef = useRef(false);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  // add pointer up event to window
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

  const { camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const cosAngle = grabRef.current ? Math.cos(grabRef.current.rotation[2]) : 1;
  const sinAngle = grabRef.current ? Math.sin(grabRef.current.rotation[2]) : 0;
  let intersectionPlaneType = IntersectionPlaneType.Ground;
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);
  const elementParentRotation = useMemo(() => new Euler(), []);

  if (grabRef.current) {
    if (Util.isPlantOrHuman(grabRef.current)) {
      intersectionPlaneType = IntersectionPlaneType.Vertical;
      const a = useStore.getState().viewState.orthographic ? 0 : -HALF_PI;
      const { x: cameraX, y: cameraY } = camera.position;
      const rotation = -Math.atan2(cameraX, cameraY);
      intersectionPlaneAngle.set(a, 0, rotation, 'ZXY');
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, 0);
    } else if (moveHandleType === MoveHandleType.Top) {
      intersectionPlaneType = IntersectionPlaneType.Horizontal;
      intersectionPlanePosition.set(grabRef.current.cx, grabRef.current.cy, grabRef.current.lz);
      intersectionPlaneAngle.set(0, 0, 0);
    } else if (
      Util.isMoveHandle(moveHandleType) ||
      resizeHandleType === ResizeHandleType.Left ||
      resizeHandleType === ResizeHandleType.Right ||
      resizeHandleType === ResizeHandleType.Lower ||
      resizeHandleType === ResizeHandleType.Upper ||
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
    mouse.x = (e.offsetX / getThree().gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / getThree().gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, getThree().camera);
  };

  const getIntersectionToStand = (intersections: Intersection[]) => {
    for (const intersection of intersections) {
      if (intersection.object.userData.stand) {
        return intersection;
      }
    }
    return null;
  };

  const setParentIdById = (parentId: string | null | undefined, elementId: string) => {
    if (!parentId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        // don't set parentId for foundations or cuboids as their parents are allowed to be ground only (for now)
        if (e.id === elementId && e.type !== ObjectType.Foundation) {
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

  const attachToGroup = (
    attachParentId: string | null | undefined,
    currParentId: string | null | undefined,
    currId: string,
  ) => {
    if (!attachParentId || !currParentId) return;
    const contentRef = useRefStore.getState().contentRef;
    if (contentRef?.current) {
      const currParentObj = Util.getObjectChildById(contentRef.current, currParentId);
      const currObj = Util.getObjectChildById(currParentId === GROUND_ID ? contentRef.current : currParentObj, currId);
      if (currObj) {
        if (attachParentId === GROUND_ID) {
          contentRef.current.add(currObj);
        } else {
          const attachParentObj = Util.getObjectChildById(contentRef.current, attachParentId);
          attachParentObj?.add(currObj);
        }
        invalidate();
      }
    }
  };

  const handlePlantOrHumanRefMove = (elementRef: RefObject<Group> | null, e: ThreeEvent<PointerEvent>) => {
    if (elementRef && elementRef.current) {
      const intersection = getIntersectionToStand(e.intersections);
      if (intersection) {
        const intersectionObj = intersection.object; // Mesh
        const elementParentRef = elementRef.current.parent;

        // stand on ground
        if (intersectionObj.name === 'Ground') {
          // change parent: attach dom, set parentId?
          if (elementParentRef && elementParentRef.name !== 'Content') {
            const contentRef = useRefStore.getState().contentRef;
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
            // change parent: attach dom, set parentId?
            if (elementParentRef && elementParentRef.uuid !== intersectionObjGroup.uuid) {
              intersectionObjGroup.add(elementRef.current); // attach to Group
              setParentIdById(getObjectId(intersectionObjGroup), getObjectId(elementRef.current));
            }
            const { rot: intersectionObjGroupWorldRotation } = Util.getWorldDataById(getObjectId(intersectionObjGroup));
            elementParentRotation.set(0, 0, -intersectionObjGroupWorldRotation);
            const relPos = new Vector3()
              .subVectors(intersection.point, intersectionObjGroup.localToWorld(new Vector3()))
              .applyEuler(elementParentRotation);
            elementRef.current.position.copy(relPos); // relative abs position
            invalidate();
          }
        }

        if (!isHumanOrPlantMovedRef.current) {
          isHumanOrPlantMovedRef.current = true;
        }
      }
    }
  };

  // for tree, flower, and human for now
  const handleSetElementState = (elemId: string, standObjId: string, position: Vector3) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          // don't set parentId for foundations or cuboids as their parents are allowed to be ground only (for now)
          if (!Util.isFoundationOrCuboid(e)) e.parentId = standObjId;
          e.cx = position.x;
          e.cy = position.y;
          e.cz = position.z;
          break;
        }
      }
    });
  };

  const handleUndoableResize = () => {
    if (!grabRef.current) return;
    const undoableResize = {
      name: 'Resize',
      timestamp: Date.now(),
      resizedElementId: grabRef.current.id,
      resizedElementType: grabRef.current.type,
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
      oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
      newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
      oldWallPointsMap: new Map(oldWallPointsMapRef.current),
      newWallPointsMap: new Map(newWallPointsMapRef.current),
      undo: () => {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              e.cx = undoableResize.oldCx;
              e.cy = undoableResize.oldCy;
              e.cz = undoableResize.oldCz;
              e.lx = undoableResize.oldLx;
              e.ly = undoableResize.oldLy;
              e.lz = undoableResize.oldLz;
              break;
            }
          }
        });
        if (undoableResize.oldChildrenPositionsMap.size > 0) {
          for (const [id, p] of undoableResize.oldChildrenPositionsMap.entries()) {
            const elem = getElementById(id);
            if (elem?.type !== ObjectType.Polygon) {
              setCommonStore((state) => {
                for (const e of state.elements) {
                  if (e.id === id) {
                    e.cx = p.x;
                    e.cy = p.y;
                    if (!isRoofTopElement(e)) {
                      e.cz = p.z;
                    }
                    if (e.type === ObjectType.Wall) {
                      const w = e as WallModel;
                      const oldPoints = undoableResize.oldWallPointsMap.get(w.id);
                      if (oldPoints) {
                        w.leftPoint = [oldPoints[0].x, oldPoints[0].y, 0];
                        w.rightPoint = [oldPoints[1].x, oldPoints[1].y, 0];
                      }
                    }
                    break;
                  }
                }
                if (undoableResize.oldWallPointsMap.size > 0) {
                  state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                }
              });
              const oldParentId = undoableResize.oldChildrenParentIdMap?.get(id);
              const newParentId = undoableResize.newChildrenParentIdMap?.get(id);
              if (oldParentId && newParentId && oldParentId !== newParentId) {
                attachToGroup(oldParentId, newParentId, id);
                setParentIdById(oldParentId, id);
              }
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
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              e.cx = undoableResize.newCx;
              e.cy = undoableResize.newCy;
              e.cz = undoableResize.newCz;
              e.lx = undoableResize.newLx;
              e.ly = undoableResize.newLy;
              e.lz = undoableResize.newLz;
              break;
            }
          }
        });
        if (undoableResize.newChildrenPositionsMap.size > 0) {
          for (const [id, p] of undoableResize.newChildrenPositionsMap.entries()) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.cx = p.x;
                  e.cy = p.y;
                  if (e.type !== ObjectType.SolarPanel || (e as SolarPanelModel).parentType !== ObjectType.Roof) {
                    e.cz = p.z;
                  }
                  if (e.type === ObjectType.Wall) {
                    const w = e as WallModel;
                    const oldPoints = undoableResize.newWallPointsMap.get(w.id);
                    if (oldPoints) {
                      w.leftPoint = [oldPoints[0].x, oldPoints[0].y, 0];
                      w.rightPoint = [oldPoints[1].x, oldPoints[1].y, 0];
                    }
                  }
                  break;
                }
              }
              if (undoableResize.newWallPointsMap.size > 0) {
                state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
              }
            });
            const oldParentId = undoableResize.oldChildrenParentIdMap?.get(id);
            const newParentId = undoableResize.newChildrenParentIdMap?.get(id);
            if (oldParentId && newParentId && oldParentId !== newParentId) {
              attachToGroup(newParentId, oldParentId, id);
              setParentIdById(newParentId, id);
            }
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
    return undoableResize;
  };

  const handleDetachParent = (elem: ElementModel, e: ElementModel) => {
    const contentRef = useRefStore.getState().contentRef;
    const parentObject = Util.getObjectChildById(contentRef?.current, elem.id);
    if (parentObject) {
      for (const obj of parentObject.children) {
        if (obj.name.includes(`${e.id}`)) {
          useRefStore.getState().contentRef?.current?.add(obj);
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
    newChildrenPositionsMapRef.current.set(e.id, new Vector3(absPos.x, absPos.y, 0));
    newChildrenParentIdMapRef.current.set(e.id, GROUND_ID);
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0) {
      const groundClicked = e.intersections[0].object === groundPlaneRef.current;
      if (groundClicked) {
        setCommonStore((state) => {
          InnerCommonStoreState.selectNone(state);
          state.pastePoint.copy(e.intersections[0].point);
          state.clickObjectType = ObjectType.Ground;
          state.contextMenuObjectType = ObjectType.Ground;
          state.pasteNormal = UNIT_VECTOR_POS_Z;
        });
      }
    }
  };

  const resizeElementOnPointerUp = (elem: ElementModel) => {
    const resizeHandleType = useStore.getState().resizeHandleType;
    // special cases
    switch (elem.type) {
      case ObjectType.Tree:
        switch (resizeHandleType) {
          case ResizeHandleType.Top:
            const undoableChangeHeight = {
              name: 'Change Tree Height',
              timestamp: Date.now(),
              changedElementId: elem.id,
              changedElementType: elem.type,
              oldValue: oldDimensionRef.current.z,
              newValue: elem.lz,
              undo: () => {
                updateElementLzById(undoableChangeHeight.changedElementId, undoableChangeHeight.oldValue as number);
              },
              redo: () => {
                updateElementLzById(undoableChangeHeight.changedElementId, undoableChangeHeight.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChangeHeight);
            setCommonStore((state) => {
              state.actionState.treeHeight = elem.lz;
            });
            return;
          case ResizeHandleType.Left:
          case ResizeHandleType.Right:
          case ResizeHandleType.Lower:
          case ResizeHandleType.Upper:
            const undoableChangeSpread = {
              name: 'Change Tree Spread',
              timestamp: Date.now(),
              changedElementId: elem.id,
              changedElementType: elem.type,
              oldValue: oldDimensionRef.current.x,
              newValue: elem.lx,
              undo: () => {
                updateElementLxById(undoableChangeSpread.changedElementId, undoableChangeSpread.oldValue as number);
              },
              redo: () => {
                updateElementLxById(undoableChangeSpread.changedElementId, undoableChangeSpread.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChangeSpread);
            setCommonStore((state) => {
              state.actionState.treeSpread = elem.lx;
            });
            return;
        }
        break;
      case ObjectType.Wall: {
        const undoableChangeHeight = {
          name: 'Change Wall Height',
          timestamp: Date.now(),
          changedElementId: elem.id,
          changedElementType: elem.type,
          oldValue: oldDimensionRef.current.z,
          newValue: elem.lz,
          undo: () => {
            updateElementLzById(undoableChangeHeight.changedElementId, undoableChangeHeight.oldValue as number);
          },
          redo: () => {
            updateElementLzById(undoableChangeHeight.changedElementId, undoableChangeHeight.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChangeHeight);
        setCommonStore((state) => {
          state.actionState.wallHeight = elem.lz;
        });
        return;
      }
    }

    // if the above condition is valid , it will return. So the following part will not run.
    newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
    newDimensionRef.current.set(elem.lx, elem.ly, elem.lz);
    oldChildrenParentIdMapRef.current.clear();
    newChildrenParentIdMapRef.current.clear();
    newChildrenPositionsMapRef.current.clear();
    newPolygonVerticesMapRef.current.clear();
    newWallPointsMapRef.current.clear();
    setCommonStore((state) => {
      if (elem.type === ObjectType.Cuboid) {
        state.actionState.cuboidHeight = elem.lz;
      }
      state.updateSceneRadius();
      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      // set ref children state
      if (elem.parentId === GROUND_ID) {
        for (const e of state.elements) {
          if (Util.isPlantOrHuman(e)) {
            if (e.parentId === elem.id) {
              oldChildrenParentIdMapRef.current.set(e.id, elem.id);
              if (!Util.isResizingVertical(useStore.getState().resizeHandleType)) {
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
        }
      }
    });
    if (
      newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE &&
      newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > ZERO_TOLERANCE
    ) {
      // store the new positions of the children if the selected element may be a parent
      if (elem.type === ObjectType.Foundation || elem.type === ObjectType.Cuboid) {
        const children = getChildren(elem.id);
        if (children.length > 0) {
          for (const c of children) {
            if (c.type === ObjectType.Polygon) {
              newPolygonVerticesMapRef.current.set(
                c.id,
                (c as PolygonModel).vertices.map((v) => ({ ...v })),
              );
            } else {
              if (c.type === ObjectType.Wall) {
                const w = c as WallModel;
                const leftPoint = new Vector2(w.leftPoint[0], w.leftPoint[1]);
                const rightPoint = new Vector2(w.rightPoint[0], w.rightPoint[1]);
                newWallPointsMapRef.current.set(c.id, [leftPoint, rightPoint]);
              }
              newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
            }
          }
        }
        if (elem.type === ObjectType.Foundation) {
          const elementsOnRoof = getRooftopChildren(elem.id);
          if (elementsOnRoof.length > 0) {
            for (const e of elementsOnRoof) {
              const centerRelPos = new Vector3(e.cx, e.cy);
              newChildrenPositionsMapRef.current.set(e.id, centerRelPos);
            }
          }
        }
      }
      const undoableResize = handleUndoableResize();
      undoableResize && addUndoable(undoableResize);
    }
  };

  const isMoveToSky = () => {
    if (useStore.getState().viewState.orthographic) return false; // impossible to move to sky in 2D mode
    if (groundPlaneRef.current) {
      const intersections = ray.intersectObjects(getThree().scene.children, true);
      if (intersections.length > 0) {
        for (const intersection of intersections) {
          if (intersection.object.userData.stand) {
            return false;
          }
        }
      }
    }
    return ray.intersectObjects([groundPlaneRef.current!]).length === 0;
  };

  const updateBaseGroupPosition = (map: Map<string, number[]>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (map.has(elem.id)) {
          const pos = map.get(elem.id);
          if (pos) {
            elem.cx = pos[0];
            elem.cy = pos[1];
            elem.cz = pos[2];
          }
        }
      }
    });
  };

  const moveElementOnPointerUp = (elem: ElementModel, e: PointerEvent) => {
    if (elem.locked) return;
    newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
    let newHumanOrPlantParentId: string | null = oldHumanOrPlantParentIdRef.current;
    // elements modified by reference
    let elementRef: Group | null | undefined = null;
    setRayCast(e);
    switch (elem.type) {
      case ObjectType.Tree:
        elementRef = useRefStore.getState().treeRef?.current;
        break;
      case ObjectType.Flower:
        elementRef = useRefStore.getState().flowerRef?.current;
        break;
      case ObjectType.Human:
        elementRef = useRefStore.getState().humanRef?.current;
        break;
    }
    if (elementRef && isHumanOrPlantMovedRef.current) {
      const intersections = ray.intersectObjects(Util.fetchIntersectables(scene), false);
      const intersection = getIntersectionToStand(intersections); // could simplify???
      if (intersection) {
        const p = intersection.point;
        // on ground
        if (intersection.object.name === 'Ground') {
          handleSetElementState(elem.id, GROUND_ID, p);
          newPositionRef.current.set(p.x, p.y, p.z);
          newHumanOrPlantParentId = GROUND_ID;
        }
        // on other standable elements
        else if (intersection.object.userData.stand) {
          const intersectionObjId = getObjectId(intersection.object);
          const intersectionObjGroup = intersection.object.parent;
          if (intersectionObjGroup) {
            const relPos = new Vector3()
              .subVectors(p, intersectionObjGroup.localToWorld(new Vector3()))
              .applyEuler(elementParentRotation);
            handleSetElementState(elem.id, intersectionObjId, relPos);
            newPositionRef.current.set(relPos.x, relPos.y, relPos.z);
            newHumanOrPlantParentId = intersectionObjId;
          }
        }
      }
      isHumanOrPlantMovedRef.current = false;
    }
    if (
      newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE ||
      ray.intersectObjects([groundPlaneRef.current!]).length === 0
    ) {
      let moveOk = true;
      if (!useStore.getState().viewState.orthographic) {
        // OK to move closer to the origin
        moveOk = newPositionRef.current.length() < oldPositionRef.current.length();
        if (!moveOk) {
          // in the case that it is moving away from the origin, check it will be too far
          const screenPosition = newPositionRef.current.clone().project(camera);
          const screenLx = newPositionRef.current
            .clone()
            .add(new Vector3(elem.lx, 0, 0))
            .project(camera)
            .distanceTo(screenPosition);
          const screenLy = newPositionRef.current
            .clone()
            .add(new Vector3(0, elem.ly ?? 1, 0))
            .project(camera)
            .distanceTo(screenPosition);
          const screenLz = newPositionRef.current
            .clone()
            .add(new Vector3(0, 0, elem.lz))
            .project(camera)
            .distanceTo(screenPosition);
          // OK if larger than 2% of screen dimension
          moveOk = Math.max(screenLx, screenLy, screenLz) > 0.02;
        }
      }
      if (!moveOk || isMoveToSky()) {
        setElementPosition(elem.id, oldPositionRef.current.x, oldPositionRef.current.y, oldPositionRef.current.z);
        if (elementRef) {
          if (Util.isPlantOrHuman(elem)) {
            elementRef.position.copy(oldPositionRef.current);
          }
        }
        if (Util.isPlantOrHuman(elem)) {
          setParentIdById(oldHumanOrPlantParentIdRef.current, elem.id);
        }
        const contentRef = useRefStore.getState().contentRef;
        if (contentRef?.current && oldHumanOrPlantParentIdRef.current && elementRef) {
          if (oldHumanOrPlantParentIdRef.current === GROUND_ID) {
            contentRef.current.add(elementRef);
          } else {
            const attachParentObj = Util.getObjectChildById(contentRef.current, oldHumanOrPlantParentIdRef.current);
            attachParentObj?.add(elementRef);
          }
          invalidate();
        }
        showError(i18n.t('message.CannotMoveObjectTooFar', lang));
      } else {
        if (baseGroupRelPosMapRef.current.size > 1 && isMultipleMoveRef.current) {
          baseGroupNewPosMapRef.current.clear();
          for (const elem of useStore.getState().elements) {
            if (baseGroupOldPosMapRef.current.has(elem.id)) {
              baseGroupNewPosMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz]);
            }
          }
          const undoableMove = {
            name: 'Move Foundation Group',
            timestamp: Date.now(),
            oldPositionMap: new Map(baseGroupOldPosMapRef.current),
            newPositionMap: new Map(baseGroupNewPosMapRef.current),
            undo: () => {
              updateBaseGroupPosition(undoableMove.oldPositionMap);
            },
            redo: () => {
              updateBaseGroupPosition(undoableMove.newPositionMap);
            },
          } as UndoableMoveFoundationGroup;
          addUndoable(undoableMove);
        } else {
          const isCuboid = elem.type === ObjectType.Cuboid;
          const oldParentId = isCuboid ? oldCuboidParentIdRef.current : oldHumanOrPlantParentIdRef.current;
          const newParentId = isCuboid ? elem.parentId : newHumanOrPlantParentId;
          const undoableMove = {
            name: 'Move',
            timestamp: Date.now(),
            movedElementId: elem.id,
            movedElementType: elem.type,
            oldCx: oldPositionRef.current.x,
            oldCy: oldPositionRef.current.y,
            oldCz: oldPositionRef.current.z,
            newCx: newPositionRef.current.x,
            newCy: newPositionRef.current.y,
            newCz: newPositionRef.current.z,
            oldRotation: [...oldRotationRef.current],
            newRotation: [...elem.rotation],
            oldParentId: oldParentId,
            newParentId: newParentId,
            undo: () => {
              setElementPosition(
                undoableMove.movedElementId,
                undoableMove.oldCx,
                undoableMove.oldCy,
                undoableMove.oldCz,
              );
              setCommonStore((state) => {
                const e = state.elements.find((e) => e.id === undoableMove.movedElementId);
                if (e && undoableMove.oldRotation) e.rotation = [...undoableMove.oldRotation];
              });
              setParentIdById(undoableMove.oldParentId, undoableMove.movedElementId);
              if (undoableMove.movedElementType && isHumanOrPlant(undoableMove.movedElementType)) {
                attachToGroup(undoableMove.oldParentId, undoableMove.newParentId, undoableMove.movedElementId);
              }
            },
            redo: () => {
              setElementPosition(
                undoableMove.movedElementId,
                undoableMove.newCx,
                undoableMove.newCy,
                undoableMove.newCz,
              );
              setCommonStore((state) => {
                const e = state.elements.find((e) => e.id === undoableMove.movedElementId);
                if (e && undoableMove.newRotation) e.rotation = [...undoableMove.newRotation];
              });
              setParentIdById(undoableMove.newParentId, undoableMove.movedElementId);
              if (undoableMove.movedElementType && isHumanOrPlant(undoableMove.movedElementType)) {
                attachToGroup(undoableMove.newParentId, undoableMove.oldParentId, undoableMove.movedElementId);
              }
            },
          } as UndoableMove;
          addUndoable(undoableMove);
        }
        isMultipleMoveRef.current = false;
        baseGroupRelPosMapRef.current.clear();
        updateSceneRadius();
      }
    }
  };

  const rotateElementOnPointerUp = (elem: ElementModel) => {
    newRotationRef.current = [...elem.rotation];
    const oldRotation = new Vector3().fromArray(oldRotationRef.current);
    const newRotation = new Vector3().fromArray(newRotationRef.current);
    if (newRotation.distanceToSquared(oldRotation) > ZERO_TOLERANCE) {
      const undoableRotate = {
        name: 'Rotate',
        timestamp: Date.now(),
        rotatedElementId: elem.id,
        rotatedElementType: elem.type,
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
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (e.button === 2) return;
    useRefStore.setState((state) => {
      state.setEnableOrbitController(true);
    });
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        // adding foundation end point
        if (isSettingFoundationEndPointRef.current) {
          isSettingFoundationStartPointRef.current = false;
          isSettingFoundationEndPointRef.current = false;
          setCommonStore((state) => {
            state.addedFoundationId = null;
            state.updateSceneRadius();
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
                updateSceneRadius();
              },
              redo: () => {
                setCommonStore((state) => {
                  state.elements.push(undoableAdd.addedElement);
                  state.selectedElement = undoableAdd.addedElement;
                  state.updateSceneRadius();
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
            state.updateSceneRadius();
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
                updateSceneRadius();
              },
              redo: () => {
                setCommonStore((state) => {
                  state.elements.push(undoableAdd.addedElement);
                  state.selectedElement = undoableAdd.addedElement;
                  state.updateSceneRadius();
                });
              },
            } as UndoableAdd;
            addUndoable(undoableAdd);
          }
        }
        // handling editing events
        else {
          if (useStore.getState().resizeHandleType) {
            resizeElementOnPointerUp(elem);
          } else if (useStore.getState().rotateHandleType) {
            rotateElementOnPointerUp(elem);
          } else if (useStore.getState().moveHandleType) {
            moveElementOnPointerUp(elem, e);
          }
          if (elem.type === ObjectType.Foundation) {
            usePrimitiveStore.getState().updateFoundationMovedFlag();
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
    useRefStore.setState((state) => {
      state.humanRef = null;
      state.treeRef = null;
      state.flowerRef = null;
    });
  };

  const setBasePosMap = (element: ElementModel, pointer: Vector3) => {
    const { pos } = Util.getWorldDataById(element.id);
    const center = new Vector3(pos.x, pos.y);
    const diff = new Vector3().subVectors(center, pointer);
    baseGroupRelPosMapRef.current.set(element.id, diff);
    baseGroupOldPosMapRef.current.set(element.id, [element.cx, element.cy, element.cz]);
  };

  const checkOverlapWithAllBases = (event: ThreeEvent<PointerEvent>, currElem: GroupableModel) => {
    const pointer = event.intersections[0].point.clone().setZ(0);
    for (const element of useStore.getState().elements) {
      if (
        isGroupable(element) &&
        element.parentId === GROUND_ID &&
        !element.locked &&
        element.id !== currElem.id &&
        !baseGroupRelPosMapRef.current.has(element.id) &&
        !Util.isChild(currElem.id, element.id) &&
        !Util.isChild(element.id, currElem.id) &&
        Util.areTwoBasesOverlapped(element, currElem)
      ) {
        setBasePosMap(element, pointer);
        checkOverlapWithAllBases(event, element);
      }
      if (element.id === currElem.id) {
        setBasePosMap(element, pointer);
      }
    }
  };

  const handleGroupMaster = (event: ThreeEvent<PointerEvent>, currElem: GroupableModel) => {
    baseGroupRelPosMapRef.current.clear();
    baseGroupOldPosMapRef.current.clear();
    if (!currElem.enableGroupMaster) return;
    if (useStore.getState().moveHandleType) {
      checkOverlapWithAllBases(event, currElem);
    }
  };

  // todo: should add sensor and light
  const isRoofTopElement = (e: ElementModel) => {
    if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) return true;
    if (e.type === ObjectType.Window && (e as WindowModel).parentType === ObjectType.Roof) return true;
  };

  const getRooftopChildren = (fId: string) => {
    return useStore.getState().elements.filter((e) => {
      if (e.foundationId !== fId) return false;
      if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) return true;
      if (e.type === ObjectType.Window && (e as WindowModel).parentType === ObjectType.Roof) return true;
      if (e.type === ObjectType.Sensor || e.type === ObjectType.Light) return true;
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    if (e.intersections.length === 0 || !groundPlaneRef.current) return;
    // adding foundation start point
    if (isSettingFoundationStartPointRef.current) {
      setRayCast(e);
      const intersects = ray.intersectObjects([groundPlaneRef.current]);
      if (intersects.length > 0) {
        useRefStore.getState().setEnableOrbitController(false);
        setCommonStore((state) => {
          state.moveHandleType = null;
          state.resizeHandleType = ResizeHandleType.LowerRight;
          state.resizeAnchor.copy(intersects[0].point);
        });
        isSettingFoundationStartPointRef.current = false;
        isSettingFoundationEndPointRef.current = true;
      }
      return;
    }
    // adding cuboid start point
    if (isSettingCuboidStartPointRef.current) {
      setRayCast(e);
      const intersects = ray.intersectObjects([groundPlaneRef.current]);
      if (intersects.length > 0) {
        useRefStore.getState().setEnableOrbitController(false);
        setCommonStore((state) => {
          state.moveHandleType = null;
          state.resizeHandleType = ResizeHandleType.LowerRight;
          state.resizeAnchor.copy(intersects[0].point);
          if (grabRef.current) {
            const firstIntersectedCuboidObject = getFirstStackableCuboid(e, grabRef.current?.id);
            if (firstIntersectedCuboidObject) {
              const intersects = ray.intersectObjects([firstIntersectedCuboidObject.eventObject]);
              if (intersects.length > 0) {
                state.resizeAnchor.copy(intersects[0].point);
              }
            }
          }
        });
        isSettingCuboidStartPointRef.current = false;
        isSettingCuboidEndPointRef.current = true;
      }
      return;
    }

    const groundClicked = e.intersections[0].object === groundPlaneRef.current;
    if (groundClicked) {
      if (!useStore.getState().multiSelectionsMode) {
        setCommonStore((state) => {
          state.clickObjectType = ObjectType.Ground;
          state.selectedElement = null;
          InnerCommonStoreState.selectNone(state);
          state.contextMenuObjectType = null;
          state.groupMasterId = null;
        });
      }
      if (legalOnGround(objectTypeToAdd)) {
        const position = e.intersections[0].point;
        const addedElement = addElement(groundModel, position);
        const undoableAdd = {
          name: 'Add',
          timestamp: Date.now(),
          addedElement: addedElement,
          undo: () => {
            removeElementById(undoableAdd.addedElement.id, false);
            updateSceneRadius();
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(undoableAdd.addedElement);
              state.selectedElement = undoableAdd.addedElement;
              state.updateSceneRadius();
            });
          },
        } as UndoableAdd;
        addUndoable(undoableAdd);
        setCommonStore((state) => {
          if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
          state.updateSceneRadius();
        });
      }
    } else {
      const selectedElementIdSet = useStore.getState().selectedElementIdSet;
      if (selectedElementIdSet.size > 1) {
        const selectedElement = useStore.getState().selectedElement;
        if (selectedElement) {
          grabRef.current = selectedElement;
          baseGroupRelPosMapRef.current.clear();
          isMultipleMoveRef.current = true;
          for (const elem of useStore.getState().elements) {
            if (Util.isElementAllowedMultipleMoveOnGround(elem) && selectedElementIdSet.has(elem.id)) {
              const base = elem as GroupableModel;
              if (base.enableGroupMaster) {
                checkOverlapWithAllBases(e, elem);
              } else {
                const pointer = e.intersections[0].point.clone().setZ(0);
                setBasePosMap(elem, pointer);
              }
            }
          }
        }
      } else {
        const selectedElement = getSelectedElement();
        if (selectedElement && legalOnGround(selectedElement.type)) {
          grabRef.current = selectedElement;
          // save info for undo
          oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
          oldRotationRef.current = [...selectedElement.rotation];

          // store the positions of the children if the selected element may be a parent
          if (selectedElement.type === ObjectType.Foundation || selectedElement.type === ObjectType.Cuboid) {
            const children = getChildren(selectedElement.id);
            oldChildrenPositionsMapRef.current.clear();
            oldPolygonVerticesMapRef.current.clear();
            oldWallPointsMapRef.current.clear();
            if (children.length > 0) {
              for (const c of children) {
                if (c.type === ObjectType.Polygon) {
                  oldPolygonVerticesMapRef.current.set(
                    c.id,
                    (c as PolygonModel).vertices.map((v) => ({ ...v })),
                  );
                } else {
                  if (c.type === ObjectType.Wall) {
                    const w = c as WallModel;
                    const leftPoint = new Vector2(w.leftPoint[0], w.leftPoint[1]);
                    const rightPoint = new Vector2(w.rightPoint[0], w.rightPoint[1]);
                    oldWallPointsMapRef.current.set(c.id, [leftPoint, rightPoint]);
                  }
                  oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
                }
              }
            }
            if (selectedElement.type === ObjectType.Foundation) {
              const elementsOnRoof = getRooftopChildren(selectedElement.id);
              if (elementsOnRoof.length > 0) {
                for (const e of elementsOnRoof) {
                  // skylight window position is absolute to foundation
                  const centerRelPos = new Vector3(e.cx, e.cy);
                  oldChildrenPositionsMapRef.current.set(e.id, centerRelPos);
                }
              }
            }
          }
          switch (selectedElement.type) {
            case ObjectType.Tree:
              oldHumanOrPlantParentIdRef.current = selectedElement.parentId;
              oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
              break;
            case ObjectType.Flower:
              oldHumanOrPlantParentIdRef.current = selectedElement.parentId;
              break;
            case ObjectType.Human:
              oldHumanOrPlantParentIdRef.current = selectedElement.parentId;
              break;
            case ObjectType.Cuboid:
              if (isGroupable(selectedElement) && selectedElement.parentId === GROUND_ID) {
                handleGroupMaster(e, selectedElement as GroupableModel);
              }
              oldCuboidParentIdRef.current = selectedElement.parentId;
              const moveHandleType = useStore.getState().moveHandleType;
              if (moveHandleType) {
                const { rot } = Util.getWorldDataById(selectedElement.id);
                const euler = new Euler(0, 0, rot);
                switch (useStore.getState().moveHandleType) {
                  case MoveHandleType.Right: {
                    moveHandleWorldDiffV3Ref.current.set(-selectedElement.lx / 2, 0, 0).applyEuler(euler);
                    break;
                  }
                  case MoveHandleType.Left: {
                    moveHandleWorldDiffV3Ref.current.set(selectedElement.lx / 2, 0, 0).applyEuler(euler);
                    break;
                  }
                  case MoveHandleType.Lower: {
                    moveHandleWorldDiffV3Ref.current.set(0, selectedElement.ly / 2, 0).applyEuler(euler);
                    break;
                  }
                  case MoveHandleType.Upper: {
                    moveHandleWorldDiffV3Ref.current.set(0, -selectedElement.ly / 2, 0).applyEuler(euler);
                    break;
                  }
                  default: {
                    moveHandleWorldDiffV3Ref.current.set(0, 0, 0);
                    break;
                  }
                }
              }
              // getting ready for resizing even though it may not happen
              absPosMapRef.current.clear();
              const { pos, rot } = Util.getWorldDataById(selectedElement.id);
              const cuboidCenter = new Vector3(pos.x, pos.y, pos.z);
              const cuboidChildren = getChildren(selectedElement.id);
              if (cuboidChildren.length > 0) {
                for (const e of cuboidChildren) {
                  switch (e.type) {
                    case ObjectType.Cuboid: {
                      const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, rot));
                      centerAbsPos.add(cuboidCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    }
                    case ObjectType.Tree:
                    case ObjectType.Flower:
                    case ObjectType.Human: {
                      const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, rot));
                      centerAbsPos.add(cuboidCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    }
                    case ObjectType.SolarPanel:
                    case ObjectType.Light:
                    case ObjectType.Sensor:
                      if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                        const centerAbsPos = new Vector3(
                          e.cx * selectedElement.lx,
                          e.cy * selectedElement.ly,
                          e.cz * selectedElement.lz,
                        ).applyEuler(new Euler(0, 0, rot));
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
                          ).rotateAround(ORIGIN_VECTOR2, rot);
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
              if (isGroupable(selectedElement)) {
                handleGroupMaster(e, selectedElement as GroupableModel);
              }
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
                    case ObjectType.Flower:
                    case ObjectType.Human: {
                      const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, a));
                      centerAbsPos.add(foundationCenter);
                      absPosMapRef.current.set(e.id, centerAbsPos);
                      break;
                    }
                    case ObjectType.SolarPanel:
                    case ObjectType.ParabolicTrough:
                    case ObjectType.ParabolicDish:
                    case ObjectType.FresnelReflector:
                    case ObjectType.Heliostat:
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
              const elementsOnRoof = getRooftopChildren(selectedElement.id);
              if (elementsOnRoof.length > 0) {
                const euler = new Euler(0, 0, selectedElement.rotation[2]);
                for (const e of elementsOnRoof) {
                  // skylight window position is absolute to foundation
                  if (e.type === ObjectType.Window) {
                    const centerAbsPos = new Vector3(e.cx, e.cy).applyEuler(euler);
                    centerAbsPos.add(foundationCenter);
                    absPosMapRef.current.set(e.id, centerAbsPos);
                  } else {
                    const centerAbsPos = new Vector3(e.cx * selectedElement.lx, e.cy * selectedElement.ly).applyEuler(
                      euler,
                    );
                    centerAbsPos.add(foundationCenter);
                    absPosMapRef.current.set(e.id, centerAbsPos);
                  }
                }
              }
              break;
          }
        }
      }
    }
  };

  const isHumanOrPlant = (type: ObjectType) => {
    return type === ObjectType.Human || type === ObjectType.Tree || type === ObjectType.Flower;
  };

  const handleTempHumanPlantChild = (state: CommonStoreState, parentId: string) => {
    if (state.tempHumanPlant.length === 0) {
      const temp = state.elements.filter((e) => {
        return isHumanOrPlant(e.type) && Util.isDescendantOf(e, parentId);
      });
      state.tempHumanPlant = temp;
      const set = new Set(temp.map((e) => e.id));
      state.elements = state.elements.filter((e) => !set.has(e.id));
    }
  };

  /** self, child and group Master group exclusive */
  const getFirstStackableCuboid = (e: ThreeEvent<PointerEvent>, currId: string) => {
    const firstIntersectedCuboidObject = e.intersections.find((intersect) => {
      const obj = intersect.eventObject;
      if (!obj.name.includes('Cuboid')) return false;
      const nameArray = obj.name.split(' ');
      if (nameArray.length !== 2) return false;
      return nameArray[1] !== currId && obj.userData.stackable;
    });

    if (!firstIntersectedCuboidObject) return undefined;

    const firstIntersectedCuboidObjectId = firstIntersectedCuboidObject.eventObject.name.split(' ')[1];

    if (baseGroupRelPosMapRef.current.has(firstIntersectedCuboidObjectId)) return undefined;

    return Util.isChild(currId, firstIntersectedCuboidObjectId) ? undefined : firstIntersectedCuboidObject;
  };

  const handleGroundPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      setRayCast(e);
      let intersects;
      switch (grabRef.current.type) {
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
                const p = intersects[0].point.clone();
                const firstIntersectedCuboidObject = getFirstStackableCuboid(e, grabRef.current.id);
                if (moveHandleType) {
                  if (baseGroupRelPosMapRef.current.size > 1) {
                    handleMove(p);
                  } else if (firstIntersectedCuboidObject) {
                    intersects = ray.intersectObjects([firstIntersectedCuboidObject.eventObject]);
                    if (intersects.length === 0) return;
                    p.copy(intersects[0].point).add(moveHandleWorldDiffV3Ref.current);
                    const newParentId = firstIntersectedCuboidObject.eventObject.name.split(' ')[1];
                    setCommonStore((state) => {
                      // todo: move grouped cuboid
                      const cuboid = state.elements.find((e) => e.id === state.selectedElement?.id);
                      const selectedElement = state.selectedElement;
                      if (cuboid && selectedElement) {
                        const { pos: parentAbsPos, rot: parentAbsRot } = Util.getWorldDataById(newParentId);
                        const diff = new Vector3().subVectors(p, parentAbsPos);
                        diff.applyEuler(new Euler(0, 0, -parentAbsRot));
                        cuboid.cx = diff.x;
                        cuboid.cy = diff.y;
                        if (selectedElement.parentId !== newParentId) {
                          if (cuboid.parentId !== newParentId) {
                            handleTempHumanPlantChild(state, cuboid.id);
                          }
                          const { rot: currAbsRot } = Util.getWorldDataById(selectedElement.id);
                          cuboid.rotation[2] = currAbsRot - parentAbsRot;
                          cuboid.parentId = newParentId;
                        } else if (cuboid.parentId !== newParentId) {
                          if (cuboid.parentId !== selectedElement.parentId) {
                            handleTempHumanPlantChild(state, cuboid.id);
                          }
                          cuboid.parentId = selectedElement.parentId;
                          cuboid.rotation[2] = selectedElement.rotation[2];
                        }
                      }
                    });
                  } else {
                    setCommonStore((state) => {
                      const cuboid = state.elements.find((e) => e.id === grabRef.current!.id);
                      if (cuboid && cuboid.parentId !== GROUND_ID) {
                        if (cuboid.parentId !== GROUND_ID) {
                          handleTempHumanPlantChild(state, cuboid.id);
                        }
                        const { rot: parentAbsRot } = Util.getWorldDataById(cuboid.parentId);
                        cuboid.rotation[2] += parentAbsRot;
                        cuboid.parentId = GROUND_ID;
                      }
                    });
                    handleMove(p);
                  }
                } else if (resizeHandleType) {
                  const cuboid = getElementById(grabRef.current.id);
                  if (cuboid && cuboid.parentId === GROUND_ID) {
                    handleResize(p);
                  }
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
        if (intersects.length > 0) {
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
      }

      // setting start point
      if (grabRef.current && (isSettingFoundationStartPointRef.current || isSettingCuboidStartPointRef.current)) {
        setRayCast(e);
        let intersects = ray.intersectObjects([groundPlaneRef.current]);
        if (intersects.length === 0) return;
        const p = intersects[0].point;
        if (grabRef.current.type === ObjectType.Foundation) {
          setElementPosition(grabRef.current.id, p.x, p.y);
        } else if (grabRef.current.type === ObjectType.Cuboid) {
          const firstIntersectedCuboidObject = getFirstStackableCuboid(e, grabRef.current.id);
          if (firstIntersectedCuboidObject) {
            intersects = ray.intersectObjects([firstIntersectedCuboidObject.eventObject]);
            if (intersects.length === 0) return;
            p.copy(intersects[0].point);
            const newParentId = firstIntersectedCuboidObject.eventObject.name.split(' ')[1];
            setCommonStore((state) => {
              const cuboid = state.elements.find((e) => e.id === grabRef.current?.id);
              if (cuboid) {
                const { pos: parentAbsPos, rot: parentAbsRot } = Util.getWorldDataById(newParentId);
                const diff = new Vector3().subVectors(p, parentAbsPos);
                diff.applyEuler(new Euler(0, 0, -parentAbsRot));
                cuboid.cx = diff.x;
                cuboid.cy = diff.y;
                cuboid.parentId = newParentId;
                cuboid.rotation[2] = -parentAbsRot;
              }
            });
          } else {
            setCommonStore((state) => {
              const cuboid = state.elements.find((e) => e.id === grabRef.current?.id);
              if (cuboid && cuboid.parentId !== GROUND_ID) {
                const { rot: parentAbsRot } = Util.getWorldDataById(cuboid.parentId);
                cuboid.rotation[2] += parentAbsRot;
                cuboid.parentId = GROUND_ID;
              }
            });
            setElementPosition(grabRef.current.id, p.x, p.y);
          }
        }
      }
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
            case ObjectType.Tree:
              const tree = grabRef.current as TreeModel;
              switch (resizeHandleType) {
                case ResizeHandleType.Top:
                  updateElementLzById(tree.id, p.z);
                  setCommonStore((state) => {
                    state.selectedElementHeight = Math.max(1, p.z);
                  });
                  break;
                // TODO: Need to move on a plane parallel to the direction from the handle to the tree center
                case ResizeHandleType.Left:
                case ResizeHandleType.Right:
                case ResizeHandleType.Upper:
                case ResizeHandleType.Lower:
                  updateElementLxById(tree.id, 2 * Math.hypot(p.x - tree.cx, p.y - tree.cy));
                  break;
              }
              handlePlantOrHumanRefMove(useRefStore.getState().treeRef, e);
              break;
            case ObjectType.Flower: {
              handlePlantOrHumanRefMove(useRefStore.getState().flowerRef, e);
              break;
            }
            case ObjectType.Human: {
              handlePlantOrHumanRefMove(useRefStore.getState().humanRef, e);
              break;
            }
          }
        }
      }
    }
  };

  // only these elements are allowed to be on the ground
  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Flower ||
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

  const handleHumanAndPlantPositionFixedOnParent = (
    object: Object3D | null | undefined,
    lx: number,
    ly: number,
    parentWorldPosition: Vector3,
    parentWorldRotation: number,
  ) => {
    if (!object) return;
    for (const child of object.children) {
      if (child.name.includes('Human') || child.name.includes('Tree') || child.name.includes('Flower')) {
        const childId = getObjectId(child);
        const worldPos = absPosMapRef.current.get(childId);
        if (worldPos) {
          // top face
          if (Math.abs(oldDimensionRef.current.z / 2 - child.position.z) < 0.01) {
            const relativePos = new Vector3()
              .subVectors(worldPos, parentWorldPosition)
              .applyEuler(new Euler(0, 0, -parentWorldRotation));
            child.position.setX(relativePos.x);
            child.position.setY(relativePos.y);
          }
          // side face
          else {
            const relativePos = new Vector3()
              .subVectors(worldPos, oldPositionRef.current)
              .applyEuler(new Euler(0, 0, -parentWorldRotation));
            const d = new Vector3().subVectors(parentWorldPosition, oldPositionRef.current);
            const v = new Vector3().subVectors(relativePos, d);
            // west and east face
            if (Math.abs(relativePos.x / oldDimensionRef.current.x) > 0.49) {
              child.position.setX((relativePos.x > 0 ? lx : -lx) / 2);
              child.position.setY(v.y);
            }
            // north and south face
            else if (Math.abs(relativePos.y / oldDimensionRef.current.y) > 0.49) {
              child.position.setX(v.x);
              child.position.setY((relativePos.y > 0 ? ly : -ly) / 2);
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
              if (children.length > 0 && !groupMasterId) {
                // basically, we have to create a copy of parent and children, set them to the new values,
                // check if the new values are OK, proceed to change the original elements in
                // the common store only when they are OK.
                const childrenClone: ElementModel[] = [];
                for (const c of children) {
                  if (Util.isPlantOrHuman(c)) continue;
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
                        switch (resizeHandleType) {
                          case ResizeHandleType.Lower:
                          case ResizeHandleType.Upper:
                            childClone.cy = centerPointRelativePos.y;
                            break;
                          case ResizeHandleType.Left:
                          case ResizeHandleType.Right:
                            childClone.cx = centerPointRelativePos.x;
                            break;
                          case ResizeHandleType.LowerLeft:
                          case ResizeHandleType.LowerRight:
                          case ResizeHandleType.UpperLeft:
                          case ResizeHandleType.UpperRight:
                            childClone.cx = centerPointRelativePos.x;
                            childClone.cy = centerPointRelativePos.y;
                            break;
                        }
                        childClone.leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, 0];
                        childClone.rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, 0];
                      }
                    } else {
                      const centerAbsPos = absPosMapRef.current.get(c.id);
                      if (centerAbsPos) {
                        const a = -e.rotation[2];
                        const relativePos = new Vector2()
                          .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                          .rotateAround(ORIGIN_VECTOR2, a);
                        switch (resizeHandleType) {
                          case ResizeHandleType.Lower:
                          case ResizeHandleType.Upper:
                            childClone.cy = relativePos.y / ly;
                            break;
                          case ResizeHandleType.Left:
                          case ResizeHandleType.Right:
                            childClone.cx = relativePos.x / lx;
                            break;
                          case ResizeHandleType.LowerLeft:
                          case ResizeHandleType.LowerRight:
                          case ResizeHandleType.UpperLeft:
                          case ResizeHandleType.UpperRight:
                            childClone.cx = relativePos.x / lx;
                            childClone.cy = relativePos.y / ly;
                            break;
                        }
                      }
                    }
                  }
                }
                const parentClone = JSON.parse(JSON.stringify(e)) as ElementModel;
                switch (resizeHandleType) {
                  case ResizeHandleType.Lower:
                  case ResizeHandleType.Upper:
                    parentClone.ly = ly;
                    parentClone.cy = center.y;
                    break;
                  case ResizeHandleType.Left:
                  case ResizeHandleType.Right:
                    parentClone.lx = lx;
                    parentClone.cx = center.x;
                    break;
                  case ResizeHandleType.LowerLeft:
                  case ResizeHandleType.LowerRight:
                  case ResizeHandleType.UpperLeft:
                  case ResizeHandleType.UpperRight:
                    parentClone.lx = lx;
                    parentClone.ly = ly;
                    parentClone.cx = center.x;
                    parentClone.cy = center.y;
                    break;
                }
                if (Util.doesParentContainAllChildren(parentClone, childrenClone)) {
                  switch (resizeHandleType) {
                    case ResizeHandleType.Lower:
                    case ResizeHandleType.Upper:
                      e.ly = ly;
                      e.cy = center.y;
                      break;
                    case ResizeHandleType.Left:
                    case ResizeHandleType.Right:
                      e.lx = lx;
                      e.cx = center.x;
                      break;
                    case ResizeHandleType.LowerLeft:
                    case ResizeHandleType.LowerRight:
                    case ResizeHandleType.UpperLeft:
                    case ResizeHandleType.UpperRight:
                      e.lx = lx;
                      e.ly = ly;
                      e.cx = center.x;
                      e.cy = center.y;
                      break;
                  }
                  sizeOk = true;
                }
              } else {
                // any size is okay for a childless parent
                if (lx > 0.49 && ly > 0.49) {
                  switch (resizeHandleType) {
                    case ResizeHandleType.Lower:
                    case ResizeHandleType.Upper:
                      e.ly = ly;
                      e.cy = center.y;
                      break;
                    case ResizeHandleType.Left:
                    case ResizeHandleType.Right:
                      e.lx = lx;
                      e.cx = center.x;
                      break;
                    case ResizeHandleType.LowerLeft:
                    case ResizeHandleType.LowerRight:
                    case ResizeHandleType.UpperLeft:
                    case ResizeHandleType.UpperRight:
                      e.lx = lx;
                      e.ly = ly;
                      e.cx = center.x;
                      e.cy = center.y;
                      break;
                  }
                  sizeOk = true;
                }
              }
              break;
          }
          break;
        }
      }
      // if the new size is okay, we can then change the relative positions of the children.
      if (sizeOk && !groupMasterId) {
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
                  switch (resizeHandleType) {
                    case ResizeHandleType.Lower:
                    case ResizeHandleType.Upper:
                      e.cy = centerPointRelativePos.y;
                      break;
                    case ResizeHandleType.Left:
                    case ResizeHandleType.Right:
                      e.cx = centerPointRelativePos.x;
                      break;
                    case ResizeHandleType.LowerLeft:
                    case ResizeHandleType.LowerRight:
                    case ResizeHandleType.UpperLeft:
                    case ResizeHandleType.UpperRight:
                      e.cx = centerPointRelativePos.x;
                      e.cy = centerPointRelativePos.y;
                      break;
                  }
                  wall.leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, 0];
                  wall.rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, 0];
                }
                break;
              case ObjectType.SolarPanel:
              case ObjectType.ParabolicTrough:
              case ObjectType.ParabolicDish:
              case ObjectType.FresnelReflector:
              case ObjectType.Heliostat:
              case ObjectType.Sensor:
                if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                  const centerAbsPos = absPosMapRef.current.get(e.id);
                  if (centerAbsPos) {
                    const relativePos = new Vector2()
                      .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                      .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
                    switch (resizeHandleType) {
                      case ResizeHandleType.Lower:
                      case ResizeHandleType.Upper:
                        e.cy = relativePos.y / ly;
                        break;
                      case ResizeHandleType.Left:
                      case ResizeHandleType.Right:
                        e.cx = relativePos.x / lx;
                        break;
                      case ResizeHandleType.LowerLeft:
                      case ResizeHandleType.LowerRight:
                      case ResizeHandleType.UpperLeft:
                      case ResizeHandleType.UpperRight:
                        e.cx = relativePos.x / lx;
                        e.cy = relativePos.y / ly;
                        break;
                    }
                  }
                }
                break;
              case ObjectType.Cuboid: {
                const centerAbsPos = absPosMapRef.current.get(e.id);
                if (centerAbsPos) {
                  const relativePos = new Vector2()
                    .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                    .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
                  switch (resizeHandleType) {
                    case ResizeHandleType.Lower:
                    case ResizeHandleType.Upper:
                      e.cy = relativePos.y;
                      break;
                    case ResizeHandleType.Left:
                    case ResizeHandleType.Right:
                      e.cx = relativePos.x;
                      break;
                    case ResizeHandleType.LowerLeft:
                    case ResizeHandleType.LowerRight:
                    case ResizeHandleType.UpperLeft:
                    case ResizeHandleType.UpperRight:
                      e.cx = relativePos.x;
                      e.cy = relativePos.y;
                      break;
                  }
                }
                break;
              }
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
          if (
            e.foundationId === grabRef.current.id &&
            e.type === ObjectType.SolarPanel &&
            (e as SolarPanelModel).parentType === ObjectType.Roof
          ) {
            const centerAbsPos = absPosMapRef.current.get(e.id);
            if (centerAbsPos) {
              const relativePos = new Vector2()
                .subVectors(new Vector2(centerAbsPos.x, centerAbsPos.y), center)
                .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
              switch (resizeHandleType) {
                case ResizeHandleType.Lower:
                case ResizeHandleType.Upper:
                  e.cy = relativePos.y / ly;
                  break;
                case ResizeHandleType.Left:
                case ResizeHandleType.Right:
                  e.cx = relativePos.x / lx;
                  break;
                case ResizeHandleType.LowerLeft:
                case ResizeHandleType.LowerRight:
                case ResizeHandleType.UpperLeft:
                case ResizeHandleType.UpperRight:
                  e.cx = relativePos.x / lx;
                  e.cy = relativePos.y / ly;
                  break;
              }
            }
          }
          if (
            e.foundationId === grabRef.current.id &&
            e.type === ObjectType.Window &&
            (e as WindowModel).parentType === ObjectType.Roof
          ) {
            const centerPos = absPosMapRef.current.get(e.id);
            if (centerPos) {
              const relPosToFoundation = new Vector2()
                .subVectors(new Vector2(centerPos.x, centerPos.y), center)
                .rotateAround(ORIGIN_VECTOR2, -grabRef.current!.rotation[2]);
              e.cx = relPosToFoundation.x;
              e.cy = relPosToFoundation.y;
            }
          }
        }
      }
    });

    switch (grabRef.current.type) {
      case ObjectType.Foundation:
        const foundationRef = useRefStore.getState().foundationRef;
        if (foundationRef?.current) {
          handleHumanAndPlantPositionFixedOnParent(
            foundationRef?.current,
            lx,
            ly,
            foundationRef.current.position,
            grabRef.current.rotation[2],
          );
        }
        break;
      case ObjectType.Cuboid:
        const cuboidRef = useRefStore.getState().cuboidRef;
        if (cuboidRef?.current && cuboidRef.current.parent) {
          handleHumanAndPlantPositionFixedOnParent(
            cuboidRef?.current,
            lx,
            ly,
            cuboidRef.current.parent.position,
            grabRef.current.rotation[2],
          );
        }
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
    if (baseGroupRelPosMapRef.current.size > 0) {
      setCommonStore((state) => {
        for (const elem of state.elements) {
          if (isGroupable(elem) && baseGroupRelPosMapRef.current.has(elem.id)) {
            const v = baseGroupRelPosMapRef.current.get(elem.id);
            if (v) {
              elem.cx = p.x + v.x;
              elem.cy = p.y + v.y;
            }
          }
        }
      });
      return;
    }
    let x0, y0;
    const hx = grabRef.current!.lx / 2;
    const hy = grabRef.current!.ly / 2;
    switch (moveHandleType) {
      case MoveHandleType.Top: {
        if (isMultipleMoveRef.current) {
          const center = new Vector3(p.x, p.y);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === grabRef.current!.id) {
                e.cx = center.x;
                e.cy = center.y;
              } else if (baseGroupRelPosMapRef.current.has(e.id)) {
                const offset = baseGroupRelPosMapRef.current.get(e.id);
                if (offset) {
                  const c = new Vector3().addVectors(center, offset);
                  e.cx = c.x;
                  e.cy = c.y;
                }
              }
            }
          });
        } else {
          setElementPosition(grabRef.current!.id, p.x, p.y);
        }
        break;
      }
      case MoveHandleType.Upper:
        x0 = p.x + sinAngle * hy;
        y0 = p.y - cosAngle * hy;
        if (isMultipleMoveRef.current) {
          const center = new Vector3(x0, y0);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === grabRef.current!.id) {
                e.cx = center.x;
                e.cy = center.y;
              } else if (baseGroupRelPosMapRef.current.has(e.id)) {
                const offset = baseGroupRelPosMapRef.current.get(e.id);
                if (offset) {
                  const c = new Vector3().addVectors(center, offset);
                  e.cx = c.x;
                  e.cy = c.y;
                }
              }
            }
          });
        } else {
          setElementPosition(grabRef.current!.id, x0, y0);
        }
        break;
      case MoveHandleType.Lower:
        x0 = p.x - sinAngle * hy;
        y0 = p.y + cosAngle * hy;
        if (isMultipleMoveRef.current) {
          const center = new Vector3(x0, y0);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === grabRef.current!.id) {
                e.cx = center.x;
                e.cy = center.y;
              } else if (baseGroupRelPosMapRef.current.has(e.id)) {
                const offset = baseGroupRelPosMapRef.current.get(e.id);
                if (offset) {
                  const c = new Vector3().addVectors(center, offset);
                  e.cx = c.x;
                  e.cy = c.y;
                }
              }
            }
          });
        } else {
          setElementPosition(grabRef.current!.id, x0, y0);
        }
        break;
      case MoveHandleType.Left:
        x0 = p.x + cosAngle * hx;
        y0 = p.y + sinAngle * hx;
        if (isMultipleMoveRef.current) {
          const center = new Vector3(x0, y0);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === grabRef.current!.id) {
                e.cx = center.x;
                e.cy = center.y;
              } else if (baseGroupRelPosMapRef.current.has(e.id)) {
                const offset = baseGroupRelPosMapRef.current.get(e.id);
                if (offset) {
                  const c = new Vector3().addVectors(center, offset);
                  e.cx = c.x;
                  e.cy = c.y;
                }
              }
            }
          });
        } else {
          setElementPosition(grabRef.current!.id, x0, y0);
        }
        break;
      case MoveHandleType.Right:
        x0 = p.x - cosAngle * hx;
        y0 = p.y - sinAngle * hx;
        if (isMultipleMoveRef.current) {
          const center = new Vector3(x0, y0);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === grabRef.current!.id) {
                e.cx = center.x;
                e.cy = center.y;
              } else if (baseGroupRelPosMapRef.current.has(e.id)) {
                const offset = baseGroupRelPosMapRef.current.get(e.id);
                if (offset) {
                  const c = new Vector3().addVectors(center, offset);
                  e.cx = c.x;
                  e.cy = c.y;
                }
              }
            }
          });
        } else {
          setElementPosition(grabRef.current!.id, x0, y0);
        }
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
        >
          <meshStandardMaterial side={DoubleSide} opacity={0.5} transparent />
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
        onPointerMove={handleGroundPointerMove}
        // onPointerOut={handleGroundPointerOut}
      >
        {showSolarRadiationHeatmap && !waterSurface ? (
          <meshBasicMaterial color={groundColor} />
        ) : (
          <meshStandardMaterial
            depthTest={false}
            color={waterSurface ? 'white' : groundColor}
            map={waterSurface ? Util.WATER_TEXTURE : Util.WHITE_TEXTURE}
            needsUpdate={true}
          />
        )}
      </Plane>
    </>
  );
};

export default React.memo(Ground);
