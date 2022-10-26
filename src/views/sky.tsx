/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { RefObject, useMemo, useRef, useState } from 'react';
import { BackSide, DoubleSide, Euler, Group, Intersection, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { invalidate, ThreeEvent, useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';

import DefaultImage from '../resources/daysky.jpg';
import DesertImage from '../resources/desert.jpg';
import DuneImage from '../resources/dune.jpg';
import ForestImage from '../resources/forest.jpg';
import GrasslandImage from '../resources/grassland.jpg';
import HillSpringImage from '../resources/hill-spring.jpg';
import HillSummerImage from '../resources/hill-summer.jpg';
import HillFallImage from '../resources/hill-fall.jpg';
import HillWinterImage from '../resources/hill-winter.jpg';
import LakeImage from '../resources/lake.jpg';
import MountainImage from '../resources/mountain.jpg';
import RuralImage from '../resources/rural.jpg';

import { useStore } from '../stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from '../stores/selector';
import { IntersectionPlaneType, ObjectType, ResizeHandleType, Theme } from '../types';
import { ElementModel } from '../models/ElementModel';
import {
  DEFAULT_SKY_RADIUS,
  GROUND_ID,
  HALF_PI,
  ORIGIN_VECTOR2,
  TWO_PI,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from '../constants';
import { Util } from 'src/Util';
import { PolygonModel } from 'src/models/PolygonModel';
import { TreeModel } from '../models/TreeModel';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableMove } from 'src/undo/UndoableMove';
import { showError } from 'src/helpers';
import i18n from 'src/i18n/i18n';

export interface SkyProps {
  theme?: string;
}

const Sky = ({ theme = 'Default' }: SkyProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const getChildren = useStore(Selector.getChildren);
  const getElementById = useStore(Selector.getElementById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const latitude = useStore(Selector.world.latitude);
  const date = useStore(Selector.world.date);
  const addUndoable = useStore(Selector.addUndoable);
  const setElementPosition = useStore(Selector.setElementPosition);
  const language = useStore(Selector.language);
  const updateSceneRadius = useStore(Selector.updateSceneRadius);

  const {
    scene,
    camera,
    gl: { domElement },
  } = useThree();
  const meshRef = useRef<Mesh>(null!);
  const grabRef = useRef<ElementModel | null>(null);
  const intersectionPlaneRef = useRef<Mesh>();
  const absPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const polygonsAbsPosMapRef = useRef<Map<string, Vector2[]>>(new Map());
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldWidthRef = useRef<number>(0);
  const oldHeightRef = useRef<number>(0);
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldHumanOrTreeParentIdRef = useRef<string | null>(null);

  const lang = { lng: language };
  const ray = useMemo(() => new Raycaster(), []);
  const elementParentRotation = useMemo(() => new Euler(), []);

  const now = new Date(date);
  const month = now.getMonth() + 1;
  const night = sunlightDirection.z <= 0;

  const [intersectionPlaneType, setIntersectionPlaneType] = useState(IntersectionPlaneType.Sky);
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);
  if (grabRef.current && resizeHandleType) {
    if (intersectionPlaneType !== IntersectionPlaneType.Vertical) {
      setIntersectionPlaneType(IntersectionPlaneType.Vertical);
    }
    const handlePosition = getResizeHandlePosition(grabRef.current, resizeHandleType);
    const cameraDir = getCameraDirection();
    const rotation = -Math.atan2(cameraDir.x, cameraDir.y);
    intersectionPlanePosition.set(handlePosition.x, handlePosition.y, 0);
    intersectionPlaneAngle.set(-HALF_PI, 0, rotation, 'ZXY');
  }

  const scale = useMemo(() => {
    switch (theme) {
      case Theme.Desert:
        return 0.5;
      case Theme.Dune:
        return 0.25;
      case Theme.Forest:
        return 0.25;
      case Theme.Grassland:
        return 0.15;
      case Theme.Hill:
        return 0.3;
      case Theme.Lake:
        return 0.1;
      case Theme.Mountain:
        return 0.4;
      case Theme.Rural:
        return 0.25;
      default:
        return 0.2;
    }
  }, [theme]);

  const textureImg = useMemo(() => {
    switch (theme) {
      case Theme.Desert:
        return DesertImage;
      case Theme.Dune:
        return DuneImage;
      case Theme.Forest:
        return ForestImage;
      case Theme.Grassland:
        return GrasslandImage;
      case Theme.Hill:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            return HillWinterImage;
          } else if (month > 3 && month <= 5) {
            return HillSpringImage;
          } else if (month > 5 && month <= 9) {
            return HillSummerImage;
          } else {
            // November
            return HillFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            return HillSummerImage;
          } else if (month > 3 && month <= 5) {
            return HillFallImage;
          } else if (month > 5 && month <= 9) {
            return HillWinterImage;
          } else {
            return HillSpringImage;
          }
        }
      case Theme.Lake:
        return LakeImage;
      case Theme.Mountain:
        return MountainImage;
      case Theme.Rural:
        return RuralImage;
      default:
        return DefaultImage;
    }
  }, [theme, date, latitude]);

  const texture = useTexture(textureImg);

  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Flower ||
      type === ObjectType.Human
    );
  };

  const clickSky = (e: ThreeEvent<MouseEvent>) => {
    // We must check if there is really a first intersection, onClick does not guarantee it
    // onClick listener for an object can still fire an event even when the object is behind another one
    if (e.intersections.length > 0) {
      const skyClicked = e.intersections[0].object === meshRef.current;
      if (skyClicked) {
        selectNone();
        setCommonStore((state) => {
          state.clickObjectType = ObjectType.Sky;
        });
      } else {
        const selectedElement = getSelectedElement();
        const wallResizeHandle = useStore.getState().resizeHandleType;
        if (selectedElement) {
          if (legalOnGround(selectedElement.type)) {
            grabRef.current = selectedElement;
            if (Util.isPlantOrHuman(grabRef.current)) {
              setIntersectionPlaneType(IntersectionPlaneType.Vertical);
              intersectionPlaneAngle.set(-HALF_PI, 0, 0, 'ZXY');
            }
            if (selectedElement.type !== ObjectType.Foundation && selectedElement.type !== ObjectType.Cuboid) {
              useStoreRef.getState().setEnableOrbitController(false);
            }
          } else if (
            selectedElement.type === ObjectType.Wall &&
            (wallResizeHandle === ResizeHandleType.UpperLeft || wallResizeHandle === ResizeHandleType.UpperRight)
          ) {
            grabRef.current = selectedElement;
          }
        }
      }
    }
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
    newChildrenPositionsMapRef.current.set(e.id, new Vector3(absPos.x, absPos.y, 0));
    newChildrenParentIdMapRef.current.set(e.id, GROUND_ID);
  };

  const attachToGroup = (
    attachParentId: string | null | undefined,
    currParentId: string | null | undefined,
    currId: string,
  ) => {
    if (!attachParentId || !currParentId) return;
    const contentRef = useStoreRef.getState().contentRef;
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

  const setParentIdById = (parentId: string | null | undefined, elementId: string) => {
    if (!parentId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        // don't set parentId for foundations or cuboids as their parents are allowed to be ground only (for now)
        if (e.id === elementId && !Util.isFoundationOrCuboid(e)) {
          e.parentId = parentId;
          break;
        }
      }
    });
  };

  const getIntersectionToStand = (intersections: Intersection[]) => {
    for (const intersection of intersections) {
      if (intersection.object.userData.stand) {
        return intersection;
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
          // change parent: attach dom, set parentId?
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
            // change parent: attach dom, set parentId?
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
      }
    }
  };

  // for tree and human for now
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

  const isMoveToSky = () => {
    if (useStore.getState().viewState.orthographic) return false; // impossible to move to sky in 2D mode
    if (meshRef.current) {
      const intersections = ray.intersectObjects(Util.fetchIntersectables(scene), false);
      if (intersections.length > 0) {
        for (const intersection of intersections) {
          if (intersection.object.userData.stand) {
            return false;
          }
        }
      }
    }
    return ray.intersectObjects([meshRef.current!]).length > 0;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      const mouse = new Vector2();
      mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
      mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
      ray.setFromCamera(mouse, camera);
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
                case ResizeHandleType.Left:
                case ResizeHandleType.Right:
                case ResizeHandleType.Upper:
                case ResizeHandleType.Lower:
                  updateElementLxById(tree.id, 2 * Math.hypot(p.x - tree.cx, p.y - tree.cy));
                  break;
              }
              handleTreeOrHumanRefMove(useStoreRef.getState().treeRef, e);
              break;
            case ObjectType.Human:
              handleTreeOrHumanRefMove(useStoreRef.getState().humanRef, e);
              break;
            case ObjectType.Cuboid:
              if (Util.isTopResizeHandle(resizeHandleType)) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cz = Math.max(0.5, p.z / 2);
                      e.lz = Math.max(1, p.z);
                      break;
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
                        if (Math.abs(oldHeightRef.current - absPos.z) < 0.01) {
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
                      break;
                    }
                  }
                  state.selectedElementHeight = Math.max(1, p.z);
                  state.updateRoofFlag = !state.updateRoofFlag;
                });
              }
              break;
          }
        }
      }
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    clickSky(e);

    const selectedElement = grabRef.current;
    if (selectedElement) {
      // save info for undo
      oldHeightRef.current = selectedElement.lz;
      oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);

      // store the positions of children
      switch (selectedElement.type) {
        case ObjectType.Human:
          oldHumanOrTreeParentIdRef.current = selectedElement.parentId;
          break;
        case ObjectType.Tree:
          oldHumanOrTreeParentIdRef.current = selectedElement.parentId;
          oldWidthRef.current = selectedElement.lx; // crown spread of tree
          break;
        case ObjectType.Cuboid: {
          oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);

          absPosMapRef.current.clear();
          const cuboidCenter = new Vector3(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          const cuboidChildren = getChildren(selectedElement.id);
          if (cuboidChildren.length > 0) {
            oldChildrenPositionsMapRef.current.clear();
            const a = selectedElement.rotation[2];
            for (const e of cuboidChildren) {
              switch (e.type) {
                case ObjectType.Tree:
                case ObjectType.Human:
                  const centerAbsPos = new Vector3(e.cx, e.cy, e.cz).applyEuler(new Euler(0, 0, a));
                  centerAbsPos.add(cuboidCenter);
                  absPosMapRef.current.set(e.id, centerAbsPos);
                  oldChildrenPositionsMapRef.current.set(e.id, new Vector3(e.cx, e.cy, e.cz));
                  break;
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
                      const vertexAbsPos = new Vector2(v.x * selectedElement.lx, v.y * selectedElement.ly).rotateAround(
                        ORIGIN_VECTOR2,
                        a,
                      );
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
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (grabRef.current) {
      const elem = getElementById(grabRef.current.id);
      if (elem && !elem.locked) {
        let elementRef: Group | null | undefined = null;
        let newHumanOrTreeParentId: string | null = oldHumanOrTreeParentIdRef.current;
        switch (elem.type) {
          case ObjectType.Cuboid:
            switch (resizeHandleType) {
              case ResizeHandleType.UpperLeftTop:
              case ResizeHandleType.UpperRightTop:
              case ResizeHandleType.LowerLeftTop:
              case ResizeHandleType.LowerRightTop:
                oldChildrenParentIdMapRef.current.clear();
                setCommonStore((state) => {
                  state.actionState.cuboidHeight = elem.lz;
                  // set ref children state
                  for (const e of state.elements) {
                    if (Util.isPlantOrHuman(e)) {
                      if (e.parentId === elem.id) {
                        oldChildrenParentIdMapRef.current.set(e.id, elem.id);
                        // stand on top face
                        if (Math.abs(oldDimensionRef.current.z / 2 - e.cz) < 0.01) {
                          e.cz = elem.lz / 2;
                        }
                        // stand on side faces
                        else {
                          const newRelZ = e.cz + oldPositionRef.current.z - elem.cz;
                          if (Math.abs(newRelZ) > elem.lz / 2) {
                            handleDetachParent(elem, e);
                          } else {
                            e.cz = newRelZ;
                          }
                        }
                      }
                    }
                  }
                });
                const children = getChildren(elem.id);
                if (children.length > 0) {
                  for (const c of children) {
                    newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
                  }
                }
                const undoableChangeHeight = {
                  name: 'Change Cuboid Height',
                  timestamp: Date.now(),
                  changedElementId: elem.id,
                  changedElementType: elem.type,
                  oldValue: oldHeightRef.current,
                  newValue: elem.lz,
                  oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
                  newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
                  oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
                  newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
                  undo: () => {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === undoableChangeHeight.changedElementId) {
                          e.lz = undoableChangeHeight.oldValue as number;
                          e.cz = (undoableChangeHeight.oldValue as number) / 2;
                          break;
                        }
                      }
                    });
                    if (
                      undoableChangeHeight.oldChildrenPositionsMap &&
                      undoableChangeHeight.oldChildrenPositionsMap.size > 0
                    ) {
                      for (const [id, p] of undoableChangeHeight.oldChildrenPositionsMap.entries()) {
                        const elem = getElementById(id);
                        if (elem?.type !== ObjectType.Polygon) {
                          setElementPosition(id, p.x, p.y, p.z);
                          const oldParentId = undoableChangeHeight.oldChildrenParentIdMap?.get(id);
                          const newParentId = undoableChangeHeight.newChildrenParentIdMap?.get(id);
                          if (oldParentId && newParentId && oldParentId !== newParentId) {
                            attachToGroup(oldParentId, newParentId, id);
                            setParentIdById(oldParentId, id);
                          }
                        }
                      }
                    }
                  },
                  redo: () => {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === undoableChangeHeight.changedElementId) {
                          e.lz = undoableChangeHeight.newValue as number;
                          e.cz = (undoableChangeHeight.newValue as number) / 2;
                          break;
                        }
                      }
                    });
                    if (
                      undoableChangeHeight.newChildrenPositionsMap &&
                      undoableChangeHeight.newChildrenPositionsMap.size > 0
                    ) {
                      for (const [id, p] of undoableChangeHeight.newChildrenPositionsMap.entries()) {
                        setElementPosition(id, p.x, p.y, p.z);
                        const oldParentId = undoableChangeHeight.oldChildrenParentIdMap?.get(id);
                        const newParentId = undoableChangeHeight.newChildrenParentIdMap?.get(id);
                        if (oldParentId && newParentId && oldParentId !== newParentId) {
                          attachToGroup(newParentId, oldParentId, id);
                          setParentIdById(newParentId, id);
                        }
                      }
                    }
                  },
                } as UndoableChange;
                addUndoable(undoableChangeHeight);
                break;
            }
            break;
          case ObjectType.Tree:
            switch (resizeHandleType) {
              case ResizeHandleType.Top:
                const undoableChangeHeight = {
                  name: 'Change Tree Height',
                  timestamp: Date.now(),
                  changedElementId: elem.id,
                  changedElementType: elem.type,
                  oldValue: oldHeightRef.current,
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
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                const undoableChangeSpread = {
                  name: 'Change Tree Spread',
                  timestamp: Date.now(),
                  changedElementId: elem.id,
                  changedElementType: elem.type,
                  oldValue: oldWidthRef.current,
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
                break;
            }
            elementRef = useStoreRef.getState().treeRef?.current;
            break;
          case ObjectType.Human:
            elementRef = useStoreRef.getState().humanRef?.current;
            break;
          case ObjectType.Wall:
            const undoableChangeHeight = {
              name: 'Change Wall Height',
              timestamp: Date.now(),
              changedElementId: elem.id,
              changedElementType: elem.type,
              oldValue: oldHeightRef.current,
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
            break;
        }
        if (elementRef) {
          const intersections = ray.intersectObjects(Util.fetchIntersectables(scene), false);
          const intersection = getIntersectionToStand(intersections); // could simplify???
          if (intersection) {
            const p = intersection.point;
            // on ground
            if (intersection.object.name === 'Ground') {
              handleSetElementState(elem.id, GROUND_ID, p);
              newPositionRef.current.set(p.x, p.y, p.z);
              newHumanOrTreeParentId = GROUND_ID;
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
                newPositionRef.current.set(relPos.x, relPos.y, relPos.z);
                newHumanOrTreeParentId = intersectionObjId;
              }
            }
          }
        }
        if (
          useStore.getState().moveHandleType &&
          Util.isPlantOrHuman(elem) &&
          (newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE ||
            ray.intersectObjects([meshRef.current!]).length > 0)
        ) {
          let moveOk = true;
          // not sure why we need to check this as I cannot imagine which object will be dragged in the sky
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
              setParentIdById(oldHumanOrTreeParentIdRef.current, elem.id);
            }
            const contentRef = useStoreRef.getState().contentRef;
            if (contentRef?.current && oldHumanOrTreeParentIdRef.current && elementRef) {
              if (oldHumanOrTreeParentIdRef.current === GROUND_ID) {
                contentRef.current.add(elementRef);
              } else {
                const attachParentObj = Util.getObjectChildById(contentRef.current, oldHumanOrTreeParentIdRef.current);
                attachParentObj?.add(elementRef);
              }
              invalidate();
            }
            showError(i18n.t('message.CannotMoveObjectTooFar', lang));
          } else {
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
              oldParentId: oldHumanOrTreeParentIdRef.current,
              newParentId: newHumanOrTreeParentId,
              undo: () => {
                setElementPosition(
                  undoableMove.movedElementId,
                  undoableMove.oldCx,
                  undoableMove.oldCy,
                  undoableMove.oldCz,
                );
                setParentIdById(undoableMove.oldParentId, undoableMove.movedElementId);
                attachToGroup(undoableMove.oldParentId, undoableMove.newParentId, undoableMove.movedElementId);
              },
              redo: () => {
                setElementPosition(
                  undoableMove.movedElementId,
                  undoableMove.newCx,
                  undoableMove.newCy,
                  undoableMove.newCz,
                );
                setParentIdById(undoableMove.newParentId, undoableMove.movedElementId);
                attachToGroup(undoableMove.newParentId, undoableMove.oldParentId, undoableMove.movedElementId);
              },
            } as UndoableMove;
            addUndoable(undoableMove);
            updateSceneRadius();
          }
        }
      }
      grabRef.current = null;
      setIntersectionPlaneType(IntersectionPlaneType.Sky);
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
    }
  };

  return (
    <>
      <mesh
        ref={meshRef}
        name={'Sky'}
        rotation={[HALF_PI, 0, 0]}
        scale={[1, scale, 1]}
        onContextMenu={(e) => {
          if (e.intersections.length > 0) {
            const skyClicked = e.intersections[0].object === meshRef.current;
            if (skyClicked) {
              selectNone();
              setCommonStore((state) => {
                state.clickObjectType = ObjectType.Sky;
                state.contextMenuObjectType = ObjectType.Sky;
              });
            }
          }
        }}
        onPointerDown={handlePointerDown}
      >
        <sphereBufferGeometry args={[DEFAULT_SKY_RADIUS, 16, 8, 0, TWO_PI, 0, HALF_PI]} />
        {night ? (
          <meshStandardMaterial map={texture} side={BackSide} opacity={1} color={'skyblue'} />
        ) : (
          <meshBasicMaterial map={texture} side={BackSide} opacity={1} color={'skyblue'} />
        )}
      </mesh>
      {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Sky && (
        <Plane
          ref={intersectionPlaneRef}
          visible={false}
          name={'Sky Intersection Plane'}
          rotation={intersectionPlaneAngle}
          position={intersectionPlanePosition}
          args={[1000, 1000]}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
    </>
  );
};

export default React.memo(Sky);
