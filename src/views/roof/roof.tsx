/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import RoofTextureDefault from 'src/resources/roof_edge.png';
import RoofTexture00 from 'src/resources/roof_00.png';
import RoofTexture01 from 'src/resources/roof_01.png';
import RoofTexture02 from 'src/resources/roof_02.png';
import RoofTexture03 from 'src/resources/roof_03.png';
import RoofTexture04 from 'src/resources/roof_04.png';
import RoofTexture05 from 'src/resources/roof_05.png';
import RoofTexture06 from 'src/resources/roof_06.png';
import RoofTexture07 from 'src/resources/roof_07.png';

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../stores/common';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofModel,
  RoofType,
} from '../../models/RoofModel';
import * as Selector from '../../stores/selector';
import PyramidRoof from './pyramidRoof';
import GableRoof from './gableRoof';
import HipRoof from './hipRoof';
import GambrelRoof from './gambrelRoof';
import { UndoableResizeRoofHeight } from 'src/undo/UndoableResize';
import MansardRoof from './mansardRoof';
import { Euler, RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { ObjectType, RoofTexture } from 'src/types';
import { ThreeEvent } from '@react-three/fiber';
import { WallModel } from 'src/models/WallModel';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { Point2 } from 'src/models/Point2';

export const euler = new Euler(0, 0, HALF_PI);
export interface ConvexGeoProps {
  points: Vector3[];
  direction: number;
  length: number;
}

export interface RoofWireframeProps {
  roofSegments: ConvexGeoProps[];
  thickness: number;
  lineWidth: number;
  lineColor: string;
}

export const handleUndoableResizeRoofHeight = (elemId: string, oldHeight: number, newHeight: number) => {
  const undoableResizeRoofHeight = {
    name: 'Resize Roof Height',
    timestamp: Date.now(),
    resizedElementId: elemId,
    resizedElementType: ObjectType.Roof,
    oldHeight: oldHeight,
    newHeight: newHeight,
    undo: () => {
      useStore
        .getState()
        .updateRoofHeight(undoableResizeRoofHeight.resizedElementId, undoableResizeRoofHeight.oldHeight);
    },
    redo: () => {
      useStore
        .getState()
        .updateRoofHeight(undoableResizeRoofHeight.resizedElementId, undoableResizeRoofHeight.newHeight);
    },
  } as UndoableResizeRoofHeight;
  useStore.getState().addUndoable(undoableResizeRoofHeight);
};

export const useRoofTexture = (textureType: RoofTexture) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case RoofTexture.NoTexture:
        textureImg = RoofTexture00;
        break;
      case RoofTexture.Texture01:
        textureImg = RoofTexture01;
        break;
      case RoofTexture.Texture02:
        textureImg = RoofTexture02;
        break;
      case RoofTexture.Texture03:
        textureImg = RoofTexture03;
        break;
      case RoofTexture.Texture04:
        textureImg = RoofTexture04;
        break;
      case RoofTexture.Texture05:
        textureImg = RoofTexture05;
        break;
      case RoofTexture.Texture06:
        textureImg = RoofTexture06;
        break;
      case RoofTexture.Texture07:
        textureImg = RoofTexture07;
        break;
      default:
        textureImg = RoofTextureDefault;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      switch (textureType) {
        case RoofTexture.NoTexture:
        case RoofTexture.Default:
          texture.repeat.set(4, 4);
          break;
        case RoofTexture.Texture01:
          texture.repeat.set(0.5, 0.5);
          break;
        case RoofTexture.Texture03:
          texture.repeat.set(0.9, 0.9);
          break;
        case RoofTexture.Texture04:
        case RoofTexture.Texture05:
        case RoofTexture.Texture06:
          texture.repeat.set(0.75, 0.75);
          break;
        default:
          texture.repeat.set(0.5, 0.5);
      }
      setTexture(texture);
    });
  }, [textureType]);

  const [texture, setTexture] = useState(textureLoader);
  return texture;
};

export const handleRoofPointerDown = (e: ThreeEvent<PointerEvent>, id: string, foundationId: string) => {
  if (useStore.getState().isAddingElement()) {
    return;
  }
  if (e.intersections.length > 0 && e.intersections[0].eventObject.name === e.eventObject.name) {
    e.stopPropagation();
    useStore.getState().set((state) => {
      if (state.groupActionMode) {
        for (const e of state.elements) {
          e.selected = e.id === foundationId;
        }
        state.elementGroupId = foundationId;
      } else {
        for (const e of state.elements) {
          if (e.id === id) {
            e.selected = true;
            state.selectedElement = e;
          } else {
            e.selected = false;
          }
        }
      }
    });
  }
};

export const handleRoofContextMenu = (e: ThreeEvent<MouseEvent>, id: string) => {
  if (e.intersections.length > 0 && e.intersections[0].eventObject.name === e.eventObject.name) {
    e.stopPropagation();
    useStore.getState().set((state) => {
      state.contextMenuObjectType = ObjectType.Roof;
      for (const e of state.elements) {
        if (e.id === id) {
          e.selected = true;
          state.selectedElement = e;
        } else {
          e.selected = false;
        }
      }
    });
  }
};

export const getNormal = (wall: WallModel) => {
  return new Vector3()
    .subVectors(new Vector3(wall.leftPoint[0], wall.leftPoint[1]), new Vector3(wall.rightPoint[0], wall.rightPoint[1]))
    .applyEuler(euler)
    .normalize();
};

export const getIntersectionPoint = (v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3) => {
  const x = [v1.x, v2.x, v3.x, v4.x];
  const y = [v1.y, v2.y, v3.y, v4.y];
  const x0 =
    ((x[2] - x[3]) * (x[1] * y[0] - x[0] * y[1]) - (x[0] - x[1]) * (x[3] * y[2] - x[2] * y[3])) /
    ((x[2] - x[3]) * (y[0] - y[1]) - (x[0] - x[1]) * (y[2] - y[3]));
  const y0 =
    ((y[2] - y[3]) * (y[1] * x[0] - y[0] * x[1]) - (y[0] - y[1]) * (y[3] * x[2] - y[2] * x[3])) /
    ((y[2] - y[3]) * (x[0] - x[1]) - (y[0] - y[1]) * (x[2] - x[3]));
  return new Vector3(x0, y0);
};

// distance from point p3 to line formed by p1 and p2
export const getDistance = (p1: Vector3, p2: Vector3, p3: Vector3) => {
  const A = p2.y - p1.y;
  const B = p1.x - p2.x;
  const C = p2.x * p1.y - p1.x * p2.y;
  const res = Math.abs((A * p3.x + B * p3.y + C) / Math.sqrt(A * A + B * B));
  return res === 0 ? Infinity : res;
};

export const getWallPoints2D = (
  wall: WallModel,
  centerRoofHeight?: number[],
  centerLeftRoofHeight?: number[],
  centerRightRoofHeight?: number[],
) => {
  const { lx, lz, rightRoofHeight, leftRoofHeight } = wall;
  const centerLeft = centerLeftRoofHeight ?? wall.centerLeftRoofHeight;
  const center = centerRoofHeight ?? wall.centerRoofHeight;
  const centerRight = centerRightRoofHeight ?? wall.centerRightRoofHeight;

  const points: Point2[] = [];
  const x = lx / 2;
  const y = lz / 2;
  points.push({ x: -x, y: -y });
  points.push({ x: x, y: -y });
  rightRoofHeight ? points.push({ x: x, y: rightRoofHeight - y }) : points.push({ x: x, y: y });
  if (centerRight) {
    points.push({ x: centerRight[0] * lx, y: centerRight[1] - y });
  }
  if (center) {
    points.push({ x: center[0] * lx, y: center[1] - y });
  }
  if (centerLeft) {
    points.push({ x: centerLeft[0] * lx, y: centerLeft[1] - y });
  }
  leftRoofHeight ? points.push({ x: -x, y: leftRoofHeight - y }) : points.push({ x: -x, y: y });
  return points;
};

export const isPointInside = (wallPoints2D: Point2[], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = wallPoints2D.length - 1; i < wallPoints2D.length; j = i++) {
    const xi = wallPoints2D[i].x;
    const yi = wallPoints2D[i].y;
    const xj = wallPoints2D[j].x;
    const yj = wallPoints2D[j].y;
    if (yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

export const isRoofValid = (
  roofId: string,
  currWallId?: string,
  counterWallId?: string,
  centerRoofHeight?: number[],
  centerLeftRoofHeight?: number[],
  centerRightRoofHeight?: number[],
) => {
  for (const element of useStore.getState().elements) {
    if (element.type === ObjectType.Wall && (element as WallModel).roofId === roofId) {
      const wall = element as WallModel;
      let points: Point2[] = [];
      if (wall.id === currWallId) {
        points = getWallPoints2D(wall, centerRoofHeight, centerLeftRoofHeight, centerRightRoofHeight);
      } else if (wall.id === counterWallId) {
        let ch: number[] | undefined = undefined;
        let cl: number[] | undefined = undefined;
        let cr: number[] | undefined = undefined;
        if (centerRoofHeight) {
          ch = [-centerRoofHeight[0], centerRoofHeight[1]];
        }
        if (centerRightRoofHeight) {
          cl = [-centerRightRoofHeight[0], centerRightRoofHeight[1]];
        }
        if (centerLeftRoofHeight) {
          cr = [-centerLeftRoofHeight[0], centerLeftRoofHeight[1]];
        }
        points = getWallPoints2D(wall, ch, cl, cr);
      }
      if (wall.id === currWallId || wall.id === counterWallId) {
        for (const e of useStore.getState().elements) {
          if (e.parentId === wall.id) {
            const minX = e.cx * wall.lx - (e.lx * wall.lx) / 2;
            const maxX = e.cx * wall.lx + (e.lx * wall.lx) / 2;
            const maxZ = e.cz * wall.lz + (e.lz * wall.lz) / 2 + 0.5;
            if (!isPointInside(points, minX, maxZ) || !isPointInside(points, maxX, maxZ)) {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
};

const Roof = (props: RoofModel) => {
  const removeElementById = useStore(Selector.removeElementById);
  const setCommonStore = useStore(Selector.set);

  const { id, wallsId, roofType, selected, locked } = props;

  // some old files don't have these props
  const _lineColor = selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : props.lineColor ?? 'black';
  const _lineWidth = selected && locked ? 1 : props.lineWidth ?? 0.2;

  useEffect(() => {
    if (wallsId.length === 0) {
      removeElementById(id, false);
    }
  }, [wallsId]);

  if (props.thickness === undefined || props.overhang === undefined) {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).thickness = props.thickness ?? 0.3;
          (e as RoofModel).overhang = props.overhang ?? 0.4;
          return;
        }
      }
    });
    return null;
  }

  const renderRoof = () => {
    switch (roofType) {
      case RoofType.Pyramid:
        return <PyramidRoof {...(props as PyramidRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Gable:
        return <GableRoof {...(props as GableRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Hip:
        return <HipRoof {...(props as HipRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Gambrel:
        return <GambrelRoof {...(props as GambrelRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      case RoofType.Mansard:
        return <MansardRoof {...(props as MansardRoofModel)} lineColor={_lineColor} lineWidth={_lineWidth} />;
      default:
        return null;
    }
  };

  return renderRoof();
};

export default Roof;
