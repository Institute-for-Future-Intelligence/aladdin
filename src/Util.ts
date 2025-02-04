/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import {
  DEFAULT_SHADOW_MAP_SIZE,
  FINE_GRID_SCALE,
  GROUND_ID,
  HALF_PI,
  LAT_LNG_FRACTION_DIGITS,
  NORMAL_GRID_SCALE,
  ORIGIN_VECTOR2,
  SOLAR_HEATMAP_COLORS,
  TWO_PI,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from './constants';
import {
  CanvasTexture,
  Color,
  Euler,
  EulerOrder,
  Object3D,
  Quaternion,
  RepeatWrapping,
  Scene,
  Triangle,
  Vector2,
  Vector3,
} from 'three';
import { ElementModel } from './models/ElementModel';
import { SolarPanelModel } from './models/SolarPanelModel';
import {
  BirdSafeDesign,
  BuildingCompletionStatus,
  Design,
  ElementState,
  ModelSite,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RoofHandleType,
  RotateHandleType,
  TrackerType,
  XYZO,
} from './types';
import { PvModel } from './models/PvModel';
import { SensorModel } from './models/SensorModel';
import { WallFill, WallModel } from './models/WallModel';
import { PolygonModel } from './models/PolygonModel';
import { Point2 } from './models/Point2';
import { useStore } from './stores/common';
import { SolarCollector } from './models/SolarCollector';
import { Rectangle } from './models/Rectangle';
import platform from 'platform';
import { RoofModel, RoofType } from './models/RoofModel';
import { RoofUtil } from './views/roof/RoofUtil';
import { FoundationModel } from './models/FoundationModel';
import { WindowModel, WindowType } from './models/WindowModel';
import { DoorModel, DoorType } from './models/DoorModel';
import { CUBOID_STACKABLE_CHILD, CUBOID_WRAPPER_NAME } from './views/cuboid';
import { ViewState } from './stores/ViewState';
import { WindTurbineModel } from './models/WindTurbineModel';
import { HvacSystem } from './models/HvacSystem';
import { BatteryStorageModel } from './models/BatteryStorageModel';

export class Util {
  static getHeatingSetpoint(now: Date, hvac: HvacSystem | undefined) {
    if (!hvac) return 20;
    if (!hvac.type || hvac.type === 'Simple') {
      return hvac.heatingSetpoint ?? hvac.thermostatSetpoint ?? 20;
    } else if (hvac.type === 'Programmable') {
      const setpoints = hvac.thermostatSetpoints;
      if (setpoints) {
        const nowTime = now.getHours() + now.getMinutes() / 60;
        for (let i = 0; i < setpoints.length; i++) {
          const currPeriodTime = setpoints[i].time;
          if (nowTime < currPeriodTime) {
            const idx = (i + setpoints.length - 1) % setpoints.length;
            return setpoints[idx].heat;
          } else if (i === setpoints.length - 1) {
            return setpoints[i].heat;
          }
        }
      }
    }
    return 20;
  }

  static getCoolingSetpoint(now: Date, hvac: HvacSystem | undefined) {
    if (!hvac) return 20;
    if (!hvac.type || hvac.type === 'Simple') {
      return hvac.coolingSetpoint ?? hvac.thermostatSetpoint ?? 20;
    } else if (hvac.type === 'Programmable') {
      const setpoints = hvac.thermostatSetpoints;
      if (setpoints) {
        const nowTime = now.getHours() + now.getMinutes() / 60;
        for (let i = 0; i < setpoints.length; i++) {
          const currPeriodTime = setpoints[i].time;
          if (nowTime < currPeriodTime) {
            const idx = (i + setpoints.length - 1) % setpoints.length;
            return setpoints[idx].cool;
          } else if (i === setpoints.length - 1) {
            return setpoints[i].cool;
          }
        }
      }
    }
    return 20;
  }

  static getShadowMapSize() {
    const val = localStorage.getItem('aladdin-shadow-map-size');
    if (!val) return DEFAULT_SHADOW_MAP_SIZE;
    return Number(val);
  }

  // calculate the annual profit in 1,000 dollars
  static calculateProfit(design: Design): number {
    return (design.yearlyYield * design.sellingPrice - design.panelCount * design.unitCost * 365) * 0.001;
  }

  static calculateCost(design: Design): number {
    return design.panelCount * design.unitCost * 0.365;
  }

  static getLatLngKey(lat: number, lng: number): string {
    return lat.toFixed(LAT_LNG_FRACTION_DIGITS) + ', ' + lng.toFixed(LAT_LNG_FRACTION_DIGITS);
  }

  static getModelKey(model: ModelSite): string {
    return model.title + ', ' + model.userid;
  }

  static resizeCanvas(canvas: HTMLCanvasElement, newWidth: number, newHeight?: number): HTMLCanvasElement {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight ? newHeight : (newWidth * canvas.height) / canvas.width;
    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, resizedCanvas.width, resizedCanvas.height);
    }
    return resizedCanvas;
  }

  static getEuler(
    from: Vector3,
    to: Vector3,
    order?: string,
    rotateX?: number,
    rotateY?: number,
    rotateZ?: number,
  ): Euler {
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(from, to);
    const euler = new Euler();
    euler.setFromQuaternion(quaternion);
    if (order) euler.order = order as EulerOrder;
    if (rotateX) euler.x += rotateX;
    if (rotateY) euler.y += rotateY;
    if (rotateZ) euler.z += rotateZ;
    return euler;
  }

  static zero2DArray(array: number[][]): void {
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array[i].length; j++) {
        array[i][j] = 0;
      }
    }
  }

  static getTriangleArea(a: Vector3, b: Vector3, c: Vector3): number {
    return new Triangle(a, b, c).getArea();
  }

  static getPolygonArea(vertices: Point2[]): number {
    let total = 0;
    for (let i = 0, l = vertices.length; i < l; i++) {
      const addX = vertices[i].x;
      const addY = vertices[i === vertices.length - 1 ? 0 : i + 1].y;
      const subX = vertices[i === vertices.length - 1 ? 0 : i + 1].x;
      const subY = vertices[i].y;
      total += addX * addY;
      total -= subX * subY;
    }
    return Math.abs(total) * 0.5;
  }

  static getBuildingArea(foundation: FoundationModel, elements: ElementModel[]): number {
    let area = 0;
    for (const e of elements) {
      if (e.type === ObjectType.Roof && e.foundationId === foundation.id) {
        area += Util.calculateBuildingArea(e as RoofModel);
      }
    }
    return area;
  }

  static getBuildingCompletionStatus(foundation: FoundationModel, elements: ElementModel[]): BuildingCompletionStatus {
    // check roof first
    let hasRoof = false;
    for (const e of elements) {
      if (e.type === ObjectType.Roof) {
        if (e.foundationId === foundation.id) {
          hasRoof = true;
          break;
        }
      }
    }
    if (!hasRoof) return BuildingCompletionStatus.ROOF_MISSING;
    // check walls now

    // let emptyWall = false;
    // for (const e of elements) {
    //   if (e.type === ObjectType.Wall) {
    //     if (e.foundationId === foundation.id) {
    //       const wall = e as WallModel;
    //       if (wall.fill === WallFill.Empty) {
    //         emptyWall = true;
    //         break;
    //       }
    //     }
    //   }
    // }
    // if (emptyWall) return BuildingCompletionStatus.WALL_EMPTY;

    // check if the walls are joined
    const walls: WallModel[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Wall && e.foundationId === foundation.id) {
        walls.push(e as WallModel);
      }
    }
    if (walls.length > 0) {
      for (const w of walls) {
        if (!w.leftJoints || w.leftJoints.length === 0) return BuildingCompletionStatus.WALL_DISJOINED;
        if (!w.rightJoints || w.rightJoints.length === 0) return BuildingCompletionStatus.WALL_DISJOINED;
      }
    }
    return BuildingCompletionStatus.COMPLETE;
  }

  static calculateBuildingArea(roof: RoofModel): number {
    const wallPoints = Util.getWallPointsOfRoof(roof);
    return Util.getPolygonArea(wallPoints);
  }

  static toUValueInUS(uValueInSI: number): number {
    return uValueInSI / 5.67826;
  }

  static toUValueInSI(uValueInUS: number): number {
    return uValueInUS * 5.67826;
  }

  static toRValueInUS(rValueInSI: number): number {
    return rValueInSI * 5.67826;
  }

  static toRValueInSI(rValueInUS: number): number {
    return rValueInUS / 5.67826;
  }

  static WATER_TEXTURE = Util.fetchWaterTexture(100, 100);
  static WHITE_TEXTURE = Util.fetchWhiteTexture(2, 2);

  static fetchWaterTexture(w: number, h: number): CanvasTexture {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
      grd.addColorStop(0, '#45AAEA');
      grd.addColorStop(0.04, '#2B65EC');
      grd.addColorStop(0.2, '#0000FF');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    return new CanvasTexture(canvas);
  }

  static fetchWhiteTexture(w: number, h: number): CanvasTexture {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, w, h);
    }
    return new CanvasTexture(canvas);
  }

  static fetchIntersectables(scene: Scene): Object3D[] {
    const objects: Object3D[] = [];
    scene.traverse((o) => {
      if (!o.userData.unintersectable) {
        objects.push(o);
      }
    });
    return objects;
  }

  static fetchSimulationElements(obj: Object3D, arr: Object3D[]): void {
    if (obj.userData['simulation']) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        Util.fetchSimulationElements(c, arr);
      }
    }
  }

  static getSimulationElements(obj: Object3D, arr: Object3D[], id?: string): void {
    if (obj.userData['simulation'] && obj.uuid !== id) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        Util.getSimulationElements(c, arr, id);
      }
    }
  }

  static hasMovingParts(elements: ElementModel[]): boolean {
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.ParabolicDish:
        case ObjectType.ParabolicTrough:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat:
          return true;
        case ObjectType.SolarPanel:
          if ((e as SolarPanelModel).trackerType !== TrackerType.NO_TRACKER) return true;
      }
    }
    return false;
  }

  static onBuildingEnvelope(e: ElementModel): boolean {
    return (
      e.type === ObjectType.Foundation ||
      e.type === ObjectType.Window ||
      e.type === ObjectType.Door ||
      e.type === ObjectType.Wall ||
      e.type === ObjectType.Roof
    );
  }

  // Area of an arch given height and radius: https://keisan.casio.com/exec/system/14407397055469
  static getWindowArea(window: WindowModel, parent?: ElementModel): number {
    if (parent) {
      // if parent is set, window dimension is relative to it (e.g., when it is on a wall)
      if (window.windowType === WindowType.Arched && window.archHeight > 0) {
        const hx = 0.5 * window.lx * parent.lx;
        const lz = window.lz * parent.lz;
        const ah = Math.min(window.archHeight, lz, hx); // actual arc height
        const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
        const startAngle = Math.acos(Math.min(hx / r, 1));
        const extent = Math.PI - startAngle * 2;
        return 0.5 * extent * r * r - hx * (r - ah) + (lz - ah) * hx * 2;
      } else if (window.windowType === WindowType.Polygonal && window.polygonTop) {
        let a = window.lx * window.lz * parent.lx * parent.lz;
        a += (window.lx * parent.lx * window.polygonTop[1]) / 2;
        return a;
      }
      return window.lx * window.lz * parent.lx * parent.lz;
    } else {
      // if parent is not set, window dimension is absolute (e.g., when it is on a roof)
      if (window.windowType === WindowType.Arched && window.archHeight > 0) {
        const hx = 0.5 * window.lx;
        const lz = window.lz;
        const ah = Math.min(window.archHeight, lz, hx); // actual arc height
        const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
        const startAngle = Math.acos(Math.min(hx / r, 1));
        const extent = Math.PI - startAngle * 2;
        return 0.5 * extent * r * r - hx * (r - ah) + (lz - ah) * hx * 2;
      } else if (window.windowType === WindowType.Polygonal && window.polygonTop) {
        let a = window.lx * window.lz;
        a += (window.lx * window.polygonTop[1]) / 2;
        return a;
      }
      return window.lx * window.lz;
    }
  }

  // Area of an arch given height and radius: https://keisan.casio.com/exec/system/14407397055469
  static getDoorArea(door: DoorModel, parent?: ElementModel): number {
    if (parent) {
      // if parent is set, door dimension is relative to it
      if (door.doorType === DoorType.Arched && door.archHeight > 0) {
        const hx = 0.5 * door.lx * parent.lx;
        const lz = door.lz * parent.lz;
        const ah = Math.min(door.archHeight, lz, hx); // actual arch height
        const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
        const startAngle = Math.acos(Math.min(hx / r, 1));
        const extent = Math.PI - startAngle * 2;
        return 0.5 * extent * r * r - hx * (r - ah) + (lz - ah) * hx * 2;
      }
      return door.lx * door.lz * parent.lx * parent.lz;
    } else {
      // if parent is not set, door dimension is absolute
      if (door.doorType === DoorType.Arched && door.archHeight > 0) {
        const hx = 0.5 * door.lx;
        const lz = door.lz;
        const ah = Math.min(door.archHeight, lz, hx); // actual arch height
        const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
        const startAngle = Math.acos(Math.min(hx / r, 1));
        const extent = Math.PI - startAngle * 2;
        return 0.5 * extent * r * r - hx * (r - ah) + (lz - ah) * hx * 2;
      }
      return door.lx * door.lz;
    }
  }

  static hasHeliostatOrFresnelReflectors(elements: ElementModel[]): boolean {
    for (const e of elements) {
      if (e.type === ObjectType.FresnelReflector || e.type === ObjectType.Heliostat) return true;
    }
    return false;
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

  static calculateSolarRadiationColor(value: number, maxValue: number): Color {
    const valuePerColorRange = maxValue / (SOLAR_HEATMAP_COLORS.length - 1);
    let colorIndex = Math.max(0, Math.floor(value / valuePerColorRange));
    if (colorIndex > SOLAR_HEATMAP_COLORS.length - 2) colorIndex = SOLAR_HEATMAP_COLORS.length - 2;
    const scalar = Math.min(1, (value - valuePerColorRange * colorIndex) / valuePerColorRange);
    return new Color(SOLAR_HEATMAP_COLORS[colorIndex]).lerp(SOLAR_HEATMAP_COLORS[colorIndex + 1], scalar);
  }

  static transpose(array2d: number[][]): number[][] {
    return array2d[0].map((col, i) => array2d.map((row) => row[i]));
  }

  static clone2DArray(array: any[][]) {
    return array.map((row) => [...row]);
  }

  static fetchHeatmapTexture(data: number[][] | undefined, maxValue: number, flip?: boolean): CanvasTexture | null {
    if (!data) return null;
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const w = data.length;
    const h = data[0].length;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
          const c = Util.calculateSolarRadiationColor(data[flip ? w - 1 - i : i][j], maxValue);
          const off = ((h - 1 - j) * w + i) * 4;
          pixels[off] = Math.floor(c.r * 255);
          pixels[off + 1] = Math.floor(c.g * 255);
          pixels[off + 2] = Math.floor(c.b * 255);
          pixels[off + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return new CanvasTexture(canvas);
  }

  static fetchBladeTexture(
    w: number,
    h: number,
    scale: number,
    birdSafe: BirdSafeDesign,
    bladeColor: string,
    stripeColor: string,
  ): CanvasTexture | null {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const wc = Math.round(w * scale);
    const hc = Math.round(h * scale);
    canvas.width = wc;
    canvas.height = hc;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, wc, hc);
      const imageData = ctx.getImageData(0, 0, wc, hc);
      const pixels = imageData.data;
      const sectionLength = wc / 4;
      const bladeRgb = Util.hexToRgb(bladeColor) ?? { r: 255, g: 255, b: 255 };
      const stripeRgb = Util.hexToRgb(stripeColor) ?? { r: 64, g: 64, b: 64 };
      for (let i = 0; i < wc; i++) {
        const r =
          birdSafe === BirdSafeDesign.Bicolor
            ? i < sectionLength
              ? bladeRgb.r
              : stripeRgb.r
            : Math.floor(i / sectionLength) % 2 === 0
            ? bladeRgb.r
            : stripeRgb.r;
        const g =
          birdSafe === BirdSafeDesign.Bicolor
            ? i < sectionLength
              ? bladeRgb.g
              : stripeRgb.g
            : Math.floor(i / sectionLength) % 2 === 0
            ? bladeRgb.g
            : stripeRgb.g;
        const b =
          birdSafe === BirdSafeDesign.Bicolor
            ? i < sectionLength
              ? bladeRgb.b
              : stripeRgb.b
            : Math.floor(i / sectionLength) % 2 === 0
            ? bladeRgb.b
            : stripeRgb.b;
        for (let j = 0; j < hc; j++) {
          const off = ((hc - 1 - j) * wc + i) * 4;
          pixels[off] = r;
          pixels[off + 1] = g;
          pixels[off + 2] = b;
          pixels[off + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    const t = new CanvasTexture(canvas);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.rotation = HALF_PI;
    t.repeat.set(1 / w, 1 / h);
    return t;
  }

  static countSolarPanelsOnRack(rack: SolarPanelModel, pvModel: PvModel): number {
    let count = 0;
    if (pvModel && rack) {
      let nx, ny;
      if (rack.orientation === Orientation.portrait) {
        nx = Math.max(1, Math.round(rack.lx / pvModel.width));
        ny = Math.max(1, Math.round(rack.ly / pvModel.length));
      } else {
        nx = Math.max(1, Math.round(rack.lx / pvModel.length));
        ny = Math.max(1, Math.round(rack.ly / pvModel.width));
      }
      count += nx * ny;
    }
    return count;
  }

  static countAllSolarPanelDailyYields(): number {
    let total = 0;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel) {
        total += (e as SolarPanelModel).dailyYield ?? 0;
      }
    }
    return total;
  }

  static countAllSolarPanelYearlyYields(): number {
    let total = 0;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel) {
        total += (e as SolarPanelModel).yearlyYield ?? 0;
      }
    }
    return total;
  }

  static countAllSolarPanels(): number {
    let count = 0;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel) {
        const sp = e as SolarPanelModel;
        const pvModel = useStore.getState().getPvModule(sp.pvModelName);
        if (pvModel) {
          count += Util.countSolarPanelsOnRack(sp, pvModel);
        }
      }
    }
    return count;
  }

  static hasSolarPanels(elements: ElementModel[]): boolean {
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) return true;
    }
    return false;
  }

  // special case as a rack may have many solar panels
  static countAllChildSolarPanels(parentId: string, excludeLocked?: boolean): number {
    let count = 0;
    const elements = useStore.getState().elements;
    if (excludeLocked) {
      for (const e of elements) {
        if (!e.locked && e.type === ObjectType.SolarPanel && e.parentId === parentId) {
          const sp = e as SolarPanelModel;
          const pvModel = useStore.getState().getPvModule(sp.pvModelName);
          if (pvModel) {
            count += Util.countSolarPanelsOnRack(sp, pvModel);
          }
        }
      }
    } else {
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel && e.parentId === parentId) {
          const sp = e as SolarPanelModel;
          const pvModel = useStore.getState().getPvModule(sp.pvModelName);
          if (pvModel) {
            count += Util.countSolarPanelsOnRack(sp, pvModel);
          }
        }
      }
    }
    return count;
  }

  static countAllChildSolarPanelDailyYields(parentId: string): number {
    let total = 0;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel && e.parentId === parentId) {
        total += (e as SolarPanelModel).dailyYield ?? 0;
      }
    }
    return total;
  }

  static countAllChildElementsByType(parentId: string, type: ObjectType, excludeLocked?: boolean): number {
    let count = 0;
    const elements = useStore.getState().elements;
    if (excludeLocked) {
      for (const e of elements) {
        if (!e.locked && e.type === type && e.parentId === parentId) {
          count++;
        }
      }
    } else {
      for (const e of elements) {
        if (e.type === type && e.parentId === parentId) {
          count++;
        }
      }
    }
    return count;
  }

  static areTwoBasesOverlapped(f1: ElementModel, f2: ElementModel): boolean {
    const v1 = Util.fetchFoundationVertexCoordinates(f1);
    const v2 = Util.fetchFoundationVertexCoordinates(f2);
    for (const v of v1) {
      if (Util.isPointInside(v.x, v.y, v2)) {
        return true;
      }
    }
    for (const v of v2) {
      if (Util.isPointInside(v.x, v.y, v1)) {
        return true;
      }
    }
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

  static fetchFoundationVertexCoordinates(foundation: ElementModel): Point2[] {
    const { pos } = Util.getWorldDataById(foundation.id);
    const xc = pos.x;
    const yc = pos.y;
    const cosaz = Math.cos(foundation.rotation[2]);
    const sinaz = Math.sin(foundation.rotation[2]);
    const rx = foundation.lx * 0.5;
    const ry = foundation.ly * 0.5;
    // corners are stored in the clockwise direction
    const vertices: Point2[] = [];
    // upper-right corner
    vertices.push({
      x: xc + rx * cosaz - ry * sinaz,
      y: yc + rx * sinaz + ry * cosaz,
    } as Point2);
    // lower-right corner
    vertices.push({
      x: xc + rx * cosaz + ry * sinaz,
      y: yc + rx * sinaz - ry * cosaz,
    } as Point2);
    // lower-left corner
    vertices.push({
      x: xc - rx * cosaz + ry * sinaz,
      y: yc - rx * sinaz - ry * cosaz,
    } as Point2);
    // upper-left corner
    vertices.push({
      x: xc - rx * cosaz - ry * sinaz,
      y: yc - rx * sinaz + ry * cosaz,
    } as Point2);
    return vertices;
  }

  static doSolarPanelsOverlap(sp1: SolarPanelModel, sp2: SolarPanelModel, parent: ElementModel): boolean {
    if (sp1.parentId !== parent.id || sp2.parentId !== parent.id) return false;
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
    const xc = sp.cx;
    const yc = sp.cy;
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

  static changeOrientation(solarPanel: SolarPanelModel, pvModel: PvModel, value: Orientation): void {
    if (solarPanel) {
      solarPanel.orientation = value;
      // add a small number because the round-off error may cause the floor to drop one
      solarPanel.lx += 0.00001;
      solarPanel.ly += 0.00001;
      if (value === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / pvModel.width));
        const ny = Math.max(1, Math.floor(solarPanel.ly / pvModel.length));
        solarPanel.lx = nx * pvModel.width;
        solarPanel.ly = ny * pvModel.length;
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / pvModel.length));
        const ny = Math.max(1, Math.floor(solarPanel.ly / pvModel.width));
        solarPanel.lx = nx * pvModel.length;
        solarPanel.ly = ny * pvModel.width;
      }
    }
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
  static isPointInside(x: number, y: number, vertices: Point2[]): boolean {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  static getPoints(vertices: Vector3[]): Point2[] {
    const points: Point2[] = [];
    for (const v of vertices) {
      points.push({ x: v.x, y: v.y } as Point2);
    }
    return points;
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

  static calculatePolygonBounds(vertices: Point2[]): Rectangle {
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
    return new Rectangle(minX, minY, maxX - minX, maxY - minY);
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

  static rotatePolygon(vertices: Point2[], cx: number, cy: number, angleInRadian: number): Point2[] {
    const rotatedVertices: Point2[] = [];
    const cos = Math.cos(angleInRadian);
    const sin = Math.sin(angleInRadian);
    for (const v of vertices) {
      const dx = v.x - cx;
      const dy = v.y - cy;
      rotatedVertices.push({ x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos } as Point2);
    }
    return rotatedVertices;
  }

  static rotatePoint(point: Point2, cx: number, cy: number, angleInRadian: number): Point2 {
    const cos = Math.cos(angleInRadian);
    const sin = Math.sin(angleInRadian);
    const dx = point.x - cx;
    const dy = point.y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos } as Point2;
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
        case ObjectType.SolarPanel: {
          const absPos = new Vector2(c.cx, c.cy).rotateAround(ORIGIN_VECTOR2, parent.rotation[2]);
          childAbsPosMap.set(c.id, absPos);
          break;
        }
        case ObjectType.Sensor: {
          const absPos = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(
            ORIGIN_VECTOR2,
            parent.rotation[2],
          );
          childAbsPosMap.set(c.id, absPos);
          break;
        }
      }
    }
    const childrenClone: ElementModel[] = [];
    for (const c of children) {
      const childClone = JSON.parse(JSON.stringify(c));
      childrenClone.push(childClone);
      const childAbsPos = childAbsPosMap.get(c.id);
      if (childAbsPos) {
        const relativePos = new Vector2(childAbsPos.x, childAbsPos.y).rotateAround(ORIGIN_VECTOR2, -c.rotation[2]);
        if (childClone.type !== ObjectType.SolarPanel) {
          childClone.cx = relativePos.x / lx;
          childClone.cy = relativePos.y / ly;
        }
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
        // solar panels can be installed on any surface, but we can only check horizontal surfaces now
        case ObjectType.SolarPanel:
          if ((e as SolarPanelModel).parentType === ObjectType.Roof) continue;
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSolarCollectorWithinHorizontalSurface(e as SolarCollector, parent)) {
              return false;
            }
          }
          break;
        // these CSP collectors can only be installed on a foundation
        case ObjectType.ParabolicDish:
        case ObjectType.ParabolicTrough:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat:
          if (!Util.isSolarCollectorWithinHorizontalSurface(e as SolarCollector, parent)) {
            return false;
          }
          break;
        case ObjectType.WindTurbine:
          if (!Util.isWindTurbineWithinHorizontalSurface(e as WindTurbineModel, parent)) {
            return false;
          }
          break;
        // sensors can be placed on any surface, but we can only check horizontal surfaces now
        case ObjectType.Sensor:
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSensorWithin(e as SensorModel, parent)) {
              return false;
            }
          }
          break;
        case ObjectType.Wall: {
          if (!Util.isWallWithin(e as WallModel, parent)) {
            return false;
          }
          break;
        }
        case ObjectType.BatteryStorage: {
          return Util.isBatteryStorageWithin(e as BatteryStorageModel, parent);
        }
      }
    }
    return true;
  }

  static isBatteryStorageWithin(element: BatteryStorageModel, parent: ElementModel) {
    const x0 = element.cx;
    const y0 = element.cy;
    const cosaz = Math.cos(element.rotation[2]);
    const sinaz = Math.sin(element.rotation[2]);
    const dx = parent.lx * 0.5;
    const dy = parent.ly * 0.5;
    const rx = element.lx * 0.5;
    const ry = element.ly * 0.5;
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

  static isSolarCollectorWithinHorizontalSurface(collector: SolarCollector, parent: ElementModel): boolean {
    const x0 = collector.cx;
    const y0 = collector.cy;
    const cosaz = Math.cos(collector.relativeAzimuth);
    const sinaz = Math.sin(collector.relativeAzimuth);
    const dx = parent.lx * 0.5;
    const dy = parent.ly * 0.5;
    const rx = collector.lx * 0.5;
    const ry = collector.ly * 0.5 * Math.cos(collector.tiltAngle);
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

  static isWindTurbineWithinHorizontalSurface(turbine: WindTurbineModel, parent: ElementModel): boolean {
    return Math.abs(turbine.cx) <= 0.5 && Math.abs(turbine.cy) <= 0.5;
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

  static isEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < ZERO_TOLERANCE;
  }

  static isZero(x: number): boolean {
    return Math.abs(x) < ZERO_TOLERANCE;
  }

  static deleteElement(a: any[], e: any): void {
    const i = a.indexOf(e, 0);
    if (i > -1) {
      a.splice(i, 1);
    }
  }

  static fixElements(elements: ElementModel[]): void {
    const found: ElementModel[] = [];
    for (const e of elements) {
      if (!e.type) {
        found.push(e);
      }
    }
    if (found.length > 0) {
      for (const e of found) {
        Util.deleteElement(elements, e);
      }
    }
  }

  static fixViewStateLight(viewState: ViewState) {
    if (viewState.ambientLightIntensity) {
      viewState.ambientLightIntensity *= 2;
    }
    if (viewState.directLightIntensity) {
      viewState.directLightIntensity *= 3.5;
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

  static isTopResizeHandle(
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ): boolean {
    // unfortunately, I cannot find a better way to tell the type of enum variable
    return (
      handle === ResizeHandleType.LowerLeftTop ||
      handle === ResizeHandleType.LowerRightTop ||
      handle === ResizeHandleType.UpperLeftTop ||
      handle === ResizeHandleType.UpperRightTop ||
      handle === ResizeHandleType.Top
    );
  }

  static isXResizeHandle(
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ): boolean {
    // unfortunately, I cannot find a better way to tell the type of enum variable
    return handle === ResizeHandleType.Left || handle === ResizeHandleType.Right;
  }

  static isYResizeHandle(
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ): boolean {
    // unfortunately, I cannot find a better way to tell the type of enum variable
    return handle === ResizeHandleType.Upper || handle === ResizeHandleType.Lower;
  }

  static isTopResizeHandleOfWall(
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ): boolean {
    return handle === ResizeHandleType.UpperLeft || handle === ResizeHandleType.UpperRight;
  }

  static isRiseHandleOfRoof(
    handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null,
  ): boolean {
    return handle === RoofHandleType.Top || handle === RoofHandleType.Mid || handle === RoofHandleType.TopMid;
  }

  static isMoveHandle(handle: MoveHandleType | ResizeHandleType | RotateHandleType | RoofHandleType | null): boolean {
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
      objectType === ObjectType.BatteryStorage ||
      objectType === ObjectType.SolarPanel ||
      objectType === ObjectType.ParabolicTrough ||
      objectType === ObjectType.ParabolicDish ||
      objectType === ObjectType.FresnelReflector ||
      objectType === ObjectType.Heliostat ||
      objectType === ObjectType.WindTurbine ||
      objectType === ObjectType.SolarWaterHeater ||
      objectType === ObjectType.Sensor ||
      objectType === ObjectType.Light ||
      objectType === ObjectType.Polygon ||
      objectType === ObjectType.Window ||
      objectType === ObjectType.Door ||
      objectType === ObjectType.Roof ||
      objectType === ObjectType.Wall
    );
  }

  static isPlantOrHuman(elem: ElementModel): boolean {
    return elem.type === ObjectType.Tree || elem.type === ObjectType.Flower || elem.type === ObjectType.Human;
  }

  static isFoundationOrCuboid(elem: ElementModel): boolean {
    return elem.type === ObjectType.Foundation || elem.type === ObjectType.Cuboid;
  }

  static isSolarCollector(elem: ElementModel): boolean {
    return Util.isSolarCollectorType(elem.type);
  }

  static isSolarCollectorType(type: ObjectType): boolean {
    return type === ObjectType.SolarPanel || type === ObjectType.SolarWaterHeater || Util.isCspCollectorType(type);
  }

  static isCspCollector(elem: ElementModel): boolean {
    return Util.isCspCollectorType(elem.type);
  }

  static isCspCollectorType(type: ObjectType): boolean {
    return (
      type === ObjectType.ParabolicDish ||
      type === ObjectType.ParabolicTrough ||
      type === ObjectType.FresnelReflector ||
      type === ObjectType.Heliostat
    );
  }

  static isParabolicCollector(elem: ElementModel): boolean {
    return Util.isParabolaType(elem.type);
  }

  static isParabolaType(type: ObjectType): boolean {
    return type === ObjectType.ParabolicDish || type === ObjectType.ParabolicTrough;
  }

  static isParabolicTroughOrFresnelReflector(type: ObjectType): boolean {
    return type === ObjectType.FresnelReflector || type === ObjectType.ParabolicTrough;
  }

  static isHeliostatOrFresnelReflector(type: ObjectType): boolean {
    return type === ObjectType.FresnelReflector || type === ObjectType.Heliostat;
  }

  static isLegalOnWall(type: ObjectType): boolean {
    switch (type) {
      case ObjectType.Window:
      case ObjectType.Door:
      case ObjectType.Sensor:
      case ObjectType.Light:
      case ObjectType.SolarPanel:
      case ObjectType.Polygon:
        return true;
    }
    return false;
  }

  static isDescendantOf(child: ElementModel, targetId: string): boolean {
    const parentId = child.parentId;
    if (!parentId || parentId === GROUND_ID) return false;
    const parent = useStore.getState().getElementById(parentId);
    if (!parent) return false;
    if (parent.id === targetId) return true;
    return Util.isDescendantOf(parent, targetId);
  }

  // p is relative position on wall
  static isElementInsideWall(
    p: Vector3,
    wlx: number,
    wlz: number,
    boundingPoints: Point2[],
    isDoor?: boolean,
  ): boolean {
    const hx = wlx / 2;
    const hz = wlz / 2;
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        if (isDoor && j === -1) continue;
        const x = p.x + hx * i;
        const y = p.z + hz * j;
        if (!Util.isPointInside(x, y, boundingPoints)) {
          return false;
        }
      }
    }

    const elementPoints = [
      { x: p.x - hx, y: p.z - hz },
      { x: p.x - hx, y: p.z + hz },
      { x: p.x + hx, y: p.z + hz },
      { x: p.x + hx, y: p.z - hz },
    ];

    for (const p of boundingPoints) {
      if (Util.isPointInside(p.x, p.y, elementPoints)) {
        return false;
      }
    }
    return true;
  }

  static isRectOutsideBoundary(cx: number, cy: number, rHlx: number, rHly: number, bHx: number, bHy: number) {
    return cx + rHlx > bHx || cx - rHlx < -bHx || cy + rHly > bHy || cy - rHly < -bHy;
  }

  static getSolarPanelVerticesOnCuboidVerticalFace(sp: ElementModel) {
    const arr: Point2[] = [];
    const [hx, hy] = [sp.lx / 2, sp.ly / 2];
    // east west
    if (Util.isIdentical(sp.normal, [-1, 0, 0]) || Util.isIdentical(sp.normal, [1, 0, 0])) {
      arr.push({ x: sp.cy - hx, y: sp.cz - hy });
      arr.push({ x: sp.cy + hx, y: sp.cz - hy });
      arr.push({ x: sp.cy + hx, y: sp.cz + hy });
      arr.push({ x: sp.cy - hx, y: sp.cz + hy });
    }
    // north south
    else if (Util.isIdentical(sp.normal, [0, 1, 0]) || Util.isIdentical(sp.normal, [0, -1, 0])) {
      arr.push({ x: sp.cx - hx, y: sp.cz - hy });
      arr.push({ x: sp.cx + hx, y: sp.cz - hy });
      arr.push({ x: sp.cx + hx, y: sp.cz + hy });
      arr.push({ x: sp.cx - hx, y: sp.cz + hy });
    }
    return arr;
  }

  static checkCollisionOnCuboidSameVerticalFace(sp: ElementModel) {
    for (const e of useStore.getState().elements) {
      if (
        e.type === ObjectType.SolarPanel &&
        e.id !== sp.id &&
        e.parentId === sp.parentId &&
        Util.isIdentical(e.normal, sp.normal)
      ) {
        const targetVertices: Point2[] = Util.getSolarPanelVerticesOnCuboidVerticalFace(e);
        const currentVertices: Point2[] = Util.getSolarPanelVerticesOnCuboidVerticalFace(sp);
        for (const v of targetVertices) {
          if (Util.isPointInside(v.x, v.y, currentVertices)) {
            return true;
          }
        }
        for (const v of currentVertices) {
          if (Util.isPointInside(v.x, v.y, targetVertices)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  static checkElementOnCuboidState(sp: SolarPanelModel, parent: ElementModel): ElementState {
    if (Util.isIdentical(sp.normal, [0, 0, 1])) {
      if (!Util.isSolarCollectorWithinHorizontalSurface(sp, parent)) {
        return ElementState.OutsideBoundary;
      }
      if (useStore.getState().overlapWithSibling(sp)) {
        return ElementState.OverLap;
      }
    } else {
      const [spHlx, spHly] = [sp.lx / 2, sp.ly / 2];
      const [parentHlx, parentHly, parentHlz] = [parent.lx / 2, parent.ly / 2, parent.lz / 2];
      // boundary check
      // west east
      if (Util.isIdentical(sp.normal, [-1, 0, 0]) || Util.isIdentical(sp.normal, [1, 0, 0])) {
        if (Util.isRectOutsideBoundary(sp.cy, sp.cz, spHlx, spHly, parentHly, parentHlz)) {
          return ElementState.OutsideBoundary;
        }
      }
      // north south
      else if (Util.isIdentical(sp.normal, [0, 1, 0]) || Util.isIdentical(sp.normal, [0, -1, 0])) {
        if (Util.isRectOutsideBoundary(sp.cx, sp.cz, spHlx, spHly, parentHlx, parentHlz)) {
          return ElementState.OutsideBoundary;
        }
      }
      // collision check
      if (Util.checkCollisionOnCuboidSameVerticalFace(sp)) {
        return ElementState.OverLap;
      }
    }
    return ElementState.Valid;
  }

  static checkElementOnWallState(elem: ElementModel, parent?: ElementModel): ElementState {
    const margin = 0.00001;

    let hx = elem.lx / 2 + margin;
    let hz = elem.lz / 2 + margin;
    if (parent && elem.type === ObjectType.SolarPanel) {
      hx = hx / parent.lx + margin;
      hz = elem.ly / 2 / parent.lz + margin;
    }
    const eMinX = elem.cx - hx;
    const eMaxX = elem.cx + hx;
    const eMinZ = elem.cz - hz;
    const eMaxZ = elem.cz + hz;

    if (
      parent &&
      parent.type === ObjectType.Wall &&
      !Util.isElementInsideWall(
        new Vector3(elem.cx * parent.lx, elem.cy, elem.cz * parent.lz),
        parent.lx * hx * 2,
        parent.lz * hz * 2,
        Util.getWallInnerSideShapePoints(parent as WallModel),
        elem.type === ObjectType.Door,
      )
    ) {
      return ElementState.OutsideBoundary;
    }
    for (const e of useStore.getState().elements) {
      // check collision with other elements (except polygons)
      if (
        Util.isLegalOnWall(e.type) &&
        e.type !== ObjectType.Polygon &&
        e.parentId === elem.parentId &&
        e.id !== elem.id
      ) {
        let ehx = e.lx / 2;
        let ehz = e.lz / 2;
        if (parent && e.type === ObjectType.SolarPanel) {
          ehx = ehx / parent.lx;
          ehz = e.ly / 2 / parent.lz;
        }
        // target element
        const tMinX = e.cx - ehx;
        const tMaxX = e.cx + ehx;
        const tMinZ = e.cz - ehz;
        const tMaxZ = e.cz + ehz;
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
          return ElementState.OverLap;
        }
      }
    }
    return ElementState.Valid;
  }

  static checkElementOnRoofState(element: ElementModel, roof: RoofModel): ElementState {
    if (element.foundationId) {
      const foundation = useStore.getState().getElementById(element.foundationId);
      if (foundation) {
        const elementVertices = RoofUtil.getElementVerticesOnRoof(element, foundation);
        const wallVertices = RoofUtil.getRoofBoundaryVertices(roof);
        if (!RoofUtil.rooftopElementBoundaryCheck(elementVertices, wallVertices)) {
          return ElementState.OutsideBoundary;
        }
        if (!RoofUtil.rooftopElementCollisionCheck(element, foundation, elementVertices)) {
          return ElementState.OverLap;
        }
        return ElementState.Valid;
      }
    }
    return ElementState.Invalid;
  }

  static relativeCoordinates(x: number, y: number, z: number, parent: ElementModel, isAbs?: boolean): Vector3 {
    const v = new Vector3(x, y, z);
    if (parent.type === ObjectType.Wall) {
      const parentPos = new Vector3(parent.cx, parent.cy); // relative
      const grandParent = useStore.getState().getParent(parent);
      if (grandParent) {
        const grandParentPos = new Vector3(grandParent.cx, grandParent.cy); // world
        parentPos
          .applyEuler(new Euler(0, 0, grandParent.rotation[2]))
          .add(grandParentPos)
          .setZ(grandParent.lz + parent.lz / 2); // world
        v.sub(parentPos).applyEuler(new Euler(0, 0, -(parent as WallModel).relativeAngle - grandParent.rotation[2]));
      }
    } else {
      const { pos, rot } = Util.getWorldDataById(parent.id);
      v.set(x - pos.x, y - pos.y, z - pos.z);
      v.applyEuler(new Euler(0, 0, -rot));
    }
    if (isAbs) {
      return v;
    }
    v.x /= parent.lx;
    v.y /= parent.ly;
    v.z /= parent.lz;
    return v;
  }

  // don't use this for humans or trees or flowers
  static absoluteCoordinates(
    x: number,
    y: number,
    z: number,
    parent: ElementModel,
    foundation?: FoundationModel | null,
    shift?: number,
    isAbs?: boolean,
  ): Vector3 {
    if (parent.type === ObjectType.Wall && foundation) {
      const wall = parent as WallModel;
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      if (wallAbsAngle !== undefined) {
        const wallAbsPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
          wall.lz / 2 + foundation.lz,
        );
        const v = new Vector3(x * wall.lx, y * wall.ly, z * wall.lz);
        v.applyAxisAngle(UNIT_VECTOR_POS_Z, wallAbsAngle);
        if (shift) {
          const dx = shift * Math.cos(wallAbsAngle - HALF_PI);
          const dy = shift * Math.sin(wallAbsAngle - HALF_PI);
          return new Vector3(wallAbsPos.x + v.x + dx, wallAbsPos.y + v.y + dy, wallAbsPos.z + v.z);
        }
        return new Vector3(wallAbsPos.x + v.x, wallAbsPos.y + v.y, wallAbsPos.z + v.z);
      }
    }
    if (parent.type === ObjectType.Roof && foundation) {
      const v = new Vector3(x, y, z + foundation.cz);
      v.applyEuler(new Euler().fromArray(foundation.rotation as XYZO));
      v.x += foundation.cx;
      v.y += foundation.cy;
      return v;
    }
    const v = new Vector3();
    if (isAbs) {
      v.set(x, y, z);
    } else {
      v.set(x * parent.lx, y * parent.ly, z * parent.lz);
    }
    v.applyEuler(new Euler().fromArray(parent.rotation as XYZO));
    v.x += parent.cx;
    v.y += parent.cy;
    v.z += parent.cz;
    return v;
  }

  // use this only for humans or trees or flowers
  static absoluteHumanOrTreeCoordinates(x: number, y: number, z: number, parent: ElementModel): Vector3 {
    const v = new Vector3(x, y, z);
    v.applyEuler(new Euler().fromArray(parent.rotation as XYZO));
    v.x += parent.cx;
    v.y += parent.cy;
    v.z += parent.cz;
    return v;
  }

  // no normalization
  static relativePoint(point: Vector3, parent: ElementModel): Vector3 {
    const v = new Vector3(point.x - parent.cx, point.y - parent.cy, point.z - parent.cz);
    v.applyEuler(new Euler().fromArray(parent.rotation.map((a) => -a) as XYZO));
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
      for (const children of object.children) {
        if (children.name === CUBOID_WRAPPER_NAME) {
          const child = Util.getStackCuboidObjectById(children, id);
          if (child) return child;
        } else if (children.name.includes(id)) {
          return children;
        }
      }
    }
    return null;
  }

  static getStackCuboidObjectById(wrapper: Object3D | null | undefined, id: string): Object3D | null {
    if (wrapper) {
      for (const child of wrapper.children) {
        if (child.name.includes(id)) {
          return child;
        }
        if (child.name === CUBOID_STACKABLE_CHILD) {
          const c = Util.getStackCuboidObjectById(child.children[0], id);
          if (c) return c;
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

  // returns the maximum of a 1D array
  static getArrayMax(array: number[]): number {
    return array.reduce((a, b) => Math.max(a, b));
  }

  // returns the minimum of a 1D array
  static getArrayMin(array: number[]): number {
    return array.reduce((a, b) => Math.min(a, b));
  }

  // returns the maximum of a 2D array
  static getArrayMax2D(array2d: number[][]): number {
    return Util.getArrayMax(array2d.map(Util.getArrayMax));
  }

  // returns the minimum of a 2D array
  static getArrayMin2D(array2d: number[][]): number {
    return Util.getArrayMin(array2d.map(Util.getArrayMin));
  }

  static sphericalToCartesianZ(sphereCoords: Vector3): Vector3 {
    const a = sphereCoords.x * Math.cos(sphereCoords.z);
    const x = a * Math.cos(sphereCoords.y);
    const y = a * Math.sin(sphereCoords.y);
    const z = sphereCoords.x * Math.sin(sphereCoords.z);
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

  // convert to UTC to avoid problems caused by the daylight saving time
  static dayOfYear(date: Date): number {
    return (
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000
    );
  }

  // https://en.wikipedia.org/wiki/Leap_year
  static daysInYear(date: Date): number {
    const year = date.getFullYear();
    return (year % 4 === 0 && year % 100 > 0) || year % 400 === 0 ? 366 : 365;
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

  static getOS(): string | undefined {
    return platform.os?.family;
  }

  static isMac(): boolean {
    const os = Util.getOS();
    if (os) return os.includes('Mac') || os.includes('OS X');
    return false;
  }

  static isChrome(): boolean {
    const os = Util.getOS();
    if (os) return os.includes('Chrome');
    return false;
  }

  static detectWebGLContext(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return (
        !!window.WebGLRenderingContext && (!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  static clamp(num: number, min: number, max: number): number {
    if (min > max) {
      return (min + max) / 2;
    }
    return Math.min(Math.max(num, min), max);
  }

  static distanceFromPointToLine2D(p: Vector3, l1: Vector3, l2: Vector3): number {
    const [x, y] = [p.x, p.y];
    const [x1, y1] = [l1.x, l1.y];
    const [x2, y2] = [l2.x, l2.y];

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) {
      param = dot / len_sq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static mapVector3ToPoint2(v: Vector3): Point2 {
    return { x: v.x, y: v.y } as Point2;
  }

  // get the relative 2D vertices of a wall (can be a quad, pentagon, or heptagon)
  static getWallVertices(wall: WallModel, margin: number): Point2[] {
    const hx = wall.lx / 2;
    const hz = wall.lz / 2;
    const lowerLeft = { x: -hx - margin, y: -hz - margin } as Point2;
    const lowerRight = { x: hx + margin, y: -hz - margin } as Point2;
    const upperLeft = { x: -hx - margin, y: (wall.leftRoofHeight ?? wall.lz) - hz + margin } as Point2;
    const upperRight = { x: hx + margin, y: (wall.rightRoofHeight ?? wall.lz) - hz + margin } as Point2;
    const vertices: Point2[] = [];
    vertices.push(upperLeft, lowerLeft, lowerRight, upperRight);
    if (wall.centerRightRoofHeight) {
      vertices.push({
        x: wall.centerRightRoofHeight[0] * wall.lx,
        y: wall.centerRightRoofHeight[1] - hz + margin,
      } as Point2);
    }
    if (wall.centerRoofHeight) {
      vertices.push({ x: wall.centerRoofHeight[0] * wall.lx, y: wall.centerRoofHeight[1] - hz + margin } as Point2);
    }
    if (wall.centerLeftRoofHeight) {
      vertices.push({
        x: wall.centerLeftRoofHeight[0] * wall.lx,
        y: wall.centerLeftRoofHeight[1] - hz + margin,
      } as Point2);
    }
    return vertices;
  }

  // check if a partial wall is effectively full
  static isPartialWallFull(wall: WallModel): boolean {
    return (
      Util.isZero((wall.leftRoofHeight ?? wall.lz) - wall.leftTopPartialHeight) &&
      Util.isZero((wall.rightRoofHeight ?? wall.lz) - wall.rightTopPartialHeight) &&
      Util.isZero(wall.leftUnfilledHeight) &&
      Util.isZero(wall.rightUnfilledHeight)
    );
  }

  // get the relative 2D vertices of a partial wall (a quad)
  static getPartialWallVertices(wall: WallModel, margin: number): Point2[] {
    if (Util.isPartialWallFull(wall)) return Util.getWallVertices(wall, margin);
    const hx = wall.lx / 2;
    const hz = wall.lz / 2;
    const lowerLeft = { x: -hx - margin, y: wall.leftUnfilledHeight - hz - margin } as Point2;
    const lowerRight = { x: hx + margin, y: wall.rightUnfilledHeight - hz - margin } as Point2;
    const upperLeft = { x: -hx - margin, y: wall.leftTopPartialHeight - hz + margin } as Point2;
    const upperRight = { x: hx + margin, y: wall.rightTopPartialHeight - hz + margin } as Point2;
    const vertices: Point2[] = [];
    vertices.push(upperLeft, lowerLeft, lowerRight, upperRight);
    if (wall.centerRightRoofHeight) {
      vertices.push({
        x: wall.centerRightRoofHeight[0] * wall.lx,
        y: wall.centerRightRoofHeight[1] - hz + margin,
      } as Point2);
    }
    if (wall.centerRoofHeight) {
      vertices.push({ x: wall.centerRoofHeight[0] * wall.lx, y: wall.centerRoofHeight[1] - hz + margin } as Point2);
    }
    if (wall.centerLeftRoofHeight) {
      vertices.push({
        x: wall.centerLeftRoofHeight[0] * wall.lx,
        y: wall.centerLeftRoofHeight[1] - hz + margin,
      } as Point2);
    }
    return vertices;
  }

  // get the highest point of a wall (can be a quad, pentagon, or heptagon)
  static getHighestPointOfWall(wall: WallModel): number {
    let h = wall.lz;
    if (wall.leftRoofHeight) {
      h = Math.max(h, wall.leftRoofHeight);
    }
    if (wall.rightRoofHeight) {
      h = Math.max(h, wall.rightRoofHeight);
    }
    if (wall.centerRightRoofHeight) {
      h = Math.max(h, wall.centerRightRoofHeight[1]);
    }
    if (wall.centerRoofHeight) {
      h = Math.max(h, wall.centerRoofHeight[1]);
    }
    if (wall.centerLeftRoofHeight) {
      h = Math.max(h, wall.centerLeftRoofHeight[1]);
    }
    return h;
  }

  // get the points for all the walls under a roof
  static getWallPointsOfRoof(roof: RoofModel, wallModel?: WallModel) {
    let wall = wallModel ?? (useStore.getState().getElementById(roof.wallsId[0]) as WallModel);
    if (!wall) return [];
    const startWall = wall;
    const array = [];

    while (wall && (!wall.roofId || wall.roofId === roof.id)) {
      array.push({ x: wall.leftPoint[0], y: wall.leftPoint[1], eave: wall.eavesLength ?? 0 });
      if (wall.leftJoints[0]) {
        if (wall.leftJoints[0] !== startWall.id) {
          wall = useStore.getState().getElementById(wall.leftJoints[0]) as WallModel;
        }
        // is a loop
        else {
          array.reverse();
          return array;
        }
      } else {
        break;
      }
    }

    array.reverse();

    wall = useStore.getState().getElementById(startWall?.rightJoints[0]) as WallModel;
    while (wall && (!wall.roofId || wall.roofId === roof.id)) {
      array.push({ x: wall.leftPoint[0], y: wall.leftPoint[1], eave: wall.eavesLength ?? 0 });
      if (wall.rightJoints[0] && wall.rightJoints[0] !== startWall.id) {
        wall = useStore.getState().getElementById(wall.rightJoints[0]) as WallModel;
      } else {
        break;
      }
    }
    return array;
  }

  static getWallInnerSideShapePoints(wallModel: WallModel) {
    const {
      lx,
      ly,
      lz,
      relativeAngle,
      fill,
      leftUnfilledHeight,
      rightUnfilledHeight,
      leftRoofHeight,
      centerLeftRoofHeight,
      centerRoofHeight,
      centerRightRoofHeight,
      rightRoofHeight,
      leftJoints,
      rightJoints,
    } = wallModel;

    const leftWall = leftJoints.length > 0 ? useStore.getState().getElementById(leftJoints[0]) : null;
    const rightWall = rightJoints.length > 0 ? useStore.getState().getElementById(rightJoints[0]) : null;

    const leftOffset =
      leftWall && leftWall.type === ObjectType.Wall
        ? Util.getInnerWallOffset(leftWall as WallModel, lx, ly, relativeAngle, 'left')
        : 0;
    const rightOffset =
      rightWall && rightWall.type === ObjectType.Wall
        ? Util.getInnerWallOffset(rightWall as WallModel, lx, ly, relativeAngle, 'right')
        : 0;

    const points: Point2[] = [];
    const x = lx / 2;
    const y = lz / 2;
    if (fill === WallFill.Partial) {
      points.push({ x: -x + leftOffset, y: -y + leftUnfilledHeight });
      points.push({ x: x - rightOffset, y: -y + rightUnfilledHeight });
    } else {
      points.push({ x: -x + leftOffset, y: -y });
      points.push({ x: x - rightOffset, y: -y });
    }
    rightRoofHeight
      ? points.push({ x: x - rightOffset, y: rightRoofHeight - y })
      : points.push({ x: x - rightOffset, y: y });
    if (centerRightRoofHeight) {
      points.push({ x: centerRightRoofHeight[0] * lx, y: centerRightRoofHeight[1] - y });
    }
    if (centerRoofHeight) {
      points.push({ x: centerRoofHeight[0] * lx, y: centerRoofHeight[1] - y });
    }
    if (centerLeftRoofHeight) {
      points.push({ x: centerLeftRoofHeight[0] * lx, y: centerLeftRoofHeight[1] - y });
    }
    leftRoofHeight
      ? points.push({ x: -x + leftOffset, y: leftRoofHeight - y })
      : points.push({ x: -x + leftOffset, y: y });

    return points;
  }

  static getInnerWallOffset(
    sideWall: WallModel | null,
    lx: number,
    ly: number,
    relativeAngle: number,
    side: 'left' | 'right',
  ) {
    let offset = 0;
    if (sideWall && sideWall.fill !== WallFill.Empty) {
      const sign = side === 'left' ? -1 : 1;
      const deltaAngle = (Math.PI * 3 + sign * (relativeAngle - sideWall.relativeAngle)) % TWO_PI;
      if (deltaAngle <= HALF_PI + 0.01 && deltaAngle > 0) {
        offset = Math.min(ly / Math.tan(deltaAngle) + sideWall.ly, lx);
      }
    }
    return offset;
  }

  static getAllConnectedWalls = (wall: WallModel) => {
    const getElementById = useStore.getState().getElementById;

    const array = [];
    const startWall = wall;
    while (wall) {
      array.push(wall);
      if (wall.leftJoints[0]) {
        if (wall.leftJoints[0] !== startWall.id) {
          const w = getElementById(wall.leftJoints[0]);
          if (w && w.type === ObjectType.Wall) {
            wall = w as WallModel;
          }
        }
        // is a loop
        else {
          return array;
        }
      } else {
        break;
      }
    }

    const w = getElementById(startWall.rightJoints[0]);
    if (w && w.type === ObjectType.Wall) {
      wall = w as WallModel;
    }
    while (wall) {
      array.push(wall);
      if (wall.rightJoints[0] && wall.rightJoints[0] !== startWall.id) {
        const w = getElementById(wall.rightJoints[0]);
        if (w) {
          wall = w as WallModel;
        }
      } else {
        break;
      }
    }

    return array;
  };

  static getWorldDataById = (id: string): { pos: Vector3; rot: number; topZ: number } => {
    const el = useStore.getState().getElementById(id);
    if (!el) return { pos: new Vector3(), rot: 0, topZ: 0 };

    const currPos = new Vector3(el.cx, el.cy, el.cz);
    const currRot = el.rotation[2];
    const currTopZ = el.lz;

    if (el.parentId === GROUND_ID) {
      return { pos: currPos, rot: currRot, topZ: currTopZ };
    }
    const { pos: worldPos, rot: worldRot, topZ: worldTopZ } = Util.getWorldDataById(el.parentId);
    const euler = new Euler(0, 0, worldRot);

    return {
      pos: new Vector3().addVectors(currPos.applyEuler(euler), worldPos.clone().setZ(worldTopZ)),
      rot: currRot + worldRot,
      topZ: currTopZ + worldTopZ,
    };
  };

  /** check is child recursively */
  static isChild = (baseId: string, childId: string, checkLock = false): boolean => {
    const child = useStore.getState().getElementById(childId);
    if (!child) return false;
    if (checkLock && child.locked) return false;
    if (child.parentId === baseId) return true;
    return Util.isChild(baseId, child.parentId, checkLock);
  };

  static getBaseId = (id: string): string | null => {
    const el = useStore.getState().getElementById(id);
    if (!el) return null;
    if (el.parentId === GROUND_ID) return el.id;
    return Util.getBaseId(el.parentId);
  };

  static isElementTriggerAutoDeletion = (el: ElementModel) => {
    if (el.type === ObjectType.Roof) {
      const roof = el as RoofModel;
      if (roof.roofType === RoofType.Gable || roof.roofType === RoofType.Gambrel) {
        return true;
      }
    }
    if (el.type !== ObjectType.Wall) return false;

    const wall = el as WallModel;
    if (!wall.roofId) return false;

    const roof = useStore.getState().getElementById(wall.roofId) as RoofModel;
    if (!roof) return false;

    switch (roof.roofType) {
      case RoofType.Hip:
      case RoofType.Gable:
      case RoofType.Gambrel:
        return true;
      case RoofType.Pyramid:
      case RoofType.Mansard: {
        if (roof.wallsId.length === 0) return false;
        return roof.wallsId[0] === wall.id;
      }
      default:
        return false;
    }
  };

  static isElementAllowedMultipleMoveOnGround(e: ElementModel) {
    if (e.type === ObjectType.Foundation) return true;
    if (e.type === ObjectType.Cuboid && e.parentId === GROUND_ID) return true;
    return false;
  }

  static areBasesOverlapped(bId1: string, bId2: string, verticesMap: Map<string, Point2[]>) {
    const v1 = verticesMap.get(bId1);
    const v2 = verticesMap.get(bId2);
    if (!v1 || !v2) return false;
    for (const v of v1) {
      if (Util.isPointInside(v.x, v.y, v2)) {
        return true;
      }
    }
    for (const v of v2) {
      if (Util.isPointInside(v.x, v.y, v1)) {
        return true;
      }
    }
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

  /** Is first version older than second one */
  static compareVersion(version1: string | undefined, version2: string) {
    if (!version1) return true;

    const [v1Major, v1Minor, v1Patch] = version1.split('.').map((n) => Number(n));
    const [v2Major, v2Minor, v2Patch] = version2.split('.').map((n) => Number(n));

    if (v1Major < v2Major) return true;
    if (v1Major > v2Major) return false;

    if (v1Minor < v2Minor) return true;
    if (v1Minor > v2Minor) return false;

    if (v1Patch < v2Patch) return true;

    return false;
  }

  static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  static isOpenFromURL() {
    const params = new URLSearchParams(window.location.search);
    const userid = params.get('userid');
    const title = params.get('title');
    const project = params.get('project');
    return !!(userid && title && !project);
  }
}
