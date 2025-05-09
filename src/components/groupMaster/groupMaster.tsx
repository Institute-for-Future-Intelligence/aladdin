/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Box, Circle, Cone, Plane, Sphere, Torus } from '@react-three/drei';
import { MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';
import { useRefStore } from 'src/stores/commonRef';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { GROUND_ID, HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR, TWO_PI } from 'src/constants';
import { WallFill, WallModel } from 'src/models/WallModel';
import Wireframe from '../wireframe';
import { UndoableMoveFoundationGroup } from 'src/undo/UndoableMove';
import { UndoableResizeBuildingXY, UndoableResizeBuildingZ } from 'src/undo/UndoableResizeBuilding';
import { useHandleSize } from 'src/views/wall/hooks';
import { RoofModel } from 'src/models/RoofModel';
import { isGroupable } from 'src/models/Groupable';
import { Util } from 'src/Util';
import { WindowModel } from 'src/models/WindowModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { FoundationModel } from 'src/models/FoundationModel';

interface GroupMasterProps {
  groupedElementsIdSet: Set<string>;
  childCuboidSet: Set<string>;
  initialPosition: number[];
  initialDimension: number[];
  initialRotation: number;
}

interface HandleProps {
  args: number[]; // [cx, cy, cz, handleSize];
  handleType: MoveHandleType | ResizeHandleType | RotateHandleType;
}

enum Operation {
  Move = 'Move',
  ResizeX = 'Resize X',
  ResizeY = 'Resize Y',
  ResizeXY = 'Resize XY',
  ResizeZ = 'Resize Z',
  RotateUpper = 'Rotate Upper',
  RotateLower = 'Rotate Lower',
  Null = 'Null',
}

export type PartialWallHeight = {
  upperLeft: number;
  upperRight: number;
  lowerLeft: number;
  lowerRight: number;
};

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

const GroupMaster = React.memo(
  ({ groupedElementsIdSet, childCuboidSet, initialPosition, initialDimension, initialRotation }: GroupMasterProps) => {
    const [cx, cy, cz] = initialPosition;
    const [lx, ly, lz] = initialDimension;
    const aspectRatio = lx === 0 ? 1 : ly / lx;
    const lockAspectRatio = groupedElementsIdSet.size > 1 || childCuboidSet.size > 0;

    const intersectionPlaneRef = useRef<Mesh>(null);
    const intersectionPlanePositionRef = useRef(new Vector3());
    const intersectionPlaneRotationRef = useRef(new Euler());
    const resizeAnchorRef = useRef(new Vector2());
    const elementHeightMapRef = useRef<Map<string, number>>(new Map());
    const wallRelPointsMapRef = useRef<Map<string, Vector2[]>>(new Map<string, Vector2[]>());
    const partialWallHeightMapRef = useRef<Map<string, PartialWallHeight>>(new Map());
    const childRelPosMapRef = useRef<Map<string, number[]>>(new Map());
    const baseRelPosMapRef = useRef<Map<string, Vector3>>(new Map());
    const baseRotationMapRef = useRef<Map<string, number>>(new Map());
    const basePosRatioMapRef = useRef<Map<string, number[]>>(new Map()); // 2d
    const baseDmsRatioMapRef = useRef<Map<string, number[]>>(new Map()); // 2d
    const resizerCenterRelPosRef = useRef(new Vector3());
    const pointerDownRef = useRef(false); // for performance reason

    // undo
    const foundationOldDataMapRef = useRef<Map<string, number[]>>(new Map());
    const wallOldPointsMapRef = useRef<Map<string, number[]>>(new Map());
    const elementOldHeightMapRef = useRef<Map<string, number>>(new Map());
    const oldPartialWallHeightMapRef = useRef<Map<string, PartialWallHeight>>(new Map());
    const oldChildPosMapRef = useRef<Map<string, number[]>>(new Map());

    const [position, setPosition] = useState<Vector3>(new Vector3(cx, cy, cz));
    const [rotation, setRotation] = useState<number>(initialRotation);
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
      setRotation(initialRotation);
    }, [initialPosition, initialDimension, initialRotation]);

    const setRayCast = (e: ThreeEvent<PointerEvent>) => {
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

    const updateUndoableResizeXY = (
      foundationDataMap: Map<string, number[]>,
      wallPointsMap: Map<string, number[]>,
      skylightPosMap: Map<string, number[]>,
    ) => {
      setCommonStore((state) => {
        for (const elem of state.elements) {
          if (isGroupable(elem) && foundationDataMap.has(elem.id)) {
            [elem.cx, elem.cy, elem.lx, elem.ly] = foundationDataMap.get(elem.id)!;
          } else if (elem.foundationId && foundationDataMap.has(elem.foundationId)) {
            switch (elem.type) {
              case ObjectType.Wall: {
                const points = wallPointsMap.get(elem.id);
                if (!points) continue;
                const w = elem as WallModel;
                const leftPoint = points.slice(0, 3);
                const rightPoint = points.slice(3);
                w.cx = (leftPoint[0] + rightPoint[0]) / 2;
                w.cy = (leftPoint[1] + rightPoint[1]) / 2;
                w.lx = Math.hypot(leftPoint[0] - rightPoint[0] + (leftPoint[1] - rightPoint[1]));
                w.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
                w.leftPoint = [...leftPoint];
                w.rightPoint = [...rightPoint];
                break;
              }
              case ObjectType.Window: {
                const window = elem as WindowModel;
                if (window.parentType !== ObjectType.Roof) continue;
                const position = skylightPosMap.get(elem.id);
                if (!position) continue;
                [window.cx, window.cy] = position;
                break;
              }
              case ObjectType.BatteryStorage:
              case ObjectType.SolarPanel: {
                const position = skylightPosMap.get(elem.id);
                if (!position) continue;
                [elem.cx, elem.cy, elem.cz] = position;
                break;
              }
            }
          }
        }
        state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
        state.updateElementOnRoofFlag = true;
      });
    };

    const updateUndoableResizeZ = (
      heightMap: Map<string, number>,
      partialWallHeightMap: Map<string, PartialWallHeight>,
    ) => {
      setCommonStore((state) => {
        for (const elem of state.elements) {
          if (heightMap.has(elem.id)) {
            const height = heightMap.get(elem.id);
            if (height !== undefined) {
              if (elem.type === ObjectType.Roof) {
                (elem as RoofModel).rise = height;
              } else if (elem.type === ObjectType.SolarPanel) {
                elem.cz = height;
              } else {
                elem.lz = height;
              }
            }
          }
          if (elem.type === ObjectType.Wall && partialWallHeightMap.has(elem.id)) {
            const w = elem as WallModel;
            const partialWallHeight = partialWallHeightMap.get(w.id);
            if (partialWallHeight) {
              w.leftTopPartialHeight = partialWallHeight.upperLeft;
              w.rightTopPartialHeight = partialWallHeight.upperRight;
              w.leftUnfilledHeight = partialWallHeight.lowerLeft;
              w.rightUnfilledHeight = partialWallHeight.lowerRight;
            }
          }
        }
        state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
        state.updateElementOnRoofFlag = true;
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
        if ((isGroupable(elem) && groupedElementsIdSet.has(elem.id)) || groupedElementsIdSet.has(elem.parentId)) {
          map.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
        }
      }
      const name = operation === Operation.Move ? 'Move' : 'Rotate';
      const undoableMove = {
        name: `${name} Foundation Group`,
        timestamp: Date.now(),
        oldPositionMap: new Map(foundationOldDataMapRef.current),
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
      const newChildPosMap = new Map<string, number[]>();
      for (const elem of useStore.getState().elements) {
        if (isGroupable(elem) && foundationOldDataMapRef.current.has(elem.id)) {
          foundationNewDataMap.set(elem.id, [elem.cx, elem.cy, elem.lx, elem.ly]);
        } else if (wallOldPointsMapRef.current.has(elem.id)) {
          const w = elem as WallModel;
          wallNewPointsMap.set(elem.id, [...w.leftPoint, ...w.rightPoint]);
        } else if (oldChildPosMapRef.current.has(elem.id)) {
          if (elem.type === ObjectType.Window) {
            const window = elem as WindowModel;
            if (window.parentType !== ObjectType.Roof) continue;
            newChildPosMap.set(window.id, [window.cx, window.cy]);
          } else if (elem.type === ObjectType.SolarPanel || elem.type === ObjectType.BatteryStorage) {
            newChildPosMap.set(elem.id, [elem.cx, elem.cy, elem.cz]);
          }
        }
      }
      const undoableResizeXY = {
        name: 'Resize Building XY',
        timestamp: Date.now(),
        oldFoundationDataMap: new Map(foundationOldDataMapRef.current),
        newFoundationDataMap: new Map(foundationNewDataMap),
        oldWallPointsMap: new Map(wallOldPointsMapRef.current),
        newWallPointsMap: new Map(wallNewPointsMap),
        oldSkylightPosMap: new Map(oldChildPosMapRef.current),
        newSkylightPosMap: new Map(newChildPosMap),
        undo: () => {
          updateUndoableResizeXY(
            undoableResizeXY.oldFoundationDataMap,
            undoableResizeXY.oldWallPointsMap,
            undoableResizeXY.oldSkylightPosMap,
          );
        },
        redo: () => {
          updateUndoableResizeXY(
            undoableResizeXY.newFoundationDataMap,
            undoableResizeXY.newWallPointsMap,
            undoableResizeXY.newSkylightPosMap,
          );
        },
      } as UndoableResizeBuildingXY;
      addUndoable(undoableResizeXY);
    };

    const addUndoableResizeZ = () => {
      const newHeightMap = new Map<string, number>();
      const newPartialWallHeightMap = new Map<string, PartialWallHeight>();

      for (const elem of useStore.getState().elements) {
        if (elementOldHeightMapRef.current.has(elem.id)) {
          if (elem.type === ObjectType.Roof) {
            newHeightMap.set(elem.id, (elem as RoofModel).rise);
          } else if (elem.type === ObjectType.SolarPanel) {
            newHeightMap.set(elem.id, elem.cz);
          } else {
            newHeightMap.set(elem.id, elem.lz);
          }
        }
        if (elem.type === ObjectType.Wall && oldPartialWallHeightMapRef.current.has(elem.id)) {
          const w = elem as WallModel;
          newPartialWallHeightMap.set(w.id, {
            lowerLeft: w.leftUnfilledHeight,
            lowerRight: w.rightUnfilledHeight,
            upperLeft: w.leftTopPartialHeight,
            upperRight: w.rightTopPartialHeight,
          });
        }
      }
      const undoableResizeZ = {
        name: 'Resize Building Z',
        timestamp: Date.now(),
        oldElementHeightMap: new Map(elementOldHeightMapRef.current),
        newElementHeightMap: new Map(newHeightMap),
        oldPartialWallHeightMap: new Map(oldPartialWallHeightMapRef.current),
        newPartialWallHeightMap: new Map(newPartialWallHeightMap),
        undo: () => {
          updateUndoableResizeZ(undoableResizeZ.oldElementHeightMap, undoableResizeZ.oldPartialWallHeightMap);
        },
        redo: () => {
          updateUndoableResizeZ(undoableResizeZ.newElementHeightMap, undoableResizeZ.newPartialWallHeightMap);
        },
      } as UndoableResizeBuildingZ;
      addUndoable(undoableResizeZ);
    };

    const setCommonStoreHandleType = (handleType: MoveHandleType | null) => {
      setCommonStore((state) => {
        state.moveHandleType = handleType;
      });
    };

    const updateResizeBottom = (cx: number, cy: number, lx: number, ly: number) => {
      setPosition(new Vector3(cx, cy));
      setDimension(lx, ly);
      setCommonStore((state) => {
        for (const elem of state.elements) {
          // foundationGroupSet only has one element here
          if (groupedElementsIdSet.has(elem.id)) {
            elem.lx = lx;
            elem.ly = ly;
            elem.cx = cx;
            elem.cy = cy;
          }
          // child elements
          else if (elem.foundationId && groupedElementsIdSet.has(elem.foundationId)) {
            switch (elem.type) {
              case ObjectType.Wall: {
                const wall = elem as WallModel;
                const relativePosition = wallRelPointsMapRef.current.get(wall.id);
                if (!relativePosition) continue;
                const [leftRelPoint, rightRelPoint] = relativePosition;
                const leftPoint = [leftRelPoint.x * lx, leftRelPoint.y * ly, 0];
                const rightPoint = [rightRelPoint.x * lx, rightRelPoint.y * ly, 0];
                wall.cx = (leftPoint[0] + rightPoint[0]) / 2;
                wall.cy = (leftPoint[1] + rightPoint[1]) / 2;
                wall.lx = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
                wall.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
                wall.leftPoint = [...leftPoint];
                wall.rightPoint = [...rightPoint];
                break;
              }
              case ObjectType.SolarPanel: {
                const solarPanel = elem as SolarPanelModel;
                const relativePosition = childRelPosMapRef.current.get(solarPanel.id);
                if (!relativePosition) continue;

                const parentType = solarPanel.parentType;
                const [x, y, z] = solarPanel.normal;
                if (
                  parentType === ObjectType.Foundation ||
                  parentType === ObjectType.Roof ||
                  (parentType === ObjectType.Cuboid && Util.isEqual(z, 1))
                ) {
                  solarPanel.cx = relativePosition[0] * lx;
                  solarPanel.cy = relativePosition[1] * ly;
                  if (parentType === ObjectType.Foundation) {
                    const foundation = state.elements.find(
                      (e) => e.id === elem.parentId && e.type === ObjectType.Foundation,
                    ) as FoundationModel;
                    if (foundation && foundation.enableSlope) {
                      solarPanel.cz = foundation.lz + Util.getZOnSlope(lx, foundation.slope, solarPanel.cx);
                    }
                  }
                } else if (parentType === ObjectType.Cuboid) {
                  // north face
                  if (Util.isEqual(x, 0) && Util.isEqual(y, 1)) {
                    solarPanel.cx = relativePosition[0] * lx;
                    solarPanel.cy = ly / 2;
                  }
                  // south face
                  else if (Util.isEqual(x, 0) && Util.isEqual(y, -1)) {
                    solarPanel.cx = relativePosition[0] * lx;
                    solarPanel.cy = -ly / 2;
                  }
                  // west face
                  else if (Util.isEqual(x, -1) && Util.isEqual(y, 0)) {
                    solarPanel.cx = -lx / 2;
                    solarPanel.cy = relativePosition[1] * ly;
                  }
                  // east face
                  else if (Util.isEqual(x, 1) && Util.isEqual(y, 0)) {
                    solarPanel.cx = lx / 2;
                    solarPanel.cy = relativePosition[1] * ly;
                  }
                }
                break;
              }
              case ObjectType.BatteryStorage: {
                const relativePosition = childRelPosMapRef.current.get(elem.id);
                if (!relativePosition) continue;
                elem.cx = relativePosition[0] * lx;
                elem.cy = relativePosition[1] * ly;
                const foundation = state.elements.find(
                  (e) => e.id === elem.parentId && e.type === ObjectType.Foundation,
                ) as FoundationModel;
                if (foundation && foundation.enableSlope) {
                  elem.cz = foundation.lz + Util.getZOnSlope(lx, foundation.slope, elem.cx);
                }
                break;
              }
              case ObjectType.Window: {
                const skylight = elem as WindowModel;
                if (skylight.parentType !== ObjectType.Roof) continue;
                const relativePosition = childRelPosMapRef.current.get(skylight.id);
                if (!relativePosition) continue;
                skylight.cx = relativePosition[0] * lx;
                skylight.cy = relativePosition[1] * ly;
              }
            }
          }
        }
      });
    };

    const resizeX = (p: Vector3) => {
      const pointer2D = new Vector2(p.x, p.y);
      const anchor = resizeAnchorRef.current.clone();

      const anchorToPointer = new Vector3(pointer2D.x - anchor.x, pointer2D.y - anchor.y);
      const nx = new Vector3(1, 0, 0).applyEuler(new Euler(0, 0, rotation));
      const angle = anchorToPointer.angleTo(nx);
      const lx = Math.abs(anchorToPointer.length() * Math.cos(angle));

      if (angle > HALF_PI) {
        nx.multiplyScalar(-lx / 2);
      } else {
        nx.multiplyScalar(lx / 2);
      }
      const center = new Vector3().addVectors(new Vector3(anchor.x, anchor.y), nx);
      updateResizeBottom(center.x, center.y, lx, ly);
      useStore.getState().updateElementOnRoofFn();
    };

    const resizeY = (p: Vector3) => {
      const pointer2D = new Vector2(p.x, p.y);
      const anchor = resizeAnchorRef.current.clone();

      const anchorToPointer = new Vector3(pointer2D.x - anchor.x, pointer2D.y - anchor.y);
      const ny = new Vector3(0, 1, 0).applyEuler(new Euler(0, 0, rotation));
      const angle = anchorToPointer.angleTo(ny);
      const ly = Math.abs(anchorToPointer.length() * Math.cos(angle));

      if (angle > HALF_PI) {
        ny.multiplyScalar(-ly / 2);
      } else {
        ny.multiplyScalar(ly / 2);
      }
      const center = new Vector3().addVectors(new Vector3(anchor.x, anchor.y), ny);
      updateResizeBottom(center.x, center.y, lx, ly);
      useStore.getState().updateElementOnRoofFn();
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
          const tempWorldDataMap = new Map<string, { pos: Vector3; rot: number }>();
          for (const elem of state.elements) {
            if (isGroupable(elem) && (groupedElementsIdSet.has(elem.id) || childCuboidSet.has(elem.id))) {
              const posRatio = basePosRatioMapRef.current.get(elem.id);
              const dmsRatio = baseDmsRatioMapRef.current.get(elem.id);
              if (posRatio && dmsRatio) {
                const newLx = dmsRatio[0] * lx;
                const newLy = dmsRatio[1] * ly;

                elem.lx = newLx;
                elem.ly = newLy;

                if (elem.parentId !== GROUND_ID) {
                  const parentWorldData = tempWorldDataMap.get(elem.parentId);
                  if (parentWorldData) {
                    const { pos, rot } = parentWorldData;
                    const worldCenter = new Vector3(posRatio[0] * lx + center.x, posRatio[1] * ly + center.y);
                    const relativeCenter = worldCenter.clone().sub(pos).applyEuler(new Euler(0, 0, -rot));
                    elem.cx = relativeCenter.x;
                    elem.cy = relativeCenter.y;
                    tempWorldDataMap.set(elem.id, { pos: worldCenter.clone(), rot: elem.rotation[2] + rot });
                  }
                } else {
                  const newCx = posRatio[0] * lx + center.x;
                  const newCy = posRatio[1] * ly + center.y;
                  elem.cx = newCx;
                  elem.cy = newCy;
                  tempWorldDataMap.set(elem.id, { pos: new Vector3(newCx, newCy), rot: elem.rotation[2] });
                }

                for (const e of state.elements) {
                  if (e.foundationId === elem.id) {
                    switch (e.type) {
                      case ObjectType.Wall: {
                        const wall = e as WallModel;
                        const relativePosition = wallRelPointsMapRef.current.get(wall.id);
                        if (!relativePosition) continue;
                        const [leftRelPoint, rightRelPoint] = relativePosition;
                        const leftPoint = [leftRelPoint.x * newLx, leftRelPoint.y * newLy, elem.lz];
                        const rightPoint = [rightRelPoint.x * newLx, rightRelPoint.y * newLy, elem.lz];
                        wall.cx = (leftPoint[0] + rightPoint[0]) / 2;
                        wall.cy = (leftPoint[1] + rightPoint[1]) / 2;
                        wall.lx = Math.hypot(leftPoint[0] - rightPoint[0] + (leftPoint[1] - rightPoint[1]));
                        wall.relativeAngle = Math.atan2(rightPoint[1] - leftPoint[1], rightPoint[0] - leftPoint[0]);
                        wall.leftPoint = [...leftPoint];
                        wall.rightPoint = [...rightPoint];
                        break;
                      }
                      case ObjectType.BatteryStorage: {
                        const relativePosition = childRelPosMapRef.current.get(elem.id);
                        if (!relativePosition) continue;
                        elem.cx = relativePosition[0] * lx;
                        elem.cy = relativePosition[1] * ly;
                        const foundation = state.elements.find(
                          (e) => e.id === elem.parentId && e.type === ObjectType.Foundation,
                        ) as FoundationModel;
                        if (foundation && foundation.enableSlope) {
                          elem.cz = foundation.lz + Util.getZOnSlope(foundation.lx, foundation.slope, elem.cx);
                        }
                        break;
                      }
                      case ObjectType.SolarPanel: {
                        const solarPanel = e as SolarPanelModel;
                        const relativePosition = childRelPosMapRef.current.get(solarPanel.id);
                        if (!relativePosition) continue;

                        const parentType = solarPanel.parentType;
                        const [x, y, z] = solarPanel.normal;
                        if (
                          parentType === ObjectType.Foundation ||
                          parentType === ObjectType.Roof ||
                          (parentType === ObjectType.Cuboid && Util.isEqual(z, 1))
                        ) {
                          solarPanel.cx = relativePosition[0] * newLx;
                          solarPanel.cy = relativePosition[1] * newLy;
                          if (parentType === ObjectType.Foundation) {
                            const foundation = state.elements.find(
                              (e) => e.id === elem.parentId && e.type === ObjectType.Foundation,
                            ) as FoundationModel;
                            if (foundation && foundation.enableSlope) {
                              solarPanel.cz =
                                foundation.lz + Util.getZOnSlope(foundation.lx, foundation.slope, solarPanel.cx);
                            }
                          }
                        } else if (parentType === ObjectType.Cuboid) {
                          // north face
                          if (Util.isEqual(x, 0) && Util.isEqual(y, 1)) {
                            solarPanel.cx = relativePosition[0] * newLx;
                            solarPanel.cy = newLy / 2;
                          }
                          // south face
                          else if (Util.isEqual(x, 0) && Util.isEqual(y, -1)) {
                            solarPanel.cx = relativePosition[0] * newLx;
                            solarPanel.cy = -newLy / 2;
                          }
                          // west face
                          else if (Util.isEqual(x, -1) && Util.isEqual(y, 0)) {
                            solarPanel.cx = -newLx / 2;
                            solarPanel.cy = relativePosition[1] * newLy;
                          }
                          // east face
                          else if (Util.isEqual(x, 1) && Util.isEqual(y, 0)) {
                            solarPanel.cx = newLx / 2;
                            solarPanel.cy = relativePosition[1] * newLy;
                          }
                        }
                        break;
                      }
                      case ObjectType.Window: {
                        const skylight = e as WindowModel;
                        if (skylight.parentType !== ObjectType.Roof) continue;
                        const relativePosition = childRelPosMapRef.current.get(skylight.id);
                        if (!relativePosition) continue;
                        skylight.cx = relativePosition[0] * newLx;
                        skylight.cy = relativePosition[1] * newLy;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
          for (const elem of state.elements) {
            if (elem.type === ObjectType.SolarPanel || elem.type === ObjectType.BatteryStorage) {
              const foundation = state.elements.find(
                (e) => e.id === elem.parentId && e.type === ObjectType.Foundation,
              ) as FoundationModel;
              if (foundation && foundation.enableSlope) {
                elem.cz = foundation.lz / 2 + Util.getZOnSlope(foundation.lx, foundation.slope, elem.cx);
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
        updateResizeBottom(center.x, center.y, lx, ly);
      }
      useStore.getState().updateElementOnRoofFn();
    };

    const resizeZ = (p: Vector3) => {
      if (p.z < 0.1) return;
      const height = p.z;
      setHeight(height);
      setCommonStore((state) => {
        for (const elem of state.elements) {
          if (elementHeightMapRef.current.has(elem.id)) {
            if (elem.type === ObjectType.Wall) {
              elem.lz = height * elementHeightMapRef.current.get(elem.id)!;
              const w = elem as WallModel;
              if (w.fill === WallFill.Partial) {
                const partialWallHeight = partialWallHeightMapRef.current.get(w.id);
                if (partialWallHeight) {
                  w.leftTopPartialHeight = height * partialWallHeight.upperLeft;
                  w.rightTopPartialHeight = height * partialWallHeight.upperRight;
                  w.leftUnfilledHeight = height * partialWallHeight.lowerLeft;
                  w.rightUnfilledHeight = height * partialWallHeight.lowerRight;
                }
              }
            } else if (elem.type === ObjectType.Roof) {
              (elem as RoofModel).rise = height * elementHeightMapRef.current.get(elem.id)!;
            } else if (elem.type === ObjectType.Cuboid) {
              const heightRatio = elementHeightMapRef.current.get(elem.id);
              if (heightRatio) {
                const newHeight = heightRatio * height;
                elem.lz = newHeight;
                elem.cz = newHeight / 2;
              }
            } else if (
              elem.type === ObjectType.SolarPanel &&
              (elem as SolarPanelModel).parentType === ObjectType.Cuboid &&
              elementHeightMapRef.current.has(elem.parentId)
            ) {
              const parentHeightRatio = elementHeightMapRef.current.get(elem.parentId);
              if (parentHeightRatio) {
                const newParentHeight = parentHeightRatio * height;
                // on top
                if (Util.isEqual(elem.normal[2], 1)) {
                  elem.cz = newParentHeight / 2;
                }
                // on sides
                else {
                  const elemHeightRatio = elementHeightMapRef.current.get(elem.id);
                  if (elemHeightRatio) {
                    elem.cz = elemHeightRatio * newParentHeight;
                  }
                }
              }
            }
          }
        }
        state.updateElementOnRoofFlag = true;
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
          if (isGroupable(elem) && groupedElementsIdSet.has(elem.id) && !childCuboidSet.has(elem.id)) {
            const oldCenter = baseRelPosMapRef.current.get(elem.id);
            const oldRotation = groupSize !== 1 ? baseRotationMapRef.current.get(elem.id) : 0;
            if (oldCenter && oldRotation !== undefined) {
              const newCenter = oldCenter.clone().applyEuler(euler);
              elem.cx = resizerCenter.x + newCenter.x;
              elem.cy = resizerCenter.y + newCenter.y;
              elem.rotation = [0, 0, oldRotation + rotateAngle];
            }
          }
          if (elem.type !== ObjectType.Cuboid && groupedElementsIdSet.has(elem.parentId)) {
            const oldRotation = groupSize !== 1 ? baseRotationMapRef.current.get(elem.parentId) : 0;
            if (oldRotation !== undefined) {
              elem.rotation = [0, 0, oldRotation + rotateAngle];
            }
          }
        }
      });
      setRotation(rotateAngle);
    };

    const pointerDownBottomResizeHandle = (x: number, y: number, operation: Operation) => {
      const positionV2 = new Vector2(position.x, position.y);
      resizeAnchorRef.current.set(x, y).rotateAround(zeroVector2, rotation).add(positionV2);
      setOperation(operation);

      basePosRatioMapRef.current.clear();
      baseDmsRatioMapRef.current.clear();
      wallRelPointsMapRef.current.clear();
      foundationOldDataMapRef.current.clear();
      wallOldPointsMapRef.current.clear();
      childRelPosMapRef.current.clear();
      oldChildPosMapRef.current.clear();

      const [currLx, currLy] = [hx * 2, hy * 2];
      for (const elem of useStore.getState().elements) {
        // base elements
        if (isGroupable(elem) && (groupedElementsIdSet.has(elem.id) || childCuboidSet.has(elem.id))) {
          const { pos } = Util.getWorldDataById(elem.id);
          basePosRatioMapRef.current.set(elem.id, [(pos.x - position.x) / currLx, (pos.y - position.y) / currLy]);
          baseDmsRatioMapRef.current.set(elem.id, [elem.lx / currLx, elem.ly / currLy]);
          foundationOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.lx, elem.ly]);
        }
        // child elements
        else if (
          elem.foundationId &&
          (groupedElementsIdSet.has(elem.foundationId) || childCuboidSet.has(elem.foundationId))
        ) {
          const foundation = getElementById(elem.foundationId);
          if (!foundation) continue;
          switch (elem.type) {
            case ObjectType.Wall: {
              const wall = elem as WallModel;
              const leftPointRelative = new Vector2(
                wall.leftPoint[0] / foundation.lx,
                wall.leftPoint[1] / foundation.ly,
              );
              const rightPointRelative = new Vector2(
                wall.rightPoint[0] / foundation.lx,
                wall.rightPoint[1] / foundation.ly,
              );
              wallRelPointsMapRef.current.set(wall.id, [leftPointRelative, rightPointRelative]);
              wallOldPointsMapRef.current.set(wall.id, [...wall.leftPoint, ...wall.rightPoint]);
              break;
            }
            case ObjectType.BatteryStorage:
            case ObjectType.SolarPanel:
            case ObjectType.Window: {
              const child = elem as WindowModel | SolarPanelModel;
              childRelPosMapRef.current.set(child.id, [child.cx / foundation.lx, child.cy / foundation.ly]);
              oldChildPosMapRef.current.set(child.id, [child.cx, child.cy, child.cz]);
              break;
            }
          }
        }
      }
    };

    const pointerDownTopResizeHandle = (x: number, y: number, z: number) => {
      const { x: cameraX, y: cameraY } = getCameraDirection();
      intersectionPlanePositionRef.current.set(x, y, z);
      intersectionPlaneRotationRef.current.set(-HALF_PI, 0, -Math.atan2(cameraX, cameraY) - rotation, 'ZXY');
      setOperation(Operation.ResizeZ);

      elementHeightMapRef.current.clear();
      elementOldHeightMapRef.current.clear();
      partialWallHeightMapRef.current.clear();
      oldPartialWallHeightMapRef.current.clear();

      for (const elem of useStore.getState().elements) {
        if (elem.foundationId && (groupedElementsIdSet.has(elem.foundationId) || childCuboidSet.has(elem.parentId))) {
          if (elem.type === ObjectType.Wall) {
            elementHeightMapRef.current.set(elem.id, elem.lz / height);
            elementOldHeightMapRef.current.set(elem.id, elem.lz);
            const w = elem as WallModel;
            if (w.fill === WallFill.Partial) {
              oldPartialWallHeightMapRef.current.set(w.id, {
                upperLeft: w.leftTopPartialHeight,
                upperRight: w.rightTopPartialHeight,
                lowerLeft: w.leftUnfilledHeight,
                lowerRight: w.rightUnfilledHeight,
              });
              partialWallHeightMapRef.current.set(w.id, {
                upperLeft: w.leftTopPartialHeight / height,
                upperRight: w.rightTopPartialHeight / height,
                lowerLeft: w.leftUnfilledHeight / height,
                lowerRight: w.rightUnfilledHeight / height,
              });
            }
          } else if (elem.type === ObjectType.Roof) {
            elementHeightMapRef.current.set(elem.id, (elem as RoofModel).rise / height);
            elementOldHeightMapRef.current.set(elem.id, (elem as RoofModel).rise);
          } else if (
            elem.type === ObjectType.SolarPanel &&
            (elem as SolarPanelModel).parentType === ObjectType.Cuboid
          ) {
            const parent = useStore.getState().elements.find((e) => e.id === elem.parentId);
            if (parent) {
              elementHeightMapRef.current.set(elem.id, elem.cz / parent.lz);
              elementOldHeightMapRef.current.set(elem.id, elem.cz);
            }
          }
        } else if (groupedElementsIdSet.has(elem.id) || childCuboidSet.has(elem.id)) {
          elementHeightMapRef.current.set(elem.id, elem.lz / height);
          elementOldHeightMapRef.current.set(elem.id, elem.lz);
        }
      }
    };

    const handleResizeHandlesPointerDown = (event: ThreeEvent<PointerEvent>) => {
      initPointerDown(event);
      switch (event.object.name) {
        case ResizeHandleType.UpperLeft: {
          pointerDownBottomResizeHandle(hx, -hy, Operation.ResizeXY);
          break;
        }
        case ResizeHandleType.UpperRight: {
          pointerDownBottomResizeHandle(-hx, -hy, Operation.ResizeXY);
          break;
        }
        case ResizeHandleType.LowerLeft: {
          pointerDownBottomResizeHandle(hx, hy, Operation.ResizeXY);
          break;
        }
        case ResizeHandleType.LowerRight: {
          pointerDownBottomResizeHandle(-hx, hy, Operation.ResizeXY);
          break;
        }
        case ResizeHandleType.Upper: {
          pointerDownBottomResizeHandle(0, -hy, Operation.ResizeY);
          break;
        }
        case ResizeHandleType.Lower: {
          pointerDownBottomResizeHandle(0, hy, Operation.ResizeY);
          break;
        }
        case ResizeHandleType.Left: {
          pointerDownBottomResizeHandle(hx, 0, Operation.ResizeX);
          break;
        }
        case ResizeHandleType.Right: {
          pointerDownBottomResizeHandle(-hx, 0, Operation.ResizeX);
          break;
        }
        case ResizeHandleType.UpperLeftTop: {
          pointerDownTopResizeHandle(-hx, hy, height);
          break;
        }
        case ResizeHandleType.UpperRightTop: {
          pointerDownTopResizeHandle(hx, hy, height);
          break;
        }
        case ResizeHandleType.LowerLeftTop: {
          pointerDownTopResizeHandle(-hx, -hy, height);
          break;
        }
        case ResizeHandleType.LowerRightTop: {
          pointerDownTopResizeHandle(hx, -hy, height);
          break;
        }
      }
    };

    const handleMoveHandlesPointerDown = (event: ThreeEvent<PointerEvent>) => {
      initPointerDown(event);
      setOperation(Operation.Move);
      if (event.intersections.length > 0) {
        const p = event.intersections[0].point.clone().setZ(0);
        resizerCenterRelPosRef.current.subVectors(position, p);
        for (const elem of useStore.getState().elements) {
          if (isGroupable(elem) && groupedElementsIdSet.has(elem.id)) {
            const c = new Vector3(elem.cx, elem.cy);
            const v = new Vector3().subVectors(c, p);
            baseRelPosMapRef.current.set(elem.id, v);
            foundationOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
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
          if (isGroupable(elem) && groupedElementsIdSet.has(elem.id)) {
            const elemCenter = new Vector3(elem.cx, elem.cy);
            const v = new Vector3().subVectors(elemCenter, resizerCenter);
            baseRelPosMapRef.current.set(elem.id, v);
            baseRotationMapRef.current.set(elem.id, elem.rotation[2]);
            foundationOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
          }
          if (groupedElementsIdSet.has(elem.parentId)) {
            foundationOldDataMapRef.current.set(elem.id, [elem.cx, elem.cy, elem.cz, elem.rotation[2]]);
          }
        }
      }
    };

    const handleIntersectionPlanePointerUp = () => {
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
          addUndoableResizeZ();
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
        state.updateElementOnRoofFlag = true;
      });
    };

    const handleIntersectionPlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
      if (!intersectionPlaneRef.current || !pointerDownRef.current) return;
      setRayCast(event);
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
      if (intersects.length > 0) {
        const p = intersects[0].point;
        switch (operation) {
          case Operation.ResizeX:
            resizeX(p);
            break;
          case Operation.ResizeY:
            resizeY(p);
            break;
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
                if (isGroupable(elem) && groupedElementsIdSet.has(elem.id) && !childCuboidSet.has(elem.id)) {
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
    const bottomHandleZ = handleSize / 2;
    const topHandleZ = height + bottomHandleZ - handleSize / 2;
    const moveHandleX = hx + handleSize * 2;
    const moveHandleY = hy + handleSize * 2;
    const resizeHandleY = hy + handleSize * 5;

    return (
      <group name={'Group Master'} position={position} rotation={[0, 0, rotation]}>
        <group name={'Resize Handle Group'} onPointerDown={handleResizeHandlesPointerDown}>
          <ResizeHandle args={[hx, hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.UpperRight} />
          <ResizeHandle args={[-hx, hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.UpperLeft} />
          <ResizeHandle args={[hx, -hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.LowerRight} />
          <ResizeHandle args={[-hx, -hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.LowerLeft} />
          {!lockAspectRatio && (
            <>
              <ResizeHandle args={[-hx, 0, bottomHandleZ, handleSize]} handleType={ResizeHandleType.Left} />
              <ResizeHandle args={[hx, 0, bottomHandleZ, handleSize]} handleType={ResizeHandleType.Right} />
              <ResizeHandle args={[0, -hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.Lower} />
              <ResizeHandle args={[0, hy, bottomHandleZ, handleSize]} handleType={ResizeHandleType.Upper} />
            </>
          )}

          {!orthographic && (
            <>
              <ResizeHandle args={[hx, hy, topHandleZ, handleSize]} handleType={ResizeHandleType.UpperRightTop} />
              <ResizeHandle args={[-hx, hy, topHandleZ, handleSize]} handleType={ResizeHandleType.UpperLeftTop} />
              <ResizeHandle args={[hx, -hy, topHandleZ, handleSize]} handleType={ResizeHandleType.LowerRightTop} />
              <ResizeHandle args={[-hx, -hy, topHandleZ, handleSize]} handleType={ResizeHandleType.LowerLeftTop} />
            </>
          )}
        </group>

        <group name={'Move Handle Group'} onPointerDown={handleMoveHandlesPointerDown}>
          <MoveHandle args={[0, moveHandleY, bottomHandleZ, handleSize]} handleType={MoveHandleType.Upper} />
          <MoveHandle args={[0, -moveHandleY, bottomHandleZ, handleSize]} handleType={MoveHandleType.Lower} />
          <MoveHandle args={[moveHandleX, 0, bottomHandleZ, handleSize]} handleType={MoveHandleType.Right} />
          <MoveHandle args={[-moveHandleX, 0, bottomHandleZ, handleSize]} handleType={MoveHandleType.Left} />
        </group>

        <group name={'Rotate Handle Group'} onPointerDown={handleRotateHandlesPointerDown}>
          <RotateHandle args={[0, resizeHandleY, bottomHandleZ, handleSize]} handleType={RotateHandleType.Upper} />
          <RotateHandle args={[0, -resizeHandleY, bottomHandleZ, handleSize]} handleType={RotateHandleType.Lower} />
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
  },
);

export default GroupMaster;
