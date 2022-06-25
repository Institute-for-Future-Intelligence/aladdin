/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { MoveHandleType, ObjectType, ResizeHandleType } from 'src/types';
import { useStoreRef } from 'src/stores/commonRef';
import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';
import { HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from 'src/constants';
import { FoundationModel } from 'src/models/FoundationModel';
import { WallModel } from 'src/models/WallModel';
import Wireframe from './wireframe';
import { UndoableMove } from 'src/undo/UndoableMove';
import { UndoableResizeBuildingXY, UndoableResizeBuildingZ } from 'src/undo/UndoableResizeBuilding';
import { ElementModel } from 'src/models/ElementModel';

interface BuildingResizerProps {
  foundation: FoundationModel;
  args: number[];
  handleSize: number;
}

interface HandleProps {
  args: number[]; // [cx, cy, cz, handleSize];
  handleType: MoveHandleType | ResizeHandleType;
}

enum Operation {
  Move = 'Move',
  ResizeXY = 'Resize XY',
  ResizeZ = 'Resize Z',
  Null = 'Null',
}

const zeroVector2 = new Vector2();

const ResizeHandle = ({ args, handleType }: HandleProps) => {
  const [cx, cy, cz, handleSize] = args;
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  return (
    <Box
      name={handleType}
      args={[handleSize, handleSize, handleSize]}
      position={[cx, cy, cz]}
      onPointerOver={() => setColor(HIGHLIGHT_HANDLE_COLOR)}
      onPointerOut={() => setColor(RESIZE_HANDLE_COLOR)}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
};

const MoveHandle = ({ args, handleType }: HandleProps) => {
  const [cx, cy, cz, handleSize] = args;
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  return (
    <Sphere
      name={handleType}
      args={[handleSize]}
      position={[cx, cy, cz]}
      onPointerOver={() => setColor(HIGHLIGHT_HANDLE_COLOR)}
      onPointerOut={() => setColor(RESIZE_HANDLE_COLOR)}
    >
      <meshStandardMaterial color={color} />
    </Sphere>
  );
};

const BuildingResizer = ({ foundation, args, handleSize }: BuildingResizerProps) => {
  const [lx, ly, lz] = args;
  const [hx, hy] = [lx / 2, ly / 2];

  const intersectionPlaneRef = useRef<Mesh>(null);
  const intersectionPlanePositionRef = useRef(new Vector3());
  const intersectionPlaneRotationRef = useRef(new Euler());
  const resizeAnchorRef = useRef(new Vector2());
  const wallPointsMapRef = useRef<Map<string, Vector2[]>>(new Map<string, Vector2[]>());
  const wallHeightMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const roofHeightMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const moveCenterPosRef = useRef(new Vector2());
  const pointerDownRef = useRef(false); // for performance reason

  // undo
  const oldPositionRef = useRef<number[]>([]);
  const newPositionRef = useRef<number[]>([]);
  const oldDimensionRef = useRef<number[]>([]);
  const newDimensionRef = useRef<number[]>([]);
  const oldChildsMapXYRef = useRef(new Map<string, WallModel>());
  const oldChildsMapZRef = useRef(new Map<string, number>());

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [height, setHeight] = useState(lz);
  const [operation, setOperation] = useState<Operation>(Operation.Null);

  const { get: getThree } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const getCameraDirection = useStore(Selector.getCameraDirection);
  const updateWallMapOnFoundation = useStore(Selector.updateWallMapOnFoundation);
  const setCommonStore = useStore(Selector.set);
  const setElementPosition = useStore(Selector.setElementPosition);
  const addUndoable = useStore(Selector.addUndoable);
  const buildingHeightChangedFlag = useStore(Selector.buildingHeightChangedFlag);

  useEffect(() => {
    setHeight(lz);
  }, [lz, buildingHeightChangedFlag]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / getThree().gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / getThree().gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, getThree().camera);
  };

  const resizeXY = (p: Vector3) => {
    const pointer2D = new Vector2(p.x, p.y);
    const anchor = resizeAnchorRef.current.clone();
    const diagonal = anchor.distanceTo(pointer2D);
    const angle = Math.atan2(pointer2D.x - anchor.x, pointer2D.y - anchor.y) + foundation.rotation[2];
    const lx = Math.abs(diagonal * Math.sin(angle));
    const ly = Math.abs(diagonal * Math.cos(angle));
    const center = new Vector2().addVectors(pointer2D, anchor).multiplyScalar(0.5);

    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (elem.id === foundation.id) {
          elem.lx = lx;
          elem.ly = ly;
          elem.cx = center.x;
          elem.cy = center.y;
          newDimensionRef.current = [lx, ly, elem.lz];
          newPositionRef.current = [center.x, center.y, 0];
        }
        if (elem.parentId === foundation.id && elem.type === ObjectType.Wall) {
          const wall = elem as WallModel;
          const relativePosition = wallPointsMapRef.current.get(wall.id);
          if (relativePosition) {
            const [leftRelPoint, rightRelPoint] = relativePosition;
            const leftPoint = [leftRelPoint.x * lx, leftRelPoint.y * ly, foundation.lz];
            const rightPoint = [rightRelPoint.x * lx, rightRelPoint.y * ly, foundation.lz];
            wall.cx = (leftPoint[0] + rightPoint[0]) / 2;
            wall.cy = (leftPoint[1] + rightPoint[1]) / 2;
            wall.lx = Math.sqrt(Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2));
            wall.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
            wall.leftPoint = [...leftPoint];
            wall.rightPoint = [...rightPoint];
          }
        }
      }
    });
  };

  const resizeZ = (p: Vector3) => {
    if (p.z < 0.1) {
      return;
    }
    const height = Math.max(p.z, foundation.lz + 1);
    setHeight(height);
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (elem.foundationId === foundation.id) {
          if (elem.type === ObjectType.Wall) {
            elem.lz = (height - foundation.lz) * wallHeightMapRef.current.get(elem.id)!;
          } else if (elem.type === ObjectType.Roof) {
            elem.lz = (height - foundation.lz) * roofHeightMapRef.current.get(elem.id)!;
          }
        }
      }
    });
  };

  const initPointerDown = () => {
    setShowIntersectionPlane(true);
    useStoreRef.getState().setEnableOrbitController(false);
    pointerDownRef.current = true;
    intersectionPlanePositionRef.current.set(0, 0, 0);
    intersectionPlaneRotationRef.current.set(0, 0, 0);
  };

  const pointerDownBottomResizeHandle = (x: number, y: number) => {
    resizeAnchorRef.current.set(x, y).rotateAround(zeroVector2, foundation.rotation[2]);
    setOperation(Operation.ResizeXY);
    setCommonStoreHandleType(MoveHandleType.Default);
  };

  const pointerDonwTopResizeHandle = (x: number, y: number, z: number) => {
    const { x: cameraX, y: cameraY } = getCameraDirection();
    intersectionPlanePositionRef.current.set(x, y, z);
    intersectionPlaneRotationRef.current.set(
      -HALF_PI,
      0,
      -Math.atan2(cameraX, cameraY) - foundation.rotation[2],
      'ZXY',
    );

    setOperation(Operation.ResizeZ);
  };

  const isBuildingPart = (fId: string, elem: ElementModel) => {
    return elem.foundationId === foundation.id && (elem.type === ObjectType.Wall || elem.type === ObjectType.Roof);
  };

  const updateUndoableResizeXY = (fId: string, fPos: number[], fDim: number[], childsMap: Map<string, WallModel>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (elem.id === fId) {
          [elem.cx, elem.cy, elem.cz] = fPos;
          [elem.lx, elem.ly, elem.lz] = fDim;
        } else if (elem.foundationId === fId && elem.type === ObjectType.Wall) {
          const wall = childsMap.get(elem.id);
          if (wall) {
            elem.cx = wall.cx;
            elem.cy = wall.cy;
            elem.lx = wall.lx;
            (elem as WallModel).relativeAngle = wall.relativeAngle;
            (elem as WallModel).leftPoint = [...wall.leftPoint];
            (elem as WallModel).rightPoint = [...wall.rightPoint];
          }
        }
      }
    });
  };

  const updateUndoableResizeZ = (fId: string, childsMap: Map<string, number>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (isBuildingPart(fId, elem)) {
          const lz = childsMap.get(elem.id);
          if (lz) {
            elem.lz = lz;
          }
        }
      }
      state.buildingHeightChangedFlag = !state.buildingHeightChangedFlag;
    });
  };

  const addUndoableMove = () => {
    const undoableMove = {
      name: 'Move',
      timestamp: Date.now(),
      movedElementId: foundation.id,
      movedElementType: foundation.type,
      oldCx: oldPositionRef.current[0],
      oldCy: oldPositionRef.current[1],
      oldCz: oldPositionRef.current[2],
      newCx: newPositionRef.current[0],
      newCy: newPositionRef.current[1],
      newCz: newPositionRef.current[2],
      undo: () => {
        setElementPosition(undoableMove.movedElementId, undoableMove.oldCx, undoableMove.oldCy, undoableMove.oldCz);
      },
      redo: () => {
        setElementPosition(undoableMove.movedElementId, undoableMove.newCx, undoableMove.newCy, undoableMove.newCz);
      },
    } as UndoableMove;
    addUndoable(undoableMove);
  };

  const addUndoableResizeXY = () => {
    const newChildsMap = new Map<string, WallModel>();
    for (const elem of useStore.getState().elements) {
      if (elem.foundationId === foundation.id && elem.type === ObjectType.Wall) {
        newChildsMap.set(elem.id, elem as WallModel);
      }
    }
    const undoableReizeXY = {
      name: 'Resize Building XY',
      timestamp: Date.now(),
      foundationId: foundation.id,
      oldFoundationPosition: [...oldPositionRef.current],
      newFoundationPosition: [...newPositionRef.current],
      oldFoundationDimension: [...oldDimensionRef.current],
      newFoundationDimension: [...newDimensionRef.current],
      oldChilds: new Map(oldChildsMapXYRef.current),
      newChilds: new Map(newChildsMap),
      undo: () => {
        updateUndoableResizeXY(
          undoableReizeXY.foundationId,
          undoableReizeXY.oldFoundationPosition,
          undoableReizeXY.oldFoundationDimension,
          undoableReizeXY.oldChilds,
        );
      },
      redo: () => {
        updateUndoableResizeXY(
          undoableReizeXY.foundationId,
          undoableReizeXY.newFoundationPosition,
          undoableReizeXY.newFoundationDimension,
          undoableReizeXY.newChilds,
        );
      },
    } as UndoableResizeBuildingXY;
    addUndoable(undoableReizeXY);
  };

  const addUndoableReseizeZ = () => {
    const newChildsMap = new Map<string, number>();
    for (const elem of useStore.getState().elements) {
      if (isBuildingPart(foundation.id, elem)) {
        newChildsMap.set(elem.id, elem.lz);
      }
    }
    const undoableResizeZ = {
      name: 'Resize Building Z',
      timestamp: Date.now(),
      foundationId: foundation.id,
      oldChilds: new Map(oldChildsMapZRef.current),
      newChilds: new Map(newChildsMap),
      undo: () => {
        updateUndoableResizeZ(undoableResizeZ.foundationId, undoableResizeZ.oldChilds);
      },
      redo: () => {
        updateUndoableResizeZ(undoableResizeZ.foundationId, undoableResizeZ.newChilds);
      },
    } as UndoableResizeBuildingZ;
    addUndoable(undoableResizeZ);
  };

  const setCommonStoreHandleType = (handleType: MoveHandleType | null) => {
    setCommonStore((state) => {
      state.moveHandleType = handleType;
    });
  };

  const handleResizeHandlesPointerDown = (event: ThreeEvent<PointerEvent>) => {
    initPointerDown();
    event.stopPropagation();

    switch (event.object.name) {
      case ResizeHandleType.UpperLeft: {
        pointerDownBottomResizeHandle(hx, -hy);
        break;
      }
      case ResizeHandleType.UpperRight: {
        pointerDownBottomResizeHandle(-hx, -hy);
        break;
      }
      case ResizeHandleType.LowerLeft: {
        pointerDownBottomResizeHandle(hx, hy);
        break;
      }
      case ResizeHandleType.LowerRight: {
        pointerDownBottomResizeHandle(-hx, hy);
        break;
      }
      case ResizeHandleType.UpperLeftTop: {
        pointerDonwTopResizeHandle(-hx, hy, height);
        break;
      }
      case ResizeHandleType.UpperRightTop: {
        pointerDonwTopResizeHandle(hx, hy, height);
        break;
      }
      case ResizeHandleType.LowerLeftTop: {
        pointerDonwTopResizeHandle(-hx, -hy, height);
        break;
      }
      case ResizeHandleType.LowerRightTop: {
        pointerDonwTopResizeHandle(hx, -hy, height);
        break;
      }
    }

    wallPointsMapRef.current.clear();
    wallHeightMapRef.current.clear();
    roofHeightMapRef.current.clear();
    oldChildsMapXYRef.current.clear();
    oldChildsMapZRef.current.clear();
    for (const elem of useStore.getState().elements) {
      if (elem.id === foundation.id) {
        resizeAnchorRef.current.add(new Vector2(elem.cx, elem.cy));
        oldDimensionRef.current = [elem.lx, elem.ly, elem.lz];
        oldPositionRef.current = [elem.cx, elem.cy, 0];
      } else if (elem.type === ObjectType.Wall && elem.foundationId === foundation.id) {
        const w = elem as WallModel;
        const leftPointRelative = new Vector2(w.leftPoint[0] / foundation.lx, w.leftPoint[1] / foundation.ly);
        const rightPointRelative = new Vector2(w.rightPoint[0] / foundation.lx, w.rightPoint[1] / foundation.ly);
        wallPointsMapRef.current.set(w.id, [leftPointRelative, rightPointRelative]);
        wallHeightMapRef.current.set(w.id, w.lz / (height - foundation.lz));
        oldChildsMapXYRef.current.set(w.id, Object.assign(w));
        oldChildsMapZRef.current.set(w.id, w.lz);
      } else if (elem.type === ObjectType.Roof && elem.foundationId === foundation.id) {
        roofHeightMapRef.current.set(elem.id, elem.lz / (height - foundation.lz));
        oldChildsMapZRef.current.set(elem.id, elem.lz);
      }
    }
  };

  const handleMoveHanldesPointerDown = (event: ThreeEvent<PointerEvent>) => {
    initPointerDown();
    event.stopPropagation();
    setCommonStoreHandleType(MoveHandleType.Default);
    setOperation(Operation.Move);
    if (event.intersections.length > 0) {
      const p = event.intersections[0].point;
      const c = new Vector3(foundation.cx, foundation.cy);
      const v = new Vector3().subVectors(c, p);
      moveCenterPosRef.current.set(v.x, v.y);
      oldPositionRef.current = [c.x, c.y, 0];
    }
  };

  const handleIntersectionPlanePointerUp = (event: ThreeEvent<PointerEvent>) => {
    switch (operation) {
      case Operation.Move:
        addUndoableMove();
        break;
      case Operation.ResizeXY:
        addUndoableResizeXY();
        break;
      case Operation.ResizeZ:
        addUndoableReseizeZ();
        break;
    }
    setShowIntersectionPlane(false);
    useStoreRef.getState().setEnableOrbitController(true);
    updateWallMapOnFoundation();
    pointerDownRef.current = false;
    setOperation(Operation.Null);
    setCommonStoreHandleType(null);
  };

  const handleIntersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!intersectionPlaneRef.current || !pointerDownRef.current) {
      return;
    }

    setRayCast(event);
    const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
    if (intersects.length > 0) {
      const p = intersects[0].point;
      if (operation === Operation.ResizeXY || operation === Operation.ResizeZ) {
        if (intersectionPlanePositionRef.current.z > 0) {
          resizeZ(p);
        } else {
          resizeXY(p);
        }
      } else if (operation === Operation.Move) {
        const cx = p.x + moveCenterPosRef.current.x;
        const cy = p.y + moveCenterPosRef.current.y;
        setElementPosition(foundation.id, cx, cy);
        newPositionRef.current = [cx, cy, 0];
      }
    }
  };

  const bottomHanldeZ = (handleSize - foundation.lz) / 2;
  const topHanldeZ = height + bottomHanldeZ - handleSize / 2;
  const moveHanldeX = hx + handleSize;
  const moveHnadleY = hy + handleSize;

  return (
    <group name={'Building Resizer'}>
      <group name={'Resize Handle Group'} onPointerDown={handleResizeHandlesPointerDown}>
        <ResizeHandle args={[hx, hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.UpperRight} />
        <ResizeHandle args={[-hx, hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.UpperLeft} />
        <ResizeHandle args={[hx, -hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.LowerRight} />
        <ResizeHandle args={[-hx, -hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.LowerLeft} />
        <ResizeHandle args={[hx, hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.UpperRightTop} />
        <ResizeHandle args={[-hx, hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.UpperLeftTop} />
        <ResizeHandle args={[hx, -hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.LowerRightTop} />
        <ResizeHandle args={[-hx, -hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.LowerLeftTop} />
      </group>

      <group name={'Move Handle Group'} onPointerDown={handleMoveHanldesPointerDown}>
        <MoveHandle args={[0, moveHnadleY, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Upper} />
        <MoveHandle args={[0, -moveHnadleY, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Lower} />
        <MoveHandle args={[moveHanldeX, 0, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Right} />
        <MoveHandle args={[-moveHanldeX, 0, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Left} />
      </group>

      {showIntersectionPlane && (
        <Plane
          name={'Intersection Plane'}
          ref={intersectionPlaneRef}
          args={[Math.max(lx * 1.2, 1000), Math.max(lx * 1.2, 1000)]}
          visible={false}
          position={intersectionPlanePositionRef.current}
          rotation={intersectionPlaneRotationRef.current}
          onPointerMove={handleIntersectionPlanePointerMove}
          onPointerUp={handleIntersectionPlanePointerUp}
        />
      )}

      <group name={'Wireframe Group'} position={[0, 0, (height - foundation.lz) / 2]}>
        <Wireframe hx={hx} hy={hy} hz={height / 2} lineColor={'white'} />
      </group>
    </group>
  );
};

export default BuildingResizer;
