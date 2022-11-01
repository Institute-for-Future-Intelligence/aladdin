import { Euler, Vector3 } from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { Util } from 'src/Util';
import { ConvexGeoProps } from './roofRenderer';
import { HALF_PI_Z_EULER, UNIT_VECTOR_POS_Z } from 'src/constants';
import { WallModel } from 'src/models/WallModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';

export class RoofUtil {
  // roof related
  static getWallNormal(wall: WallModel) {
    return new Vector3()
      .subVectors(
        new Vector3(wall.leftPoint[0], wall.leftPoint[1]),
        new Vector3(wall.rightPoint[0], wall.rightPoint[1]),
      )
      .applyEuler(HALF_PI_Z_EULER)
      .normalize();
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

  // distance from point p3 to line formed by p1 and p2
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
              if (e.type === ObjectType.SolarPanel) {
                hx = hx / wall.lx;
                hz = e.ly / wall.lz / 2;
              }
              const minX = e.cx * wall.lx - hx * wall.lx;
              const maxX = e.cx * wall.lx + hx * wall.lx;
              const maxZ = e.cz * wall.lz + hz * wall.lz + 0.5;
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

  // solar panel related
  static getSegmentIdx(roofSegments: ConvexGeoProps[], posRelToCentroid: Vector3) {
    for (let i = 0; i < roofSegments.length; i++) {
      const points = roofSegments[i].points.slice(0, 4);
      if (Util.isPointInside(posRelToCentroid.x, posRelToCentroid.y, points.map(Util.mapVector3ToPoint2))) {
        return i;
      }
    }
    return -1;
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

  static getSegmentVertices(roofSegments: ConvexGeoProps[], segmentIdx: number, pointer: Vector3) {
    // return orders matter: couter clockwise
    const [wallLeft, wallRight, ridgeRight, ridgeLeft] = roofSegments[segmentIdx].points;
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
    // order matters for cross product, counter clockwise, v1 is shared vertice
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

  static getSolarPanelZ(vertices: Vector3[], pos: Vector3, roofHeight: number) {
    const [v1, v2, v3] = vertices;
    const A = (v2.y - v1.y) * (v3.z - v1.z) - (v2.z - v1.z) * (v3.y - v1.y);
    const B = (v2.z - v1.z) * (v3.x - v1.x) - (v2.x - v1.x) * (v3.z - v1.z);
    const C = (v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x);
    const D = -(A * v1.x + B * v1.y + C * v1.z);
    return -(D + A * pos.x + B * pos.y) / C + roofHeight;
  }

  static computeState(roofSegments: ConvexGeoProps[], posRelToCentroid: Vector3) {
    const segmentIdx = RoofUtil.getSegmentIdx(roofSegments, posRelToCentroid);
    if (segmentIdx !== -1) {
      const segmentVertices = RoofUtil.getSegmentVertices(roofSegments, segmentIdx, posRelToCentroid);
      const normal = RoofUtil.getSegmentNormal(segmentVertices);
      const rotation = RoofUtil.getRotationFromNormal(normal);
      return { segmentIdx, segmentVertices, normal, rotation };
    }
    // mansard roof top surface
    return { segmentIdx: -1, segmentVertices: null, normal: new Vector3(0, 0, 1), rotation: [0, 0, 0] };
  }

  static getBoundaryVertices(roofId: string, wall: WallModel, overhang: number) {
    const vertices = Util.getWallPoints(roofId, wall);
    const centroid = Util.calculatePolygonCentroid(vertices);
    const centroidVector = new Vector3(centroid.x, centroid.y);
    overhang += 0.1;
    return vertices.map((v) => {
      const diff = new Vector3(v.x, v.y).sub(centroidVector);
      diff.setX(diff.x + overhang * Math.sign(diff.x));
      diff.setY(diff.y + overhang * Math.sign(diff.y));
      const res = new Vector3().addVectors(centroidVector, diff);
      return { x: res.x, y: res.y };
    });
  }

  static getSolarPanelVerticesOnRoof(sp: SolarPanelModel, foundation: ElementModel) {
    const vertices: Vector3[] = [];
    const center = new Vector3(sp.cx * foundation.lx, sp.cy * foundation.ly, sp.cz + foundation.lz);
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const vertex = new Vector3((sp.lx / 2) * i, (sp.ly / 2) * j * i, 0);
        // has pole
        if (sp.rotation[0] === 0) {
          vertex.applyEuler(new Euler(sp.tiltAngle, 0, sp.relativeAzimuth, 'ZXY')).add(center);
        } else {
          vertex.applyEuler(new Euler(sp.rotation[0], sp.rotation[1], sp.rotation[2], 'ZXY')).add(center);
        }
        vertices.push(vertex);
      }
    }
    return vertices;
  }

  // state check
  static rooftopSPBoundaryCheck(solarPanelVertices: Vector3[], wallVertices: Point2[]) {
    for (const vertex of solarPanelVertices) {
      if (!Util.isPointInside(vertex.x, vertex.y, wallVertices)) {
        return false;
      }
    }
    return true;
  }

  static rooftopSPCollisionCheck(sp: SolarPanelModel, foundation: ElementModel, spVertices: Vector3[]) {
    for (const elem of useStore.getState().elements) {
      if (elem.type === sp.type && elem.parentId === sp.parentId && elem.id !== sp.id) {
        const sp2Vertices = RoofUtil.getSolarPanelVerticesOnRoof(elem as SolarPanelModel, foundation);
        for (const vertex of spVertices) {
          if (Util.isPointInside(vertex.x, vertex.y, sp2Vertices)) {
            return false;
          }
        }
        for (const vertex of sp2Vertices) {
          if (Util.isPointInside(vertex.x, vertex.y, spVertices)) {
            return false;
          }
        }
        const v1 = spVertices.map(Util.mapVector3ToPoint2);
        const v2 = sp2Vertices.map(Util.mapVector3ToPoint2);
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
}
