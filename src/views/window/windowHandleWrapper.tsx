/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { DoubleSide, Euler, Mesh, Vector3 } from 'three';
import { Box, Plane } from '@react-three/drei';
import { MoveHandleType, ObjectType, ResizeHandleType } from 'src/types';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import WindowResizeHandle from './windowResizeHandle';
import WindowMoveHandle from './windowMoveHandle';
import { HALF_PI } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from 'src/stores/common';
import { FoundationModel } from 'src/models/FoundationModel';
import * as Selector from 'src/stores/selector';
import { RoofUtil } from '../roof/RoofUtil';
import { useRefStore } from 'src/stores/commonRef';
import { RoofSegmentGroupUserData, RoofSegmentProps } from '../roof/roofRenderer';
import { RoofModel, RoofType } from 'src/models/RoofModel';
import { Util } from 'src/Util';
import { UndoableMoveSkylight } from 'src/undo/UndoableMove';
import { UndoableResizeSkylight, UndoableResizeSkylightPolygonTop } from 'src/undo/UndoableResize';
import { getRoofPointsOfGambrelRoof } from '../roof/flatRoof';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { DEFAULT_POLYGONTOP } from './window';
import { FOUNDATION_GROUP_NAME } from '../foundation/foundation';
import { BUILDING_GROUP_NAME } from '../foundation/buildingRenderer';

interface WindowHandleWrapperProps {
  id: string;
  parentId: string;
  foundationId?: string;
  lx: number;
  lz: number;
  polygonTop: number[];
  rotation: number[];
  windowType: WindowType;
  parentType: ObjectType;
}

type HandleType = MoveHandleType | ResizeHandleType;

const INTERSECTION_PLANE_NAME = 'Handles Intersection Plane';

const getPointerOnIntersectionPlane = (e: ThreeEvent<PointerEvent>) => {
  if (e.intersections.length > 0) {
    for (const intersection of e.intersections) {
      if (intersection.eventObject.name === INTERSECTION_PLANE_NAME) {
        // don't know why there is case point.z is negtive
        if (intersection.point.z < 0) return null;
        return intersection.point;
      }
    }
  }
  return null;
};

const getPosRelToFoundation = (p: Vector3, foundation: FoundationModel) => {
  return new Vector3()
    .subVectors(p, new Vector3(foundation.cx, foundation.cy, foundation.lz))
    .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
};

const isRectWindowInsideVertices = (
  center: Vector3,
  lx: number,
  ly: number,
  rotation: number[],
  vertices: Vector3[],
) => {
  const [hx, hy] = [lx / 2, ly / 2];
  const [a, b, c] = rotation;
  const euler = new Euler().fromArray([a - HALF_PI, b, c, 'ZXY']);
  const boundaryPoint2 = vertices.map((v) => ({ x: v.x, y: v.y }));

  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const v = new Vector3(hx * i, 0, hy * j).applyEuler(euler);
      const vertex = new Vector3().addVectors(center, v);
      if (!Util.isPointInside(vertex.x, vertex.y, boundaryPoint2)) {
        return false;
      }
    }
  }
  return true;
};

const isPolygonalWindowInsideVertices = (
  center: Vector3,
  lx: number,
  ly: number,
  topX: number,
  topH: number,
  rotation: number[],
  vertices: Vector3[],
) => {
  const [hx, hy] = [lx / 2, ly / 2];
  const [a, b, c] = rotation;
  const euler = new Euler().fromArray([a - HALF_PI, b, c, 'ZXY']);
  const boundaryPoint2 = vertices.map((v) => ({ x: v.x, y: v.y }));

  const topVertex = new Vector3().addVectors(center, new Vector3(topX * lx, 0, hy + topH).applyEuler(euler));
  if (!Util.isPointInside(topVertex.x, topVertex.y, boundaryPoint2)) return false;

  if (!isRectWindowInsideVertices(center, lx, ly, rotation, vertices)) return false;

  return true;
};

const getDataOnRoof = (e: ThreeEvent<PointerEvent>, windowId: string, roofId: string) => {
  if (e.intersections.length > 0) {
    for (const intersection of e.intersections) {
      const eventObjectName = intersection.eventObject.name;
      if (
        eventObjectName.includes('Window') &&
        eventObjectName.includes(windowId) &&
        intersection.object.name !== INTERSECTION_PLANE_NAME
      )
        return null;

      if (eventObjectName.includes('Roof') && eventObjectName.includes(roofId)) {
        const pointer = intersection.point.clone();
        const segmentIdx = Number.parseInt(intersection.object.name.split(' ').pop() ?? '-1');
        return { pointer, segmentIdx };
      }
    }
  }
  return null;
};

const isResizeHandle = (handleType: HandleType | null) => {
  switch (handleType) {
    case ResizeHandleType.LowerLeft:
    case ResizeHandleType.LowerRight:
    case ResizeHandleType.UpperLeft:
    case ResizeHandleType.UpperRight:
      return true;
  }
  return false;
};

const getNewResizedData = (anchor: Vector3, pointer: Vector3, r: number) => {
  const diffVector = new Vector3().subVectors(pointer, anchor).applyEuler(new Euler(0, 0, -r));
  const newLx = Math.abs(diffVector.x);
  const newLz = Math.hypot(diffVector.y, diffVector.z);
  const newCenter = new Vector3().addVectors(anchor, pointer).divideScalar(2);
  return { newLx, newLz, newCenter };
};

const getRoofBoundaryVertices = (roofSegments: RoofSegmentProps[], roofCentroid: Vector3, roofType: RoofType) => {
  if (roofType === RoofType.Gambrel) {
    return getRoofPointsOfGambrelRoof(roofSegments).map((v) => v.add(roofCentroid));
  } else {
    return roofSegments.map((segment) => segment.points[0].clone().add(roofCentroid));
  }
};

const setUndoableMove = (id: string, position: number[], rotation: number[]) => {
  useStore.getState().set((state) => {
    const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;
    [window.cx, window.cy, window.cz] = position;
    window.rotation = [...rotation];
  });
};

const setUndoableResize = (id: string, position: number[], dimension: number[], archHeight?: number | null) => {
  useStore.getState().set((state) => {
    const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;
    [window.cx, window.cy, window.cz] = position;
    [window.lx, window.ly, window.lz] = dimension;
    if (archHeight !== undefined && archHeight !== null) {
      window.archHeight = archHeight;
    }
  });
};

const setUndoableResizePolygonTop = (id: string, polygonTop: number[]) => {
  useStore.getState().set((state) => {
    const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;
    window.polygonTop = [...polygonTop];
  });
};

const getElementVerticesOnRoof = (el: ElementModel, foundation: FoundationModel, margin = 0.01) => {
  if (el.type !== ObjectType.SolarPanel && el.type !== ObjectType.Window) return null;

  const euler = new Euler().fromArray([...el.rotation, 'ZXY']);
  const center = new Vector3();
  const hx = el.lx / 2 + margin;
  let hy = margin;
  if (el.type === ObjectType.SolarPanel) {
    hy += el.ly / 2;
    center.set(el.cx * foundation.lx, el.cy * foundation.ly, 0);
  } else {
    hy += el.lz / 2;
    center.set(el.cx, el.cy, 0);
  }

  const vertices: Point2[] = [];
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const v = new Vector3(i * hx, i * j * hy).applyEuler(euler).add(center);
      vertices.push(v);
    }
  }
  if (el.type === ObjectType.Window && (el as WindowModel).windowType === WindowType.Polygonal) {
    const [tx, th] = (el as WindowModel).polygonTop ?? DEFAULT_POLYGONTOP;
    const v = new Vector3(tx * hx, th + hy).applyEuler(euler).add(center);
    vertices.push(v);
  }
  return vertices;
};

const getPolygonTop = (window: WindowModel) => {
  if (window.windowType !== WindowType.Polygonal) return;
  return window.polygonTop ?? DEFAULT_POLYGONTOP;
};

export const ArchResizeHandle = ({ z }: { z: number }) => {
  const ref = useRef<Mesh>();

  const [color, setColor] = useState('white');
  return (
    <Box
      ref={ref}
      name={ResizeHandleType.Arch}
      args={[0.2, 0.2, 0.2]}
      position={[0, 0, z]}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        setColor('white');
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
};

const WindowHandleWrapper = ({
  id,
  parentId,
  foundationId,
  lx,
  lz,
  polygonTop,
  rotation,
  windowType,
  parentType,
}: WindowHandleWrapperProps) => {
  const addedWindowId = useStore((state) => state.addedWindowId);
  const addUndoable = useStore(Selector.addUndoable);

  const isSettingNewWindow = addedWindowId === id;
  const isOnRoof = parentType === ObjectType.Roof;

  const handleTypeRef = useRef<HandleType | null>(null);
  const foundationModelRef = useRef<FoundationModel | undefined | null>(null);
  const roofModelRef = useRef<RoofModel | undefined | null>(null);
  const roofSegmentsRef = useRef<RoofSegmentProps[] | undefined | null>(null);
  const roofCentroidRef = useRef<Vector3 | undefined | null>(null);
  const currRoofSegmentIdxRef = useRef<number | null>(null);
  const resizeAnchorWorldPosRef = useRef<Vector3 | null>(null);
  const roofBoundaryVerticesRef = useRef<Vector3[] | null>(null);
  const roofChildVertices2DRef = useRef<Point2[][]>([]);

  const oldPositionRef = useRef<number[] | null>(null);
  const oldRotationRef = useRef<number[] | null>(null);
  const oldDimensionRef = useRef<number[] | null>(null);
  const oldArchHeight = useRef<number | null>(null);
  const oldPolygonTop = useRef<number[] | null>(null);

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const [hx, hz] = [lx / 2, lz / 2];
  const [topX, topH] = polygonTop;

  const absTopX = useMemo(() => lx * topX, [lx, topX]);

  const setCommonStore = useStore(Selector.set);

  const getResizeAnchor = (event: ThreeEvent<PointerEvent>, lx: number, lz: number) => {
    if (!foundationId) return null;
    const foundationModel = useStore
      .getState()
      .elements.find((e) => e.id === foundationId && e.type === ObjectType.Foundation);
    if (!foundationModel) return null;
    const worldPosition = event.object.localToWorld(new Vector3());
    const [a, b, c] = rotation;
    const euler = new Euler().fromArray([a - HALF_PI, b, c + foundationModel.rotation[2], 'ZXY']);
    const v = new Vector3(lx, 0, lz).applyEuler(euler);
    return new Vector3().addVectors(worldPosition, v);
  };

  const setRefDataBeforePointerMove = (handleType: HandleType) => {
    let windowModel: WindowModel | undefined;
    let foundationModel: FoundationModel | undefined;
    let roofModel: RoofModel | undefined;

    for (const el of useStore.getState().elements) {
      if (el.id === id && el.type === ObjectType.Window) {
        windowModel = el as WindowModel;
      } else if (el.id === foundationId && el.type === ObjectType.Foundation) {
        foundationModel = el as FoundationModel;
      } else if (el.id === parentId && el.type === ObjectType.Roof) {
        roofModel = el as RoofModel;
      }
    }

    const contentRef = useRefStore.getState().contentRef;
    if (!windowModel || !foundationModel || !roofModel || !contentRef || !contentRef.current) return;

    const fId = foundationModel.id;
    const foundationGroup = contentRef.current.children.find((obj) => obj.name === `${FOUNDATION_GROUP_NAME} ${fId}`);
    if (!foundationGroup) return;

    const buildingGroup = foundationGroup.children.find((obj) => obj.name === BUILDING_GROUP_NAME);
    if (!buildingGroup) return;

    const roofGroup = buildingGroup.children.find((obj) => obj.name.includes('Roof') && obj.name.includes(parentId));
    if (!roofGroup) return;

    const segmentGroup = roofGroup.children[0];
    if (!segmentGroup) return;

    for (const el of useStore.getState().elements) {
      if (el.parentId === parentId && el.id !== id) {
        const vertices = getElementVerticesOnRoof(el, foundationModel);
        if (vertices) {
          roofChildVertices2DRef.current.push(vertices);
        }
      }
    }

    const { centroid, roofSegments } = segmentGroup.userData as RoofSegmentGroupUserData;
    const posRelToFoundation = new Vector3(windowModel.cx, windowModel.cy, windowModel.cz + foundationModel.lz);
    const posRelToCentroid = posRelToFoundation.clone().sub(centroid);

    handleTypeRef.current = handleType;
    foundationModelRef.current = foundationModel;
    roofModelRef.current = roofModel;
    currRoofSegmentIdxRef.current = RoofUtil.getSegmentIdx(roofSegments, posRelToCentroid);
    roofCentroidRef.current = centroid;
    roofSegmentsRef.current = roofSegments;
    roofBoundaryVerticesRef.current = getRoofBoundaryVertices(
      roofSegmentsRef.current,
      roofCentroidRef.current,
      roofModel.roofType,
    );

    oldPositionRef.current = [windowModel.cx, windowModel.cy, windowModel.cz];
    oldDimensionRef.current = [windowModel.lx, windowModel.ly, windowModel.lz];
    oldRotationRef.current = [...windowModel.rotation];
    oldArchHeight.current = windowModel.archHeight;
    oldPolygonTop.current = windowModel.polygonTop ?? null;
  };

  const addUndoableMove = () => {
    if (!oldPositionRef.current || !oldRotationRef.current) return;
    const window = useStore.getState().elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;

    const undoable = {
      name: 'Move skylight',
      timestamp: Date.now(),
      id: window.id,
      oldPosition: [...oldPositionRef.current],
      newPosition: [window.cx, window.cy, window.cz],
      oldRotation: [...oldRotationRef.current],
      newRotation: [...window.rotation],
      undo() {
        setUndoableMove(undoable.id, undoable.oldPosition, undoable.oldRotation);
      },
      redo() {
        setUndoableMove(undoable.id, undoable.newPosition, undoable.newRotation);
      },
    } as UndoableMoveSkylight;

    addUndoable(undoable);
  };

  const addUndoableResize = () => {
    if (!oldDimensionRef.current || !oldPositionRef.current) return;
    const window = useStore.getState().elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;

    const undoable = {
      name: 'Resize skylight',
      timestamp: Date.now(),
      id: window.id,
      oldPosition: [...oldPositionRef.current],
      newPosition: [window.cx, window.cy, window.cz],
      oldDimension: [...oldDimensionRef.current],
      newDimension: [window.lx, window.ly, window.lz],
      oldArchHeight: oldArchHeight.current,
      newArchHeight: window.archHeight,
      undo() {
        setUndoableResize(this.id, this.oldPosition, this.oldDimension, this.oldArchHeight);
      },
      redo() {
        setUndoableResize(this.id, this.newPosition, this.newDimension, this.newArchHeight);
      },
    } as UndoableResizeSkylight;
    addUndoable(undoable);
  };

  const addUndoableReizePolygonTop = () => {
    if (!oldPolygonTop.current) return;
    const window = useStore.getState().elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    if (!window) return;

    const undoable = {
      name: 'Resize skylight top vertex',
      timestamp: Date.now(),
      id: window.id,
      oldPolygonTop: [...oldPolygonTop.current],
      newPolygonTop: window.polygonTop ?? DEFAULT_POLYGONTOP,
      undo() {
        setUndoableResizePolygonTop(this.id, this.oldPolygonTop);
      },
      redo() {
        setUndoableResizePolygonTop(this.id, this.newPolygonTop);
      },
    } as UndoableResizeSkylightPolygonTop;
    addUndoable(undoable);
  };

  const isFlatRoof = (roof: RoofModel) => {
    if (roof.roofType === RoofType.Gable) return false;
    return Math.abs(roof.rise) < 0.001;
  };

  const getBoundary = (segmentIdx?: number | null) => {
    const isOnFlatRoof = roofModelRef.current && isFlatRoof(roofModelRef.current);
    if (isOnFlatRoof) {
      return roofBoundaryVerticesRef.current;
    } else if (segmentIdx !== undefined && segmentIdx !== null) {
      const segmentVertices = useStore.getState().getRoofSegmentVertices(parentId);
      if (!segmentVertices) return;
      const idx = segmentIdx === -1 ? segmentVertices.length - 1 : segmentIdx;
      const vertices = segmentVertices[idx];
      return vertices;
    }
  };

  const collisionCheck = (center: Vector3, lx: number, ly: number, rotation: number[], polygonTop?: number[]) => {
    const [hx, hy] = [lx / 2, ly / 2];
    const euler = new Euler().fromArray([...rotation, 'ZXY']);

    const currentVertices: Vector3[] = [];
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const v = new Vector3(i * hx, i * j * hy).applyEuler(euler).add(center);
        currentVertices.push(v);
      }
    }
    if (polygonTop) {
      const [tx, th] = polygonTop;
      const v = new Vector3(tx * hx * 2, th + hy).applyEuler(euler).add(center);
      currentVertices.push(v);
    }

    for (const targetVertices of roofChildVertices2DRef.current) {
      // check if current element vertices inside other(target) element
      for (const currentVertex of currentVertices) {
        if (Util.isPointInside(currentVertex.x, currentVertex.y, targetVertices)) {
          return false;
        }
      }
      // check if other element vertices inside current element
      for (const targetVertex of targetVertices) {
        if (Util.isPointInside(targetVertex.x, targetVertex.y, currentVertices)) {
          return false;
        }
      }
    }

    return true;
  };

  const boundaryCheck = (
    boundary: Vector3[],
    center: Vector3,
    lx: number,
    ly: number,
    rotation: number[],
    polygonTop?: number[],
  ) => {
    if (polygonTop) {
      const [topX, topH] = polygonTop;
      return isPolygonalWindowInsideVertices(center, lx, ly, topX, topH, rotation, boundary);
    } else {
      return isRectWindowInsideVertices(center, lx, ly, rotation, boundary);
    }
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isOnRoof || isSettingNewWindow) return;

    const handleType = event.object.name as HandleType;

    switch (handleType) {
      case MoveHandleType.Mid: {
        // use break to avoid default return
        break;
      }
      case ResizeHandleType.LowerLeft: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, lx, lz);
        break;
      }
      case ResizeHandleType.LowerRight: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, -lx, lz);
        break;
      }
      case ResizeHandleType.UpperLeft: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, lx, -lz);
        break;
      }
      case ResizeHandleType.UpperRight: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, -lx, -lz);
        break;
      }
      case ResizeHandleType.Arch: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, 0, -lz);
        break;
      }
      case ResizeHandleType.Upper:
        // use break to avoid default return
        break;
      default:
        // just in case handle type is not correct
        return;
    }

    setRefDataBeforePointerMove(handleType);
    setShowIntersectionPlane(true);
    useRefStore.getState().setEnableOrbitController(false);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (
      handleTypeRef.current === null ||
      !foundationModelRef.current ||
      !roofModelRef.current ||
      !roofSegmentsRef.current ||
      !roofCentroidRef.current ||
      !roofBoundaryVerticesRef.current
    )
      return;

    const foundation = foundationModelRef.current;

    if (handleTypeRef.current === MoveHandleType.Mid) {
      const roof = roofModelRef.current;
      const dataOnRoof = getDataOnRoof(event, id, parentId);
      const pointer = new Vector3();

      if (isFlatRoof(roof)) {
        const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
        if (!pointerOnIntersectionPlane) return;
        pointer.copy(pointerOnIntersectionPlane);
        const newCenter = getPosRelToFoundation(pointer, foundation);

        setCommonStore((state) => {
          if (!roofBoundaryVerticesRef.current) return;
          const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
          if (!window) return;

          const { lx, lz, rotation } = window;
          const boundary = roofBoundaryVerticesRef.current;
          const polygonTop = getPolygonTop(window);
          const insideBoundary = boundaryCheck(boundary, newCenter, lx, lz, rotation, polygonTop);
          const noCollision = collisionCheck(newCenter, lx, lz, rotation, polygonTop);

          if (insideBoundary && noCollision) {
            window.cx = newCenter.x;
            window.cy = newCenter.y;
            window.cz = newCenter.z;
          }
        });
      } else {
        // segment changed
        if (dataOnRoof && dataOnRoof.segmentIdx !== currRoofSegmentIdxRef.current) {
          const pointerOnRoof = dataOnRoof.pointer;
          pointer.copy(pointerOnRoof);
        }
        // segment not changed
        else {
          const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
          if (!pointerOnIntersectionPlane) return;
          pointer.copy(pointerOnIntersectionPlane);
        }

        const newCenter = getPosRelToFoundation(pointer, foundation);
        const posRelToCentroid = newCenter.clone().sub(roofCentroidRef.current);
        const { rotation, segmentVertices, segmentIdx } = RoofUtil.computeState(
          roofSegmentsRef.current,
          posRelToCentroid,
        );
        if (segmentVertices) {
          newCenter.setZ(
            RoofUtil.getRooftopElementZ(segmentVertices, posRelToCentroid, roofCentroidRef.current.z + roof.thickness),
          );
        } else {
          newCenter.setZ(roofCentroidRef.current.z + roof.thickness);
        }

        setCommonStore((state) => {
          const segmentVertices = useStore.getState().getRoofSegmentVertices(parentId);
          if (!segmentVertices) return;
          // mansard top surface idx is -1, and its vertices is the last in the arrary
          const idx = segmentIdx === -1 ? segmentVertices.length - 1 : segmentIdx;
          const vertices = segmentVertices[idx];
          if (!vertices) return;

          const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
          if (!window) return;

          const { lx, lz } = window;
          const polygonTop = getPolygonTop(window);
          const insideBoundary = boundaryCheck(vertices, newCenter, lx, lz, rotation, polygonTop);
          const noCollision = collisionCheck(newCenter, lx, lz, rotation, polygonTop);

          if (insideBoundary && noCollision) {
            window.cx = newCenter.x;
            window.cy = newCenter.y;
            window.cz = newCenter.z;
            window.rotation = [...rotation];
            if (dataOnRoof && dataOnRoof.segmentIdx !== currRoofSegmentIdxRef.current) {
              currRoofSegmentIdxRef.current = dataOnRoof.segmentIdx;
            }
          }
        });
      }
    } else if (isResizeHandle(handleTypeRef.current)) {
      const boundary = getBoundary(currRoofSegmentIdxRef.current);
      const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
      const anchorWorldPos = resizeAnchorWorldPosRef.current;
      if (!pointerOnIntersectionPlane || !anchorWorldPos || !boundary) return;

      const pointerRelToFoundation = getPosRelToFoundation(pointerOnIntersectionPlane, foundation);
      const anchorRelToFoundation = getPosRelToFoundation(anchorWorldPos, foundation);
      const { newLx, newLz, newCenter } = getNewResizedData(anchorRelToFoundation, pointerRelToFoundation, rotation[2]);

      useStore.getState().set((state) => {
        const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
        if (!window) return;

        const polygonTop = getPolygonTop(window);
        const insideBoundary = boundaryCheck(boundary, newCenter, newLx, newLz, rotation, polygonTop);
        const noCollision = collisionCheck(newCenter, newLx, newLz, rotation, polygonTop);

        if (insideBoundary && noCollision) {
          window.cx = newCenter.x;
          window.cy = newCenter.y;
          window.cz = newCenter.z;
          window.lx = newLx;
          window.lz = Math.max(0.001, newLz);
        }
      });
    } else if (handleTypeRef.current === ResizeHandleType.Upper) {
      const boundary = getBoundary(currRoofSegmentIdxRef.current);
      const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
      if (!pointerOnIntersectionPlane || !boundary) return;

      const pointerRelToFoundation = getPosRelToFoundation(pointerOnIntersectionPlane, foundation);

      setCommonStore((state) => {
        const window = state.elements.find((e) => e.id === id) as WindowModel;
        if (!window) return;

        const [whx, whz] = [window.lx / 2, window.lz / 2];

        const centerPoint = new Vector3(window.cx, window.cy, window.cz);
        const euler = new Euler().fromArray([...window.rotation, 'ZXY']);
        const lowerLeftPoint = new Vector3(-whx, -whz, 0).applyEuler(euler).add(centerPoint);
        const lowerRightPoint = new Vector3(whx, -whz, 0).applyEuler(euler).add(centerPoint);

        const pointerRelToLowerLeft = new Vector3().subVectors(pointerRelToFoundation, lowerLeftPoint);
        const botNormal = new Vector3().subVectors(lowerRightPoint, lowerLeftPoint).normalize();
        const topXRelToLeft = pointerRelToLowerLeft
          .clone()
          .projectOnVector(botNormal)
          .applyEuler(new Euler(0, 0, -window.rotation[2]));
        const newTopX = Util.clamp((topXRelToLeft.x - whx) / window.lx, -0.5, 0.5);

        const topToBotDist2D = RoofUtil.getDistance(lowerLeftPoint, lowerRightPoint, pointerRelToFoundation);
        const topToBotDist = Math.hypot(topToBotDist2D, pointerRelToFoundation.z - lowerLeftPoint.z);
        const newTopH = Math.max(0, topToBotDist - window.lz);
        const newPolygonTop = [newTopX, newTopH];

        const center = new Vector3(window.cx, window.cy, window.cz);
        const { lx, lz } = window;
        const insideBoundary = boundaryCheck(boundary, center, lx, lz, rotation, newPolygonTop);
        const noCollision = collisionCheck(center, lx, lz, rotation, newPolygonTop);

        if (insideBoundary && noCollision) {
          window.polygonTop = [...newPolygonTop];
        }
      });
    } else if (handleTypeRef.current === ResizeHandleType.Arch) {
      const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
      const anchorWorldPos = resizeAnchorWorldPosRef.current;
      const boundary = getBoundary(currRoofSegmentIdxRef.current);
      if (!pointerOnIntersectionPlane || !anchorWorldPos || !boundary) return;

      const pointerRelToFoundation = getPosRelToFoundation(pointerOnIntersectionPlane, foundation);
      const anchorRelToFoundation = getPosRelToFoundation(anchorWorldPos, foundation);

      setCommonStore((state) => {
        const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
        if (!window) return;

        const [whx, whz] = [window.lx / 2, window.lz / 2];

        const centerPoint = new Vector3(window.cx, window.cy, window.cz);
        const euler = new Euler().fromArray([...window.rotation, 'ZXY']);
        const lowerLeftPoint = new Vector3(-whx, -whz, 0).applyEuler(euler).add(centerPoint);
        const lowerRightPoint = new Vector3(whx, -whz, 0).applyEuler(euler).add(centerPoint);

        const topToBotDist2D = RoofUtil.getDistance(lowerLeftPoint, lowerRightPoint, pointerRelToFoundation);
        let newLz = Math.hypot(topToBotDist2D, pointerRelToFoundation.z - lowerLeftPoint.z);

        const ah = Math.min(window.archHeight, window.lz, window.lx / 2);
        const rectHeight = window.lz - ah;

        if (newLz > rectHeight && newLz < window.lx / 2 + rectHeight) {
          const anchorToCenterNormal = new Vector3().subVectors(centerPoint, anchorRelToFoundation).normalize();
          const newCenter = new Vector3().addVectors(
            anchorRelToFoundation,
            anchorToCenterNormal.multiplyScalar(newLz / 2),
          );
          const newArchHeight = newLz - rectHeight;

          const insideBoundary = boundaryCheck(boundary, newCenter, window.lx, newLz, rotation);
          const noCollision = collisionCheck(newCenter, window.lx, newLz, rotation);

          if (insideBoundary && noCollision) {
            window.cx = newCenter.x;
            window.cy = newCenter.y;
            window.cz = newCenter.z;
            window.lz = newLz;
            window.archHeight = newArchHeight;
          }
        }
      });
    }
  };

  const handlePointerUp = () => {
    if (handleTypeRef.current === MoveHandleType.Mid) {
      addUndoableMove();
    } else if (isResizeHandle(handleTypeRef.current)) {
      addUndoableResize();
    } else if (handleTypeRef.current === ResizeHandleType.Upper) {
      addUndoableReizePolygonTop();
    } else if (handleTypeRef.current === ResizeHandleType.Arch) {
      addUndoableResize();
    }
    oldPositionRef.current = null;
    oldDimensionRef.current = null;
    oldRotationRef.current = null;
    oldArchHeight.current = null;
    oldPolygonTop.current = null;

    handleTypeRef.current = null;
    foundationModelRef.current = null;
    roofModelRef.current = null;
    roofSegmentsRef.current = null;
    roofCentroidRef.current = null;
    currRoofSegmentIdxRef.current = null;
    resizeAnchorWorldPosRef.current = null;
    roofBoundaryVerticesRef.current = null;
    roofChildVertices2DRef.current = [];
    setShowIntersectionPlane(false);
    useRefStore.getState().setEnableOrbitController(true);
  };

  return (
    <>
      <group name={'Handle Wrapper'} onPointerDown={handlePointerDown}>
        {!isSettingNewWindow && (
          <>
            {windowType === WindowType.Polygonal && (
              <WindowResizeHandle x={absTopX} z={hz + topH} handleType={ResizeHandleType.Upper} scale={[0.5, 1, 1.5]} />
            )}
            <WindowResizeHandle x={-hx} z={hz} handleType={ResizeHandleType.UpperLeft} />
            <WindowResizeHandle x={hx} z={hz} handleType={ResizeHandleType.UpperRight} />
            <WindowResizeHandle x={-hx} z={-hz} handleType={ResizeHandleType.LowerLeft} />
            <WindowResizeHandle x={hx} z={-hz} handleType={ResizeHandleType.LowerRight} />

            {/* arch resize handle */}
            {windowType === WindowType.Arched && <ArchResizeHandle z={hz} />}
          </>
        )}
        <WindowMoveHandle handleType={MoveHandleType.Mid} />
      </group>

      {isOnRoof && showIntersectionPlane && (
        <Plane
          name={INTERSECTION_PLANE_NAME}
          args={[1000, 1000]}
          rotation={[HALF_PI, 0, 0]}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          visible={false}
        >
          <meshBasicMaterial color={'red'} side={DoubleSide} transparent opacity={0.5} />
        </Plane>
      )}
    </>
  );
};

export default React.memo(WindowHandleWrapper);
