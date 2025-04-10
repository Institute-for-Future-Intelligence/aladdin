/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Euler, Vector3 } from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Util } from 'src/Util';
import { RoofSegmentProps } from './roofRenderer';
import { HALF_PI_Z_EULER, LOCKED_ELEMENT_SELECTION_COLOR, UNIT_VECTOR_POS_Z } from 'src/constants';
import { WallModel } from 'src/models/WallModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { RoofModel, RoofType } from 'src/models/RoofModel';
import { WALL_PADDING } from '../wall/wall';
import { WindowModel, WindowType } from '../../models/WindowModel';
import { FoundationModel } from '../../models/FoundationModel';
import { DEFAULT_POLYGONTOP } from '../window/window';
import { ComposedWall } from './hooks';
import { useDataStore } from 'src/stores/commonData';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';

export class RoofUtil {
  // roof related

  static getWireframeStyle(lineColor: string, lineWidth: number, selected: boolean, locked?: boolean) {
    const _lineColor = selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor;
    const _lineWidth = selected && locked ? 1 : lineWidth;
    return [_lineColor, _lineWidth] as [string, number];
  }

  static getComposedWallNormal(wall: ComposedWall) {
    return new Vector3().subVectors(wall.leftPoint, wall.rightPoint).applyEuler(HALF_PI_Z_EULER).normalize();
  }

  // to be deleted
  static getWallNormal(wall: WallModel) {
    return new Vector3()
      .subVectors(
        new Vector3(wall.leftPoint[0], wall.leftPoint[1]),
        new Vector3(wall.rightPoint[0], wall.rightPoint[1]),
      )
      .applyEuler(HALF_PI_Z_EULER)
      .normalize();
  }

  static isTypeRoof(type: ObjectType) {
    return (
      type === ObjectType.Roof ||
      type === ObjectType.PyramidRoof ||
      type === ObjectType.HipRoof ||
      type === ObjectType.GableRoof ||
      type === ObjectType.GambrelRoof ||
      type === ObjectType.MansardRoof
    );
  }

  static getIntersectionPoint(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3) {
    if (Math.abs(v1.x - v2.x) < 0.001 && Math.abs(v3.x - v4.x) < 0.001) {
      return v2.clone();
    }
    const k1 = (v2.y - v1.y) / (v2.x - v1.x);
    const k2 = (v4.y - v3.y) / (v4.x - v3.x);
    if (Math.abs(k1 - k2) < 0.001) {
      return v2.clone();
    }
    const x = [v1.x, v2.x, v3.x, v4.x];
    const y = [v1.y, v2.y, v3.y, v4.y];
    const x0 =
      ((x[2] - x[3]) * (x[1] * y[0] - x[0] * y[1]) - (x[0] - x[1]) * (x[3] * y[2] - x[2] * y[3])) /
      ((x[2] - x[3]) * (y[0] - y[1]) - (x[0] - x[1]) * (y[2] - y[3]));
    const y0 =
      ((y[2] - y[3]) * (y[1] * x[0] - y[0] * x[1]) - (y[0] - y[1]) * (y[3] * x[2] - y[2] * x[3])) /
      ((y[2] - y[3]) * (x[0] - x[1]) - (y[0] - y[1]) * (x[2] - x[3]));
    if (!Number.isFinite(x0) || !Number.isFinite(y0)) {
      return v2.clone();
    }
    return new Vector3(x0, y0);
  }

  /** distance from point p3 to line formed by p1 and p2 in 2D */
  static getDistance(p1: Vector3, p2: Vector3, p3: Vector3) {
    const A = p2.y - p1.y;
    if (A === 0) {
      return Math.abs(p1.y - p3.y);
    }
    const B = p1.x - p2.x;
    if (B === 0) {
      return Math.abs(p1.x - p3.x);
    }
    const C = p2.x * p1.y - p1.x * p2.y;
    const res = Math.abs((A * p3.x + B * p3.y + C) / Math.sqrt(A * A + B * B));
    return res === 0 ? Infinity : res;
  }

  static getWallPoints2D(
    wall: WallModel,
    centerRoofHeight?: number[],
    centerLeftRoofHeight?: number[],
    centerRightRoofHeight?: number[],
  ) {
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
  }

  static isPointInside(wallPoints2D: Point2[], x: number, y: number) {
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
  }

  static isRoofValid(
    roofId: string,
    currWallId?: string,
    counterWallId?: string,
    centerRoofHeight?: number[],
    centerLeftRoofHeight?: number[],
    centerRightRoofHeight?: number[],
  ) {
    for (const element of useStore.getState().elements) {
      if (element.type === ObjectType.Wall && (element as WallModel).roofId === roofId) {
        const wall = element as WallModel;
        let points: Point2[] = [];
        if (wall.id === currWallId) {
          points = RoofUtil.getWallPoints2D(wall, centerRoofHeight, centerLeftRoofHeight, centerRightRoofHeight);
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
          points = RoofUtil.getWallPoints2D(wall, ch, cl, cr);
        }
        if (wall.id === currWallId || wall.id === counterWallId) {
          for (const e of useStore.getState().elements) {
            if (e.parentId === wall.id) {
              let hx = e.lx / 2;
              let hz = e.lz / 2;
              let padding = WALL_PADDING;
              if (e.type === ObjectType.SolarPanel) {
                hx = (hx - 0.01) / wall.lx;
                hz = (e.ly / 2 - 0.01) / wall.lz;
                padding = 0;
              }
              const minX = e.cx * wall.lx - hx * wall.lx;
              const maxX = e.cx * wall.lx + hx * wall.lx;
              const maxZ = e.cz * wall.lz + hz * wall.lz + padding;
              if (!RoofUtil.isPointInside(points, minX, maxZ) || !RoofUtil.isPointInside(points, maxX, maxZ)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  // for solar panels and skylight windows on a roof segment
  static getSegmentIdx(roofSegments: RoofSegmentProps[], posRelToCentroid: Vector3): number {
    for (let i = 0; i < roofSegments.length; i++) {
      const points = roofSegments[i].points.slice(0, 4);
      if (Util.isPointInside(posRelToCentroid.x, posRelToCentroid.y, points.map(Util.mapVector3ToPoint2))) {
        return i;
      }
    }
    return -1;
  }

  static onSegment(vertices: Vector3[], cx: number, cy: number): boolean {
    return Util.isPointInside(cx, cy, vertices.map(Util.mapVector3ToPoint2));
  }

  // less compute but easier to appear bugs
  static getSegmentIdxFromPointerEvent(e: ThreeEvent<PointerEvent>) {
    for (const intersection of e.intersections) {
      if (intersection.object.name.includes('Roof segment')) {
        return parseInt(intersection.object.name.slice(-1));
      }
    }
    return Number.NaN;
  }

  static getSegmentVertices(roofSegments: RoofSegmentProps[], segmentIdx: number, pointer: Vector3) {
    // return orders matter: counterclockwise
    const [wallLeft, wallRight, ridgeRight, ridgeLeft] = roofSegments[segmentIdx].points;
    if (roofSegments[segmentIdx].points.length === 6) {
      return [wallRight, ridgeRight, wallLeft];
    }
    const leftDis = Util.distanceFromPointToLine2D(ridgeLeft, wallLeft, wallRight);
    const rightDis = Util.distanceFromPointToLine2D(ridgeRight, wallLeft, wallRight);
    if (Math.abs(leftDis - rightDis) < 0.01) {
      if (wallLeft.z > wallRight.z) {
        const upperHalf = [ridgeLeft, ridgeRight, wallLeft];
        if (Util.isPointInside(pointer.x, pointer.y, upperHalf.map(Util.mapVector3ToPoint2))) {
          return [wallLeft, ridgeRight, ridgeLeft];
        } else {
          return [wallLeft, wallRight, ridgeRight];
        }
      } else {
        const upperHalf = [ridgeLeft, ridgeRight, wallRight];
        if (Util.isPointInside(pointer.x, pointer.y, upperHalf.map(Util.mapVector3ToPoint2))) {
          return [wallRight, ridgeRight, ridgeLeft];
        } else {
          return [wallRight, ridgeLeft, wallLeft];
        }
      }
    } else if (leftDis <= rightDis) {
      const upperHalf = [ridgeLeft, ridgeRight, wallRight];
      if (Util.isPointInside(pointer.x, pointer.y, upperHalf.map(Util.mapVector3ToPoint2))) {
        return [wallRight, ridgeRight, ridgeLeft];
      } else {
        return [wallRight, ridgeLeft, wallLeft];
      }
    } else {
      const upperHalf = [ridgeLeft, ridgeRight, wallLeft];
      if (Util.isPointInside(pointer.x, pointer.y, upperHalf.map(Util.mapVector3ToPoint2))) {
        return [wallLeft, ridgeRight, ridgeLeft];
      } else {
        return [wallLeft, wallRight, ridgeRight];
      }
    }
  }

  static getSegmentNormal(vertices: Vector3[]) {
    // order matters for cross product, counterclockwise, v1 is shared vertex
    const [v1, v2, v3] = vertices;
    return new Vector3().crossVectors(new Vector3().subVectors(v1, v2), new Vector3().subVectors(v1, v3)).normalize();
  }

  static getRotationFromNormal(normal: Vector3) {
    return Util.isSame(normal.normalize(), UNIT_VECTOR_POS_Z)
      ? [0, 0, 0]
      : [
          Math.PI / 2 - Math.atan2(normal.z, Math.hypot(normal.x, normal.y)),
          0,
          Math.atan2(normal.y, normal.x) + Math.PI / 2,
        ];
  }

  static getRooftopElementZ(vertices: Vector3[], pos: Vector3, roofHeight: number) {
    const [v1, v2, v3] = vertices;
    const A = (v2.y - v1.y) * (v3.z - v1.z) - (v2.z - v1.z) * (v3.y - v1.y);
    const B = (v2.z - v1.z) * (v3.x - v1.x) - (v2.x - v1.x) * (v3.z - v1.z);
    const C = (v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x);
    const D = -(A * v1.x + B * v1.y + C * v1.z);
    return -(D + A * pos.x + B * pos.y) / C + roofHeight;
  }

  // return triangulated vertices
  static computeState(roofSegments: RoofSegmentProps[], posRelToCentroid: Vector3, isFlatGambrel?: boolean) {
    const segmentIdx = RoofUtil.getSegmentIdx(roofSegments, posRelToCentroid);
    if (isFlatGambrel) {
      return { segmentIdx: -1, segmentVertices: null, normal: new Vector3(0, 0, 1), rotation: [0, 0, 0] };
    }
    if (segmentIdx !== -1) {
      const segmentVertices = RoofUtil.getSegmentVertices(roofSegments, segmentIdx, posRelToCentroid);
      const normal = RoofUtil.getSegmentNormal(segmentVertices);
      const rotation = RoofUtil.getRotationFromNormal(normal);
      return { segmentIdx, segmentVertices, normal, rotation };
    } else {
      // mansard rooftop surface
      return { segmentIdx: -1, segmentVertices: null, normal: new Vector3(0, 0, 1), rotation: [0, 0, 0] };
    }
  }

  // todo: need to add roofId to each wall when adding roof
  static getOrderedWallArrayOfRoof(roofId: string) {
    const wallMap = new Map<string, WallModel>();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && (e as WallModel).roofId === roofId) {
        wallMap.set(e.id, e as WallModel);
      }
    }

    if (wallMap.size === 0) {
      return { orderedWallArray: [] as WallModel[], isLoop: false };
    }

    const wall0 = wallMap.entries().next().value[1] as WallModel;
    const orderedWallArray = [wall0];

    let nextId = wall0.rightJoints[0];
    while (nextId && nextId !== wall0.id) {
      const nextWall = wallMap.get(nextId);
      if (nextWall) {
        orderedWallArray.push(nextWall);
        nextId = nextWall.rightJoints[0];
      } else {
        break;
      }
    }

    if (nextId === wall0.id) {
      return { orderedWallArray, isLoop: true };
    }

    nextId = wall0.leftJoints[0];
    while (nextId) {
      const nextWall = wallMap.get(nextId);
      if (nextWall) {
        orderedWallArray.unshift(nextWall);
        nextId = nextWall.leftJoints[0];
      } else {
        break;
      }
    }

    return { orderedWallArray, isLoop: false };
  }

  static getRoofBoundaryVertices(roof: RoofModel) {
    const segments = useDataStore.getState().roofSegmentVerticesMap.get(roof.id);
    if (!segments) throw new Error();
    // flat roof
    if (roof.roofType !== RoofType.Gable && roof.rise < 0.01) {
      return segments[0].map((v) => ({ x: v.x, y: v.y } as Point2));
    }
    switch (roof.roofType) {
      case RoofType.Gable: {
        if (segments.length === 1) {
          return segments[0].map((p) => ({ x: p.x, y: p.y }));
        }
        return segments.reduce((acc, points) => {
          acc.push({ x: points[0].x, y: points[0].y }, { x: points[1].x, y: points[1].y });
          return acc;
        }, [] as Point2[]);
      }
      case RoofType.Gambrel: {
        return segments.reduce((acc, points, idx) => {
          if (idx === 0 || idx === 3) {
            acc.push({ x: points[0].x, y: points[0].y }, { x: points[1].x, y: points[1].y });
          }
          return acc;
        }, [] as Point2[]);
      }
      case RoofType.Mansard: {
        return segments.reduce((acc, points, idx) => {
          if (idx !== segments.length - 1) {
            acc.push({ x: points[0].x, y: points[0].y });
          }
          return acc;
        }, [] as Point2[]);
      }
      default: {
        return segments.reduce((acc, points, idx) => {
          acc.push({ x: points[0].x, y: points[0].y });
          return acc;
        }, [] as Point2[]);
      }
    }
  }

  static getAbsoluteWindowVerticesOnRoof(window: WindowModel, foundation: FoundationModel): Vector3[] {
    const vertices: Vector3[] = [];
    const center = new Vector3(window.cx, window.cy, window.cz);
    const foundationCenter = new Vector3(foundation.cx, foundation.cy, foundation.lz);
    if (window.windowType === WindowType.Arched) {
      const ah = Math.min(window.archHeight, window.lx / 2, window.lz);
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const vertex =
            i * j > 0
              ? new Vector3((window.lx / 2) * i, (window.lz / 2 - ah) * j * i, 0)
              : new Vector3((window.lx / 2) * i, (window.lz / 2) * j * i, 0);
          vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
          vertex.applyEuler(new Euler(0, 0, foundation.rotation[2], 'ZXY')).add(foundationCenter);
          vertices.push(vertex);
        }
      }
      // approximate the arc with a triangle (arch height is included in window.lz)
      const vertex = new Vector3(0, window.lz / 2, 0);
      vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
      vertex.applyEuler(new Euler(0, 0, foundation.rotation[2], 'ZXY')).add(foundationCenter);
      vertices.push(vertex);
    } else {
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const vertex = new Vector3((window.lx / 2) * i, (window.lz / 2) * j * i, 0);
          vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
          vertex.applyEuler(new Euler(0, 0, foundation.rotation[2], 'ZXY')).add(foundationCenter);
          vertices.push(vertex);
        }
      }
      if (window.windowType === WindowType.Polygonal && window.polygonTop) {
        const vertex = new Vector3(window.lx * window.polygonTop[0], window.lz / 2 + window.polygonTop[1], 0);
        vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
        vertex.applyEuler(new Euler(0, 0, foundation.rotation[2], 'ZXY')).add(foundationCenter);
        vertices.push(vertex);
      }
    }
    return vertices;
  }

  static getRelativeWindowVerticesOnRoof(window: WindowModel): Vector3[] {
    const vertices: Vector3[] = [];
    const center = new Vector3(window.cx, window.cy, window.cz);
    if (window.windowType === WindowType.Arched) {
      const ah = Math.min(window.archHeight, window.lx / 2, window.lz);
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const vertex =
            i * j > 0
              ? new Vector3((window.lx / 2) * i, (window.lz / 2 - ah) * j * i, 0)
              : new Vector3((window.lx / 2) * i, (window.lz / 2) * j * i, 0);
          vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
          vertices.push(vertex);
        }
      }
      // approximate the arc with a triangle (arch height is included in window.lz)
      const vertex = new Vector3(0, window.lz / 2, 0);
      vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
      vertices.push(vertex);
    } else {
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          const vertex = new Vector3((window.lx / 2) * i, (window.lz / 2) * j * i, 0);
          vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
          vertices.push(vertex);
        }
      }
      if (window.windowType === WindowType.Polygonal && window.polygonTop) {
        const vertex = new Vector3(window.lx * window.polygonTop[0], window.lz / 2 + window.polygonTop[1], 0);
        vertex.applyEuler(new Euler(window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY')).add(center);
        vertices.push(vertex);
      }
    }
    return vertices;
  }

  static getAbsoluteSolarPanelVerticesOnRoof(sp: SolarPanelModel, foundation: FoundationModel): Vector3[] {
    const vertices: Vector3[] = [];
    const center = new Vector3(sp.cx, sp.cy, sp.cz);
    const foundationCenter = new Vector3(foundation.cx, foundation.cy, foundation.cz);
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const vertex = new Vector3((sp.lx / 2) * i, (sp.ly / 2) * j * i, 0);
        if (sp.rotation[0] === 0) {
          // has pole
          vertex.applyEuler(new Euler(sp.tiltAngle, 0, sp.relativeAzimuth, 'ZXY')).add(center);
        } else {
          vertex.applyEuler(new Euler(sp.rotation[0], sp.rotation[1], sp.rotation[2], 'ZXY')).add(center);
        }
        vertex.applyEuler(new Euler(0, 0, foundation.rotation[2], 'ZXY')).add(foundationCenter);
        vertices.push(vertex);
      }
    }
    return vertices;
  }

  static getElementVerticesOnRoof(el: ElementModel, foundation: ElementModel): Vector3[] {
    if (el.type === ObjectType.SolarPanel)
      return RoofUtil.getSolarPanelVerticesOnRoof(el as SolarPanelModel, foundation);
    if (el.type === ObjectType.SolarWaterHeater)
      return RoofUtil.getSolarWaterHeaterVerticesOnRoof(el as SolarWaterHeaterModel, foundation);
    return [];
  }

  static getSolarPanelVerticesOnRoof(sp: SolarPanelModel, foundation: ElementModel): Vector3[] {
    const vertices: Vector3[] = [];
    const center = new Vector3(sp.cx, sp.cy, sp.cz + foundation.cz);
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const vertex = new Vector3((sp.lx / 2) * i, (sp.ly / 2) * j * i, 0);
        if (sp.rotation[0] === 0) {
          // has pole
          vertex.applyEuler(new Euler(sp.tiltAngle, 0, sp.relativeAzimuth, 'ZXY')).add(center);
        } else {
          vertex.applyEuler(new Euler(sp.rotation[0], sp.rotation[1], sp.rotation[2], 'ZXY')).add(center);
        }
        vertices.push(vertex);
      }
    }
    return vertices;
  }

  static getSolarWaterHeaterVerticesOnRoof(swh: SolarWaterHeaterModel, foundation: ElementModel): Vector3[] {
    const vertices: Vector3[] = []; // counter-clockwise
    const { lx, ly, lz, waterTankRadius, relativeAzimuth } = swh;
    const mountHeight = lz - waterTankRadius * 2; // surface to tank bottom, lz is from surface to top
    const angle = Math.asin(Math.min(1, (mountHeight + waterTankRadius) / ly));
    const width2D = ly * Math.cos(angle);

    const topY = ly / 2 + waterTankRadius;
    const center = new Vector3(swh.cx, swh.cy, swh.cz + foundation.cz);
    const euler = new Euler(0, 0, relativeAzimuth, 'ZXY');
    vertices.push(new Vector3(-lx / 2, topY).applyEuler(euler).add(center));
    vertices.push(new Vector3(-lx / 2, topY - width2D).applyEuler(euler).add(center));
    vertices.push(new Vector3(lx / 2, topY - width2D).applyEuler(euler).add(center));
    vertices.push(new Vector3(lx / 2, topY).applyEuler(euler).add(center));
    return vertices;
  }

  static getWindowVerticesOnRoof(window: WindowModel, margin = 0): Vector3[] {
    const vertices: Vector3[] = [];
    const center = new Vector3(window.cx, window.cy, window.cz);
    const [hx, hy] = [window.lx / 2 + margin, window.lz / 2 + margin];
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const vertex = new Vector3(i * hx, i * j * hy);
        vertex
          .applyEuler(new Euler().fromArray([window.rotation[0], window.rotation[1], window.rotation[2], 'ZXY']))
          .add(center);
        vertices.push(vertex);
      }
    }
    if (window.windowType === WindowType.Polygonal) {
      const [tx, th] = window.polygonTop ?? DEFAULT_POLYGONTOP;
      const vertex = new Vector3(tx * window.lx, window.lz + th).add(center);
      vertices.push(vertex);
    }
    return vertices;
  }

  // state check
  static rooftopElementBoundaryCheck(elementVertices: Vector3[], boundaryVertices: Point2[]): boolean {
    for (const vertex of elementVertices) {
      if (!Util.isPointInside(vertex.x, vertex.y, boundaryVertices)) {
        return false;
      }
    }
    return true;
  }

  static rooftopWindowCollisionCheck(currId: string, currVertices: Vector3[], roofId: string) {
    const targetElementsVertices: Vector3[][] = [];
    for (const el of useStore.getState().elements) {
      if (el.parentId === roofId && el.id !== currId) {
        const vertices = RoofUtil.getWindowVerticesOnRoof(el as WindowModel);
        targetElementsVertices.push(vertices);
      }
    }

    for (const targetVertices of targetElementsVertices) {
      // check if current element vertices inside other(target) element
      for (const currentVertex of currVertices) {
        if (Util.isPointInside(currentVertex.x, currentVertex.y, targetVertices)) {
          return false;
        }
      }
      // check if other element vertices inside current element
      for (const targetVertex of targetVertices) {
        if (Util.isPointInside(targetVertex.x, targetVertex.y, currVertices)) {
          return false;
        }
      }
    }
    return true;
  }

  static rooftopElementCollisionCheck(el: ElementModel, foundation: ElementModel, selfVertices: Vector3[]): boolean {
    for (const elem of useStore.getState().elements) {
      if (
        (elem.type === ObjectType.SolarPanel || elem.type === ObjectType.SolarWaterHeater) &&
        elem.parentId === el.parentId &&
        elem.id !== el.id
      ) {
        const siblingVertices = RoofUtil.getElementVerticesOnRoof(elem, foundation);
        for (const vertex of selfVertices) {
          if (Util.isPointInside(vertex.x, vertex.y, siblingVertices)) {
            return false;
          }
        }
        for (const vertex of siblingVertices) {
          if (Util.isPointInside(vertex.x, vertex.y, selfVertices)) {
            return false;
          }
        }
        const v1 = selfVertices.map(Util.mapVector3ToPoint2);
        const v2 = siblingVertices.map(Util.mapVector3ToPoint2);
        v1.push(v1[0]);
        v2.push(v2[0]);
        for (let i1 = 0; i1 < v1.length - 1; i1++) {
          const from1 = v1[i1];
          const to1 = v1[i1 + 1];
          for (let i2 = 0; i2 < v2.length - 1; i2++) {
            const from2 = v2[i2];
            const to2 = v2[i2 + 1];
            if (Util.lineIntersection(from1, to1, from2, to2)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  static getComposedWallHeight(arr: ComposedWall[], i: number) {
    const w = arr[i];
    let lh;
    let rh;
    if (i === 0) {
      lh = Math.max(w.lz, arr[arr.length - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    } else if (i === arr.length - 1) {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[0].lz);
    } else {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    }
    return { lh, rh };
  }

  static getHighestComposedWallHeight(composedWallArray: ComposedWall[] | null, ignoreSide?: boolean) {
    if (composedWallArray === null) return 0;

    let maxWallHeight = 0;
    if (ignoreSide && composedWallArray.length === 4) {
      return Math.max(composedWallArray[0].lz, composedWallArray[2].lz);
    }
    for (let i = 0; i < composedWallArray.length; i++) {
      const { lh, rh } = RoofUtil.getComposedWallHeight(composedWallArray, i);
      maxWallHeight = Math.max(maxWallHeight, lh, rh);
    }
    return maxWallHeight;
  }

  // to be deleted
  static getWallHeight(arr: WallModel[], i: number) {
    const w = arr[i];
    let lh;
    let rh;
    if (i === 0) {
      lh = Math.max(w.lz, arr[arr.length - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    } else if (i === arr.length - 1) {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[0].lz);
    } else {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    }
    return { lh, rh };
  }

  static getHighestWallHeight(currentWallArray: WallModel[], ignoreSide?: boolean) {
    let maxWallHeight = 0;
    if (ignoreSide && currentWallArray.length === 4) {
      return Math.max(currentWallArray[0].lz, currentWallArray[2].lz);
    }
    for (let i = 0; i < currentWallArray.length; i++) {
      const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
      maxWallHeight = Math.max(maxWallHeight, lh, rh);
    }
    return maxWallHeight;
  }

  static isValidOnRoof(elem: ElementModel | null) {
    if (!elem) return false;
    switch (elem.type) {
      case ObjectType.SolarPanel:
      // return (elem as SolarPanelModel).parentType === ObjectType.Roof;
      // eslint-disable-next-line no-fallthrough
      case ObjectType.Light:
      case ObjectType.Sensor:
        return true;
    }
    return false;
  }

  /** position is relative to foundation */
  static getRotationOnRoof(roofId: string, position: Vector3) {
    const segments = useDataStore.getState().getRoofSegmentVertices(roofId);
    if (!segments) return null;
    for (const segment of segments) {
      if (Util.isPointInside(position.x, position.y, segment)) {
        const normal = RoofUtil.getSegmentNormal(segment);
        return RoofUtil.getRotationFromNormal(normal);
      }
    }
    return null;
  }

  static getRoofSegmentBoundary(roofId: string, position: Vector3) {
    const segments = useDataStore.getState().getRoofSegmentVertices(roofId);
    if (!segments) return null;
    for (const segment of segments) {
      if (Util.isPointInside(position.x, position.y, segment)) {
        return segment;
      }
    }
    return null;
  }

  static getComposedWallLength(wall: ComposedWall) {
    return new Vector3().subVectors(wall.leftPoint, wall.rightPoint).length();
  }

  static getComposedWallCenter(wall: ComposedWall) {
    return new Vector3().addVectors(wall.leftPoint, wall.rightPoint).divideScalar(2);
  }
}
