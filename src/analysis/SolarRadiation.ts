/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { WallModel } from '../models/WallModel';
import { Util } from '../Util';
import {
  AMBIENT_LIGHT_THRESHOLD,
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  ROOFTOP_SOLAR_PANEL_OFFSET,
} from './sunTools';
import { Euler, Quaternion, Vector2, Vector3 } from 'three';
import { HALF_PI, UNIT_VECTOR_POS_Y, UNIT_VECTOR_POS_Z } from '../constants';
import { AirMass } from './analysisConstants';
import { Point2 } from '../models/Point2';
import { FoundationModel } from '../models/FoundationModel';
import { WorldModel } from '../models/WorldModel';
import { ElementModel } from '../models/ElementModel';
import { DoorModel, DoorType } from '../models/DoorModel';
import { RoofModel } from '../models/RoofModel';
import { WindowModel, WindowType } from '../models/WindowModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Discretization, ObjectType, Orientation, ShadeTolerance, TrackerType } from '../types';
import { PvModel } from '../models/PvModel';

export class SolarRadiation {
  // return the output energy density of a solar panel (need to be multiplied by area, weather factor, etc.)
  static computeSolarPanelOutput(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    pvModel: PvModel,
    panel: SolarPanelModel,
    parent: ElementModel,
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { heatmap: number[][]; average: number } {
    let rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = foundation;
    }
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, foundation, panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const rot = parent.rotation[2];
    let angle = panel.tiltAngle;
    let zRot = rot + panel.relativeAzimuth;
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz + 0.02 + parent.cz + parent.lz / 2;
      if (Util.isZero(panel.rotation[0])) {
        // on a flat roof, add pole height
        center.z += panel.poleHeight;
      } else {
        // on a no-flat roof, ignore tilt angle
        angle = panel.rotation[0];
        zRot = rot;
        flat = false;
      }
    }
    if (walltop && !Util.isZero(panel.tiltAngle)) {
      const wall = parent as WallModel;
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      const an = wallAbsAngle - HALF_PI;
      const dr = (panel.ly * Math.abs(Math.sin(panel.tiltAngle))) / 2;
      center.x += dr * Math.cos(an); // panel.ly has been rotated based on the orientation
      center.y += dr * Math.sin(an);
    }
    const normal = new Vector3().fromArray(panel.normal);
    const month = now.getMonth();
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    let lx: number, ly: number, nx: number, ny: number;
    let dCell: number;
    if (world.discretization === Discretization.EXACT) {
      lx = panel.lx;
      ly = panel.ly;
      if (panel.orientation === Orientation.portrait) {
        nx = Math.max(1, Math.round(panel.lx / pvModel.width));
        ny = Math.max(1, Math.round(panel.ly / pvModel.length));
        nx *= pvModel.n;
        ny *= pvModel.m;
      } else {
        nx = Math.max(1, Math.round(panel.lx / pvModel.length));
        ny = Math.max(1, Math.round(panel.ly / pvModel.width));
        nx *= pvModel.m;
        ny *= pvModel.n;
      }
      dCell = panel.lx / nx;
    } else {
      lx = panel.lx;
      ly = panel.ly;
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
      // nx and ny must be even (for circuit simulation)
      if (nx % 2 !== 0) nx += 1;
      if (ny % 2 !== 0) ny += 1;
      dCell = cellSize;
    }
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - dCell) / 2;
    const y0 = center.y - (ly - dCell) / 2;
    const z0 = rooftop || walltop ? center.z : parent.lz + panel.poleHeight + panel.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    // normal has been set if it is on top of a tilted roof, but has not if it is on top of a foundation or flat roof.
    // so we only need to tilt the normal for a solar panel on a foundation or flat roof
    let normalEuler = new Euler(rooftop && !flat ? 0 : angle, 0, zRot, 'ZYX');
    if (panel.trackerType !== TrackerType.NO_TRACKER) {
      // dynamic angles
      const rotatedSunDirection = rot
        ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
        : sunDirection.clone();
      switch (panel.trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
          const qRotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
          normalEuler = new Euler().setFromQuaternion(qRotAADAT);
          break;
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
          const qRotHSAT = new Quaternion().setFromUnitVectors(
            UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          normalEuler = new Euler().setFromQuaternion(qRotHSAT);
          break;
        case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
          const v2 = new Vector3(rotatedSunDirection.x, -rotatedSunDirection.y, 0).normalize();
          const az = Math.acos(UNIT_VECTOR_POS_Y.dot(v2)) * Math.sign(v2.x);
          normalEuler = new Euler(panel.tiltAngle, 0, az + rot, 'ZYX');
          break;
        case TrackerType.TILTED_SINGLE_AXIS_TRACKER:
          // TODO
          break;
      }
    }
    normal.applyEuler(normalEuler);
    // the dot array on a solar panel above a tilted roof has not been tilted or rotated
    // we need to set the normal Euler below for this case
    if (rooftop && !flat) {
      normalEuler.x = panel.rotation[0];
      normalEuler.z = panel.rotation[2] + rot;
    }
    if (walltop) {
      // wall panels use negative tilt angles, opposite to foundation panels, so we use + below.
      normalEuler.x = HALF_PI + panel.tiltAngle;
      normalEuler.z = (parent as WallModel).relativeAngle + rot;
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        cellOutputs[kx][ky] = indirectRadiation;
        if (dot > 0) {
          v2d.set(x0 + kx * dx, y0 + ky * dy);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (distanceToClosestObject(panel.id, v, sunDirection) < 0) {
            // direct radiation
            cellOutputs[kx][ky] += dot * peakRadiation;
          }
        }
      }
    }
    // we must consider cell wiring and distributed efficiency
    // Nice demo at: https://www.youtube.com/watch?v=UNPJapaZlCU
    let sum = 0;
    switch (pvModel.shadeTolerance) {
      case ShadeTolerance.NONE:
        // all the cells are connected in a single series,
        // so the total output is determined by the minimum
        let min1 = Number.MAX_VALUE;
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            const c = cellOutputs[kx][ky];
            if (c < min1) {
              min1 = c;
            }
          }
        }
        sum = min1 * nx * ny;
        break;
      case ShadeTolerance.PARTIAL:
        // assuming each panel uses a diode bypass to connect two columns of cells
        let min2 = Number.MAX_VALUE;
        if (panel.orientation === Orientation.portrait) {
          // e.g., nx = 6, ny = 10
          for (let kx = 0; kx < nx; kx++) {
            if (kx % 2 === 0) {
              // reset min every two columns of cells
              min2 = Number.MAX_VALUE;
            }
            for (let ky = 0; ky < ny; ky++) {
              const c = cellOutputs[kx][ky];
              if (c < min2) {
                min2 = c;
              }
            }
            if (kx % 2 === 1) {
              sum += min2 * ny * 2;
            }
          }
        } else {
          // landscape, e.g., nx = 10, ny = 6
          for (let ky = 0; ky < ny; ky++) {
            if (ky % 2 === 0) {
              // reset min every two columns of cells
              min2 = Number.MAX_VALUE;
            }
            for (let kx = 0; kx < nx; kx++) {
              const c = cellOutputs[kx][ky];
              if (c < min2) {
                min2 = c;
              }
            }
            if (ky % 2 === 1) {
              sum += min2 * nx * 2;
            }
          }
        }
        break;
      default:
        // this probably is too idealized
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            sum += cellOutputs[kx][ky];
          }
        }
        break;
    }
    return { heatmap: cellOutputs, average: sum / (nx * ny) };
  }

  // Return an array that represents solar energy intensity radiated onto the discretized cells of a wall,
  // along with the unit area. Also return an array with the specific margin for generating a better looking heatmap.
  static computeWallSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    wall: WallModel,
    foundation: FoundationModel,
    windows: ElementModel[],
    doors: ElementModel[],
    solarPanels: ElementModel[],
    margin: number,
    elevation: number,
    distanceToClosestObject: Function,
  ): { intensity: number[][]; unitArea: number; heatmap: number[][] } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = wall.lx;
    const lz = Util.getHighestPointOfWall(wall); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      lz / 2 + foundation.lz,
    );
    const normal = new Vector3(Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0);
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const v = new Vector3();
    const polygonWithMargin = Util.getWallVertices(wall, margin);
    // if margin is zero, skip the calculation to save time
    const polygon = margin === 0 ? null : Util.getWallVertices(wall, 0);
    const halfDif = (lz - wall.lz) / 2;
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const intensity: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    const heatmap: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const kx2 = kx - nx / 2 + 0.5;
        const kz2 = kz - nz / 2 + 0.5;
        const p = { x: kx2 * dx, y: kz2 * dz + halfDif } as Point2;
        const insidePolygonWithMargin = Util.isPointInside(p.x, p.y, polygonWithMargin);
        if (insidePolygonWithMargin) {
          v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
          let isWall = true;
          if (windows && windows.length > 0) {
            for (const w of windows) {
              if (w.type !== ObjectType.Window) continue;
              const cx = w.cx * wall.lx;
              const cz = w.cz * wall.lz;
              const hx = (w.lx * wall.lx) / 2;
              const hz = (w.lz * wall.lz) / 2;
              const window = w as WindowModel;
              if (window.windowType === WindowType.Arched) {
                const absWindowPos = absPos.clone().add(new Vector3(window.cx * wall.lx, 0, window.cz * wall.lz));
                if (SolarRadiation.pointWithinArch(v, window.lx, window.lz, window.archHeight, absWindowPos)) {
                  isWall = false;
                }
              } else {
                if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                  isWall = false;
                  break;
                }
              }
            }
          }
          if (doors && doors.length > 0) {
            for (const d of doors) {
              if (d.type !== ObjectType.Door) continue;
              const cx = d.cx * wall.lx;
              const cz = d.cz * wall.lz;
              const hx = (d.lx * wall.lx) / 2;
              const hz = (d.lz * wall.lz) / 2;
              const door = d as DoorModel;
              if (door.doorType === DoorType.Arched) {
                const absDoorPos = absPos.clone().add(new Vector3(door.cx * wall.lx, 0, door.cz * wall.lz));
                if (SolarRadiation.pointWithinArch(v, door.lx, door.lz, door.archHeight, absDoorPos)) {
                  isWall = false;
                }
              } else {
                if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                  isWall = false;
                  break;
                }
              }
            }
          }
          if (solarPanels && solarPanels.length > 0) {
            for (const s of solarPanels) {
              const cx = s.cx * wall.lx;
              const cz = s.cz * wall.lz;
              const hx = s.lx / 2;
              const hz = s.ly / 2;
              if (p.x >= cx - hx && p.x < cx + hx && p.y >= cz - hz && p.y < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (isWall) {
            const insidePolygon = polygon === null ? true : Util.isPointInside(p.x, p.y, polygon);
            const distance = distanceToClosestObject(wall.id, v, sunDirection);
            heatmap[kx][kz] += indirectRadiation;
            if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
              // wall may be covered by solar panels
              if (insidePolygon) {
                intensity[kx][kz] += indirectRadiation;
              }
            }
            if (dot > 0 && distance < 0) {
              // direct radiation
              heatmap[kx][kz] += dot * peakRadiation;
              if (insidePolygon) {
                intensity[kx][kz] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
    return { intensity: intensity, unitArea: dx * dz, heatmap: heatmap };
  }

  // return an array that represents solar energy radiated onto the discretized cells of a door,
  // along with the unit area
  static computeDoorSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    door: DoorModel,
    wall: WallModel,
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { intensity: number[][]; unitArea: number } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = door.lx * wall.lx;
    const lz = door.lz * wall.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absWallPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      wall.lz / 2 + foundation.lz,
    );
    const absDoorPos = absWallPos.clone().add(new Vector3(door.cx * wall.lx, 0, door.cz * wall.lz));
    const normal = new Vector3(Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0);
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
    const intensity: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    if (door.doorType === DoorType.Arched) {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          const kx2 = kx - nx / 2 + 0.5;
          const kz2 = kz - nz / 2 + 0.5;
          v.set(absDoorPos.x + kx2 * dxcos, absDoorPos.y + kx2 * dxsin, absDoorPos.z + kz2 * dz);
          if (SolarRadiation.pointWithinArch(v, lx, lz, door.archHeight, absDoorPos)) {
            intensity[kx][kz] += indirectRadiation;
            if (dot > 0) {
              if (distanceToClosestObject(door.id, v, sunDirection) < 0) {
                // direct radiation
                intensity[kx][kz] += dot * peakRadiation;
              }
            }
          }
        }
      }
    } else {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          intensity[kx][kz] += indirectRadiation;
          if (dot > 0) {
            const kx2 = kx - nx / 2 + 0.5;
            const kz2 = kz - nz / 2 + 0.5;
            v.set(absDoorPos.x + kx2 * dxcos, absDoorPos.y + kx2 * dxsin, absDoorPos.z + kz2 * dz);
            if (distanceToClosestObject(door.id, v, sunDirection) < 0) {
              // direct radiation
              intensity[kx][kz] += dot * peakRadiation;
            }
          }
        }
      }
    }
    return { intensity: intensity, unitArea: dx * dz };
  }

  static pointWithinArch(point: Vector3, lx: number, lz: number, archHeight: number, center: Vector3): boolean {
    if (archHeight > 0) {
      const hx = 0.5 * lx;
      const ah = Math.min(archHeight, lz, hx); // actual arch height
      const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
      // check if the point is within the rectangular part
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const dr = dx * dx + dy * dy;
      let dz = point.z - center.z;
      if (dr < hx * hx && dz < lz / 2 - ah && dz > -lz / 2) {
        return true;
      }
      // check if the point is within the arch part
      dz = point.z - (lz - r);
      return dr + dz * dz < r * r;
    }
    return true;
  }

  // return an array that represents solar energy radiated onto the discretized cells of a window on a wall,
  // along with the unit area
  static computeWallWindowSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    window: WindowModel,
    wall: WallModel,
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { intensity: number[][]; unitArea: number } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = window.lx * wall.lx;
    const lz = window.lz * wall.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absWallAngle = foundation.rotation[2] + wall.relativeAngle;
    const absWallPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      wall.lz / 2 + foundation.lz,
    );
    const absWindowPos = absWallPos.clone().add(new Vector3(window.cx * wall.lx, 0, window.cz * wall.lz));
    const normal = new Vector3(Math.cos(absWallAngle - HALF_PI), Math.sin(absWallAngle - HALF_PI), 0);
    const dxcos = dx * Math.cos(absWallAngle);
    const dxsin = dx * Math.sin(absWallAngle);
    const v = new Vector3();
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const intensity: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    if (window.windowType === WindowType.Arched) {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          const kx2 = kx - nx / 2 + 0.5;
          const kz2 = kz - nz / 2 + 0.5;
          v.set(absWindowPos.x + kx2 * dxcos, absWindowPos.y + kx2 * dxsin, absWindowPos.z + kz2 * dz);
          if (SolarRadiation.pointWithinArch(v, lx, lz, window.archHeight, absWindowPos)) {
            intensity[kx][kz] += indirectRadiation;
            if (dot > 0) {
              if (distanceToClosestObject(window.id, v, sunDirection) < 0) {
                // direct radiation
                intensity[kx][kz] += dot * peakRadiation;
              }
            }
          }
        }
      }
    } else {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          intensity[kx][kz] += indirectRadiation;
          if (dot > 0) {
            const kx2 = kx - nx / 2 + 0.5;
            const kz2 = kz - nz / 2 + 0.5;
            v.set(absWindowPos.x + kx2 * dxcos, absWindowPos.y + kx2 * dxsin, absWindowPos.z + kz2 * dz);
            if (distanceToClosestObject(window.id, v, sunDirection) < 0) {
              // direct radiation
              intensity[kx][kz] += dot * peakRadiation;
            }
          }
        }
      }
    }
    return { intensity: intensity, unitArea: dx * dz };
  }

  // return an array that represents solar energy radiated onto the discretized cells of a window on a roof,
  // along with the unit area
  static computeRoofWindowSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    window: WindowModel,
    roof: RoofModel,
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { intensity: number[][]; unitArea: number } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lx = window.lx;
    const lz = window.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absRoofAngle = foundation.rotation[2] + roof.rotation[2];
    const absRoofPos = Util.wallAbsolutePosition(new Vector3(roof.cx, roof.cy, roof.cz), foundation).setZ(
      roof.lz / 2 + foundation.lz,
    );
    const absWindowPos = absRoofPos.clone().add(new Vector3(window.cx * roof.lx, 0, window.cz * roof.lz));
    const normal = new Vector3(Math.cos(absRoofAngle - HALF_PI), Math.sin(absRoofAngle - HALF_PI), 0);
    const dxcos = dx * Math.cos(absRoofAngle);
    const dxsin = dx * Math.sin(absRoofAngle);
    const v = new Vector3();
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const intensity: number[][] = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    if (window.windowType === WindowType.Arched) {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          const kx2 = kx - nx / 2 + 0.5;
          const kz2 = kz - nz / 2 + 0.5;
          v.set(absWindowPos.x + kx2 * dxcos, absWindowPos.y + kx2 * dxsin, absWindowPos.z + kz2 * dz);
          if (SolarRadiation.pointWithinArch(v, lx, lz, window.archHeight, absWindowPos)) {
            intensity[kx][kz] += indirectRadiation;
            if (dot > 0) {
              if (distanceToClosestObject(window.id, v, sunDirection) < 0) {
                // direct radiation
                intensity[kx][kz] += dot * peakRadiation;
              }
            }
          }
        }
      }
    } else {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          intensity[kx][kz] += indirectRadiation;
          if (dot > 0) {
            const kx2 = kx - nx / 2 + 0.5;
            const kz2 = kz - nz / 2 + 0.5;
            v.set(absWindowPos.x + kx2 * dxcos, absWindowPos.y + kx2 * dxsin, absWindowPos.z + kz2 * dz);
            if (distanceToClosestObject(window.id, v, sunDirection) < 0) {
              // direct radiation
              intensity[kx][kz] += dot * peakRadiation;
            }
          }
        }
      }
    }
    return { intensity: intensity, unitArea: dx * dz };
  }

  // return arrays of solar energy radiated onto the discretized cells of the segments of a pyramid roof,
  // along with the unit areas on the segments (which may differ)
  static computePyramidRoofSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    roof: RoofModel,
    flat: boolean,
    withoutOverhang: boolean,
    segments: Vector3[][],
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { segmentIntensities: number[][][]; segmentUnitArea: number[] } {
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const dayOfYear = Util.dayOfYear(now);
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const segmentIntensities: number[][][] = [];
    const segmentUnitAreas: number[] = [];
    if (flat) {
      // obtain the bounding rectangle
      let minX = Number.MAX_VALUE;
      let minY = Number.MAX_VALUE;
      let maxX = -Number.MAX_VALUE;
      let maxY = -Number.MAX_VALUE;
      for (const s of segments) {
        for (const v of s) {
          const v2 = v.clone().applyEuler(euler);
          if (v2.x > maxX) maxX = v2.x;
          else if (v2.x < minX) minX = v2.x;
          if (v2.y > maxY) maxY = v2.y;
          else if (v2.y < minY) minY = v2.y;
        }
      }
      minX += foundation.cx;
      minY += foundation.cy;
      maxX += foundation.cx;
      maxY += foundation.cy;
      const nx = Math.max(2, Math.round((maxX - minX) / cellSize));
      const ny = Math.max(2, Math.round((maxY - minY) / cellSize));
      const dx = (maxX - minX) / nx;
      const dy = (maxY - minY) / ny;
      const intensity: number[][] = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      segmentIntensities.push(intensity);
      segmentUnitAreas.push(dx * dy);
      const h0 = segments[0][0].z;
      // we have to add roof thickness since the segment vertices without overhang are from the inside surface
      const v0 = new Vector3(
        minX + cellSize / 2,
        minY + cellSize / 2,
        foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
      );
      const v = new Vector3(0, 0, v0.z);
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        UNIT_VECTOR_POS_Z,
        peakRadiation,
      );
      const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
      for (let p = 0; p < nx; p++) {
        v.x = v0.x + p * dx;
        for (let q = 0; q < ny; q++) {
          v.y = v0.y + q * dy;
          const distance = distanceToClosestObject(roof.id, v, sunDirection);
          if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
            // roof may be covered by solar panels
            intensity[p][q] += indirectRadiation;
          }
          if (dot > 0 && distance < 0) {
            // direct radiation
            intensity[p][q] += dot * peakRadiation;
          }
        }
      }
    } else {
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
        const intensity: number[][] = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        segmentIntensities.push(intensity);
        v10.normalize();
        // find the position of the top point relative to the first edge point
        const m2 = (m * v20.dot(v10)) / length10;
        v20.normalize();
        v21.normalize();
        // find the normal vector of the plane (must normalize the cross product as it is not normalized!)
        const normal = new Vector3().crossVectors(v20, v21).normalize();
        // find the incremental vector going along the bottom edge (half-length)
        const dm = v10.multiplyScalar((0.5 * length10) / m);
        // find the incremental vector going from bottom to top (half-length)
        const dn = new Vector3()
          .crossVectors(normal, v10)
          .normalize()
          .multiplyScalar((0.5 * distance) / n);
        // find the starting point of the grid (shift half of length in both directions)
        // we have to add roof thickness since the segment vertices without overhang are from the inside surface
        const v0 = new Vector3(
          foundation.cx + s0.x,
          foundation.cy + s0.y,
          foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
        );
        v0.add(dm).add(dn);
        // double half-length to full-length for the increment vectors in both directions
        dm.multiplyScalar(2);
        dn.multiplyScalar(2);
        segmentUnitAreas.push(dm.length() * dn.length());
        const v = new Vector3();
        const relativePolygon: Point2[] = [];
        const margin = 0.01;
        relativePolygon.push({ x: -margin, y: -margin } as Point2);
        relativePolygon.push({ x: m + margin, y: -margin } as Point2);
        relativePolygon.push({ x: m2, y: n + margin } as Point2);
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
            let within = true;
            if (withoutOverhang) {
              within = Util.isPointInside(p, q, relativePolygon);
            }
            if (within) {
              v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
              const distance = distanceToClosestObject(uuid, v, sunDirection);
              if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
                // roof may be covered by solar panels
                intensity[p][q] += indirectRadiation;
              }
              if (dot > 0 && distance < 0) {
                // direct radiation
                intensity[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
    return { segmentIntensities: segmentIntensities, segmentUnitArea: segmentUnitAreas };
  }

  // return arrays of solar energy radiated onto the discretized cells of the segments of a hip roof,
  // along with the unit areas on the segments (which may differ)
  static computeHipRoofSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    roof: RoofModel,
    withoutOverhang: boolean,
    segments: Vector3[][],
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { segmentIntensities: number[][][]; segmentUnitArea: number[] } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const segmentIntensities: number[][][] = [];
    const segmentUnitAreas: number[] = [];
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
      const intensity: number[][] = Array(m)
        .fill(0)
        .map(() => Array(n).fill(0));
      segmentIntensities.push(intensity);
      v10.normalize();
      // find the position of the top point relative to the first edge point
      const m2 = (m * v20.dot(v10)) / length10;
      v20.normalize();
      v21.normalize();
      // find the normal vector of the quad
      // (must normalize the cross product of two normalized vectors as it is not automatically normalized)
      const normal = new Vector3().crossVectors(v20, v21).normalize();
      // find the incremental vector going along the bottom edge (half-length)
      const dm = v10.multiplyScalar((0.5 * length10) / m);
      // find the incremental vector going from bottom to top (half-length)
      const dn = new Vector3()
        .crossVectors(normal, v10)
        .normalize()
        .multiplyScalar((0.5 * distance) / n);
      const v = new Vector3();
      // find the starting point of the grid (shift half of length in both directions)
      // we have to add roof thickness since the segment vertices without overhang are from the inside surface
      const v0 = new Vector3(
        foundation.cx + s0.x,
        foundation.cy + s0.y,
        foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
      );
      v0.add(dm).add(dn);
      // double half-length to full-length for the increment vectors in both directions
      dm.multiplyScalar(2);
      dn.multiplyScalar(2);
      segmentUnitAreas.push(dm.length() * dn.length());
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        normal,
        peakRadiation,
      );
      const dot = normal.dot(sunDirection);
      const projectedVertices: Point2[] = [];
      for (const t of s) {
        projectedVertices.push({ x: t.x, y: t.y } as Point2);
      }
      if (index % 2 === 0) {
        // even number (0, 2) are quads, odd number (1, 3) are triangles
        for (let p = 0; p < m; p++) {
          const dmp = dm.clone().multiplyScalar(p);
          for (let q = 0; q < n; q++) {
            v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
            let within = true;
            if (withoutOverhang) {
              within = Util.isPointInside(v.x, v.y, projectedVertices);
            }
            if (within) {
              const distance = distanceToClosestObject(uuid, v, sunDirection);
              if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
                // roof may be covered by solar panels
                intensity[p][q] += indirectRadiation;
              }
              if (dot > 0 && distance < 0) {
                // direct radiation
                intensity[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      } else {
        const relativePolygon: Point2[] = [];
        const margin = 0.01;
        relativePolygon.push({ x: -margin, y: -margin } as Point2);
        relativePolygon.push({ x: m + margin, y: -margin } as Point2);
        relativePolygon.push({ x: m2, y: n + margin } as Point2);
        for (let p = 0; p < m; p++) {
          const dmp = dm.clone().multiplyScalar(p);
          for (let q = 0; q < n; q++) {
            let within = true;
            if (withoutOverhang) {
              within = Util.isPointInside(p, q, relativePolygon);
            }
            if (within) {
              v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
              const distance = distanceToClosestObject(uuid, v, sunDirection);
              if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
                // roof may be covered by solar panels
                intensity[p][q] += indirectRadiation;
              }
              if (dot > 0 && distance < 0) {
                // direct radiation
                intensity[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
    return { segmentIntensities: segmentIntensities, segmentUnitArea: segmentUnitAreas };
  }

  // return arrays of solar energy radiated onto the discretized cells of the segments of a gable or gambrel roof,
  // along with the unit areas on the segments (which may differ)
  static computeGableRoofSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    roof: RoofModel,
    withoutOverhang: boolean,
    segments: Vector3[][],
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { segmentIntensities: number[][][]; segmentUnitArea: number[] } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const segmentIntensities: number[][][] = [];
    const segmentUnitAreas: number[] = [];
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
      const intensity: number[][] = Array(m)
        .fill(0)
        .map(() => Array(n).fill(0));
      segmentIntensities.push(intensity);
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
      // find the starting point of the grid (shift half of length in both directions)
      // we have to add roof thickness since the segment vertices without overhang are from the inside surface
      const v0 = new Vector3(
        foundation.cx + s0.x,
        foundation.cy + s0.y,
        foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
      );
      v0.add(dm).add(dn);
      // double half-length to full-length for the increment vectors in both directions
      dm.multiplyScalar(2);
      dn.multiplyScalar(2);
      segmentUnitAreas.push(dm.length() * dn.length());
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
          v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
          const distance = distanceToClosestObject(uuid, v, sunDirection);
          if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
            // roof may be covered by solar panels
            intensity[p][q] += indirectRadiation;
          }
          if (dot > 0 && distance < 0) {
            // direct radiation
            intensity[p][q] += dot * peakRadiation;
          }
        }
      }
    }
    return { segmentIntensities: segmentIntensities, segmentUnitArea: segmentUnitAreas };
  }

  // return arrays of solar energy radiated onto the discretized cells of the segments of a mansard roof,
  // along with the unit areas on the segments (which may differ)
  static computeMansardRoofSolarRadiationEnergy(
    now: Date,
    world: WorldModel,
    sunDirection: Vector3,
    roof: RoofModel,
    withoutOverhang: boolean,
    segments: Vector3[][],
    foundation: FoundationModel,
    elevation: number,
    distanceToClosestObject: Function,
  ): { segmentIntensities: number[][][]; segmentUnitArea: number[] } {
    const dayOfYear = Util.dayOfYear(now);
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const segmentIntensities: number[][][] = [];
    const segmentUnitAreas: number[] = [];
    for (const [index, s] of segments.entries()) {
      const uuid = roof.id + '-' + index;
      if (index === segments.length - 1) {
        // top surface
        // obtain the bounding rectangle
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        for (const v of s) {
          const v2 = v.clone().applyEuler(euler);
          if (v2.x > maxX) maxX = v2.x;
          else if (v2.x < minX) minX = v2.x;
          if (v2.y > maxY) maxY = v2.y;
          else if (v2.y < minY) minY = v2.y;
        }
        minX += foundation.cx;
        minY += foundation.cy;
        maxX += foundation.cx;
        maxY += foundation.cy;
        const h0 = s[0].z;
        const nx = Math.max(2, Math.round((maxX - minX) / cellSize));
        const ny = Math.max(2, Math.round((maxY - minY) / cellSize));
        const dx = (maxX - minX) / nx;
        const dy = (maxY - minY) / ny;
        segmentUnitAreas.push(dx * dy);
        const intensity: number[][] = Array(nx)
          .fill(0)
          .map(() => Array(ny).fill(0));
        segmentIntensities.push(intensity);
        // we have to add roof thickness since the segment vertices without overhang are from the inside surface
        const v0 = new Vector3(
          minX + cellSize / 2,
          minY + cellSize / 2,
          foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
        );
        const v = new Vector3(0, 0, v0.z);
        const indirectRadiation = calculateDiffuseAndReflectedRadiation(
          world.ground,
          now.getMonth(),
          UNIT_VECTOR_POS_Z,
          peakRadiation,
        );
        const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
        for (let p = 0; p < nx; p++) {
          v.x = v0.x + p * dx;
          for (let q = 0; q < ny; q++) {
            v.y = v0.y + q * dy;
            const distance = distanceToClosestObject(uuid, v, sunDirection);
            if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
              // roof may be covered by solar panels
              intensity[p][q] += indirectRadiation;
            }
            if (dot > 0 && distance < 0) {
              // direct radiation
              intensity[p][q] += dot * peakRadiation;
            }
          }
        }
      } else {
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
        const intensity: number[][] = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        segmentIntensities.push(intensity);
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
        // find the starting point of the grid (shift half of length in both directions)
        // we have to add roof thickness since the segment vertices without overhang are from the inside surface
        const v0 = new Vector3(
          foundation.cx + s0.x,
          foundation.cy + s0.y,
          foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET + (withoutOverhang ? roof.thickness : 0),
        );
        v0.add(dm).add(dn);
        // double half-length to full-length for the increment vectors in both directions
        dm.multiplyScalar(2);
        dn.multiplyScalar(2);
        segmentUnitAreas.push(dm.length() * dn.length());
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
            v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
            const distance = distanceToClosestObject(uuid, v, sunDirection);
            if (distance > AMBIENT_LIGHT_THRESHOLD || distance < 0) {
              // roof may be covered by solar panels
              intensity[p][q] += indirectRadiation;
            }
            if (dot > 0 && distance < 0) {
              // direct radiation
              intensity[p][q] += dot * peakRadiation;
            }
          }
        }
      }
    }
    return { segmentIntensities: segmentIntensities, segmentUnitArea: segmentUnitAreas };
  }
}
