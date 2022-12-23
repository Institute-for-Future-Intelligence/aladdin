/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { WallModel } from '../models/WallModel';
import { Util } from '../Util';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation } from './sunTools';
import { Euler, Vector3 } from 'three';
import { HALF_PI } from '../constants';
import { AirMass } from './analysisConstants';
import { Point2 } from '../models/Point2';
import { FoundationModel } from '../models/FoundationModel';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { DoorModel } from '../models/DoorModel';
import { RoofModel } from '../models/RoofModel';

export class SolarRadiation {
  // return an array that represents solar energy radiated onto the discretized cells of a wall
  static computeWallSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    wall: WallModel,
    foundation: FoundationModel,
    windows: ElementModel[],
    doors: ElementModel[],
    solarPanels: ElementModel[],
    elevation: number,
    inShadow: Function,
  ): number[][] {
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
    const energy: number[][] = Array(nx)
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

  // return an array that represents solar energy radiated onto the discretized cells of a door
  static computeDoorSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    door: DoorModel,
    wall: WallModel,
    foundation: FoundationModel,
    elevation: number,
    inShadow: Function,
  ): number[][] {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = door.lx;
    const lz = door.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const da = dx * dz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      wall.lz / 2 + foundation.lz,
    );
    const normal = new Vector3().fromArray([Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0]);
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const v = new Vector3();
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const energy: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const kx2 = kx - nx / 2 + 0.5;
        const kz2 = kz - nz / 2 + 0.5;
        energy[kx][kz] += indirectRadiation * da;
        if (dot > 0) {
          v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
          if (!inShadow(door.id, v, sunDirection)) {
            // direct radiation
            energy[kx][kz] += dot * peakRadiation * da;
          }
        }
      }
    }

    return energy;
  }

  // return arrays that represent solar energy radiated onto the discretized cells of the segments of a roof
  static computeGableRoofSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    roof: RoofModel,
    segments: Vector3[][],
    foundation: FoundationModel,
    solarPanels: ElementModel[], //TODO: Skip areas covered by solar panels on the roof
    elevation: number,
    inShadow: Function,
  ): number[][][] {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const energyOfSegments: number[][][] = [];
    for (const [index, s] of segments.entries()) {
      const uuid = roof.id + '-' + index;
      const s0 = s[0].clone().applyEuler(euler);
      const s1 = s[1].clone().applyEuler(euler);
      const s2 = s[2].clone().applyEuler(euler);
      const v10 = new Vector3().subVectors(s1, s0);
      const v20 = new Vector3().subVectors(s2, s0);
      const v21 = new Vector3().subVectors(s2, s1);
      const length10 = v10.length();
      // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
      const distance = new Vector3().crossVectors(v20, v21).length() / length10;
      const m = Math.max(2, Math.round(length10 / cellSize));
      const n = Math.max(2, Math.round(distance / cellSize));
      const energy: number[][] = Array(m)
        .fill(0)
        .map(() => Array(n).fill(0));
      energyOfSegments.push(energy);
      v10.normalize();
      v20.normalize();
      v21.normalize();
      // find the normal vector of the quad
      const normal = new Vector3().crossVectors(v20, v21).normalize();
      // find the incremental vector going along the bottom edge (half of length)
      const dm = v10.multiplyScalar((0.5 * length10) / m);
      // find the incremental vector going from bottom to top (half of length)
      const dn = new Vector3()
        .crossVectors(normal, v10)
        .normalize()
        .multiplyScalar((0.5 * distance) / n);
      const da = dm.length() * dn.length();
      // find the starting point of the grid (shift half of length in both directions)
      const v0 = new Vector3(foundation.cx + s0.x, foundation.cy + s0.y, foundation.lz + s0.z);
      v0.add(dm).add(dn);
      // double half-length to full-length for the increment vectors in both directions
      dm.multiplyScalar(2);
      dn.multiplyScalar(2);
      const v = new Vector3();
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        normal,
        peakRadiation,
      );
      const dot = normal.dot(sunDirection);
      for (let p = 0; p < m; p++) {
        const dmp = dm.clone().multiplyScalar(p);
        for (let q = 0; q < n; q++) {
          energy[p][q] += indirectRadiation * da;
          if (dot > 0) {
            v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
            if (!inShadow(uuid, v, sunDirection)) {
              // direct radiation
              energy[p][q] += dot * peakRadiation * da;
            }
          }
        }
      }
    }
    return energyOfSegments;
  }
}
