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

export class SolarPanelLayoutRelative {
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
    const bounds = Util.calculatePolygonBounds(area.vertices);
    const ly = (orientation === Orientation.portrait ? pvModel.length : pvModel.width) * rowsPerRack;
    if (rowAxis === RowAxis.upDown) {
      // north-south axis, so the array is laid in x direction
      const n = Math.floor(((bounds.maxX() - bounds.minX()) * base.lx - ly) / interRowSpacing);
      const start = bounds.minX() + ly / (2 * base.lx) + margin / base.lx;
      const delta = interRowSpacing / base.lx;
      const h = (0.5 * Math.abs(Math.sin(tiltAngle)) * ly) / base.lx;
      const a: Point2 = { x: 0, y: -0.5 } as Point2;
      const b: Point2 = { x: 0, y: 0.5 } as Point2;
      const rotation = 'rotation' in base ? base.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cx = start + i * delta;
        a.x = b.x = cx - h;
        const p1 = Util.polygonIntersections(a, b, area.vertices).sort((v1, v2) => v1.y - v2.y);
        a.x = b.x = cx + h;
        const p2 = Util.polygonIntersections(a, b, area.vertices).sort((v1, v2) => v1.y - v2.y);
        const numberOfSegments = Math.max(p1.length, p2.length) / 2;
        if (numberOfSegments > 0) {
          for (let s = 0; s < numberOfSegments; s++) {
            const t = s * 2;
            const panel = SolarPanelLayoutRelative.makeUpDownSegment(
              p1[t] ?? p2[t],
              p1[t + 1] ?? p2[t + 1],
              p2[t] ?? p1[t],
              p2[t + 1] ?? p1[t + 1],
              rotation,
              cx,
              ly,
              base,
              pvModel,
              tiltAngle,
              poleHeight,
              poleSpacing,
              margin,
            );
            if (panel) {
              panel.referenceId = area.id;
              Util.changeOrientation(panel, pvModel, orientation);
              solarPanels.push(panel);
            }
          }
        }
      }
    } else {
      // east-west axis, so the array is laid in y direction
      const n = Math.floor(((bounds.maxY() - bounds.minY()) * base.ly - 2 * margin - ly) / interRowSpacing);
      const start = bounds.minY() + ly / (2 * base.ly) + margin / base.ly;
      const delta = interRowSpacing / base.ly;
      const h = (0.5 * Math.abs(Math.sin(tiltAngle)) * ly) / base.ly;
      const a: Point2 = { x: -0.5, y: 0 } as Point2;
      const b: Point2 = { x: 0.5, y: 0 } as Point2;
      const rotation = 'rotation' in base ? base.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cy = start + i * delta;
        a.y = b.y = cy - h;
        const p1 = Util.polygonIntersections(a, b, area.vertices).sort((v1, v2) => v1.x - v2.x);
        a.y = b.y = cy + h;
        const p2 = Util.polygonIntersections(a, b, area.vertices).sort((v1, v2) => v1.x - v2.x);
        const numberOfSegments = Math.max(p1.length, p2.length) / 2;
        if (numberOfSegments > 0) {
          for (let s = 0; s < numberOfSegments; s++) {
            const t = s * 2;
            const panel = SolarPanelLayoutRelative.makeLeftRightSegment(
              p1[t] ?? p2[t],
              p1[t + 1] ?? p2[t + 1],
              p2[t] ?? p1[t],
              p2[t + 1] ?? p1[t + 1],
              rotation,
              cy,
              ly,
              base,
              pvModel,
              tiltAngle,
              poleHeight,
              poleSpacing,
              margin,
            );
            if (panel) {
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

  // solar panel rows in up-down direction (north-south if the base's azimuth is zero)
  // p1 and q1 are the end points of the left line of this segment
  // p2 and q2 are the end points of the right line of this segment
  static makeUpDownSegment(
    p1: Point2,
    q1: Point2,
    p2: Point2,
    q2: Point2,
    rotation: number[] | undefined,
    cx: number,
    ly: number,
    base: ElementModel,
    pvModel: PvModel,
    tiltAngle: number,
    poleHeight: number,
    poleSpacing: number,
    margin: number,
  ) {
    const shorter = Math.abs(p1.y - q1.y) < Math.abs(p2.y - q2.y);
    let y1 = shorter ? p1.y : p2.y;
    let y2 = shorter ? q1.y : q2.y;
    const lx = Math.abs(y1 - y2) - (2 * margin) / base.ly;
    if (lx > 0) {
      return ElementModelFactory.makeSolarPanel(
        base,
        pvModel,
        cx,
        (y1 + y2) / 2,
        base.type === ObjectType.Cuboid ? 0.5 : base.lz,
        Orientation.portrait,
        poleHeight,
        poleSpacing,
        tiltAngle,
        HALF_PI,
        UNIT_VECTOR_POS_Z,
        rotation,
        undefined,
        lx * base.ly,
        ly,
      );
    }
    return undefined;
  }

  // solar panel rows in left-right direction (west-east if the base's azimuth is zero)
  // p1 and q1 are the end points of the lower line of this segment
  // p2 and q2 are the end points of the upper line of this segment
  static makeLeftRightSegment(
    p1: Point2,
    q1: Point2,
    p2: Point2,
    q2: Point2,
    rotation: number[] | undefined,
    cy: number,
    ly: number,
    base: ElementModel,
    pvModel: PvModel,
    tiltAngle: number,
    poleHeight: number,
    poleSpacing: number,
    margin: number,
  ) {
    const shorter = Math.abs(p1.x - q1.x) < Math.abs(p2.x - q2.x);
    const x1 = shorter ? p1.x : p2.x;
    const x2 = shorter ? q1.x : q2.x;
    const lx = Math.abs(x1 - x2) - (2 * margin) / base.lx;
    if (lx > 0) {
      return ElementModelFactory.makeSolarPanel(
        base,
        pvModel,
        (x1 + x2) / 2,
        cy,
        base.type === ObjectType.Cuboid ? 0.5 : base.lz,
        Orientation.portrait,
        poleHeight,
        poleSpacing,
        tiltAngle,
        0,
        UNIT_VECTOR_POS_Z,
        rotation,
        undefined,
        lx * base.lx,
        ly,
      );
    }
    return undefined;
  }
}
