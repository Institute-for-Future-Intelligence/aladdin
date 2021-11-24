/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Plane, Sphere } from '@react-three/drei';
import { Euler, Mesh, Raycaster, RepeatWrapping, TextureLoader, Vector2, Vector3 } from 'three';
import { useStore } from '../stores/common';
import { FoundationModel } from '../models/FoundationModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  ActionType,
  FoundationTexture,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  WallSide,
} from '../types';
import {
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  MOVE_HANDLE_OFFSET,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
} from '../constants';
import { Util } from '../Util';
import { ElementModel } from '../models/ElementModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { PolarGrid } from '../polarGrid';
import { WallModel } from '../models/WallModel';
import RotateHandle from '../components/rotateHandle';
import Wireframe from '../components/wireframe';
import * as Selector from '../stores/selector';
import { UndoableAdd } from '../undo/UndoableAdd';
import { UndoableMove } from '../undo/UndoableMove';
import { UndoableResize } from '../undo/UndoableResize';
import { UndoableChange } from '../undo/UndoableChange';
import { ElementGrid } from './elementGrid';
import Foundation_Texture_00 from '../resources/foundation_00.png';
import Foundation_Texture_01 from '../resources/foundation_01.png';
import Foundation_Texture_02 from '../resources/foundation_02.png';

const Foundation = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 1,
  lz = 0.1,
  rotation = [0, 0, 0],
  color = 'gray',
  lineColor = 'black',
  lineWidth = 0.2,
  locked = false,
  selected = false,
  textureType = FoundationTexture.NoTexture,
}: FoundationModel) => {
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getAllWallsIdOnFoundation = useStore(Selector.getAllWallsIdOnFoundation);
  const setCommonStore = useStore(Selector.set);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const updateWallLeftPointById = useStore(Selector.updateWallLeftPointById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const updateSolarPanelRelativeAzimuthById = useStore(Selector.updateSolarPanelRelativeAzimuthById);
  const removeElementById = useStore(Selector.removeElementById);
  const selectMe = useStore(Selector.selectMe);
  const addElement = useStore(Selector.addElement);
  const getPvModule = useStore(Selector.getPvModule);
  const deletedWallID = useStore(Selector.deletedWallID);
  const updateWallPointOnFoundation = useStore(Selector.updateWallPointOnFoundation);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundImage = useStore(Selector.viewState.groundImage);
  const addUndoable = useStore(Selector.addUndoable);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [hoveredResizeHandleLL, setHoveredResizeHandleLL] = useState(false);
  const [hoveredResizeHandleUL, setHoveredResizeHandleUL] = useState(false);
  const [hoveredResizeHandleLR, setHoveredResizeHandleLR] = useState(false);
  const [hoveredResizeHandleUR, setHoveredResizeHandleUR] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | RotateHandleType | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  const buildingWallIDRef = useRef<string | null>(null);
  const [buildingWallID, setBuildingWallID] = useState<string | null>(null);
  const [isSettingWallStartPoint, setIsSettingWallStartPoint] = useState(false);
  const [isSettingWallEndPoint, setIsSettingWallEndPoint] = useState(false);
  const [wallPoints, setWallPoints] = useState<Map<string, { leftPoint: Vector3 | null; rightPoint: Vector3 | null }>>(
    new Map(),
  );

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const rotateHandleTypeRef = useRef(useStore.getState().rotateHandleType);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);
  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const intersecPlaneRef = useRef<Mesh>();
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const moveHandleLowerRef = useRef<Mesh>();
  const moveHandleUpperRef = useRef<Mesh>();
  const moveHandleLeftRef = useRef<Mesh>();
  const moveHandleRightRef = useRef<Mesh>();
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldAzimuthRef = useRef<number>(0);
  const newAzimuthRef = useRef<number>(0);

  const ray = useMemo(() => new Raycaster(), []);
  const foundationModel = getElementById(id) as FoundationModel;
  const handleLift = MOVE_HANDLE_RADIUS / 2;
  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const rotateHandleSize = 0.6 * ratio;

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, -hy - rotateHandleSize, 0];
  }, [hy]);
  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, hy + rotateHandleSize, 0];
  }, [hy]);

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  const intersectionPlaneRotation = useMemo(() => new Euler(), []);

  if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
    intersectionPlanePosition.set(0, 0, (grabRef.current as SolarPanelModel).poleHeight);
    intersectionPlaneRotation.set(0, 0, 0);
  }

  useEffect(() => {
    useStore.subscribe((state) => (objectTypeToAddRef.current = state.objectTypeToAdd));
    useStore.subscribe((state) => (moveHandleTypeRef.current = state.moveHandleType));
    useStore.subscribe((state) => (resizeHandleTypeRef.current = state.resizeHandleType));
    useStore.subscribe((state) => (resizeAnchorRef.current = state.resizeAnchor));
    useStore.subscribe((state) => (rotateHandleTypeRef.current = state.rotateHandleType));
    useStore.subscribe((state) => (enableFineGridRef.current = state.enableFineGrid));
  }, []);

  useEffect(() => {
    const wallsID = getAllWallsIdOnFoundation(id);
    for (const id of wallsID) {
      const wall = getElementById(id) as WallModel;
      if (wall) {
        const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
        const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
        wallPoints.set(id, { leftPoint, rightPoint });
      }
    }
    setWallPoints(wallPoints);
  }, [updateWallPointOnFoundation]);

  useEffect(() => {
    if (deletedWallID) {
      wallPoints.delete(deletedWallID);
      setIsSettingWallStartPoint(false);
      setIsSettingWallEndPoint(false);
      setBuildingWallID(null);
      setCommonStore((state) => {
        state.buildingWallID = null;
        state.deletedWallID = null;
      });
    }
  }, [deletedWallID]);

  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case FoundationTexture.Texture_1:
        textureImg = Foundation_Texture_01;
        break;
      case FoundationTexture.Texture_2:
        textureImg = Foundation_Texture_02;
        break;
      default:
        textureImg = Foundation_Texture_00;
    }
    return new TextureLoader().load(textureImg, (t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.offset.set(0, 0);
      let repeat = 1;
      switch (textureType) {
        case FoundationTexture.Texture_1:
          repeat = 10;
          break;
        case FoundationTexture.Texture_2:
          repeat = 8;
          break;
      }
      t.repeat.set(repeat, repeat);
      setTexture(t);
    });
  }, [textureType]);
  const [texture, setTexture] = useState(textureLoader);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === e.eventObject;
        if (intersected) {
          setHoveredHandle(handle);
          if (
            // unfortunately, I cannot find a way to tell the type of an enum variable
            handle === MoveHandleType.Upper ||
            handle === MoveHandleType.Lower ||
            handle === MoveHandleType.Left ||
            handle === MoveHandleType.Right
          ) {
            domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Lower || handle === RotateHandleType.Upper) {
            domElement.style.cursor = 'grab';
          } else {
            domElement.style.cursor = 'pointer';
          }
          switch (handle) {
            case ResizeHandleType.LowerLeft:
              setHoveredResizeHandleLL(true);
              break;
            case ResizeHandleType.UpperLeft:
              setHoveredResizeHandleUL(true);
              break;
            case ResizeHandleType.LowerRight:
              setHoveredResizeHandleLR(true);
              break;
            case ResizeHandleType.UpperRight:
              setHoveredResizeHandleUR(true);
              break;
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    setHoveredResizeHandleLL(false);
    setHoveredResizeHandleUL(false);
    setHoveredResizeHandleLR(false);
    setHoveredResizeHandleUR(false);
    domElement.style.cursor = 'default';
  }, []);

  // only these elements are allowed to be on the foundation
  const legalOnFoundation = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Human:
      case ObjectType.Tree:
      case ObjectType.Sensor:
      case ObjectType.SolarPanel:
      case ObjectType.Wall:
        return true;
      default:
        return false;
    }
  };

  const findMagnetPoint = (
    wallPoints: Map<string, { leftPoint: Vector3 | null; rightPoint: Vector3 | null }>,
    pointer: Vector3,
    minDist: number,
  ) => {
    let min = minDist;
    let targetPoint: Vector3 | null = null;
    let targetID: string | null = null;
    let targetSide: WallSide | null = null;
    for (const [id, points] of wallPoints) {
      if (id === buildingWallID || (grabRef.current && id === grabRef.current.id)) continue;
      const { leftPoint, rightPoint } = points;
      const distStart = leftPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
      const distEnd = rightPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
      const flag = distStart <= distEnd;
      const dist = flag ? distStart : distEnd;
      const point = flag ? leftPoint : rightPoint;
      if (dist < min) {
        min = dist;
        targetPoint = point;
        targetID = id;
        targetSide = flag ? WallSide.Left : WallSide.Right;
      }
    }
    return { targetID, targetPoint, targetSide };
  };

  const stickToNormalGrid = (v: Vector3) => {
    return new Vector3(Math.round(v.x), Math.round(v.y), v.z);
  };

  const stickToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.round(v.x / 0.2) * 0.2).toFixed(1));
    const y = parseFloat((Math.round(v.y / 0.2) * 0.2).toFixed(1));
    return new Vector3(x, y, v.z);
  };

  const updatePointer = (p: Vector3, targetPoint?: Vector3 | null) => {
    if (!enableFineGridRef.current) {
      if (targetPoint) {
        p = targetPoint;
      } else {
        p = stickToNormalGrid(p);
      }
    } else {
      p = stickToFineGrid(p);
      targetPoint = null;
    }
    return p;
  };

  const checkWallLoop = (currentWallId: string) => {
    let wall: WallModel | undefined = undefined;

    const wallsOnThisFoundation = new Map<string, WallModel>();
    for (const e of useStore.getState().elements) {
      if (e.id === currentWallId) {
        wall = e as WallModel;
      }
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallsOnThisFoundation.set(e.id, e as WallModel);
      }
    }

    // check is loop closed
    let isClosed = false;
    while (wall && wall.leftJoints.length > 0) {
      wall = wallsOnThisFoundation.get(wall.leftJoints[0]);
      if (wall?.id === currentWallId) {
        isClosed = true;
        break;
      }
    }

    if (isClosed) {
      // get interior angle sum
      let totalAngle = 0;
      let totalNumber = 0;
      while (wall && wall.leftJoints.length > 0) {
        const targetWall = wallsOnThisFoundation.get(wall.leftJoints[0]);
        const deltaAngle = (Math.PI * 3 - (wall.relativeAngle - targetWall!.relativeAngle)) % (Math.PI * 2);
        totalAngle += deltaAngle;
        totalNumber += 1;
        wall = targetWall;
        if (wall!.id === currentWallId) {
          break;
        }
      }

      // check if need flip
      if (totalAngle > (totalNumber - 2) * Math.PI + 0.1) {
        while (wall && wall.leftJoints.length > 0) {
          const angle = (wall.relativeAngle + Math.PI) % (Math.PI * 2);
          const targetWall = wallsOnThisFoundation.get(wall.leftJoints[0]);
          const deltaAngle =
            Math.PI * 2 - ((Math.PI * 3 - (wall.relativeAngle - targetWall!.relativeAngle)) % (Math.PI * 2));

          let wallRightOffset = 0;
          let targetWallLeftOffset = 0;
          if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
            const tan = Math.tan(deltaAngle);
            wallRightOffset = wall.ly / tan;
            targetWallLeftOffset = targetWall!.ly / tan;
          }
          setCommonStore((state) => {
            if (wall && targetWall) {
              for (const e of state.elements) {
                if (e.id === wall.id) {
                  const w = e as WallModel;
                  w.relativeAngle = angle;
                  w.leftPoint = [...wall.rightPoint];
                  w.rightPoint = [...wall.leftPoint];
                  w.leftJoints = [wall.rightJoints[0]];
                  w.rightJoints = [wall.leftJoints[0]];
                  w.rightOffset = wallRightOffset;
                }
                if (e.id === targetWall.id) {
                  (e as WallModel).leftOffset = targetWallLeftOffset;
                }
              }
            }
          });

          wall = wallsOnThisFoundation.get(wall.leftJoints[0]);
          if (wall!.id === currentWallId) {
            break;
          }
        }

        setCommonStore((state) => {
          state.updateWallPointOnFoundation = !state.updateWallPointOnFoundation;
          state.resizeHandleType =
            resizeHandleTypeRef.current === ResizeHandleType.LowerLeft
              ? ResizeHandleType.LowerRight
              : ResizeHandleType.LowerLeft;
        });
      }
    }

    return isClosed;
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) return; // ignore right-click
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    if (!buildingWallID) {
      selectMe(id, e, ActionType.Select);
    }
    const selectedElement = getSelectedElement();
    // no child of this foundation is clicked
    if (selectedElement?.id === id) {
      if (legalOnFoundation(objectTypeToAddRef.current) && foundationModel) {
        setShowGrid(true);
        const position = e.intersections[0].point;
        const addedElement = addElement(foundationModel, position);
        const undoableAdd = {
          name: 'Add',
          timestamp: Date.now(),
          addedElement: addedElement,
          undo: () => {
            removeElementById(undoableAdd.addedElement.id, false);
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(undoableAdd.addedElement);
              state.selectedElement = undoableAdd.addedElement;
            });
          },
        } as UndoableAdd;
        addUndoable(undoableAdd);
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
        });
      }
    }
    // a child of this foundation is clicked
    else {
      if (selectedElement && selectedElement.parentId === id) {
        if (legalOnFoundation(selectedElement.type as ObjectType)) {
          grabRef.current = selectedElement;
          setShowGrid(true);
          oldPositionRef.current.x = selectedElement.cx;
          oldPositionRef.current.y = selectedElement.cy;
          oldPositionRef.current.z = selectedElement.cz;
          oldDimensionRef.current.x = selectedElement.lx;
          oldDimensionRef.current.y = selectedElement.ly;
          oldDimensionRef.current.z = selectedElement.lz;
          if (selectedElement.type === ObjectType.SolarPanel) {
            oldAzimuthRef.current = (selectedElement as SolarPanelModel).relativeAzimuth;
          }
        }
      }
    }

    if (isSettingWallStartPoint && buildingWallID && baseRef.current) {
      const intersects = ray.intersectObjects([baseRef.current]);
      let p = Util.wallRelativePosition(intersects[0].point, foundationModel);
      let targetID: string | null = null;
      let targetPoint: Vector3 | null = null;
      let targetSide: WallSide | null = null;
      if (!enableFineGridRef.current) {
        let target = findMagnetPoint(wallPoints, p, 1.5);
        targetID = target.targetID;
        targetPoint = target.targetPoint;
        targetSide = target.targetSide;
      }
      p = updatePointer(p, targetPoint);
      let resizeHandleType = ResizeHandleType.LowerRight;

      // attach to other wall
      if (targetID) {
        const targetWall = getElementById(targetID) as WallModel;

        // left to right
        if (targetSide === WallSide.Right) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === buildingWallID) {
                const wall = e as WallModel;
                wall.cx = p.x;
                wall.cy = p.y;
                if (targetWall.rightJoints.length === 0) {
                  wall.leftJoints = [targetWall.id];
                }
              }
              if (e.id === targetID && targetWall.rightJoints.length === 0) {
                (e as WallModel).rightJoints = [buildingWallID];
              }
            }
          });
        }
        // left to left
        else if (targetSide === WallSide.Left) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === buildingWallID) {
                const wall = e as WallModel;
                wall.cx = p.x;
                wall.cy = p.y;
                if (targetWall.leftJoints.length === 0) {
                  wall.rightJoints = [targetWall.id];
                }
              }
              if (e.id === targetID && targetWall.leftJoints.length === 0) {
                (e as WallModel).leftJoints = [buildingWallID];
              }
            }
          });
          resizeHandleType = ResizeHandleType.LowerLeft;
        }
      }
      // no attach to wall
      else {
        setElementPosition(buildingWallID, p.x, p.y);
      }

      setIsSettingWallStartPoint(false);
      setIsSettingWallEndPoint(true);
      setWallPoints(wallPoints.set(buildingWallID, { leftPoint: p, rightPoint: null }));
      updateWallLeftPointById(buildingWallID, [p.x, p.y, p.z]);
      setCommonStore((state) => {
        state.resizeHandleType = resizeHandleType;
        state.resizeAnchor = Util.wallAbsolutePosition(p, foundationModel);
      });
      grabRef.current = selectedElement;
    }
  };

  const handlePointerUp = () => {
    if (grabRef.current) {
      if (grabRef.current.parentId !== id) return;
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        if (elem.type === ObjectType.Wall) {
          const wall = elem as WallModel;
          const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1], wall.leftPoint[2]);
          const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1], wall.rightPoint[2]);
          setWallPoints(wallPoints.set(grabRef.current.id, { leftPoint: leftPoint, rightPoint: rightPoint }));
        } else {
          if (resizeHandleTypeRef.current) {
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
          } else if (rotateHandleTypeRef.current) {
            if (grabRef.current && grabRef.current.type === ObjectType.SolarPanel) {
              const solarPanel = grabRef.current as SolarPanelModel;
              if (Math.abs(newAzimuthRef.current - oldAzimuthRef.current) > 0.001) {
                const undoableRotate = {
                  name: 'Rotate',
                  timestamp: Date.now(),
                  oldValue: oldAzimuthRef.current,
                  newValue: newAzimuthRef.current,
                  undo: () => {
                    updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableRotate.oldValue as number);
                  },
                  redo: () => {
                    updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableRotate.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableRotate);
              }
            }
          } else {
            // for moving sensors and solar panels
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
            }
          }
        }
        grabRef.current = null;
      }
    }
    if (!buildingWallID) {
      setShowGrid(false);
    }
    if (isSettingWallEndPoint && buildingWallID && baseRef.current) {
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.None;
        state.buildingWallID = null;
        state.enableOrbitController = true;
      });
      setIsSettingWallEndPoint(false);
      setBuildingWallID(null);
      buildingWallIDRef.current = null;
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const objectTypeToAdd = objectTypeToAddRef.current;
    const resizeHandleType = resizeHandleTypeRef.current;
    const resizeAnchor = resizeAnchorRef.current;

    if (!grabRef.current && !buildingWallID && objectTypeToAdd !== ObjectType.Wall) {
      return;
    }
    if (grabRef.current?.parentId !== id && objectTypeToAdd === ObjectType.None) return;
    const mouse = new Vector2();
    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    if (baseRef.current && foundationModel) {
      const intersects = ray.intersectObjects([baseRef.current]);
      let p = intersects[0].point;
      if (grabRef.current && grabRef.current.type && !grabRef.current.locked && intersects.length > 0) {
        switch (grabRef.current.type) {
          case ObjectType.Sensor:
            p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
            setElementPosition(grabRef.current.id, p.x, p.y);
            break;
          case ObjectType.Wall:
            if (
              resizeHandleType &&
              (resizeHandleType === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.LowerRight)
            ) {
              p = Util.wallRelativePosition(p, foundationModel);
              let targetID: string | null = null;
              let targetPoint: Vector3 | null = null;
              let targetSide: WallSide | null = null;
              if (!enableFineGridRef.current) {
                let target = findMagnetPoint(wallPoints, p, 1.5);
                targetID = target.targetID;
                targetPoint = target.targetPoint;
                targetSide = target.targetSide;
              }
              p = updatePointer(p, targetPoint);

              // update length
              const relativResizeAnchor = Util.wallRelativePosition(resizeAnchor, foundationModel);
              const lx = p.distanceTo(relativResizeAnchor);
              if (lx < 0.01) {
                return;
              }
              const relativeCenter = new Vector3().addVectors(p, relativResizeAnchor).divideScalar(2);
              let angle =
                Math.atan2(p.y - relativResizeAnchor.y, p.x - relativResizeAnchor.x) -
                (resizeHandleType === ResizeHandleType.LowerLeft ? Math.PI : 0);
              angle = angle >= 0 ? angle : (Math.PI * 2 + angle) % (Math.PI * 2);
              const leftPoint = resizeHandleType === ResizeHandleType.LowerLeft ? p : relativResizeAnchor;
              const rightPoint = resizeHandleType === ResizeHandleType.LowerLeft ? relativResizeAnchor : p;
              setCommonStore((state) => {
                for (const e of state.elements) {
                  if (e.id === grabRef.current!.id) {
                    const wall = e as WallModel;
                    wall.cx = relativeCenter.x;
                    wall.cy = relativeCenter.y;
                    wall.lx = lx;
                    wall.relativeAngle = angle;
                    wall.leftPoint = [leftPoint.x, leftPoint.y, leftPoint.z];
                    wall.rightPoint = [rightPoint.x, rightPoint.y, rightPoint.z];
                  }
                }
              });

              const currWall = getElementById(grabRef.current.id) as WallModel;
              if (currWall) {
                // change angle
                if (resizeHandleType === ResizeHandleType.LowerRight && currWall.leftJoints.length > 0) {
                  const targetJoint = currWall.leftJoints[0];
                  const targetWall = getElementById(targetJoint) as WallModel;
                  if (targetWall) {
                    const deltaAngle = (Math.PI * 3 - (angle - targetWall.relativeAngle)) % (Math.PI * 2);
                    let currLeftOffset = 0;
                    let targetRightOffset = 0;
                    if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                      const tan = Math.tan(deltaAngle);
                      currLeftOffset = currWall.ly / tan;
                      targetRightOffset = targetWall.ly / tan;
                    } else {
                      // gap
                    }
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).leftOffset = currLeftOffset;
                        }
                        if (e.id === targetWall.id) {
                          (e as WallModel).rightOffset = targetRightOffset;
                        }
                      }
                    });
                  }
                } else if (resizeHandleType === ResizeHandleType.LowerLeft && currWall.rightJoints.length > 0) {
                  const targetWall = getElementById(currWall.rightJoints[0]) as WallModel;
                  if (targetWall) {
                    const deltaAngle = (Math.PI * 3 + angle - targetWall.relativeAngle) % (Math.PI * 2);
                    let currRightOffset = 0;
                    let targetLeftOffset = 0;
                    if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                      const tan = Math.tan(deltaAngle);
                      currRightOffset = currWall.ly / tan;
                      targetLeftOffset = targetWall.ly / tan;
                    } else {
                      // gap
                    }
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).rightOffset = currRightOffset;
                        }
                        if (e.id === targetWall.id) {
                          (e as WallModel).leftOffset = targetLeftOffset;
                        }
                      }
                    });
                  }
                }

                // attach to other wall
                if (targetID && targetPoint && targetSide) {
                  const targetWall = getElementById(targetID) as WallModel;
                  if (targetWall) {
                    const wallsOnThisFoundation = new Map<string, WallModel>();
                    for (const e of useStore.getState().elements) {
                      if (e.type === ObjectType.Wall && e.parentId === id) {
                        wallsOnThisFoundation.set(e.id, e as WallModel);
                      }
                    }

                    // flip if sides are same
                    // left to left
                    if (
                      resizeHandleType === ResizeHandleType.LowerLeft &&
                      targetWall.leftJoints.length === 0 &&
                      targetSide === WallSide.Left
                    ) {
                      const stableWall = targetWall;
                      const flipWallHead = currWall;
                      let flipWall = currWall;

                      while (flipWall) {
                        const angle = (flipWall.relativeAngle + Math.PI) % (Math.PI * 2);
                        let flipWallLeftOffset = 0;
                        let nextWallRightOffset = 0;
                        let nextWall: WallModel | undefined = undefined;

                        if (flipWall.rightJoints.length > 0) {
                          nextWall = wallsOnThisFoundation.get(flipWall.rightJoints[0]);
                          if (nextWall) {
                            const deltaAngle =
                              (Math.PI * 3 - (flipWall.relativeAngle - nextWall.relativeAngle)) % (Math.PI * 2);
                            if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                              const tan = Math.tan(deltaAngle);
                              flipWallLeftOffset = flipWall.ly / tan;
                              nextWallRightOffset = nextWall.ly / tan;
                            }
                          }
                        }

                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (flipWall && e.id === flipWall.id) {
                              const wall = e as WallModel;
                              wall.relativeAngle = angle;
                              wall.leftPoint = [...flipWall.rightPoint];
                              wall.rightPoint = [...flipWall.leftPoint];
                              wall.leftJoints = flipWall.rightJoints.length > 0 ? [flipWall.rightJoints[0]] : [];
                              wall.rightJoints = flipWall.leftJoints.length > 0 ? [flipWall.leftJoints[0]] : [];
                              wall.leftOffset = flipWallLeftOffset;
                            }
                            if (nextWall && e.id === nextWall.id) {
                              (e as WallModel).rightOffset = nextWallRightOffset;
                            }
                          }
                        });

                        if (nextWall && nextWall.id !== flipWallHead.id) {
                          flipWall = nextWall;
                        } else {
                          break;
                        }
                      }
                      setCommonStore((state) => {
                        const angle = (flipWallHead.relativeAngle + Math.PI) % (Math.PI * 2);
                        const deltaAngle = (Math.PI * 3 + angle - stableWall.relativeAngle) % (Math.PI * 2);
                        let flipWallRightOffset = 0;
                        let stableWallLeftOffset = 0;
                        if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                          const tan = Math.tan(deltaAngle);
                          flipWallRightOffset = flipWall.ly / tan;
                          stableWallLeftOffset = stableWall.ly / tan;
                        }

                        for (const e of state.elements) {
                          if (e.id === flipWallHead.id) {
                            (e as WallModel).rightJoints = [stableWall.id];
                            (e as WallModel).rightOffset = flipWallRightOffset;
                          }
                          if (e.id === stableWall.id) {
                            (e as WallModel).leftJoints = [flipWallHead.id];
                            (e as WallModel).leftOffset = stableWallLeftOffset;
                          }
                        }

                        state.updateWallPointOnFoundation = !state.updateWallPointOnFoundation;
                        state.resizeHandleType = ResizeHandleType.LowerRight;
                      });
                    }
                    // right to right
                    else if (
                      resizeHandleType === ResizeHandleType.LowerRight &&
                      targetWall.rightJoints.length === 0 &&
                      targetSide === WallSide.Right
                    ) {
                      const stableWall = targetWall;
                      const flipWallHead = currWall;
                      let flipWall = currWall;

                      while (flipWall) {
                        const angle = (flipWall.relativeAngle + Math.PI) % (Math.PI * 2);
                        let flipWallLeftOffset = 0;
                        let nextWallRightOffset = 0;
                        let nextWall: WallModel | undefined = undefined;

                        if (flipWall.leftJoints.length > 0) {
                          nextWall = wallsOnThisFoundation.get(flipWall.leftJoints[0]);
                          if (nextWall) {
                            const deltaAngle =
                              (Math.PI * 3 + flipWall.relativeAngle - nextWall.relativeAngle) % (Math.PI * 2);
                            if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                              const tan = Math.tan(deltaAngle);
                              flipWallLeftOffset = flipWall.ly / tan;
                              nextWallRightOffset = nextWall.ly / tan;
                            }
                          }
                        }

                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (flipWall && e.id === flipWall.id) {
                              const wall = e as WallModel;
                              wall.relativeAngle = angle;
                              wall.leftPoint = [...flipWall.rightPoint];
                              wall.rightPoint = [...flipWall.leftPoint];
                              wall.leftJoints = flipWall.rightJoints.length > 0 ? [flipWall.rightJoints[0]] : [];
                              wall.rightJoints = flipWall.leftJoints.length > 0 ? [flipWall.leftJoints[0]] : [];
                              wall.rightOffset = flipWallLeftOffset;
                            }
                            if (nextWall && e.id === nextWall.id) {
                              (e as WallModel).leftOffset = nextWallRightOffset;
                            }
                          }
                        });

                        if (nextWall && nextWall.id !== flipWallHead.id) {
                          flipWall = nextWall;
                        } else {
                          break;
                        }
                      }
                      setCommonStore((state) => {
                        const angle = (flipWallHead.relativeAngle + Math.PI) % (Math.PI * 2);
                        const deltaAngle = (Math.PI * 3 - (angle - stableWall.relativeAngle)) % (Math.PI * 2);
                        let flipWallLeftOffset = 0;
                        let stableWallRightOffset = 0;
                        if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                          const tan = Math.tan(deltaAngle);
                          flipWallLeftOffset = flipWall.ly / tan;
                          stableWallRightOffset = stableWall.ly / tan;
                        }

                        for (const e of state.elements) {
                          if (e.id === flipWallHead.id) {
                            (e as WallModel).leftJoints = [stableWall.id];
                            (e as WallModel).leftOffset = flipWallLeftOffset;
                          }
                          if (e.id === stableWall.id) {
                            (e as WallModel).rightJoints = [flipWallHead.id];
                            (e as WallModel).rightOffset = stableWallRightOffset;
                          }
                        }

                        state.updateWallPointOnFoundation = !state.updateWallPointOnFoundation;
                        state.resizeHandleType = ResizeHandleType.LowerLeft;
                      });
                    }

                    // attach to left side
                    if (
                      resizeHandleType === ResizeHandleType.LowerRight &&
                      targetSide === WallSide.Left &&
                      targetWall.leftJoints.length === 0 &&
                      targetWall.rightJoints[0] !== currWall.id
                    ) {
                      const deltaAngle = (Math.PI * 3 + angle - targetWall.relativeAngle) % (Math.PI * 2);
                      let currRightOffset = 0;
                      let targetLeftOffset = 0;
                      if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                        const tan = Math.tan(deltaAngle);
                        currRightOffset = currWall.ly / tan;
                        targetLeftOffset = targetWall.ly / tan;
                      }
                      setCommonStore((state) => {
                        for (const e of state.elements) {
                          if (e.id === currWall.id) {
                            (e as WallModel).rightOffset = currRightOffset;
                            (e as WallModel).rightJoints = [targetWall.id];
                          }
                          if (e.id === targetWall.id) {
                            (e as WallModel).leftOffset = targetLeftOffset;
                            (e as WallModel).leftJoints = [currWall.id];
                          }
                        }
                      });
                    }
                    // attach to right side
                    else if (
                      resizeHandleType === ResizeHandleType.LowerLeft &&
                      targetSide === WallSide.Right &&
                      targetWall.rightJoints.length === 0 &&
                      targetWall.leftJoints[0] !== currWall.id
                    ) {
                      const deltaAngle = (Math.PI * 3 - (angle - targetWall.relativeAngle)) % (Math.PI * 2);
                      let currLeftOffset = 0;
                      let targetRightOffset = 0;
                      if (deltaAngle < Math.PI / 2 && deltaAngle > 0.1) {
                        const tan = Math.tan(deltaAngle);
                        currLeftOffset = currWall.ly / tan;
                        targetRightOffset = targetWall.ly / tan;
                      }
                      setCommonStore((state) => {
                        for (const e of state.elements) {
                          if (e.id === currWall.id) {
                            (e as WallModel).leftOffset = currLeftOffset;
                            (e as WallModel).leftJoints = [targetWall.id];
                          }
                          if (e.id === targetWall.id) {
                            (e as WallModel).rightOffset = targetRightOffset;
                            (e as WallModel).rightJoints = [currWall.id];
                          }
                        }
                      });
                    }

                    checkWallLoop(currWall.id);
                  }
                }
                // detach
                else {
                  if (resizeHandleType === ResizeHandleType.LowerRight && currWall.rightJoints.length > 0) {
                    const targetWallId = currWall.rightJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).rightOffset = 0;
                          (e as WallModel).rightJoints = [];
                        }
                        if (e.id === targetWallId) {
                          (e as WallModel).leftOffset = 0;
                          (e as WallModel).leftJoints = [];
                        }
                      }
                    });
                  } else if (resizeHandleType === ResizeHandleType.LowerLeft && currWall.leftJoints.length > 0) {
                    const targetWallId = currWall.leftJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === currWall.id) {
                          (e as WallModel).leftOffset = 0;
                          (e as WallModel).leftJoints = [];
                        }
                        if (e.id === targetWallId) {
                          (e as WallModel).rightOffset = 0;
                          (e as WallModel).rightJoints = [];
                        }
                      }
                    });
                  }
                }
              }
            }
            break;
        }
      }
      if (objectTypeToAdd === ObjectType.Wall) {
        const addedWall = addElement(foundationModel, p) as WallModel;
        grabRef.current = addedWall;
        buildingWallIDRef.current = addedWall.id;
        setBuildingWallID(addedWall.id);
        setIsSettingWallStartPoint(true);
        setShowGrid(true);
        setCommonStore((state) => {
          state.buildingWallID = addedWall.id;
          state.objectTypeToAdd = ObjectType.None;
          state.enableOrbitController = false;
        });
      }
      if (buildingWallID && isSettingWallStartPoint) {
        p = Util.wallRelativePosition(intersects[0].point, foundationModel);
        const { targetPoint } = findMagnetPoint(wallPoints, p, 1.5);
        p = updatePointer(p, targetPoint);
        if (isSettingWallStartPoint) {
          setElementPosition(buildingWallID, p.x, p.y);
        }
      }
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === baseRef.current;
      if (intersected) {
        setHovered(true);
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    selectMe(id, e, ActionType.Select);
    setCommonStore((state) => {
      state.pastePoint.copy(e.intersections[0].point);
      state.clickObjectType = ObjectType.Foundation;
      if (e.intersections.length > 0) {
        const intersected = e.intersections[0].object === baseRef.current;
        if (intersected) {
          state.contextMenuObjectType = ObjectType.Foundation;
        }
      }
      state.pasteNormal = Util.UNIT_VECTOR_POS_Z;
    });
  };

  const handleSolarPanelMove = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current) {
      const mouse = new Vector2();
      mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
      mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      let intersects;
      if (intersecPlaneRef.current) {
        const solarPanel = grabRef.current as SolarPanelModel;
        const pvModel = getPvModule(solarPanel.pvModelName);
        intersects = ray.intersectObjects([intersecPlaneRef.current]);
        if (intersects.length > 0) {
          let p = intersects[0].point; //World coordinate
          const moveHandleType = moveHandleTypeRef.current;
          const rotateHandleType = rotateHandleTypeRef.current;
          const resizeHandleType = resizeHandleTypeRef.current;
          const resizeAnchor = resizeAnchorRef.current;
          if (moveHandleType && foundationModel) {
            p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
            setElementPosition(solarPanel.id, p.x, p.y); //Relative coordinate
          } else if (rotateHandleType) {
            const parent = getElementById(solarPanel.parentId);
            if (parent) {
              const pr = parent.rotation[2]; //parent rotation
              const pc = new Vector2(parent.cx, parent.cy); //world parent center
              const cc = new Vector2(parent.lx * solarPanel.cx, parent.ly * solarPanel.cy) //local current center
                .rotateAround(new Vector2(0, 0), pr); //add parent rotation
              const wc = new Vector2().addVectors(cc, pc); //world current center
              const rotation =
                -pr + Math.atan2(-p.x + wc.x, p.y - wc.y) + (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
              const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * Math.PI * 2 : 0; // make sure angle is between -PI to PI
              updateSolarPanelRelativeAzimuthById(grabRef.current.id, rotation + offset);
              newAzimuthRef.current = rotation + offset;
              setCommonStore((state) => {
                state.selectedElementAngle = rotation + offset;
              });
            }
          } else if (resizeHandleType) {
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
                {
                  const wp = new Vector2(p.x, p.y);
                  const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                  const d = wp.distanceTo(resizeAnchor2D);
                  const angle = solarPanel.relativeAzimuth + rotation[2]; // world panel azimuth
                  const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
                  const theta = -angle + rp.angle() + Math.PI / 2;
                  let dyl = d * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.length / 2) / pvModel.length));
                    dyl = nx * pvModel.length;
                  } else {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.width / 2) / pvModel.width));
                    dyl = nx * pvModel.width;
                  }
                  updateElementLyById(solarPanel.id, dyl);

                  const wcx = resizeAnchor.x + (dyl * Math.sin(angle)) / 2;
                  const wcy = resizeAnchor.y - (dyl * Math.cos(angle)) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const wbc = new Vector2(cx, cy); // world foundation center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                  setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                }
                break;
              case ResizeHandleType.Upper:
                {
                  const wp = new Vector2(p.x, p.y);
                  const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                  const d = wp.distanceTo(resizeAnchor2D);
                  const angle = solarPanel.relativeAzimuth + rotation[2];
                  const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                  const theta = -angle + rp.angle() - Math.PI / 2;
                  let dyl = d * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.length / 2) / pvModel.length));
                    dyl = nx * pvModel.length;
                  } else {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.width / 2) / pvModel.width));
                    dyl = nx * pvModel.width;
                  }
                  updateElementLyById(solarPanel.id, dyl);

                  const wcx = resizeAnchor.x - (dyl * Math.sin(angle)) / 2;
                  const wcy = resizeAnchor.y + (dyl * Math.cos(angle)) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const wbc = new Vector2(cx, cy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                  setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                }
                break;
              case ResizeHandleType.Left:
                {
                  const wp = new Vector2(p.x, p.y);
                  const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                  const d = wp.distanceTo(resizeAnchor2D);
                  const angle = solarPanel.relativeAzimuth + rotation[2];
                  const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                  const theta = rp.angle() - angle + Math.PI;
                  let dxl = d * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.width / 2) / pvModel.width));
                    dxl = nx * pvModel.width;
                  } else {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.length / 2) / pvModel.length));
                    dxl = nx * pvModel.length;
                  }
                  updateElementLxById(solarPanel.id, dxl);

                  const wcx = resizeAnchor.x - (dxl * Math.cos(angle)) / 2;
                  const wcy = resizeAnchor.y - (dxl * Math.sin(angle)) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const wbc = new Vector2(cx, cy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                  setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                }
                break;
              case ResizeHandleType.Right:
                {
                  const wp = new Vector2(p.x, p.y);
                  const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
                  const d = wp.distanceTo(resizeAnchor2D);
                  const angle = solarPanel.relativeAzimuth + rotation[2];
                  const rp = new Vector2().subVectors(wp, resizeAnchor2D);
                  const theta = -angle + rp.angle();
                  let dxl = d * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.width / 2) / pvModel.width));
                    dxl = nx * pvModel.width;
                  } else {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.length / 2) / pvModel.length));
                    dxl = nx * pvModel.length;
                  }
                  updateElementLxById(solarPanel.id, dxl);

                  const wcx = resizeAnchor.x + (dxl * Math.cos(angle)) / 2;
                  const wcy = resizeAnchor.y + (dxl * Math.sin(angle)) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const wbc = new Vector2(cx, cy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(new Vector2(0, 0), -rotation[2]);
                  setElementPosition(solarPanel.id, rc.x / lx, rc.y / ly);
                }
                break;
            }
          }
        }
      }
    }
  };

  const handleSolarPanelPointerUp = () => {
    //grabRef.current = null;
    setShowGrid(false);
    setCommonStore((state) => {
      state.enableOrbitController = true;
    });
  };

  const opacity = groundImage ? 0.5 : 1;

  return (
    <group name={'Foundation Group ' + id} position={[cx, cy, hz]} rotation={[0, 0, rotation[2]]}>
      {/* draw rectangle */}
      <Box
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
        uuid={id}
        userData={{ simulation: true, aabb: true, stand: true }}
        ref={baseRef}
        name={'Foundation'}
        args={[lx, ly, lz]}
        onContextMenu={handleContextMenu}
        onPointerOver={handlePointerOver}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOut={(e) => setHovered(false)}
      >
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        {textureType === FoundationTexture.NoTexture ? (
          <meshStandardMaterial
            attachArray="material"
            color={color}
            map={texture}
            transparent={groundImage}
            opacity={opacity}
          />
        ) : (
          <meshStandardMaterial
            attachArray="material"
            color={'white'}
            map={texture}
            transparent={groundImage}
            opacity={opacity}
          />
        )}
        <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
      </Box>

      {/* intersection plane */}
      {grabRef.current?.type === ObjectType.SolarPanel && !grabRef.current.locked && (
        <Plane
          ref={intersecPlaneRef}
          position={intersectionPlanePosition}
          rotation={intersectionPlaneRotation}
          args={[lx, ly]}
          visible={false}
          onPointerMove={handleSolarPanelMove}
          onPointerUp={handleSolarPanelPointerUp}
        />
      )}

      {showGrid && (
        <>
          {rotateHandleTypeRef.current && grabRef.current?.type === ObjectType.SolarPanel && (
            <PolarGrid element={grabRef.current} height={(grabRef.current as SolarPanelModel).poleHeight + hz} />
          )}
          {(moveHandleTypeRef.current || resizeHandleTypeRef.current || buildingWallID) && (
            <ElementGrid args={[lx, ly, lz]} objectType={ObjectType.Foundation} />
          )}
        </>
      )}

      {/* wireFrame */}
      {!selected && <Wireframe args={[lx, ly, lz]} />}

      {/* draw handles */}
      {selected && !locked && (
        <>
          {/* resize handles */}
          <Box
            ref={resizeHandleLLRef}
            position={[positionLL.x, positionLL.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.LowerLeft}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLLRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(lx, ly, 0));
                  state.resizeAnchor.copy(anchor);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerLeft);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerLeft ||
                resizeHandleTypeRef.current === ResizeHandleType.LowerLeft
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleULRef}
            position={[positionUL.x, positionUL.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.UpperLeft}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleULRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(lx, -ly, 0));
                  state.resizeAnchor.copy(anchor);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperLeft);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperLeft ||
                resizeHandleTypeRef.current === ResizeHandleType.UpperLeft
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleLRRef}
            position={[positionLR.x, positionLR.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.LowerRight}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleLRRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-lx, ly, 0));
                  state.resizeAnchor.copy(anchor);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.LowerRight);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.LowerRight ||
                resizeHandleTypeRef.current === ResizeHandleType.LowerRight
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>
          <Box
            ref={resizeHandleURRef}
            position={[positionUR.x, positionUR.y, 0]}
            args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
            name={ResizeHandleType.UpperRight}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Resize);
              if (resizeHandleURRef.current) {
                setCommonStore((state) => {
                  const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-lx, -ly, 0));
                  state.resizeAnchor.copy(anchor);
                });
              }
            }}
            onPointerOver={(e) => {
              hoverHandle(e, ResizeHandleType.UpperRight);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === ResizeHandleType.UpperRight ||
                resizeHandleTypeRef.current === ResizeHandleType.UpperRight
                  ? HIGHLIGHT_HANDLE_COLOR
                  : RESIZE_HANDLE_COLOR
              }
            />
          </Box>

          {/* move handles */}
          <Sphere
            ref={moveHandleLowerRef}
            args={[moveHandleSize, 6, 6]}
            position={[0, -hy - MOVE_HANDLE_OFFSET, handleLift]}
            name={MoveHandleType.Lower}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Lower);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Lower || moveHandleTypeRef.current === MoveHandleType.Lower
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_2
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleUpperRef}
            args={[moveHandleSize, 6, 6]}
            position={[0, hy + MOVE_HANDLE_OFFSET, handleLift]}
            name={MoveHandleType.Upper}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Upper);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Upper || moveHandleTypeRef.current === MoveHandleType.Upper
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_2
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleLeftRef}
            args={[moveHandleSize, 6, 6]}
            position={[-hx - MOVE_HANDLE_OFFSET, handleLift, 0]}
            name={MoveHandleType.Left}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Left);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Left || moveHandleTypeRef.current === MoveHandleType.Left
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_1
              }
            />
          </Sphere>
          <Sphere
            ref={moveHandleRightRef}
            args={[moveHandleSize, 6, 6]}
            position={[hx + MOVE_HANDLE_OFFSET, 0, handleLift]}
            name={MoveHandleType.Right}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Move);
            }}
            onPointerOver={(e) => {
              hoverHandle(e, MoveHandleType.Right);
            }}
            onPointerOut={(e) => {
              noHoverHandle();
            }}
          >
            <meshStandardMaterial
              attach="material"
              color={
                hoveredHandle === MoveHandleType.Right || moveHandleTypeRef.current === MoveHandleType.Right
                  ? HIGHLIGHT_HANDLE_COLOR
                  : MOVE_HANDLE_COLOR_1
              }
            />
          </Sphere>

          {/* rotation handle */}
          <RotateHandle
            id={id}
            position={lowerRotateHandlePosition}
            color={
              hoveredHandle === RotateHandleType.Lower || rotateHandleTypeRef.current === RotateHandleType.Lower
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Lower}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
          <RotateHandle
            id={id}
            position={upperRotateHandlePosition}
            color={
              hoveredHandle === RotateHandleType.Upper || rotateHandleTypeRef.current === RotateHandleType.Upper
                ? HIGHLIGHT_HANDLE_COLOR
                : RESIZE_HANDLE_COLOR
            }
            ratio={rotateHandleSize}
            handleType={RotateHandleType.Upper}
            hoverHandle={hoverHandle}
            noHoverHandle={noHoverHandle}
          />
        </>
      )}

      {/* text */}
      <>
        {hovered && !selected && (
          <textSprite
            name={'Label'}
            text={'Foundation'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[0, 0, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleLL && (
          <textSprite
            name={'Label'}
            text={'LL'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[-hx, -hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleUL && (
          <textSprite
            name={'Label'}
            text={'UL'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[-hx, hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleLR && (
          <textSprite
            name={'Label'}
            text={'LR'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[hx, -hy, hz + 0.2]}
          />
        )}
        {!locked && hoveredResizeHandleUR && (
          <textSprite
            name={'Label'}
            text={'UR'}
            fontSize={20}
            fontFace={'Times Roman'}
            textHeight={0.2}
            position={[hx, hy, hz + 0.2]}
          />
        )}
      </>
    </group>
  );
};

export default React.memo(Foundation);
