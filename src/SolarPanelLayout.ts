/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { PolygonModel } from './models/PolygonModel';
import { Util } from './Util';
import { ObjectType, Orientation, RowAxis } from './types';
import { ElementModel } from './models/ElementModel';
import { FoundationModel } from './models/FoundationModel';
import { Point2 } from './models/Point2';
import { ElementModelFactory } from './models/ElementModelFactory';
import { HALF_PI, UNIT_VECTOR_POS_Z } from './constants';
import { PvModel } from './models/PvModel';
import { SolarPanelModel } from './models/SolarPanelModel';

export class SolarPanelLayout {
  static create(
    area: PolygonModel,
    base: ElementModel,
    pvModel: PvModel,
    orientation: Orientation,
    tiltAngle: number,
    rowsPerRack: number,
    interRowSpacing: number,
    rowAxis: RowAxis,
    poleHeight: number,
    poleSpacing: number,
    relativeMargin: number,
  ): SolarPanelModel[] {
    if (base.type !== ObjectType.Foundation) throw new Error('base must be a foundation');
    const foundation = base as FoundationModel;
    const solarPanels: SolarPanelModel[] = [];
    const bounds = Util.calculatePolygonBounds(area.vertices);
    let n: number;
    let start: number;
    let delta: number;
    const ly = (orientation === Orientation.portrait ? pvModel.length : pvModel.width) * rowsPerRack;
    let h = 0.5 * Math.abs(Math.sin(tiltAngle)) * ly;
    if (rowAxis === RowAxis.meridional) {
      // north-south axis, so the array is laid in x direction
      n = Math.floor(((bounds.maxX() - bounds.minX()) * foundation.lx - ly) / interRowSpacing);
      start = bounds.minX() + ly / (2 * foundation.lx);
      delta = interRowSpacing / foundation.lx;
      h /= foundation.lx;
      let a: Point2 = { x: 0, y: -0.5 } as Point2;
      let b: Point2 = { x: 0, y: 0.5 } as Point2;
      const rotation = 'rotation' in foundation ? foundation.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cx = start + i * delta;
        a.x = b.x = cx - h;
        const p1 = Util.polygonIntersections(a, b, area.vertices);
        a.x = b.x = cx + h;
        const p2 = Util.polygonIntersections(a, b, area.vertices);
        if (p1.length > 1 && p2.length > 1) {
          const test = Math.abs(p1[0].y - p1[1].y) < Math.abs(p2[0].y - p2[1].y);
          let y1 = test ? p1[0].y : p2[0].y;
          let y2 = test ? p1[1].y : p2[1].y;
          const lx = Math.abs(y1 - y2) - 2 * relativeMargin;
          if (lx > 0) {
            const panel = ElementModelFactory.makeSolarPanel(
              foundation,
              pvModel,
              cx,
              (y1 + y2) / 2,
              foundation.lz,
              Orientation.portrait,
              poleHeight,
              poleSpacing,
              tiltAngle,
              HALF_PI,
              UNIT_VECTOR_POS_Z,
              rotation,
              undefined,
              lx * foundation.ly,
              ly,
            );
            panel.referenceId = area.id;
            Util.changeOrientation(panel, pvModel, orientation);
            solarPanels.push(panel);
          }
        }
      }
    } else {
      // east-west axis, so the array is laid in y direction
      n = Math.floor(((bounds.maxY() - bounds.minY()) * foundation.ly - ly) / interRowSpacing);
      start = bounds.minY() + ly / (2 * foundation.ly) + relativeMargin;
      delta = interRowSpacing / foundation.ly;
      h /= foundation.ly;
      let a: Point2 = { x: -0.5, y: 0 } as Point2;
      let b: Point2 = { x: 0.5, y: 0 } as Point2;
      const rotation = 'rotation' in foundation ? foundation.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cy = start + i * delta;
        a.y = b.y = cy - h;
        const p1 = Util.polygonIntersections(a, b, area.vertices);
        a.y = b.y = cy + h;
        const p2 = Util.polygonIntersections(a, b, area.vertices);
        if (p1.length > 1 && p2.length > 1) {
          const test = Math.abs(p1[0].x - p1[1].x) < Math.abs(p2[0].x - p2[1].x);
          let x1 = test ? p1[0].x : p2[0].x;
          let x2 = test ? p1[1].x : p2[1].x;
          const lx = Math.abs(x1 - x2) - 2 * relativeMargin;
          if (lx > 0) {
            const panel = ElementModelFactory.makeSolarPanel(
              foundation,
              pvModel,
              (x1 + x2) / 2,
              cy,
              foundation.lz,
              Orientation.portrait,
              poleHeight,
              poleSpacing,
              tiltAngle,
              0,
              UNIT_VECTOR_POS_Z,
              rotation,
              undefined,
              lx * foundation.lx,
              ly,
            );
            panel.referenceId = area.id;
            Util.changeOrientation(panel, pvModel, orientation);
            solarPanels.push(panel);
          }
        }
      }
    }
    return solarPanels;
  }
}
