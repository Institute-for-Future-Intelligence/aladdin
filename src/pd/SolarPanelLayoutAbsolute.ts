/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { PolygonModel } from '../models/PolygonModel';
import { Util } from '../Util';
import { ObjectType, Orientation, RowAxis } from '../types';
import { ElementModel } from '../models/ElementModel';
import { Point2 } from '../models/Point2';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { HALF_PI, UNIT_VECTOR_POS_Z } from '../constants';
import { PvModel } from '../models/PvModel';
import { SolarPanelModel } from '../models/SolarPanelModel';

export class SolarPanelLayoutAbsolute {
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
    margin: number,
  ): SolarPanelModel[] {
    if (base.type !== ObjectType.Foundation && base.type !== ObjectType.Cuboid)
      throw new Error('base must be a foundation or cuboid');
    const solarPanels: SolarPanelModel[] = [];
    const rotated = !Util.isZero(base.rotation[2]);
    const vertices: Point2[] = [];
    for (const v of area.vertices) {
      vertices.push({ x: v.x * base.lx + base.cx, y: v.y * base.ly + base.cy } as Point2);
    }
    const verticesRotated = rotated ? Util.rotatePolygon(vertices, base.cx, base.cy, base.rotation[2]) : vertices;
    const bounds = Util.calculatePolygonBounds(verticesRotated);
    const ly = (orientation === Orientation.portrait ? pvModel.length : pvModel.width) * rowsPerRack;
    const h = 0.5 * Math.abs(Math.cos(tiltAngle)) * ly;
    if (rowAxis === RowAxis.eastWest) {
      const maxLength = bounds.maxY() - bounds.minY();
      const n = Math.floor((maxLength - 2 * margin - ly) / interRowSpacing);
      const start = bounds.minY() + ly / 2 + margin;
      const a: Point2 = { x: bounds.minX(), y: 0 } as Point2;
      const b: Point2 = { x: bounds.maxX(), y: 0 } as Point2;
      for (let i = 0; i <= n; i++) {
        const cy = start + i * interRowSpacing;
        a.y = b.y = cy - h;
        const p1 = Util.polygonIntersections(a, b, verticesRotated).sort((v1, v2) => v1.x - v2.x);
        a.y = b.y = cy + h;
        const p2 = Util.polygonIntersections(a, b, verticesRotated).sort((v1, v2) => v1.x - v2.x);
        const numberOfSegments = Math.max(p1.length, p2.length) / 2;
        if (numberOfSegments > 0) {
          for (let s = 0; s < numberOfSegments; s++) {
            const t = s * 2;
            const f1 = p1[t] ?? p2[t];
            const g1 = p1[t + 1] ?? p2[t + 1];
            const f2 = p2[t] ?? p1[t];
            const g2 = p2[t + 1] ?? p1[t + 1];
            const shorter = Math.hypot(f1.x - g1.x, f1.y - g1.y) <= Math.hypot(f2.x - g2.x, f2.y - g2.y);
            const x1 = shorter ? f1.x : f2.x;
            const x2 = shorter ? g1.x : g2.x;
            const y1 = shorter ? f1.y : f2.y;
            const y2 = shorter ? g1.y : g2.y;
            const lx = Math.hypot(x1 - x2, y1 - y2) - 2 * margin;
            if (lx > 0) {
              const cp = Util.relativeCoordinates((x1 + x2) / 2, cy, 0, base);
              const panel = ElementModelFactory.makeSolarPanel(
                base,
                pvModel,
                cp.x * base.lx,
                cp.y * base.ly,
                base.cz,
                Orientation.portrait,
                poleHeight,
                poleSpacing,
                tiltAngle,
                -base.rotation[2],
                UNIT_VECTOR_POS_Z,
                base.rotation,
                undefined,
                lx,
                ly,
              );
              panel.referenceId = area.id;
              Util.changeOrientation(panel, pvModel, orientation);
              solarPanels.push(panel);
            }
          }
        }
      }
    } else if (rowAxis === RowAxis.northSouth) {
      const maxLength = bounds.maxX() - bounds.minX();
      const n = Math.floor((maxLength - 2 * margin - ly) / interRowSpacing);
      const start = bounds.minX() + ly / 2 + margin;
      const a: Point2 = { x: 0, y: bounds.minY() } as Point2;
      const b: Point2 = { x: 0, y: bounds.maxY() } as Point2;
      for (let i = 0; i <= n; i++) {
        const cx = start + i * interRowSpacing;
        a.x = b.x = cx - h;
        const p1 = Util.polygonIntersections(a, b, verticesRotated).sort((v1, v2) => v1.y - v2.y);
        a.x = b.x = cx + h;
        const p2 = Util.polygonIntersections(a, b, verticesRotated).sort((v1, v2) => v1.y - v2.y);
        const numberOfSegments = Math.max(p1.length, p2.length) / 2;
        if (numberOfSegments > 0) {
          for (let s = 0; s < numberOfSegments; s++) {
            const t = s * 2;
            const f1 = p1[t] ?? p2[t];
            const g1 = p1[t + 1] ?? p2[t + 1];
            const f2 = p2[t] ?? p1[t];
            const g2 = p2[t + 1] ?? p1[t + 1];
            const shorter = Math.hypot(f1.x - g1.x, f1.y - g1.y) <= Math.hypot(f2.x - g2.x, f2.y - g2.y);
            const x1 = shorter ? f1.x : f2.x;
            const x2 = shorter ? g1.x : g2.x;
            const y1 = shorter ? f1.y : f2.y;
            const y2 = shorter ? g1.y : g2.y;
            const lx = Math.hypot(x1 - x2, y1 - y2) - 2 * margin;
            if (lx > 0) {
              const cp = Util.relativeCoordinates(cx, (y1 + y2) / 2, 0, base);
              const panel = ElementModelFactory.makeSolarPanel(
                base,
                pvModel,
                cp.x * base.lx,
                cp.y * base.ly,
                base.cz,
                Orientation.portrait,
                poleHeight,
                poleSpacing,
                tiltAngle,
                -base.rotation[2] + HALF_PI,
                UNIT_VECTOR_POS_Z,
                base.rotation,
                undefined,
                lx,
                ly,
              );
              panel.referenceId = area.id;
              Util.changeOrientation(panel, pvModel, orientation);
              solarPanels.push(panel);
            }
          }
        }
      }
    }
    return solarPanels;
  }
}
