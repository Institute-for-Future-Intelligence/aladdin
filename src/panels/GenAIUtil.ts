/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import {
  DEFAULT_DOOR_AIR_PERMEABILITY,
  DEFAULT_DOOR_ARCH_HEIGHT,
  DEFAULT_DOOR_COLOR,
  DEFAULT_DOOR_FRAME_COLOR,
  DEFAULT_DOOR_U_VALUE,
  DEFAULT_GROUND_FLOOR_R_VALUE,
  DEFAULT_HORIZONTAL_MULLION_SPACING,
  DEFAULT_MULLION_COLOR,
  DEFAULT_MULLION_WIDTH,
  DEFAULT_ROOF_AIR_PERMEABILITY,
  DEFAULT_ROOF_COLOR,
  DEFAULT_ROOF_R_VALUE,
  DEFAULT_ROOF_SIDE_COLOR,
  DEFAULT_ROOF_THICKNESS,
  DEFAULT_SOLAR_PANEL_MODEL,
  DEFAULT_SOLAR_PANEL_POLE_HEIGHT,
  DEFAULT_SOLAR_PANEL_POLE_RADIUS,
  DEFAULT_SOLAR_PANEL_POLE_SPACING,
  DEFAULT_VERTICAL_MULLION_SPACING,
  DEFAULT_WALL_AIR_PERMEABILITY,
  DEFAULT_WALL_EAVES_LENGTH,
  DEFAULT_WALL_HEIGHT,
  DEFAULT_WALL_OPACITY,
  DEFAULT_WALL_R_VALUE,
  DEFAULT_WALL_STRUCTURE_COLOR,
  DEFAULT_WALL_STRUCTURE_SPACING,
  DEFAULT_WALL_STRUCTURE_WIDTH,
  DEFAULT_WALL_THICKNESS,
  DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY,
  DEFAULT_WINDOW_AIR_PERMEABILITY,
  DEFAULT_WINDOW_ARCH_HEIGHT,
  DEFAULT_WINDOW_COLOR,
  DEFAULT_WINDOW_FRAME_WIDTH,
  DEFAULT_WINDOW_OPACITY,
  DEFAULT_WINDOW_SHUTTER_COLOR,
  DEFAULT_WINDOW_SHUTTER_WIDTH,
  DEFAULT_WINDOW_SILL_WIDTH,
  DEFAULT_WINDOW_TINT,
  DEFAULT_WINDOW_U_VALUE,
  GROUND_ID,
  TWO_PI,
} from 'src/constants';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { Point2 } from 'src/models/Point2';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofModel,
  RoofStructure,
  RoofType,
} from 'src/models/RoofModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { useDataStore } from 'src/stores/commonData';
import {
  Design,
  DoorTexture,
  FoundationTexture,
  ObjectType,
  Orientation,
  RoofTexture,
  SolarStructure,
  WallTexture,
} from 'src/types';
import { Util } from 'src/Util';
import { DEFAULT_PARAPET_SETTINGS } from 'src/views/wall/parapet';
import { HvacSystem } from '../models/HvacSystem';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { PvModel } from '../models/PvModel';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { PrismModel } from 'src/models/PolygonCuboidModel';

export class GenAIUtil {
  static arrayCorrection(jsonElements: any[]) {
    const correctedElements: any[] = [];

    const wallMap = new Map();
    const foundationMap = new Map();
    for (const e of jsonElements) {
      if (e.type === ObjectType.Wall) {
        wallMap.set(e.id, e);
      } else if (e.type === ObjectType.Foundation) {
        foundationMap.set(e.id, e);
      }
    }

    const checkedFoundationIdSet = new Set<string>();

    // correct wall loop: only for four-wall-rectangle loop
    for (const e of jsonElements) {
      if (e.type === ObjectType.Wall) {
        if (checkedFoundationIdSet.has(e.pId)) continue;

        const startingId = e.id;
        let needFlip = false;
        let isClosed = false;
        let counter = 0;
        let wallP = e; // pointer wall move around to check loop.
        while (wallP.rightConnectId && counter < 4) {
          const wallT = wallMap.get(wallP.rightConnectId); // target connected wall
          const angleP = Util.getWallRelativeAngle(wallP.leftPoint, wallP.rightPoint);
          const angleT = Util.getWallRelativeAngle(wallT.leftPoint, wallT.rightPoint);
          if (angleT - angleP === Math.PI / 2 || angleT - angleP === -(3 * Math.PI) / 2) {
            wallP = wallT;
          } else {
            needFlip = true;
          }
          if (wallP.id === startingId) {
            counter++;
            isClosed = true;
          }
        }

        if (isClosed && needFlip) {
          for (const w of jsonElements) {
            if (w.type === ObjectType.Wall && w.pId === e.pId) {
              const copyPoint = [...w.leftPoint];
              const copyId = w.leftConnectId;
              w.leftPoint = [...w.rightPoint];
              w.leftConnectId = w.rightConnectId;
              w.rightPoint = [...copyPoint];
              w.rightConnectId = copyId;
            }
          }
        }
        checkedFoundationIdSet.add(e.pId);
      }
    }

    // correct door position before windows to avoid overlapping
    for (const e of jsonElements) {
      if (e.type === ObjectType.Door) {
        const wall = wallMap.get(e.pId);
        if (wall) {
          const wLx = Math.hypot(wall.rightPoint[0] - wall.leftPoint[0], wall.rightPoint[1] - wall.rightPoint[1]);
          const dCx = e.center[0];
          const dLx = e.size[0];
          if (dCx + dLx / 2 + 0.1 > wLx / 2) {
            e.center[0] = 0;
          }
        }
      }
    }

    // push elements to array (other than rooftop solar panels)
    for (const e of jsonElements) {
      // check and push windows
      if (e.type === ObjectType.Window) {
        const { id, pId, center, size } = e;

        const wall = wallMap.get(pId);
        if (!wall) continue;

        // check boundary
        const wallLx = Math.hypot(wall.leftPoint[0] - wall.rightPoint[0], wall.leftPoint[1] - wall.rightPoint[1]);
        const wallHx = wallLx / 2;
        const margin = 0.05;
        const [cx, cz] = center;
        const [lx, lz] = size;
        if (
          cx + lx / 2 + margin > wallHx ||
          cx - lx / 2 - margin < -wallHx ||
          cz + lz / 2 + margin > wall.height ||
          cz - lz / 2 - margin < 0
        ) {
          console.log('window outside boundary', center, size, wall);
          continue;
        }

        // check collision with door
        let overlapWithDoors = false;
        const doors = jsonElements.filter((e) => e.type === ObjectType.Door && e.pId === pId);
        if (doors.length > 0) {
          for (const door of doors) {
            const [dLx, dLz] = door.size;
            const [dCx, dCz] = [door.center, dLz / 2];
            if (Util.isRectOverlap([dCx, dCz, dLx, dLz], [cx, cz, lx, lz])) {
              console.log('window overlap with door', center, size, door);
              overlapWithDoors = true;
              break;
            }
          }
        }
        if (overlapWithDoors) continue;

        const siblings = correctedElements.filter((e) => e.type === ObjectType.Window && e.id !== id && e.pId === pId);
        if (siblings.length > 0) {
          let overlapWithWindows = false;
          for (const sib of siblings) {
            if (Util.isRectOverlap([cx, cz, lx, lz], [...sib.center, ...sib.size])) {
              overlapWithWindows = true;
              console.log('window overlap with sib', center, size, sib);
              break;
            }
          }
          if (!overlapWithWindows) {
            correctedElements.push(e);
          }
        } else {
          correctedElements.push(e);
        }
      }
      // push other elements to corrected array
      else if (e.type !== ObjectType.SolarPanel) {
        correctedElements.push(e);
      }
    }

    // check/push solar panel at last
    for (const e of jsonElements) {
      if (e.type === ObjectType.SolarPanel) {
        const sp = e;
        const pvModelName = sp.pvModelName ?? 'SPR-X21-335-BLK';
        const pvModules = { ...useStore.getState().supportedPvModules, ...useStore.getState().customPvModules };
        const pvModel = pvModules[pvModelName] as PvModel;

        let [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
        let [cx = 0, cy = 0] = sp.center;

        const roof = jsonElements.find((r) => r.type === ObjectType.Roof && r.fId === sp.fId);
        if (!roof) continue;

        const wallPoints: number[][] = [];
        for (const w of jsonElements) {
          if (w.type === ObjectType.Wall && w.pId === sp.fId) {
            wallPoints.push([...w.leftPoint]);
          }
        }

        let boundaryLx = Math.abs(wallPoints[0][0] - wallPoints[1][0]);
        let boundaryLy = Math.abs(wallPoints[1][1] - wallPoints[2][1]);
        if (boundaryLx === 0 || boundaryLy === 0) {
          boundaryLx = Math.abs(wallPoints[1][0] - wallPoints[2][0]);
          boundaryLy = Math.abs(wallPoints[0][1] - wallPoints[1][1]);
        }
        const roofAngle = Math.atan2(roof.rise, boundaryLy / 2);

        const isOutsideBoundary = (cx: number, cy: number, lx: number, ly: number, bLx: number, bLy: number) => {
          const marginX = bLx * 0.1;
          const marginY = bLy * 0.05;
          return (
            cx + lx / 2 + marginX > bLx / 2 ||
            cx - lx / 2 - marginX < -bLx / 2 ||
            cy + ly / 2 + marginY > bLy / 2 ||
            cy - ly / 2 - marginY < -bLy / 2
          );
        };

        if (roof.rise === 0) {
          // check boundary to correct position
          if (isOutsideBoundary(cx, cy, lx, ly, boundaryLx, boundaryLy)) {
            const oldCenter = [...sp.center];
            sp.center = [0, 0];
            [cx, cy] = sp.center;
            console.log(`sp outside flat boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
          }
          // check boundary to correct size
          if (isOutsideBoundary(cx, cy, lx, ly, boundaryLx, boundaryLy)) {
            const oldSize = [...sp.size];
            sp.size = [Math.min(sp.size[0], boundaryLx * 0.9), Math.min(sp.size[1], boundaryLy * 0.9)];
            [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
            console.log(`sp outside flat boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
          }
        } else {
          if (roof.roofType === RoofType.Hip) {
            const ly2d = ly * Math.cos(roofAngle);
            const ridgeLength = roof.ridgeLength ?? boundaryLx;
            // check boundary to correct position
            if (isOutsideBoundary(cx, cy, lx, ly2d, ridgeLength, boundaryLy)) {
              const oldCenter = [...sp.center];
              if (oldCenter[1] > 0) {
                sp.center = [0, boundaryLy / 4, sp.center[2]];
              } else {
                sp.center = [0, -boundaryLy / 4, sp.center[2]];
              }
              [cx, cy] = sp.center;
              console.log(`sp outside ridge boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
            }
            // check boundary to correct size
            if (isOutsideBoundary(cx, cy, lx, ly2d, ridgeLength, boundaryLy)) {
              const oldSize = [...sp.size];
              sp.size = [
                Math.min(sp.size[0], ridgeLength),
                Math.min(sp.size[1], (boundaryLy / 2 / Math.cos(roofAngle)) * 0.9),
              ];
              [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
              console.log(`sp outside ridge boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
            }
          } else if (roof.roofType === RoofType.Mansard) {
            const ly2d = ly * Math.cos(roofAngle);
            const ridgeLength = (roof.ridgeLength ?? 1) * (Math.sqrt(2) / 2);
            // check boundary to correct position
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx - ridgeLength * 2, boundaryLy - ridgeLength * 2)) {
              const oldCenter = [...sp.center];
              sp.center = [0, 0];
              [cx, cy] = sp.center;
              console.log(`sp outside mansard top boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
            }
            // check boundary to correct size
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx - ridgeLength * 2, boundaryLy - ridgeLength * 2)) {
              const oldSize = [...sp.size];
              sp.size = [
                Math.min(sp.size[0], (boundaryLx - ridgeLength * 2) * 0.9),
                Math.min(sp.size[1], (boundaryLy - ridgeLength * 2) * 0.9),
              ];
              [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
              console.log(`sp outside mansard top boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
            }
          } else if (roof.roofType === RoofType.Gambrel) {
            const ly2d = ly; // approximate
            // check boundary to correct position
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx, 0.35 * boundaryLy)) {
              const oldCenter = [...sp.center];
              if (oldCenter[1] > 0) {
                sp.center = [0, -boundaryLy * 0.175, sp.center[2]];
              } else {
                sp.center = [0, -boundaryLy * 0.175, sp.center[2]];
              }
              [cx, cy] = sp.center;
              console.log(`sp outside wall boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
            }
            // check boundary to correct size
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx, 0.35 * boundaryLy)) {
              const oldSize = [...sp.size];
              sp.size = [Math.min(sp.size[0], boundaryLx * 0.9), Math.min(sp.size[1], boundaryLy * 0.35)];
              [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
              console.log(`sp outside wall boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
            }
          } else if (roof.roofType === RoofType.Gable) {
            const ly2d = ly * Math.cos(roofAngle);
            // check boundary to correct position
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx, boundaryLy)) {
              const oldCenter = [...sp.center];
              if (oldCenter[1] > 0) {
                sp.center = [0, boundaryLy / 4, sp.center[2]];
              } else {
                sp.center = [0, -boundaryLy / 4, sp.center[2]];
              }
              [cx, cy] = sp.center;
              console.log(`sp outside wall boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
            }
            // check boundary to correct size
            if (isOutsideBoundary(cx, cy, lx, ly2d, boundaryLx, boundaryLy)) {
              const oldSize = [...sp.size];
              sp.size = [
                Math.min(sp.size[0], boundaryLx * 0.9),
                Math.min(sp.size[1], (boundaryLy / 2 / Math.cos(roofAngle)) * 0.9),
              ];
              [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
              console.log(`sp outside wall boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
            }
          } else {
            const ly2d = ly * Math.cos(roofAngle);
            // check boundary to correct position
            const { region, outside } = GenAIUtil.checkSolarPanelBoundary(cx, cy, lx, ly2d, boundaryLx, boundaryLy);
            if (outside) {
              const oldCenter = [...sp.center];
              if (region === 'top') {
                sp.center = [0, (boundaryLy * 3) / 8, sp.center[2]];
              } else if (region === 'left') {
                sp.center = [(-boundaryLx * 3) / 8, 0, sp.center[2]];
              } else if (region === 'right') {
                sp.center = [(boundaryLx * 3) / 8, 0, sp.center[2]];
              } else {
                sp.center = [0, (-boundaryLy * 3) / 8, sp.center[2]];
              }
              [cx, cy] = sp.center;
              console.log(`sp outside wall boundary, position corrected: [${oldCenter}] -> [${sp.center}]`);
            }

            // check boundary to correct size
            const { region: region_2, outside: outside_2 } = GenAIUtil.checkSolarPanelBoundary(
              cx,
              cy,
              lx,
              ly2d,
              boundaryLx,
              boundaryLy,
            );
            if (outside_2) {
              const oldSize = [...sp.size];
              if (region_2 === 'left' || region_2 === 'right') {
                sp.size = [
                  Math.min(sp.size[0], (boundaryLy / 2) * 0.9),
                  Math.min(sp.size[1], (boundaryLx / 4 / Math.cos(roofAngle)) * 0.9),
                ];
              } else {
                sp.size = [
                  Math.min(sp.size[0], (boundaryLx / 2) * 0.9),
                  Math.min(sp.size[1], (boundaryLy / 4 / Math.cos(roofAngle)) * 0.9),
                ];
              }
              [lx, ly] = Util.getPanelizedSize(sp, pvModel, sp.size[0], sp.size[1]);
              console.log(`sp outside wall boundary, size corrected: [${oldSize}] -> [${sp.size}]`);
            }
          }
        }

        // check overlap
        const siblings = correctedElements.filter(
          (sib) =>
            sib.type === ObjectType.SolarPanel &&
            sib.parentType === ObjectType.Roof &&
            sib.id !== sp.id &&
            sib.pId === sp.pId,
        );
        if (siblings.length > 0) {
          let isOverlapped = false;
          for (const sib of siblings) {
            const pvModel = pvModules[sib.pvModelName ?? 'SPR-X21-335-BLK'] as PvModel;
            if (
              Util.isRectOverlap(
                [cx, cy, lx, ly],
                [sib.center[0], sib.center[1], ...Util.getPanelizedSize(sib, pvModel, sib.lx, sib.ly)],
              )
            ) {
              isOverlapped = true;
              console.log('sp on roof overlap with sib', sp, sib);
              break;
            }
          }
          if (!isOverlapped) {
            correctedElements.push(sp);
          } else {
            console.log('sp overlapped with siblings');
          }
        } else {
          correctedElements.push(sp);
        }
      }
    }

    return correctedElements;
  }

  static makeFoundationForBuildingDesign(
    id: string,
    center: number[],
    size: number[],
    r: number,
    color: string,
    rValue: number,
    heatingSetpoint: number,
    coolingSetpoint: number,
    coefficientOfPerformanceAC: number,
    hvacId: string,
    hasBattery: boolean,
  ) {
    const [cx = 0, cy = 0] = center;
    const [lx = 10, ly = 10, lz = 0.1] = size;
    return {
      id,
      type: ObjectType.Foundation,
      cx,
      cy,
      cz: lz / 2,
      lx: lx + (hasBattery ? 3.5 : 0.5),
      ly: ly + (hasBattery ? 1.5 : 0.5),
      lz,
      normal: [0, 0, 1],
      rotation: [0, 0, ((((r + 180) % 360) + 360) % 360) - 180],
      parentId: GROUND_ID,
      color,
      textureType: FoundationTexture.NoTexture,
      rValue: rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      hvacSystem: {
        id: hvacId,
        heatingSetpoint: heatingSetpoint ?? 20,
        coolingSetpoint: coolingSetpoint ?? 25,
        temperatureThreshold: 3,
        coefficientOfPerformanceAC: coefficientOfPerformanceAC ?? 4,
      } as HvacSystem,
    } as FoundationModel;
  }

  static makeWall(
    id: string,
    pId: string,
    thickness: number,
    height: number,
    color: string,
    overhang = 0.3,
    rValue = 2,
    airPermeability = 0,
    leftPoint: number[],
    rightPoint: number[],
    leftConnectId?: string,
    rightConnectId?: string,
  ) {
    const ly = thickness ?? DEFAULT_WALL_THICKNESS;
    const lz = height ?? DEFAULT_WALL_HEIGHT;
    const [lpx, lpy] = leftPoint;
    const [rpx, rpy] = rightPoint;
    const cx = (lpx + rpx) / 2;
    const cy = (lpy + rpy) / 2;
    const lx = Math.hypot(lpx - rpx, lpy - rpy);

    let angle = Math.atan2(rpy - lpy, rpx - lpx);
    angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

    return {
      type: ObjectType.Wall,
      cx,
      cy,
      cz: 0,
      lx,
      ly,
      lz,
      parapet: { ...DEFAULT_PARAPET_SETTINGS },
      eavesLength: overhang ?? DEFAULT_WALL_EAVES_LENGTH,
      rValue: rValue ?? DEFAULT_WALL_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_WALL_AIR_PERMEABILITY,
      fill: WallFill.Full,
      leftUnfilledHeight: 0.5,
      rightUnfilledHeight: 0.5,
      leftTopPartialHeight: DEFAULT_WALL_HEIGHT - 0.5,
      rightTopPartialHeight: DEFAULT_WALL_HEIGHT - 0.5,
      relativeAngle: angle,
      leftPoint: [lpx, lpy, 0],
      rightPoint: [rpx, rpy, 0],
      leftJoints: leftConnectId ? [leftConnectId] : [],
      rightJoints: rightConnectId ? [rightConnectId] : [],
      textureType: WallTexture.Default,
      color: color,
      volumetricHeatCapacity: DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY,
      wallStructure: WallStructure.Default,
      studSpacing: DEFAULT_WALL_STRUCTURE_SPACING,
      studWidth: DEFAULT_WALL_STRUCTURE_WIDTH,
      studColor: DEFAULT_WALL_STRUCTURE_COLOR,
      opacity: DEFAULT_WALL_OPACITY,
      lineWidth: 0.2,
      lineColor: '#000000',
      windows: [],
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: pId,
      foundationId: pId,
      id: id,
    } as WallModel;
  }

  static makeDoor(
    id: string,
    pId: string,
    fId: string,
    center: number[],
    size: number[],
    filled: boolean,
    color: string,
    frameColor: string,
    uValue: number,
    airPermeability: number,
    doorType: string,
    textureType: string,
  ) {
    const [cx, cz] = center;
    const [lx, lz] = size;
    return {
      type: ObjectType.Door,
      cx: cx,
      cy: 0,
      cz: cz,
      lx: lx,
      ly: 0,
      lz: lz,
      doorType: doorType ?? DoorType.Default,
      filled: filled ?? true,
      interior: false,
      archHeight: DEFAULT_DOOR_ARCH_HEIGHT,
      textureType: textureType ?? DoorTexture.Texture01,
      color: color ?? DEFAULT_DOOR_COLOR,
      frameColor: frameColor ?? DEFAULT_DOOR_FRAME_COLOR,
      uValue: uValue ?? DEFAULT_DOOR_U_VALUE,
      airPermeability: airPermeability ?? DEFAULT_DOOR_AIR_PERMEABILITY,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: pId,
      foundationId: fId,
      id: id,
    } as DoorModel;
  }

  static makeGableRoof(
    id: string,
    fId: string,
    wId: string,
    thickness: number,
    rise: number,
    color: string,
    rValue: number,
    airPermeability: number,
  ) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: false,
      thickness: thickness ?? DEFAULT_ROOF_THICKNESS,
      rise: rise,
      rValue: rValue ?? DEFAULT_ROOF_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_ROOF_AIR_PERMEABILITY,
      color: color ?? DEFAULT_ROOF_COLOR,
      sideColor: DEFAULT_ROOF_SIDE_COLOR,
      textureType: RoofTexture.Default,
      roofType: RoofType.Gable,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
      ridgeLeftPoint: [0, 1],
      ridgeRightPoint: [0, 1],
    } as GableRoofModel;
  }

  static makePyramidRoof(
    id: string,
    fId: string,
    wId: string,
    thickness: number,
    rise: number,
    color: string,
    rValue: number,
    airPermeability: number,
  ) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: false,
      rise: rise,
      thickness: thickness ?? DEFAULT_ROOF_THICKNESS,
      rValue: rValue ?? DEFAULT_ROOF_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_ROOF_AIR_PERMEABILITY,
      color: color,
      sideColor: DEFAULT_ROOF_SIDE_COLOR,
      textureType: RoofTexture.Default,
      roofType: RoofType.Pyramid,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
    } as PyramidRoofModel;
  }

  static makeMansardRoof(
    id: string,
    fId: string,
    wId: string,
    thickness: number,
    rise: number,
    color: string,
    ridgeLength = 1,
    rValue: number,
    airPermeability: number,
  ) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: false,
      rise: rise,
      thickness: thickness ?? DEFAULT_ROOF_THICKNESS,
      rValue: rValue ?? DEFAULT_ROOF_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_ROOF_AIR_PERMEABILITY,
      color: color,
      sideColor: DEFAULT_ROOF_SIDE_COLOR,
      textureType: RoofTexture.Default,
      roofType: RoofType.Mansard,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      ridgeWidth: ridgeLength,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
    } as MansardRoofModel;
  }

  static makeGambrelRoof(
    id: string,
    fId: string,
    wId: string,
    thickness: number,
    rise: number,
    color: string,
    rValue: number,
    airPermeability: number,
  ) {
    const xPercent = 0.35;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: false,
      rise: rise,
      thickness: thickness ?? DEFAULT_ROOF_THICKNESS,
      rValue: rValue ?? DEFAULT_ROOF_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_ROOF_AIR_PERMEABILITY,
      color: color,
      sideColor: DEFAULT_ROOF_SIDE_COLOR,
      textureType: RoofTexture.Default,
      roofType: RoofType.Gambrel,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      topRidgePoint: [0, 1],
      frontRidgePoint: [xPercent, 0.5],
      backRidgePoint: [xPercent, 0.5],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
    } as GambrelRoofModel;
  }

  static makeHipRoof(
    id: string,
    fId: string,
    wId: string,
    thickness: number,
    rise: number,
    color: string,
    ridgeLength = 2,
    rValue: number,
    airPermeability: number,
  ) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: false,
      rise: rise,
      thickness: thickness ?? DEFAULT_ROOF_THICKNESS,
      rValue: rValue ?? DEFAULT_ROOF_R_VALUE,
      airPermeability: airPermeability ?? DEFAULT_ROOF_AIR_PERMEABILITY,
      color: color,
      sideColor: DEFAULT_ROOF_SIDE_COLOR,
      textureType: RoofTexture.Default,
      roofType: RoofType.Hip,
      roofStructure: RoofStructure.Default,
      wallsId: [wId],
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: fId,
      foundationId: fId,
      id: id,
      leftRidgeLength: ridgeLength / 2,
      rightRidgeLength: ridgeLength / 2,
    } as HipRoofModel;
  }

  static makeWindow(
    id: string,
    pId: string,
    fId: string,
    center: number[],
    size: number[],
    opacity: number,
    uValue: number,
    color: string,
    tint: string,
    windowType: WindowType,
    shutter: boolean,
    shutterColor: string,
    shutterWidth: number,
    horizontalMullion: boolean,
    horizontalMullionSpacing: number,
    verticalMullion: boolean,
    verticalMullionSpacing: number,
    mullionColor: string,
    mullionWidth: number,
  ) {
    const [cx, cz] = center;
    const [lx, lz] = size;
    return {
      type: ObjectType.Window,
      cx: cx,
      cy: 0.3,
      cz: cz,
      lx: lx,
      ly: 0.3,
      lz: lz,
      leftShutter: shutter !== undefined ? shutter : false,
      rightShutter: shutter !== undefined ? shutter : false,
      shutterColor: shutterColor ?? DEFAULT_WINDOW_SHUTTER_COLOR,
      shutterWidth: shutterWidth !== undefined ? shutterWidth : DEFAULT_WINDOW_SHUTTER_WIDTH,
      horizontalMullion: horizontalMullion !== undefined ? horizontalMullion : true,
      verticalMullion: verticalMullion !== undefined ? verticalMullion : true,
      mullionWidth: mullionWidth !== undefined ? mullionWidth : DEFAULT_MULLION_WIDTH,
      horizontalMullionSpacing:
        horizontalMullionSpacing !== undefined ? horizontalMullionSpacing : DEFAULT_HORIZONTAL_MULLION_SPACING,
      verticalMullionSpacing:
        verticalMullionSpacing !== undefined ? verticalMullionSpacing : DEFAULT_VERTICAL_MULLION_SPACING,
      mullionColor: mullionColor ?? DEFAULT_MULLION_COLOR,
      frame: true,
      frameWidth: DEFAULT_WINDOW_FRAME_WIDTH,
      sillWidth: DEFAULT_WINDOW_SILL_WIDTH,
      windowType: windowType ?? WindowType.Default,
      empty: false,
      interior: false,
      archHeight: DEFAULT_WINDOW_ARCH_HEIGHT,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      color: color ?? DEFAULT_WINDOW_COLOR, // frame color
      tint: tint ?? DEFAULT_WINDOW_TINT, // glass color
      opacity: opacity !== undefined ? opacity : DEFAULT_WINDOW_OPACITY,
      uValue: uValue ?? DEFAULT_WINDOW_U_VALUE,
      airPermeability: DEFAULT_WINDOW_AIR_PERMEABILITY,
      normal: [0, -1, 0],
      rotation: [0, 0, 0],
      parentId: pId,
      parentType: ObjectType.Wall,
      foundationId: fId,
      id: id,
    } as WindowModel;
  }

  static makeSolarPanel(
    id: string,
    pId: string,
    fId: string,
    pvModelName: string,
    orientation: string,
    center: number[],
    size: number[],
    batteryId: string,
  ) {
    const pvModules = { ...useStore.getState().supportedPvModules, ...useStore.getState().customPvModules };
    const pvModel = pvModules[pvModelName] as PvModel;

    const [cx, cy, cz] = center;
    const [lx, ly] = size;
    const sp = {
      type: ObjectType.SolarPanel,
      cx,
      cy,
      cz,
      parentId: pId,
      parentType: ObjectType.Roof,
      foundationId: fId,
      id,
      orientation: orientation as Orientation,
      pvModelName: pvModelName ?? DEFAULT_SOLAR_PANEL_MODEL,
      poleHeight: DEFAULT_SOLAR_PANEL_POLE_HEIGHT,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      poleRadius: DEFAULT_SOLAR_PANEL_POLE_RADIUS,
      poleSpacing: DEFAULT_SOLAR_PANEL_POLE_SPACING,
      tiltAngle: 0,
      batteryStorageId: batteryId.length === 0 ? null : batteryId,
      version: 1,
    } as SolarPanelModel;
    sp.lx = Util.panelizeLx(sp, pvModel, lx);
    sp.ly = Util.panelizeLy(sp, pvModel, ly);
    return sp;
  }

  static makeBatteryStorage(
    id: string,
    pId: string,
    center: number[],
    size: number[],
    color: string,
    charging: number,
    discharging: number,
    hvacId: string,
  ) {
    const [cx, cy, cz] = center;
    const [lx, ly, lz] = size;
    return {
      type: ObjectType.BatteryStorage,
      id,
      parentId: pId,
      foundationId: pId,
      cx: cx,
      cy: cy,
      cz: cz,
      lx: lx,
      ly: ly,
      lz: lz,
      chargingEfficiency: charging,
      dischargingEfficiency: discharging,
      normal: [0, 0, 0],
      rotation: [0, 0, 0],
      color: color,
      connectedHvacIds: hvacId ? [hvacId] : [],
    } as BatteryStorageModel;
  }

  static calculateUrbanDesignSolutionSpace(design: Design) {
    let totalRoadLength = 0;
    let numberOfBuildings = 0;
    let totalGreenspaceArea = 0;
    let totalBuildingArea = 0;
    let totalFloorArea = 0;
    const floorHeight = 3; // typical floor height in meters

    // Bounding box
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Helper function to update bounding box with rotated rectangle corners
    const updateBoundingBoxWithRotation = (cx: number, cy: number, lx: number, ly: number, rotation: number[]) => {
      const angle = rotation[2] ?? 0; // rotation around z-axis
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const halfLx = lx / 2;
      const halfLy = ly / 2;

      // 4 corners relative to center
      const corners = [
        { x: -halfLx, y: -halfLy },
        { x: halfLx, y: -halfLy },
        { x: halfLx, y: halfLy },
        { x: -halfLx, y: halfLy },
      ];

      for (const corner of corners) {
        // Apply rotation
        const rotatedX = corner.x * cos - corner.y * sin;
        const rotatedY = corner.x * sin + corner.y * cos;
        // Translate to world coordinates
        const worldX = cx + rotatedX;
        const worldY = cy + rotatedY;
        // Update bounding box
        minX = Math.min(minX, worldX);
        maxX = Math.max(maxX, worldX);
        minY = Math.min(minY, worldY);
        maxY = Math.max(maxY, worldY);
      }
    };

    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Cuboid) {
        numberOfBuildings++;
        const footprint = e.lx * e.ly;
        totalBuildingArea += footprint;
        const floors = Math.max(1, Math.floor(e.lz / floorHeight));
        totalFloorArea += footprint * floors;
        updateBoundingBoxWithRotation(e.cx, e.cy, e.lx, e.ly, e.rotation);
      } else if (e.type === ObjectType.InstancedCuboid) {
        numberOfBuildings++;
        const footprint = e.lx * e.ly;
        totalBuildingArea += footprint;
        const floors = Math.max(1, Math.floor(e.lz / floorHeight));
        totalFloorArea += footprint * floors;
        updateBoundingBoxWithRotation(e.cx, e.cy, e.lx, e.ly, e.rotation);
      } else if (e.type === ObjectType.InstancedFoundation) {
        totalRoadLength += e.lx;
        updateBoundingBoxWithRotation(e.cx, e.cy, e.lx, e.ly, e.rotation);
      } else if (e.type === ObjectType.Greenspace) {
        const prism = e as PrismModel;
        totalGreenspaceArea += Util.getPolygonArea(prism.vertices);
        for (const v of prism.vertices) {
          minX = Math.min(minX, v.x);
          maxX = Math.max(maxX, v.x);
          minY = Math.min(minY, v.y);
          maxY = Math.max(maxY, v.y);
        }
      } else if (e.type === ObjectType.River) {
        const prism = e as PrismModel;
        for (const v of prism.vertices) {
          minX = Math.min(minX, v.x);
          maxX = Math.max(maxX, v.x);
          minY = Math.min(minY, v.y);
          maxY = Math.max(maxY, v.y);
        }
      }
    }

    // Calculate total area from bounding box
    const totalArea = minX !== Infinity ? (maxX - minX) * (maxY - minY) : 1;

    design['numberOfBuildings'] = numberOfBuildings;
    design['floorAreaRatio'] = totalArea > 0 ? totalFloorArea / totalArea : 0;
    design['totalRoadLength'] = totalRoadLength / 1000;
    design['totalArea'] = totalArea / 1000000;
    design['packingDensity'] = totalArea > 0 ? (totalBuildingArea / totalArea) * 100 : 0;
    design['greenspaceRatio'] = totalArea > 0 ? (totalGreenspaceArea / totalArea) * 100 : 0;
  }

  static calculateSolarPowerTowerSolutionSpace(design: Design) {
    let filedArea = 1;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        filedArea = Math.max(filedArea, f.lx * f.ly);
        if (f.notBuilding && f.solarStructure === SolarStructure.FocusTower) {
          design['towerHeight'] = f.solarPowerTower?.towerHeight ?? 10;
        }
      } else {
        design['heliostatLength'] = e.lx;
        design['heliostatWidth'] = e.ly;
      }
    }
    design['heliostatCount'] = useStore.getState().elements.length - 2;
    design['packingDensity'] =
      (design['heliostatLength'] * design['heliostatWidth'] * design['heliostatCount'] * 100) / filedArea;
  }

  static calculateBuildingSolutionSpace(design: Design) {
    let floorArea = 0;
    let surfaceArea = 0;
    let fenestratedArea = 0; // no windows on roof for now
    let wallArea = 0;
    let height = 0;
    let buildingOrientation = null;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall) {
        const wall = e as WallModel;
        const frameVertices = Util.getWallVertices(wall, 0);
        const area = Util.getPolygonArea(frameVertices);
        surfaceArea += area;
        wallArea += area;
        for (const child of useStore.getState().elements) {
          if (child.parentId === wall.id) {
            if (child.type === ObjectType.Window) {
              fenestratedArea += Util.getWindowArea(child as WindowModel, wall);
            } else if (child.type === ObjectType.Door) {
              fenestratedArea += child.lx * child.lz * wall.lx * wall.lz;
            }
          }
        }
      } else if (e.type === ObjectType.Foundation) {
        let highestWall = 0;
        let roofRise = 0;
        for (const child of useStore.getState().elements) {
          if (child.type === ObjectType.Wall && child.parentId === e.id) {
            highestWall = Math.max(highestWall, child.lz);
          } else if (child.type === ObjectType.Roof && child.parentId === e.id) {
            roofRise = (child as RoofModel).rise;
          }
        }
        height = Math.max(height, highestWall + roofRise);
        if (buildingOrientation === null) {
          buildingOrientation = (e.rotation[2] / Math.PI) * 180;
        }
      } else if (e.type === ObjectType.Roof) {
        const roof = e as RoofModel;
        floorArea += Util.calculateBuildingArea(roof);
        surfaceArea += GenAIUtil.calculateRoofArea(roof);
      }
    }

    design['floorArea'] = floorArea;
    design['volume'] = floorArea * height; // todo: genAI volume
    design['surfaceArea'] = surfaceArea;
    design['windowToWallRatio'] = fenestratedArea / wallArea;
    design['height'] = height;
    design['buildingOrientation'] = buildingOrientation ?? 0;

    design['heating'] = 0;
    design['cooling'] = 0;
    design['solar'] = 0;
    design['net'] = 0;
  }

  // todo: no skylight for now
  static calculateRoofArea(roof: RoofModel) {
    const segmentsWithoutOverhang = useDataStore.getState().getRoofSegmentVerticesWithoutOverhang(roof.id);
    if (!segmentsWithoutOverhang) return 0;
    const n = segmentsWithoutOverhang.length;
    if (n === 0) return 0;

    // check if the roof is flat or not
    let flat = true;
    const h0 = segmentsWithoutOverhang[0][0].z;
    for (const s of segmentsWithoutOverhang) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }

    let totalArea = 0;
    switch (roof.roofType) {
      case RoofType.Pyramid: {
        if (flat) {
          let a = 0;
          for (const s of segmentsWithoutOverhang) {
            const points: Point2[] = [];
            for (const v of s) {
              points.push(Util.mapVector3ToPoint2(v));
            }
            a += Util.getPolygonArea(points);
          }
          totalArea += a;
        } else {
          for (const s of segmentsWithoutOverhang) {
            const a = Util.getTriangleArea(s[0], s[1], s[2]);
            totalArea += a;
          }
        }
        break;
      }
      case RoofType.Hip: {
        for (const s of segmentsWithoutOverhang) {
          let a = 0;
          if (s.length === 3) {
            a = Util.getTriangleArea(s[0], s[1], s[2]);
          } else if (s.length === 4) {
            a = Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]);
          }
          totalArea += a;
        }
        break;
      }
      case RoofType.Gambrel: {
        for (const s of segmentsWithoutOverhang) {
          const a = Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]);
          totalArea += a;
        }
        break;
      }
      case RoofType.Gable: {
        for (const s of segmentsWithoutOverhang) {
          const a = Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]);
          totalArea += a;
        }
        break;
      }
      case RoofType.Mansard: {
        for (let i = 0; i < n - 1; i++) {
          const s = segmentsWithoutOverhang[i];
          const a = Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]);
          totalArea += a;
        }
        // the last segment may not be a quad
        const s = segmentsWithoutOverhang[n - 1];
        const points = new Array<Point2>();
        for (const p of s) {
          points.push({ x: p.x, y: p.y } as Point2);
        }
        const a = Util.getPolygonArea(points);
        totalArea += a;
        break;
      }
    }

    return totalArea;
  }

  static getSolarPanelRegion(px: number, py: number, blx: number, bly: number) {
    const k = bly / blx;
    const y1 = k * px;
    const y2 = -k * px;

    if (py > y1 && py > y2) return 'top';
    if (py > y1 && py < y2) return 'left';
    if (py < y1 && py < y2) return 'bot';
    if (py < y1 && py > y2) return 'right';
    return 'on-line';
  }

  static checkSolarPanelBoundary(cx: number, cy: number, lx: number, ly: number, blx: number, bly: number) {
    const regionCenter = GenAIUtil.getSolarPanelRegion(cx, cy, blx, bly);

    const [hx, hy] = [lx / 2, ly / 2];

    let corners = [
      [cx - hx, cy - hy],
      [cx - hx, cy + hy],
      [cx + hx, cy - hy],
      [cx + hx, cy + hy],
    ];

    if (regionCenter === 'left' || regionCenter === 'right') {
      corners = [
        [cx - hy, cy - hx],
        [cx - hy, cy + hx],
        [cx + hy, cy - hx],
        [cx + hy, cy + hx],
      ];
    }

    const cornerRegions = corners.map(([x, y]) => GenAIUtil.getSolarPanelRegion(x, y, blx, bly));

    const allSameRegion = cornerRegions.every((r) => r === regionCenter);

    return {
      region: regionCenter,
      outside: !allSameRegion,
      cornerRegions,
    };
  }
}
