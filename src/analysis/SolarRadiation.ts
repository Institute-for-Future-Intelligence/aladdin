/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { WallModel } from '../models/WallModel';
import { Util } from '../Util';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeDeclinationAngle,
  computeHourAngle,
  computeSunLocation,
} from './sunTools';
import { Vector3 } from 'three';
import { HALF_PI } from '../constants';
import { AirMass } from './analysisConstants';
import { Point2 } from '../models/Point2';
import { FoundationModel } from '../models/FoundationModel';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';

export class SolarRadiation {
  static getSunDirection(date: Date, latitude: number) {
    return computeSunLocation(
      1,
      computeHourAngle(date),
      computeDeclinationAngle(date),
      Util.toRadians(latitude),
    ).normalize();
  }

  // return an array that represents solar energy radiated onto the discretized cells
  static computeWallSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    wall: WallModel,
    foundation: FoundationModel,
    windows: ElementModel[],
    doors: ElementModel[],
    solarPanels: ElementModel[],
    elevation: number,
    inShadow: Function,
  ) {
    const sunDirection = SolarRadiation.getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out

    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = wall.lx;
    const lz = Util.getHighestPointOfWall(wall); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const da = dx * dz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      lz / 2 + foundation.lz,
    );
    const normal = new Vector3().fromArray([Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0]);
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const v = new Vector3();
    const polygon = Util.getWallVertices(wall, 0);
    const halfDif = (lz - wall.lz) / 2;
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const energy = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const kx2 = kx - nx / 2 + 0.5;
        const kz2 = kz - nz / 2 + 0.5;
        const p = { x: kx2 * dx, y: kz2 * dz + halfDif } as Point2;
        if (Util.pointInsidePolygon(p, polygon)) {
          let isWall = true;
          if (windows && windows.length > 0) {
            for (const w of windows) {
              const cx = w.cx * lx;
              const cz = w.cz * lz;
              const hx = (w.lx * lx) / 2;
              const hz = (w.lz * lz) / 2;
              if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (doors && doors.length > 0) {
            for (const d of doors) {
              const cx = d.cx * lx;
              const cz = d.cz * lz;
              const hx = (d.lx * lx) / 2;
              const hz = (d.lz * lz) / 2;
              if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (solarPanels && solarPanels.length > 0) {
            for (const s of solarPanels) {
              const cx = s.cx * lx;
              const cz = s.cz * lz;
              const hx = s.lx / 2;
              const hz = s.ly / 2;
              if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (isWall) {
            energy[kx][kz] += indirectRadiation * da;
            if (dot > 0) {
              v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
              if (!inShadow(wall.id, v, sunDirection)) {
                // direct radiation
                energy[kx][kz] += dot * peakRadiation * da;
              }
            }
          }
        }
      }
    }

    return energy;
  }
}
