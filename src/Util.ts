/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import {
  FINE_GRID_SCALE,
  NORMAL_GRID_SCALE,
  ORIGIN_VECTOR2,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from './constants';
import { Euler, Object3D, Scene, Vector2, Vector3 } from 'three';
import { ElementModel } from './models/ElementModel';
import { SolarPanelModel } from './models/SolarPanelModel';
import { MoveHandleType, ObjectType, Orientation, ResizeHandleType, RotateHandleType, WindowState } from './types';
import { PvModel } from './models/PvModel';
import { SensorModel } from './models/SensorModel';
import { WallModel } from './models/WallModel';
import { PolygonModel } from './models/PolygonModel';
import { Point2 } from './models/Point2';
import { useStore } from './stores/common';

export class Util {
  static fetchIntersectables(scene: Scene): Object3D[] {
    const objects: Object3D[] = [];
    scene.traverse((o) => {
      if (!o.userData.unintersectable) {
        objects.push(o);
      }
    });
    return objects;
  }

  static lineIntersection(from1: Point2, to1: Point2, from2: Point2, to2: Point2): Point2 | undefined {
    const dx: number = to1.x - from1.x;
    const dy: number = to1.y - from1.y;

    const determinant: number = dx * (to2.y - from2.y) - (to2.x - from2.x) * dy;
    if (determinant === 0) return undefined; // parallel lines

    const lambda: number =
      ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
    const gamma: number = ((from1.y - to1.y) * (to2.x - from1.x) + dx * (to2.y - from1.y)) / determinant;

    // check if there is an intersection
    if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return undefined;

    return {
      x: from1.x + lambda * dx,
      y: from1.y + lambda * dy,
    } as Point2;
  }

  static doSolarPanelsOverlap(sp1: SolarPanelModel, sp2: SolarPanelModel, parent: ElementModel): boolean {
    if (sp1.parentId !== parent.id || sp2.parentId !== parent.id) return false;
    if (!Util.isIdentical(sp1.normal, sp2.normal)) return false;
    const v1 = Util.fetchSolarPanelVertexCoordinates(sp1, parent);
    const v2 = Util.fetchSolarPanelVertexCoordinates(sp2, parent);
    v1.push(v1[0]);
    v2.push(v2[0]);
    for (let i1 = 0; i1 < v1.length - 1; i1++) {
      const from1 = v1[i1];
      const to1 = v1[i1 + 1];
      for (let i2 = 0; i2 < v2.length - 1; i2++) {
        const from2 = v2[i2];
        const to2 = v2[i2 + 1];
        if (Util.lineIntersection(from1, to1, from2, to2)) return true;
      }
    }
    return false;
  }

  static fetchSolarPanelVertexCoordinates(sp: SolarPanelModel, parent: ElementModel): Point2[] {
    const xc = sp.cx * parent.lx;
    const yc = sp.cy * parent.ly;
    const cosaz = Math.cos(sp.relativeAzimuth);
    const sinaz = Math.sin(sp.relativeAzimuth);
    const rx = sp.lx * 0.5;
    const ry = sp.ly * 0.5 * Math.cos(sp.tiltAngle);
    // corners are stored in the clockwise direction
    const vertices: Point2[] = [];
    // upper-right corner of solar panel
    vertices.push({
      x: xc + rx * cosaz - ry * sinaz,
      y: yc + rx * sinaz + ry * cosaz,
    } as Point2);
    // lower-right corner of solar panel
    vertices.push({
      x: xc + rx * cosaz + ry * sinaz,
      y: yc + rx * sinaz - ry * cosaz,
    } as Point2);
    // lower-left corner of solar panel
    vertices.push({
      x: xc - rx * cosaz + ry * sinaz,
      y: yc - rx * sinaz - ry * cosaz,
    } as Point2);
    // upper-left corner of solar panel
    vertices.push({
      x: xc - rx * cosaz - ry * sinaz,
      y: yc - rx * sinaz + ry * cosaz,
    } as Point2);
    return vertices;
  }

  static panelizeLx(solarPanel: SolarPanelModel, pvModel: PvModel, value: number): number {
    const dx = solarPanel.orientation === Orientation.portrait ? pvModel.width : pvModel.length;
    let lx = value ?? 1;
    const n = Math.max(1, Math.ceil((lx - dx / 2) / dx));
    lx = n * dx;
    return lx;
  }

  static panelizeLy(solarPanel: SolarPanelModel, pvModel: PvModel, value: number): number {
    const dy = solarPanel.orientation === Orientation.portrait ? pvModel.length : pvModel.width;
    let ly = value ?? 1;
    const n = Math.max(1, Math.ceil((ly - dy / 2) / dy));
    ly = n * dy;
    return ly;
  }

  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  static pointInsidePolygon(point: Point2, vertices: Point2[]) {
    const x = point.x;
    const y = point.y;
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x,
        yi = vertices[i].y;
      const xj = vertices[j].x,
        yj = vertices[j].y;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  static polygonIntersections(a: Point2, b: Point2, vertices: Point2[]): Point2[] {
    const intersections = new Array<Point2>();
    let v1: Point2, v2: Point2, p: Point2 | undefined;
    for (let i = 0; i < vertices.length - 1; i++) {
      v1 = vertices[i];
      v2 = vertices[i + 1];
      p = Util.lineIntersection(a, b, v1, v2);
      if (p) {
        intersections.push(p);
      }
    }
    v1 = vertices[vertices.length - 1];
    v2 = vertices[0];
    p = Util.lineIntersection(a, b, v1, v2);
    if (p) {
      intersections.push(p);
    }
    return intersections;
  }

  static calculatePolygonBounds(vertices: Point2[]) {
    let minX = vertices[0].x;
    let maxX = vertices[0].x;
    let minY = vertices[0].y;
    let maxY = vertices[0].y;
    for (const [i, v] of vertices.entries()) {
      if (i > 0) {
        if (minX > v.x) minX = v.x;
        if (minY > v.y) minY = v.y;
        if (maxX < v.x) maxX = v.x;
        if (maxY < v.y) maxY = v.y;
      }
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  static calculatePolygonCentroid(vertices: Point2[]): Point2 {
    // it is OK to use a shallow copy here since we are not modifying the objects in the array
    const pts = [...vertices];
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first.x !== last.x || first.y !== last.y) pts.push(first);
    const nPts = pts.length;
    let twiceArea = 0,
      x = 0,
      y = 0;
    let p1, p2, f;
    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
      p1 = pts[i];
      p2 = pts[j];
      f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
      twiceArea += f;
      x += (p1.x + p2.x - 2 * first.x) * f;
      y += (p1.y + p2.y - 2 * first.y) * f;
    }
    f = twiceArea * 3;
    return { x: x / f + first.x, y: y / f + first.y } as Point2;
  }

  static translatePolygonCenterTo(polygonModel: PolygonModel, x: number, y: number): void {
    const n = polygonModel.vertices.length;
    if (n === 0) return;
    const centroid = Util.calculatePolygonCentroid(polygonModel.vertices);
    const dx = x - centroid.x;
    const dy = y - centroid.y;
    for (const v of polygonModel.vertices) {
      v.x += dx;
      v.y += dy;
    }
  }

  // note: this assumes that the center of the parent does NOT change
  static doesNewSizeContainAllChildren(
    parent: ElementModel,
    children: ElementModel[],
    lx: number,
    ly: number,
  ): boolean {
    const childAbsPosMap = new Map<string, Vector2>();
    for (const c of children) {
      switch (c.type) {
        case ObjectType.Wall:
          // TODO
          break;
        case ObjectType.SolarPanel:
        case ObjectType.Sensor:
          const absPos = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(
            ORIGIN_VECTOR2,
            parent.rotation[2],
          );
          childAbsPosMap.set(c.id, absPos);
          break;
      }
    }
    const childrenClone: ElementModel[] = [];
    for (const c of children) {
      const childClone = JSON.parse(JSON.stringify(c));
      childrenClone.push(childClone);
      const childAbsPos = childAbsPosMap.get(c.id);
      if (childAbsPos) {
        const relativePos = new Vector2(childAbsPos.x, childAbsPos.y).rotateAround(ORIGIN_VECTOR2, -c.rotation[2]);
        childClone.cx = relativePos.x / lx;
        childClone.cy = relativePos.y / ly;
      }
    }
    const parentClone = JSON.parse(JSON.stringify(parent));
    parentClone.lx = lx;
    parentClone.ly = ly;
    return Util.doesParentContainAllChildren(parentClone, childrenClone);
  }

  // TODO: Vertical surfaces
  static doesParentContainAllChildren(parent: ElementModel, children: ElementModel[]): boolean {
    for (const e of children) {
      switch (e.type) {
        case ObjectType.SolarPanel:
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSolarPanelWithinHorizontalSurface(e as SolarPanelModel, parent)) {
              return false;
            }
          }
          break;
        case ObjectType.Sensor:
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSensorWithin(e as SensorModel, parent)) {
              return false;
            }
          }
          break;
        case ObjectType.Wall:
          if (!Util.isWallWithin(e as WallModel, parent)) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  static isWallWithin(wall: WallModel, parent: ElementModel): boolean {
    const dx = parent.lx * 0.5;
    const dy = parent.ly * 0.5;
    const lx = wall.leftPoint[0]; // left point x
    const ly = wall.leftPoint[1]; // left point y
    if (Math.abs(lx) >= dx || Math.abs(ly) >= dy) {
      return false;
    }
    const rx = wall.rightPoint[0]; // right point x
    const ry = wall.rightPoint[1]; // right point y
    if (Math.abs(rx) >= dx || Math.abs(ry) >= dy) {
      return false;
    }
    return true;
  }

  static isSensorWithin(sensor: SensorModel, parent: ElementModel): boolean {
    return Math.abs(sensor.cx) < 0.5 - sensor.lx / parent.lx && Math.abs(sensor.cy) < 0.5 - sensor.ly / parent.ly;
  }

  static isSolarPanelWithinHorizontalSurface(solarPanel: SolarPanelModel, parent: ElementModel): boolean {
    const x0 = solarPanel.cx * parent.lx;
    const y0 = solarPanel.cy * parent.ly;
    const cosaz = Math.cos(solarPanel.relativeAzimuth);
    const sinaz = Math.sin(solarPanel.relativeAzimuth);
    const dx = parent.lx * 0.5;
    const dy = parent.ly * 0.5;
    const rx = solarPanel.lx * 0.5;
    const ry = solarPanel.ly * 0.5 * Math.cos(solarPanel.tiltAngle);
    // vertex 1
    let x = x0 + rx * cosaz - ry * sinaz;
    let y = y0 + rx * sinaz + ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 2
    x = x0 + rx * cosaz + ry * sinaz;
    y = y0 + rx * sinaz - ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 3
    x = x0 - rx * cosaz - ry * sinaz;
    y = y0 - rx * sinaz + ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 4
    x = x0 - rx * cosaz + ry * sinaz;
    y = y0 - rx * sinaz - ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // all in
    return true;
  }

  static isUnitVectorX(v: Vector3): boolean {
    return Util.isSame(v, UNIT_VECTOR_POS_X) || Util.isSame(v, UNIT_VECTOR_NEG_X);
  }

  static isUnitVectorY(v: Vector3): boolean {
    return Util.isSame(v, UNIT_VECTOR_POS_Y) || Util.isSame(v, UNIT_VECTOR_NEG_Y);
  }

  static isSame(u: Vector3, v: Vector3): boolean {
    return (
      Math.abs(u.x - v.x) < ZERO_TOLERANCE &&
      Math.abs(u.y - v.y) < ZERO_TOLERANCE &&
      Math.abs(u.z - v.z) < ZERO_TOLERANCE
    );
  }

  static isIdentical(u?: number[], v?: number[]): boolean {
    if (!u || !v || u.length !== v.length) return false;
    if (u === v) return true;
    for (let i = 0; i < u.length; i++) {
      if (Math.abs(u[i] - v[i]) > ZERO_TOLERANCE) return false;
    }
    return true;
  }

  static isZero(x: number): boolean {
    return Math.abs(x) < ZERO_TOLERANCE;
  }

  static deleteElement(a: any[], e: any) {
    const i = a.indexOf(e, 0);
    if (i > -1) {
      a.splice(i, 1);
    }
  }

  static isResizingVertical(handle: ResizeHandleType | null): boolean {
    switch (handle) {
      case ResizeHandleType.LowerLeftTop:
      case ResizeHandleType.UpperLeftTop:
      case ResizeHandleType.LowerRightTop:
      case ResizeHandleType.UpperRightTop:
        return true;
      default:
        return false;
    }
  }

  static isTopResizeHandle(handle: MoveHandleType | ResizeHandleType | RotateHandleType | null): boolean {
    // unfortunately, I cannot find a better way to tell the type of enum variable
    return (
      handle === ResizeHandleType.LowerLeftTop ||
      handle === ResizeHandleType.LowerRightTop ||
      handle === ResizeHandleType.UpperLeftTop ||
      handle === ResizeHandleType.UpperRightTop ||
      handle === ResizeHandleType.Top
    );
  }

  static isMoveHandle(handle: MoveHandleType | ResizeHandleType | RotateHandleType | null): boolean {
    // unfortunately, I cannot find a better way to tell the type of enum variable
    return (
      handle === MoveHandleType.Default ||
      handle === MoveHandleType.Top ||
      handle === MoveHandleType.Upper ||
      handle === MoveHandleType.Lower ||
      handle === MoveHandleType.Left ||
      handle === MoveHandleType.Right
    );
  }

  static snapToNormalGrid(v: Vector3): Vector3 {
    const x = Math.round(v.x / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE;
    const y = Math.round(v.y / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE;
    return new Vector3(x, y, v.z);
  }

  static snapToFineGrid(v: Vector3): Vector3 {
    const x = Math.round(v.x / FINE_GRID_SCALE) * FINE_GRID_SCALE;
    const y = Math.round(v.y / FINE_GRID_SCALE) * FINE_GRID_SCALE;
    return new Vector3(x, y, v.z);
  }

  static isPositionRelative(objectType: ObjectType): boolean {
    return (
      objectType === ObjectType.SolarPanel ||
      objectType === ObjectType.Sensor ||
      objectType === ObjectType.Polygon ||
      objectType === ObjectType.Window ||
      objectType === ObjectType.Roof ||
      objectType === ObjectType.Wall
    );
  }

  static checkWindowState(elem: ElementModel): WindowState {
    const eMinX = elem.cx - elem.lx / 2;
    const eMaxX = elem.cx + elem.lx / 2;
    const eMinZ = elem.cz - elem.lz / 2;
    const eMaxZ = elem.cz + elem.lz / 2;
    if (eMinX < -0.5 || eMaxX > 0.5 || eMinZ < -0.5 || eMaxZ > 0.5) {
      return WindowState.OutsideBoundary;
    }
    for (const e of useStore.getState().elements) {
      // check collision with other windows
      if (e.type === ObjectType.Window && e.parentId === elem.parentId && e.id !== elem.id) {
        // target window
        const tMinX = e.cx - e.lx / 2;
        const tMaxX = e.cx + e.lx / 2;
        const tMinZ = e.cz - e.lz / 2;
        const tMaxZ = e.cz + e.lz / 2;
        if (
          ((eMinX >= tMinX && eMinX <= tMaxX) ||
            (eMaxX >= tMinX && eMaxX <= tMaxX) ||
            (tMinX >= eMinX && tMinX <= eMaxX) ||
            (tMaxX >= eMinX && tMaxX <= eMaxX)) &&
          ((eMinZ >= tMinZ && eMinZ <= tMaxZ) ||
            (eMaxZ >= tMinZ && eMaxZ <= tMaxZ) ||
            (tMinZ >= eMinZ && tMinZ <= eMaxZ) ||
            (tMaxZ >= eMinZ && tMaxZ <= eMaxZ))
        ) {
          return WindowState.OverLap;
        }
      }
    }
    return WindowState.Valid;
  }

  static relativeCoordinates(x: number, y: number, z: number, parent: ElementModel): Vector3 {
    const v = new Vector3(x, y, z);
    if (parent.type === ObjectType.Wall) {
      const parentPos = new Vector3(parent.cx, parent.cy); // relative
      const grandParent = useStore.getState().getElementById(parent.parentId);
      if (grandParent) {
        const grandParentPos = new Vector3(grandParent.cx, grandParent.cy); // world
        parentPos
          .applyEuler(new Euler(0, 0, grandParent.rotation[2]))
          .add(grandParentPos)
          .setZ(grandParent.lz + parent.lz / 2); // world
        v.sub(parentPos).applyEuler(new Euler(0, 0, -(parent as WallModel).relativeAngle));
      }
    } else {
      v.set(x - parent.cx, y - parent.cy, z - parent.cz);
      v.applyEuler(new Euler().fromArray(parent.rotation.map((a) => -a)));
    }
    v.x /= parent.lx;
    v.y /= parent.ly;
    v.z /= parent.lz;
    return v;
  }

  static absoluteCoordinates(x: number, y: number, z: number, parent: ElementModel): Vector3 {
    const v = new Vector3(x * parent.lx, y * parent.ly, z * parent.lz);
    v.applyEuler(new Euler().fromArray(parent.rotation));
    v.x += parent.cx;
    v.y += parent.cy;
    v.z += parent.cz;
    return v;
  }

  // no normalization
  static relativePoint(point: Vector3, parent: ElementModel): Vector3 {
    const v = new Vector3(point.x - parent.cx, point.y - parent.cy, point.z - parent.cz);
    v.applyEuler(new Euler().fromArray(parent.rotation.map((a) => -a)));
    return v;
  }

  static wallAbsolutePosition(v: Vector3, parent: ElementModel): Vector3 {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3().addVectors(
      parentPos,
      new Vector3(v.x, v.y).applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]),
    );
  }

  static wallRelativePosition(v: Vector3, parent: ElementModel): Vector3 {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3()
      .subVectors(new Vector3(v.x, v.y), parentPos)
      .applyAxisAngle(UNIT_VECTOR_POS_Z, -parent.rotation[2]);
  }

  static getObjectChildById(object: Object3D | null | undefined, id: string): Object3D | null {
    if (object) {
      for (const obj of object.children) {
        if (obj.name.includes(`${id}`)) {
          return obj;
        }
      }
    }
    return null;
  }

  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  static sphericalToCartesianZ(sphereCoords: Vector3): Vector3 {
    let a = sphereCoords.x * Math.cos(sphereCoords.z);
    let x = a * Math.cos(sphereCoords.y);
    let y = a * Math.sin(sphereCoords.y);
    let z = sphereCoords.x * Math.sin(sphereCoords.z);
    sphereCoords.set(x, y, z);
    return sphereCoords;
  }

  // the spherical law of cosines: https://en.wikipedia.org/wiki/Spherical_law_of_cosines
  static getDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
    lng1 = Util.toRadians(lng1);
    lat1 = Util.toRadians(lat1);
    lng2 = Util.toRadians(lng2);
    lat2 = Util.toRadians(lat2);
    return Math.acos(
      Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(Math.abs(lng1 - lng2)),
    );
  }

  static minutesIntoDay(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  static daysIntoYear(date: string): number {
    return Util.dayOfYear(new Date(date));
  }

  static dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  static daysOfMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  static fahrenheitToCelsius(temp: number): number {
    return ((temp - 32) * 5) / 9;
  }

  static celsiusToFahrenheit(temp: number): number {
    return temp * (9 / 5) + 32;
  }

  static getOS(): string | null {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
    return os;
  }
}
