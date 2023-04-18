/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Box, Circle, Cone, Plane, Sphere, Torus } from '@react-three/drei';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useRefStore } from 'src/stores/commonRef';
import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';
import { HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR, RESIZE_HANDLE_SIZE, TWO_PI } from 'src/constants';
import { WallModel } from 'src/models/WallModel';
import Wireframe from './wireframe';
import { UndoableMoveFoundationGroup } from 'src/undo/UndoableMove';
import { UndoableResizeBuildingXY, UndoableResizeBuildingZ } from 'src/undo/UndoableResizeBuilding';
import { useHandleSize } from 'src/views/wall/hooks';
import { RoofModel } from 'src/models/RoofModel';
import { isGroupable } from 'src/models/Groupable';
import { Util } from 'src/Util';

interface GroupMasterProps {
  baseGroupSet: Set<string>;
  childCuboidSet: Set<string>;
  initalPosition: number[];
  initalDimension: number[];
  initalRotation: number;
}

interface HandleProps {
  args: number[]; // [cx, cy, cz, handleSize];
  handleType: MoveHandleType | ResizeHandleType | RotateHandleType;
}

enum Operation {
  Move = 'Move',
  ResizeXY = 'Resize XY',
  ResizeZ = 'Resize Z',
  RotateUpper = 'Rotate Upper',
  RotateLower = 'Rotate Lower',
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

const RotateHandle = ({ args, handleType }: HandleProps) => {
  const [cx, cy, cz, handleSize] = args;
  const [color, setColor] = useState(RESIZE_HANDLE_COLOR);
  const mesh = useMemo(() => <meshStandardMaterial color={color} />, [color]);
  return (
    <group
      name={handleType}
      position={[cx, cy, cz]}
      rotation={[HALF_PI, 0, 0]}
      onPointerOver={() => setColor(HIGHLIGHT_HANDLE_COLOR)}
      onPointerOut={() => setColor(RESIZE_HANDLE_COLOR)}
      scale={handleSize * 4}
    >
      <group>
        <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
          {mesh}
        </Torus>
        <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
          {mesh}
        </Cone>
        <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
          {mesh}
        </Circle>
      </group>
      <Plane
        name={handleType}
        args={[0.35, 0.35]}
        position={[0, 0.05, 0]}
        rotation={[-HALF_PI, 0, 0]}
        visible={false}
      />
    </group>
  );
};

const GroupMaster = ({
  baseGroupSet,
  childCuboidSet,
  initalPosition,
  initalDimension,
  initalRotation,
}: GroupMasterProps) => {
  const [cx, cy, cz] = initalPosition;
  const [lx, ly, lz] = initalDimension;
  const aspectRatio = lx === 0 ? 1 : ly / lx;
  const lockAspectRatio = baseGroupSet.size > 1;

  const intersectionPlaneRef = useRef<Mesh>(null);
  const intersectionPlanePositionRef = useRef(new Vector3());
  const intersectionPlaneRotationRef = useRef(new Euler());
  const resizeAnchorRef = useRef(new Vector2());
  const elementHeightMapRef = useRef<Map<string, number>>(new Map());
  const wallRelPointsMapRef = useRef<Map<string, Vector2[]>>(new Map<string, Vector2[]>());
  const baseRelPosMapRef = useRef<Map<string, Vector3>>(new Map());
  const baseRotationMapRef = useRef<Map<string, number>>(new Map());
  const basePosRatioMapRef = useRef<Map<string, number[]>>(new Map()); // 2d
  const baseDmsRatioMapRef = useRef<Map<string, number[]>>(new Map()); // 2d
  const resizerCenterRelPosRef = useRef(new Vector3());
  const pointerDownRef = useRef(false); // for performance reason

  // undo
  const foundatonOldDataMapRef = useRef<Map<string, number[]>>(new Map());
  const wallOldPointsMapRef = useRef<Map<string, number[]>>(new Map());
  const elementOldHeightMapRef = useRef<Map<string, number>>(new Map());

  const [position, setPosition] = useState<Vector3>(new Vector3(cx, cy, cz));
  const [rotation, setRotation] = useState<number>(initalRotation);
  const [hx, setHx] = useState(lx / 2);
  const [hy, setHy] = useState(ly / 2);
  const [height, setHeight] = useState(lz);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [operation, setOperation] = useState<Operation>(Operation.Null);

  const { get: getThree } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const orthographic = useStore(Selector.viewState.orthographic);

  const getElementById = useStore(Selector.getElementById);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  useEffect(() => {
    setHeight(lz);
  }, [lz]);

  useEffect(() => {
    setPosition(new Vector3(cx, cy, cz));
    setDimension(lx, ly);
    setRotation(initalRotation);
  }, [initalPosition, initalDimension, initalRotation]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / getThree().gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / getThree().gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, getThree().camera);
  };

  const setDimension = (lx: number, ly: number) => {
    setHx(lx / 2);
    setHy(ly / 2);
  };

  const initPointerDown = (event: ThreeEvent<PointerEvent>) => {
    setShowIntersectionPlane(true);
    useRefStore.getState().setEnableOrbitController(false);
    pointerDownRef.current = true;
    intersectionPlanePositionRef.current.set(0, 0, 0);
    intersectionPlaneRotationRef.current.set(0, 0, 0);
    setCommonStoreHandleType(MoveHandleType.Default);
    event.stopPropagation();
  };

  const updateUndoableResizeXY = (foundationDataMap: Map<string, number[]>, wallPointsMap: Map<string, number[]>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (isGroupable(elem) && foundationDataMap.has(elem.id)) {
          [elem.cx, elem.cy, elem.lx, elem.ly] = foundationDataMap.get(elem.id)!;
        } else if (elem.type === ObjectType.Wall && wallPointsMap.has(elem.id)) {
          const points = wallPointsMap.get(elem.id)!;
          const w = elem as WallModel;
          const leftPoint = points.slice(0, 3);
          const rightPoint = points.slice(3);
          w.cx = (leftPoint[0] + rightPoint[0]) / 2;
          w.cy = (leftPoint[1] + rightPoint[1]) / 2;
          w.lx = Math.sqrt(Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2));
          w.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
          w.leftPoint = [...leftPoint];
          w.rightPoint = [...rightPoint];
        }
      }
      state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
      state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
    });
  };

  const updateUndoableResizeZ = (map: Map<string, number>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (map.has(elem.id)) {
          elem.lz = map.get(elem.id)!;
        }
      }
      state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
      state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
    });
  };

  const updateFoundationGroupPosition = (map: Map<string, number[]>) => {
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (map.has(elem.id)) {
          const pos = map.get(elem.id);
          if (pos) {
            elem.cx = pos[0];
            elem.cy = pos[1];
            elem.cz = pos[2];
            elem.rotation[2] = pos[3];
          }
        }
      }
      state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
    });
  };

  const addUndoableMove = () => {
    const map = new Map<string, number[]>();
    for (const elem of useStore.getState().elements) {
      if ((isGroupable(elem) && baseGroupSet.has(elem.id)) || baseGroupSet.has(elem.parentId)) {
        map.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
      }
    }
    const name = operation === Operation.Move ? 'Move' : 'Rotate';
    const undoableMove = {
      name: `${name} Foundation Group`,
      timestamp: Date.now(),
      oldPositionMap: new Map(foundatonOldDataMapRef.current),
      newPositionMap: new Map(map),
      undo: () => {
        updateFoundationGroupPosition(undoableMove.oldPositionMap);
      },
      redo: () => {
        updateFoundationGroupPosition(undoableMove.newPositionMap);
      },
    } as UndoableMoveFoundationGroup;
    addUndoable(undoableMove);
  };

  const addUndoableResizeXY = () => {
    const foundationNewDataMap = new Map<string, number[]>();
    const wallNewPointsMap = new Map<string, number[]>();
    for (const elem of useStore.getState().elements) {
      if (isGroupable(elem) && foundatonOldDataMapRef.current.has(elem.id)) {
        foundationNewDataMap.set(elem.id, [elem.cx, elem.cy, elem.lx, elem.ly]);
      } else if (elem.type === ObjectType.Wall && wallOldPointsMapRef.current.has(elem.id)) {
        const w = elem as WallModel;
        wallNewPointsMap.set(elem.id, [...w.leftPoint, ...w.rightPoint]);
      }
    }
    const undoableReizeXY = {
      name: 'Resize Building XY',
      timestamp: Date.now(),
      oldFoundationDataMap: new Map(foundatonOldDataMapRef.current),
      newFoundationDataMap: new Map(foundationNewDataMap),
      oldWallPointsMap: new Map(wallOldPointsMapRef.current),
      newWallPointsMap: new Map(wallNewPointsMap),
      undo: () => {
        updateUndoableResizeXY(undoableReizeXY.oldFoundationDataMap, undoableReizeXY.oldWallPointsMap);
      },
      redo: () => {
        updateUndoableResizeXY(undoableReizeXY.newFoundationDataMap, undoableReizeXY.newWallPointsMap);
      },
    } as UndoableResizeBuildingXY;
    addUndoable(undoableReizeXY);
  };

  const addUndoableReseizeZ = () => {
    const newMap = new Map<string, number>();
    for (const elem of useStore.getState().elements) {
      if (elementOldHeightMapRef.current.has(elem.id)) {
        newMap.set(elem.id, elem.lz);
      }
    }
    const undoableResizeZ = {
      name: 'Resize Building Z',
      timestamp: Date.now(),
      oldElementHeightMap: new Map(elementOldHeightMapRef.current),
      newElementHeightMap: new Map(newMap),
      undo: () => {
        updateUndoableResizeZ(undoableResizeZ.oldElementHeightMap);
      },
      redo: () => {
        updateUndoableResizeZ(undoableResizeZ.newElementHeightMap);
      },
    } as UndoableResizeBuildingZ;
    addUndoable(undoableResizeZ);
  };

  const setCommonStoreHandleType = (handleType: MoveHandleType | null) => {
    setCommonStore((state) => {
      state.moveHandleType = handleType;
    });
  };

  const resizeXY = (p: Vector3) => {
    const pointer2D = new Vector2(p.x, p.y);
    const anchor = resizeAnchorRef.current.clone();

    if (lockAspectRatio) {
      const diagonalVector = new Vector2().subVectors(pointer2D, anchor);
      const diagonalDistance = Math.max(1, diagonalVector.length());

      const lx = Math.sqrt(Math.pow(diagonalDistance, 2) / (Math.pow(aspectRatio, 2) + 1));
      const ly = lx * aspectRatio;

      const center = new Vector2(lx * Math.sign(diagonalVector.x), ly * Math.sign(diagonalVector.y))
        .normalize()
        .multiplyScalar(diagonalDistance / 2)
        .add(anchor);

      setPosition(new Vector3(center.x, center.y));
      setDimension(lx, ly);
      setCommonStore((state) => {
        for (const elem of state.elements) {
          if (isGroupable(elem) && baseGroupSet.has(elem.id)) {
            const posRatio = basePosRatioMapRef.current.get(elem.id);
            const dmsRatio = baseDmsRatioMapRef.current.get(elem.id);
            if (posRatio && dmsRatio) {
              const newLx = dmsRatio[0] * lx;
              const newLy = dmsRatio[1] * ly;

              elem.lx = newLx;
              elem.ly = newLy;

              if (elem.parentId !== 'Ground') {
                const { pos, rot } = Util.getWorldDataOfStackedCuboidById(elem.parentId);
                const relativeCenter = new Vector3(posRatio[0] * lx + center.x, posRatio[1] * ly + center.y)
                  .sub(pos)
                  .applyEuler(new Euler(0, 0, -rot));
                elem.cx = relativeCenter.x;
                elem.cy = relativeCenter.y;
              } else {
                elem.cx = posRatio[0] * lx + center.x;
                elem.cy = posRatio[1] * ly + center.y;
              }

              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.foundationId === elem.id) {
                  const wall = e as WallModel;
                  const relativePosition = wallRelPointsMapRef.current.get(wall.id);
                  if (relativePosition) {
                    const [leftRelPoint, rightRelPoint] = relativePosition;
                    const leftPoint = [leftRelPoint.x * newLx, leftRelPoint.y * newLy, elem.lz];
                    const rightPoint = [rightRelPoint.x * newLx, rightRelPoint.y * newLy, elem.lz];
                    wall.cx = (leftPoint[0] + rightPoint[0]) / 2;
                    wall.cy = (leftPoint[1] + rightPoint[1]) / 2;
                    wall.lx = Math.sqrt(
                      Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2),
                    );
                    wall.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
                    wall.leftPoint = [...leftPoint];
                    wall.rightPoint = [...rightPoint];
                  }
                }
              }
            }
          }
        }
      });
    } else {
      const diagonal = anchor.distanceTo(pointer2D);
      const angle = Math.atan2(pointer2D.x - anchor.x, pointer2D.y - anchor.y) + rotation;
      const lx = Math.abs(diagonal * Math.sin(angle));
      const ly = Math.abs(diagonal * Math.cos(angle));
      const center = new Vector2().addVectors(pointer2D, anchor).multiplyScalar(0.5);
      setPosition(new Vector3(center.x, center.y));
      setDimension(lx, ly);
      setCommonStore((state) => {
        for (const elem of state.elements) {
          // foundationGroupSet only has one element here
          if (baseGroupSet.has(elem.id)) {
            elem.lx = lx;
            elem.ly = ly;
            elem.cx = center.x;
            elem.cy = center.y;
          } else if (elem.type === ObjectType.Wall && baseGroupSet.has(elem.parentId)) {
            const wall = elem as WallModel;
            const relativePosition = wallRelPointsMapRef.current.get(wall.id);
            if (relativePosition) {
              const [leftRelPoint, rightRelPoint] = relativePosition;
              const leftPoint = [leftRelPoint.x * lx, leftRelPoint.y * ly, 0];
              const rightPoint = [rightRelPoint.x * lx, rightRelPoint.y * ly, 0];
              wall.cx = (leftPoint[0] + rightPoint[0]) / 2;
              wall.cy = (leftPoint[1] + rightPoint[1]) / 2;
              wall.lx = Math.sqrt(
                Math.pow(leftPoint[0] - rightPoint[0], 2) + Math.pow(leftPoint[1] - rightPoint[1], 2),
              );
              wall.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
              wall.leftPoint = [...leftPoint];
              wall.rightPoint = [...rightPoint];
            }
          }
        }
      });
    }

    useStore.getState().updateElementOnRoofFn();
  };

  const resizeZ = (p: Vector3) => {
    if (p.z < 0.1) {
      return;
    }
    const height = p.z;
    setHeight(height);
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (elementHeightMapRef.current.has(elem.id)) {
          if (elem.type === ObjectType.Wall) {
            elem.lz = height * elementHeightMapRef.current.get(elem.id)!;
          } else if (elem.type === ObjectType.Roof) {
            (elem as RoofModel).rise = height * elementHeightMapRef.current.get(elem.id)!;
          } else if (elem.type === ObjectType.Cuboid) {
            const heightRatio = elementHeightMapRef.current.get(elem.id);
            if (heightRatio) {
              const newHeight = heightRatio * height;
              elem.lz = newHeight;
              elem.cz = newHeight / 2;
            }
          }
        }
      }
      state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
    });
  };

  const rotate = (p: Vector3) => {
    const resizerCenter = new Vector3(position.x, position.y);
    const r =
      Math.atan2(resizerCenter.x - p.x, p.y - resizerCenter.y) + (operation === Operation.RotateUpper ? 0 : Math.PI);
    const offset = Math.abs(r) > Math.PI ? -TWO_PI : 0;
    const rotateAngle = r + offset;
    const euler = new Euler(0, 0, rotateAngle);
    const groupSize = baseRotationMapRef.current.size;
    setCommonStore((state) => {
      for (const elem of state.elements) {
        if (isGroupable(elem) && baseGroupSet.has(elem.id) && !childCuboidSet.has(elem.id)) {
          const oldCenter = baseRelPosMapRef.current.get(elem.id);
          const oldRotation = groupSize !== 1 ? baseRotationMapRef.current.get(elem.id) : 0;
          if (oldCenter && oldRotation !== undefined) {
            const newCenter = oldCenter.clone().applyEuler(euler);
            elem.cx = resizerCenter.x + newCenter.x;
            elem.cy = resizerCenter.y + newCenter.y;
            elem.rotation = [0, 0, oldRotation + rotateAngle];
          }
        }
        if (elem.type !== ObjectType.Cuboid && baseGroupSet.has(elem.parentId)) {
          const oldRotation = groupSize !== 1 ? baseRotationMapRef.current.get(elem.parentId) : 0;
          if (oldRotation !== undefined) {
            elem.rotation = [0, 0, oldRotation + rotateAngle];
          }
        }
      }
    });
    setRotation(rotateAngle);
  };

  const pointerDownBottomResizeHandle = (x: number, y: number) => {
    const positionV2 = new Vector2(position.x, position.y);
    resizeAnchorRef.current.set(x, y).rotateAround(zeroVector2, rotation).add(positionV2);
    setOperation(Operation.ResizeXY);

    basePosRatioMapRef.current.clear();
    baseDmsRatioMapRef.current.clear();
    wallRelPointsMapRef.current.clear();
    foundatonOldDataMapRef.current.clear();
    wallOldPointsMapRef.current.clear();

    const [currLx, currLy] = [hx * 2, hy * 2];
    for (const elem of useStore.getState().elements) {
      if (isGroupable(elem) && baseGroupSet.has(elem.id)) {
        const { pos } = Util.getWorldDataById(elem.id);
        basePosRatioMapRef.current.set(elem.id, [(pos.x - position.x) / currLx, (pos.y - position.y) / currLy]);
        baseDmsRatioMapRef.current.set(elem.id, [elem.lx / currLx, elem.ly / currLy]);
        foundatonOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.lx, elem.ly]);
      } else if (elem.type === ObjectType.Wall && elem.foundationId && baseGroupSet.has(elem.foundationId)) {
        const w = elem as WallModel;
        const f = getElementById(elem.foundationId);
        if (f) {
          const leftPointRelative = new Vector2(w.leftPoint[0] / f.lx, w.leftPoint[1] / f.ly);
          const rightPointRelative = new Vector2(w.rightPoint[0] / f.lx, w.rightPoint[1] / f.ly);
          wallRelPointsMapRef.current.set(w.id, [leftPointRelative, rightPointRelative]);
          wallOldPointsMapRef.current.set(w.id, [...w.leftPoint, ...w.rightPoint]);
        }
      }
    }
  };

  const pointerDonwTopResizeHandle = (x: number, y: number, z: number) => {
    const { x: cameraX, y: cameraY } = getCameraDirection();
    intersectionPlanePositionRef.current.set(x, y, z);
    intersectionPlaneRotationRef.current.set(-HALF_PI, 0, -Math.atan2(cameraX, cameraY) - rotation, 'ZXY');
    setOperation(Operation.ResizeZ);

    elementHeightMapRef.current.clear();
    elementOldHeightMapRef.current.clear();
    for (const elem of useStore.getState().elements) {
      if (elem.foundationId && baseGroupSet.has(elem.foundationId)) {
        if (elem.type === ObjectType.Wall) {
          elementHeightMapRef.current.set(elem.id, elem.lz / height);
          elementOldHeightMapRef.current.set(elem.id, elem.lz);
        } else if (elem.type === ObjectType.Roof) {
          elementHeightMapRef.current.set(elem.id, (elem as RoofModel).rise / height);
          elementOldHeightMapRef.current.set(elem.id, (elem as RoofModel).rise);
        }
      } else if (baseGroupSet.has(elem.id)) {
        elementHeightMapRef.current.set(elem.id, elem.lz / height);
        elementOldHeightMapRef.current.set(elem.id, elem.lz);
      }
    }
  };

  const handleResizeHandlesPointerDown = (event: ThreeEvent<PointerEvent>) => {
    initPointerDown(event);
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
  };

  const handleMoveHanldesPointerDown = (event: ThreeEvent<PointerEvent>) => {
    initPointerDown(event);
    setOperation(Operation.Move);
    if (event.intersections.length > 0) {
      const p = event.intersections[0].point.clone().setZ(0);
      resizerCenterRelPosRef.current.subVectors(position, p);
      for (const elem of useStore.getState().elements) {
        if (isGroupable(elem) && baseGroupSet.has(elem.id)) {
          const c = new Vector3(elem.cx, elem.cy);
          const v = new Vector3().subVectors(c, p);
          baseRelPosMapRef.current.set(elem.id, v);
          foundatonOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
        }
      }
    }
  };

  const handleRotateHandlesPointerDown = (event: ThreeEvent<PointerEvent>) => {
    initPointerDown(event);
    if (event.object.name === RotateHandleType.Lower) {
      setOperation(Operation.RotateLower);
    } else if (event.object.name === RotateHandleType.Upper) {
      setOperation(Operation.RotateUpper);
    }
    if (event.intersections.length > 0) {
      const resizerCenter = new Vector3(position.x, position.y);
      for (const elem of useStore.getState().elements) {
        if (isGroupable(elem) && baseGroupSet.has(elem.id)) {
          const elemCenter = new Vector3(elem.cx, elem.cy);
          const v = new Vector3().subVectors(elemCenter, resizerCenter);
          baseRelPosMapRef.current.set(elem.id, v);
          baseRotationMapRef.current.set(elem.id, elem.rotation[2]);
          foundatonOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
        }
        if (baseGroupSet.has(elem.parentId)) {
          foundatonOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
        }
      }
    }
  };

  const handleIntersectionPlanePointerUp = (event: ThreeEvent<PointerEvent>) => {
    switch (operation) {
      case Operation.Move:
      case Operation.RotateLower:
      case Operation.RotateUpper:
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
    useRefStore.getState().setEnableOrbitController(true);
    pointerDownRef.current = false;
    setOperation(Operation.Null);
    setCommonStoreHandleType(null);
    setCommonStore((state) => {
      state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
    });
  };

  const handleIntersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!intersectionPlaneRef.current || !pointerDownRef.current) return;
    setRayCast(event);
    const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
    if (intersects.length > 0) {
      const p = intersects[0].point;
      switch (operation) {
        case Operation.ResizeXY:
          resizeXY(p);
          break;
        case Operation.ResizeZ:
          resizeZ(p);
          break;
        case Operation.RotateLower:
        case Operation.RotateUpper:
          rotate(p);
          break;
        case Operation.Move:
          setPosition(new Vector3().addVectors(p.clone().setZ(0), resizerCenterRelPosRef.current));
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (isGroupable(elem) && baseGroupSet.has(elem.id) && !childCuboidSet.has(elem.id)) {
                const v = baseRelPosMapRef.current.get(elem.id);
                if (v) {
                  elem.cx = p.x + v.x;
                  elem.cy = p.y + v.y;
                }
              }
            }
          });
          break;
      }
    }
  };

  const handleSize = useHandleSize();
  const bottomHanldeZ = handleSize / 2;
  const topHanldeZ = height + bottomHanldeZ - handleSize / 2;
  const moveHanldeX = hx + handleSize;
  const moveHnadleY = hy + handleSize;
  const resizeHandleY = hy + handleSize * 4;

  return (
    <group name={'Group Master'} position={position} rotation={[0, 0, rotation]}>
      <group name={'Resize Handle Group'} onPointerDown={handleResizeHandlesPointerDown}>
        <ResizeHandle args={[hx, hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.UpperRight} />
        <ResizeHandle args={[-hx, hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.UpperLeft} />
        <ResizeHandle args={[hx, -hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.LowerRight} />
        <ResizeHandle args={[-hx, -hy, bottomHanldeZ, handleSize]} handleType={ResizeHandleType.LowerLeft} />
        {!orthographic && (
          <>
            <ResizeHandle args={[hx, hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.UpperRightTop} />
            <ResizeHandle args={[-hx, hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.UpperLeftTop} />
            <ResizeHandle args={[hx, -hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.LowerRightTop} />
            <ResizeHandle args={[-hx, -hy, topHanldeZ, handleSize]} handleType={ResizeHandleType.LowerLeftTop} />
          </>
        )}
      </group>

      <group name={'Move Handle Group'} onPointerDown={handleMoveHanldesPointerDown}>
        <MoveHandle args={[0, moveHnadleY, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Upper} />
        <MoveHandle args={[0, -moveHnadleY, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Lower} />
        <MoveHandle args={[moveHanldeX, 0, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Right} />
        <MoveHandle args={[-moveHanldeX, 0, bottomHanldeZ, handleSize]} handleType={MoveHandleType.Left} />
      </group>

      <group name={'Rotate Handle Group'} onPointerDown={handleRotateHandlesPointerDown}>
        <RotateHandle args={[0, resizeHandleY, bottomHanldeZ, handleSize]} handleType={RotateHandleType.Upper} />
        <RotateHandle args={[0, -resizeHandleY, bottomHanldeZ, handleSize]} handleType={RotateHandleType.Lower} />
      </group>

      {showIntersectionPlane && (
        <Plane
          name={'Intersection Plane'}
          ref={intersectionPlaneRef}
          args={[Math.max(hx * 2.4, 1000), Math.max(hx * 2.4, 1000)]}
          visible={false}
          position={intersectionPlanePositionRef.current}
          rotation={intersectionPlaneRotationRef.current}
          onPointerMove={handleIntersectionPlanePointerMove}
          onPointerUp={handleIntersectionPlanePointerUp}
        />
      )}

      <group name={'Wireframe Group'} position={[0, 0, height / 2]}>
        <Wireframe hx={hx} hy={hy} hz={height / 2} lineColor={'white'} />
      </group>
    </group>
  );
};

export default React.memo(GroupMaster);
