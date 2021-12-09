/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { Plane } from '@react-three/drei';
import { DoubleSide, Euler, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { IntersectionPlaneType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  FINE_GRID_SCALE,
  HALF_PI,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
} from '../constants';
import { Util } from '../Util';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableRotate } from '../undo/UndoableRotate';
import { UndoableAdd } from '../undo/UndoableAdd';
import { WallModel } from 'src/models/WallModel';

interface WallAbsPos {
  leftPointAbsPos: Vector2;
  rightPointAbsPos: Vector2;
  centerPointAbsPos: Vector2;
}

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

  const {
    camera,
    gl: { domElement },
    scene,
  } = useThree();
  const standObjectsRef = useRef<Object3D[]>([]);
  const groundPlaneRef = useRef<Mesh>();
  const intersectionPlaneRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldRotationRef = useRef<number[]>([0, 0, 1]);
  const newRotationRef = useRef<number[]>([0, 0, 1]);
  const absPosMapRef = useRef<Map<string, Vector2>>(new Map());
  const wallsAbsPosMapRef = useRef<Map<string, WallAbsPos>>(new Map());
  const isSettingFoundationStartPointRef = useRef(false);
  const isSettingFoundationEndPointRef = useRef(false);
  const isSettingCuboidStartPointRef = useRef(false);
  const isSettingCuboidEndPointRef = useRef(false);

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
        state.buildingFoundationId = null;
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
        state.buildingCuboidId = null;
        state.deletedCuboidId = null;
      });
      isSettingCuboidStartPointRef.current = false;
      isSettingCuboidEndPointRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedCuboidId]);

  const ray = useMemo(() => new Raycaster(), []);
  const cosAngle = grabRef.current ? Math.cos(grabRef.current.rotation[2]) : 1;
  const sinAngle = grabRef.current ? Math.sin(grabRef.current.rotation[2]) : 0;
  let intersectionPlaneType = IntersectionPlaneType.Ground;
  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneAngle = useMemo(() => new Euler(), []);

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
    const mouse = new Vector2();
    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const fetchStandElements = (currentId: string, obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['stand'] && obj.uuid !== currentId) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchStandElements(currentId, c, arr);
      }
    }
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

    const elem = getElementById(grabRef.current?.id ?? '');
    if (elem) {
      // set building foundation end point
      if (isSettingFoundationEndPointRef.current) {
        isSettingFoundationStartPointRef.current = false;
        isSettingFoundationEndPointRef.current = false;
        setCommonStore((state) => {
          state.buildingFoundationId = null;
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
      // set building cuboid end point
      else if (isSettingCuboidEndPointRef.current) {
        isSettingCuboidStartPointRef.current = false;
        isSettingCuboidEndPointRef.current = false;
        setCommonStore((state) => {
          state.buildingCuboidId = null;
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
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
          newDimensionRef.current.x = elem.lx;
          newDimensionRef.current.y = elem.ly;
          newDimensionRef.current.z = elem.lz;
          if (
            newPositionRef.current.distanceToSquared(oldPositionRef.current) > 0.0001 &&
            newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > 0.0001
          ) {
            const undoableResize = {
              name: 'Resize',
              timestamp: Date.now(),
              resizedElement: grabRef.current,
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
              undo: () => {
                setElementPosition(
                  undoableResize.resizedElement.id,
                  undoableResize.oldCx,
                  undoableResize.oldCy,
                  undoableResize.oldCz,
                );
                setElementSize(
                  undoableResize.resizedElement.id,
                  undoableResize.oldLx,
                  undoableResize.oldLy,
                  undoableResize.oldLz,
                );
              },
              redo: () => {
                setElementPosition(
                  undoableResize.resizedElement.id,
                  undoableResize.newCx,
                  undoableResize.newCy,
                  undoableResize.newCz,
                );
                setElementSize(
                  undoableResize.resizedElement.id,
                  undoableResize.newLx,
                  undoableResize.newLy,
                  undoableResize.newLz,
                );
              },
            } as UndoableResize;
            addUndoable(undoableResize);
          }
          setCommonStore((state) => {
            state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
            state.updateWallPointOnFoundation = !state.updateWallPointOnFoundation;
          });
        } else if (rotateHandleType) {
          newRotationRef.current = [...elem.rotation];
          const oldRotation = new Vector3().fromArray(oldRotationRef.current);
          const newRotation = new Vector3().fromArray(newRotationRef.current);
          if (newRotation.distanceToSquared(oldRotation) > 0.0001) {
            const undoableRotate = {
              name: 'Rotate',
              timestamp: Date.now(),
              rotatedElement: grabRef.current,
              oldRotation: oldRotationRef.current,
              newRotation: newRotationRef.current,
              undo: () => {
                setElementRotation(
                  undoableRotate.rotatedElement.id,
                  undoableRotate.oldRotation[0],
                  undoableRotate.oldRotation[1],
                  undoableRotate.oldRotation[2],
                );
              },
              redo: () => {
                setElementRotation(
                  undoableRotate.rotatedElement.id,
                  undoableRotate.newRotation[0],
                  undoableRotate.newRotation[1],
                  undoableRotate.newRotation[2],
                );
              },
            } as UndoableRotate;
            addUndoable(undoableRotate);
          }
        } else {
          newPositionRef.current.x = elem.cx;
          newPositionRef.current.y = elem.cy;
          newPositionRef.current.z = elem.cz;
          if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > 0.0001) {
            const undoableMove = {
              name: 'Move',
              timestamp: Date.now(),
              movedElement: grabRef.current,
              oldCx: oldPositionRef.current.x,
              oldCy: oldPositionRef.current.y,
              oldCz: oldPositionRef.current.z,
              newCx: newPositionRef.current.x,
              newCy: newPositionRef.current.y,
              newCz: newPositionRef.current.z,
              undo: () => {
                setElementPosition(
                  undoableMove.movedElement.id,
                  undoableMove.oldCx,
                  undoableMove.oldCy,
                  undoableMove.oldCz,
                );
              },
              redo: () => {
                setElementPosition(
                  undoableMove.movedElement.id,
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

    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.rotateHandleType = null;
      state.enableOrbitController = true;
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });

    if (e.intersections.length > 0 && groundPlaneRef.current) {
      // set building foundation start point
      if (isSettingFoundationStartPointRef.current) {
        setRayCast(e);
        const intersects = ray.intersectObjects([groundPlaneRef.current]);
        const p = positionOnGrid(intersects[0].point);
        setCommonStore((state) => {
          state.enableOrbitController = false;
          state.moveHandleType = null;
          state.resizeHandleType = ResizeHandleType.LowerRight;
          state.resizeAnchor.copy(p);
        });
        isSettingFoundationStartPointRef.current = false;
        isSettingFoundationEndPointRef.current = true;
        return;
      }
      // set building cuboid start point
      else if (isSettingCuboidStartPointRef.current) {
        setRayCast(e);
        const intersects = ray.intersectObjects([groundPlaneRef.current]);
        const p = positionOnGrid(intersects[0].point);
        setCommonStore((state) => {
          state.enableOrbitController = false;
          state.moveHandleType = null;
          state.resizeHandleType = ResizeHandleType.LowerRight;
          state.resizeAnchor.copy(p);
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
            oldPositionRef.current.x = selectedElement.cx;
            oldPositionRef.current.y = selectedElement.cy;
            oldPositionRef.current.z = selectedElement.cz;
            oldDimensionRef.current.x = selectedElement.lx;
            oldDimensionRef.current.y = selectedElement.ly;
            oldDimensionRef.current.z = selectedElement.lz;
            oldRotationRef.current = [...selectedElement.rotation];
            // allow the view to rotate when pressing down on the elements excluded as follows
            if (selectedElement.type !== ObjectType.Foundation && selectedElement.type !== ObjectType.Cuboid) {
              setCommonStore((state) => {
                state.enableOrbitController = false;
              });
            }
            // allow humans and trees to stand on top of a "stand" surface (defined in userData)
            switch (selectedElement.type) {
              case ObjectType.Human:
              case ObjectType.Tree:
                const content = scene.children.filter((c) => c.name === 'Content');
                standObjectsRef.current = [];
                if (content.length > 0) {
                  const components = content[0].children;
                  for (const c of components) {
                    fetchStandElements(grabRef.current.id, c, standObjectsRef.current);
                  }
                }
                break;
              case ObjectType.Cuboid:
                // getting ready for resizing even though it may not happen
                const cuboidCenter = new Vector2(selectedElement.cx, selectedElement.cy);
                absPosMapRef.current.clear();
                for (const e of useStore.getState().elements) {
                  if (e.parentId === selectedElement.id) {
                    const v0 = new Vector2(0, 0);
                    const a = selectedElement.rotation[2];
                    switch (e.type) {
                      case ObjectType.SolarPanel:
                      case ObjectType.Sensor:
                        if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                          const centerAbsPos = new Vector2(
                            e.cx * selectedElement.lx,
                            e.cy * selectedElement.ly,
                          ).rotateAround(v0, a);
                          centerAbsPos.add(cuboidCenter);
                          absPosMapRef.current.set(e.id, centerAbsPos);
                        }
                        break;
                    }
                  }
                }
                break;
              case ObjectType.Foundation:
                // getting ready for resizing even though it may not happen
                const foundationCenter = new Vector2(selectedElement.cx, selectedElement.cy);
                absPosMapRef.current.clear();
                wallsAbsPosMapRef.current.clear();
                for (const e of useStore.getState().elements) {
                  if (e.parentId === selectedElement.id) {
                    const v0 = new Vector2(0, 0);
                    const a = selectedElement.rotation[2];
                    switch (e.type) {
                      case ObjectType.Wall:
                        const wall = e as WallModel;
                        const centerPointAbsPos = new Vector2(wall.cx, wall.cy).rotateAround(v0, a);
                        centerPointAbsPos.add(foundationCenter);
                        const leftPointAbsPos = new Vector2(wall.leftPoint[0], wall.leftPoint[1]).rotateAround(v0, a);
                        leftPointAbsPos.add(foundationCenter);
                        const rightPointAbsPos = new Vector2(wall.rightPoint[0], wall.rightPoint[1]).rotateAround(
                          v0,
                          a,
                        );
                        rightPointAbsPos.add(foundationCenter);
                        wallsAbsPosMapRef.current.set(wall.id, {
                          centerPointAbsPos,
                          leftPointAbsPos,
                          rightPointAbsPos,
                        });
                        break;
                      case ObjectType.SolarPanel:
                      case ObjectType.Sensor:
                        const centerAbsPos = new Vector2(
                          e.cx * selectedElement.lx,
                          e.cy * selectedElement.ly,
                        ).rotateAround(v0, a);
                        centerAbsPos.add(foundationCenter);
                        absPosMapRef.current.set(e.id, centerAbsPos);
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
    }
  };

  const handleGroundPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
      setRayCast(e);
      let intersects;
      switch (grabRef.current.type) {
        case ObjectType.Human:
        case ObjectType.Tree:
          let hit = false;
          if (standObjectsRef.current.length > 0) {
            intersects = ray.intersectObjects(standObjectsRef.current);
            if (intersects.length > 0) {
              const p = intersects[0].point;
              setElementPosition(grabRef.current.id, p.x, p.y, p.z);
              hit = true;
            }
          }
          if (!hit) {
            if (groundPlaneRef.current) {
              intersects = ray.intersectObjects([groundPlaneRef.current]);
              if (intersects.length > 0) {
                const p = intersects[0].point;
                setElementPosition(grabRef.current.id, p.x, p.y, p.z);
              }
            }
          }
          break;
        case ObjectType.Foundation:
          if (intersectionPlaneRef.current) {
            intersects = ray.intersectObjects([intersectionPlaneRef.current]);
            if (intersects.length > 0) {
              const pointer = intersects[0].point;
              const p = positionOnGrid(pointer);
              if (moveHandleType) {
                handleMove(p);
              } else if (resizeHandleType) {
                handleResize(p);
              } else if (rotateHandleType) {
                handleRotate(pointer);
              }
            }
          }
          break;
        case ObjectType.Cuboid:
          if (intersectionPlaneRef.current) {
            if (intersectionPlaneType === IntersectionPlaneType.Horizontal) {
              intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects.length > 0) {
                const pointer = intersects[0].point;
                const p = positionOnGrid(pointer);
                if (moveHandleType) {
                  if (moveHandleType === MoveHandleType.Top) {
                    setElementPosition(grabRef.current.id, p.x, p.y);
                  } else {
                    handleMove(p);
                  }
                } else if (resizeHandleType) {
                  handleResize(p);
                } else if (rotateHandleType) {
                  handleRotate(pointer);
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
      if (objectTypeToAdd) {
        setRayCast(e);
        const intersects = ray.intersectObjects([groundPlaneRef.current]);
        const p = intersects[0].point;

        switch (objectTypeToAdd) {
          case ObjectType.Foundation: {
            const foundation = addElement(groundModel, p);
            if (foundation) {
              setCommonStore((state) => {
                state.buildingFoundationId = foundation.id;
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
                state.buildingCuboidId = cuboid.id;
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
        const p = positionOnGrid(intersects[0].point);
        setElementPosition(grabRef.current.id, p.x, p.y);
      }
    }
  };

  const handleGroundPointerOut = () => {
    const buildingFoundationID = useStore.getState().buildingFoundationId;
    const buildingCuboidID = useStore.getState().buildingCuboidId;
    if (buildingFoundationID) {
      removeElementById(buildingFoundationID, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Foundation;
        state.buildingFoundationId = null;
        state.enableOrbitController = true;
      });
      grabRef.current = null;
      isSettingFoundationStartPointRef.current = false;
      isSettingFoundationEndPointRef.current = false;
    }
    if (buildingCuboidID) {
      removeElementById(buildingCuboidID, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Cuboid;
        state.buildingCuboidId = null;
        state.enableOrbitController = true;
      });
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

  // only these elements are allowed to be on the ground
  const legalOnGround = (type: ObjectType) => {
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  const positionOnGrid = (p: Vector3) => {
    return useStore.getState().enableFineGrid ? snapToFineGrid(p) : snapToNormalGrid(p);
  };

  const snapToNormalGrid = (v: Vector3) => {
    const scale = Math.floor(useStore.getState().sceneRadius / 50) + 1;
    return new Vector3(Math.round(v.x / scale) * scale, Math.round(v.y / scale) * scale, v.z);
  };

  const snapToFineGrid = (v: Vector3) => {
    const scale = (Math.floor(useStore.getState().sceneRadius / 50) + 1) * FINE_GRID_SCALE;
    const x = parseFloat((Math.round(v.x / scale) * scale).toFixed(1));
    const y = parseFloat((Math.round(v.y / scale) * scale).toFixed(1));
    return new Vector3(x, y, v.z);
  };

  const handleResize = (p: Vector3) => {
    const point = new Vector2(p.x, p.y);
    const anchor = new Vector2(resizeAnchor.x, resizeAnchor.y);
    const distance = anchor.distanceTo(point);
    const angle = Math.atan2(point.x - resizeAnchor.x, point.y - resizeAnchor.y) + grabRef.current!.rotation[2];
    const lx = Math.abs(distance * Math.sin(angle));
    const ly = Math.abs(distance * Math.cos(angle));
    const center = new Vector2().addVectors(point, anchor).multiplyScalar(0.5);
    setCommonStore((state) => {
      let sizeOk = false;
      for (const e of state.elements) {
        if (e.id === grabRef.current!.id) {
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
                  const childClone = JSON.parse(JSON.stringify(c));
                  childrenClone.push(childClone);
                  if (Util.isIdentical(childClone.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
                    if (c.type === ObjectType.Wall) {
                      const wallAbsPos = wallsAbsPosMapRef.current.get(c.id);
                      if (wallAbsPos) {
                        const a = -e.rotation[2];
                        const v0 = new Vector2(0, 0);
                        const { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos } = wallAbsPos;
                        const centerPointRelativePos = new Vector2()
                          .subVectors(centerPointAbsPos, center)
                          .rotateAround(v0, a);
                        const leftPointRelativePos = new Vector2()
                          .subVectors(leftPointAbsPos, center)
                          .rotateAround(v0, a);
                        const rightPointRelativePos = new Vector2()
                          .subVectors(rightPointAbsPos, center)
                          .rotateAround(v0, a);
                        childClone.cx = centerPointRelativePos.x;
                        childClone.cy = centerPointRelativePos.y;
                        childClone.leftPoint = [leftPointRelativePos.x, leftPointRelativePos.y, e.lz];
                        childClone.rightPoint = [rightPointRelativePos.x, rightPointRelativePos.y, e.lz];
                      }
                    } else {
                      const centerAbsPos = absPosMapRef.current.get(c.id);
                      if (centerAbsPos) {
                        const a = -e.rotation[2];
                        const v0 = new Vector2(0, 0);
                        const relativePos = new Vector2().subVectors(centerAbsPos, center).rotateAround(v0, a);
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
                e.lx = lx;
                e.ly = ly;
                e.cx = center.x;
                e.cy = center.y;
                sizeOk = true;
              }
              break;
          }
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
                  const v0 = new Vector2(0, 0);
                  const { centerPointAbsPos, leftPointAbsPos, rightPointAbsPos } = wallAbsPos;
                  const centerPointRelativePos = new Vector2()
                    .subVectors(centerPointAbsPos, center)
                    .rotateAround(v0, a);
                  const leftPointRelativePos = new Vector2().subVectors(leftPointAbsPos, center).rotateAround(v0, a);
                  const rightPointRelativePos = new Vector2().subVectors(rightPointAbsPos, center).rotateAround(v0, a);
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
                    const a = -grabRef.current!.rotation[2];
                    const v0 = new Vector2(0, 0);
                    const relativePos = new Vector2().subVectors(centerAbsPos, center).rotateAround(v0, a);
                    e.cx = relativePos.x / lx;
                    e.cy = relativePos.y / ly;
                  }
                }
                break;
            }
          }
        }
      }
    });
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
          args={[1000, 1000]}
          onPointerMove={handleIntersectionPointerMove}
        >
          <meshStandardMaterial side={DoubleSide} />
        </Plane>
      )}
      <Plane
        receiveShadow={shadowEnabled}
        ref={groundPlaneRef}
        name={'Ground'}
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
