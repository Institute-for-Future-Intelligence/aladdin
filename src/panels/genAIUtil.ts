import { DEFAULT_HVAC_SYSTEM, GROUND_ID, TWO_PI } from 'src/constants';
import { DoorModel } from 'src/models/DoorModel';
import { ElementModel } from 'src/models/ElementModel';
import { FoundationModel } from 'src/models/FoundationModel';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofStructure,
  RoofType,
} from 'src/models/RoofModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { WindowModel } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { DoorTexture, FoundationTexture, ObjectType, RoofTexture, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { RoofUtil } from 'src/views/roof/RoofUtil';

export class GenAIUtil {
  static arrayCorrection(jsonElements: any[]) {
    const correctedElements: any[] = [];

    const wallMap = new Map();
    for (const e of jsonElements) {
      if (e.type === ObjectType.Wall) {
        wallMap.set(e.id, e);
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
            counter++;
          } else {
            needFlip = true;
          }
          if (wallP.id === startingId) {
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

    for (const e of jsonElements) {
      // check windows
      if (e.type === ObjectType.Window) {
        const { id, pId, center, size } = e;

        const wall = wallMap.get(pId);
        if (!wall) continue;

        // check bounday
        const wallLx = Math.hypot(wall.leftPoint[0] - wall.rightPoint[0], wall.leftPoint[1] - wall.rightPoint[1]);
        const wallHx = wallLx / 2;
        const margin = 0.05;
        const [cx, cz] = center;
        const [lx, lz] = size;
        if (
          cx + lx / 2 + margin > wallHx ||
          cx - lx / 2 - margin < -wallHx ||
          cz + lz / 2 + margin > wall.size[1] ||
          cz - lz / 2 - margin < 0
        ) {
          console.log('outside boundary', center, size, wall);
          continue;
        }

        // check collision with door
        {
          let isOverlap = false;
          const doors = jsonElements.filter((e) => e.type === ObjectType.Door && e.pId === pId);
          if (doors.length > 0) {
            for (const door of doors) {
              const [dLx, dLz] = door.size;
              const [dCx, dCz] = [door.center, dLz / 2];
              if (Util.isRectOverlap([dCx, dCz, dLx, dLz], [cx, cz, lx, lz])) {
                console.log('overlap with door', center, size, door);
                isOverlap = true;
                break;
              }
            }
          }
          if (isOverlap) continue;
        }

        const siblings = correctedElements.filter((e) => e.type === ObjectType.Window && e.id !== id && e.pId === pId);
        if (siblings.length > 0) {
          let isOverlap = false;
          for (const sib of siblings) {
            if (Util.isRectOverlap([cx, cz, lx, lz], [...sib.center, ...sib.size])) {
              isOverlap = true;
              console.log('ovrelap with sib', center, size, sib);
              break;
            }
          }
          if (!isOverlap) {
            correctedElements.push(e);
          }
        } else {
          correctedElements.push(e);
        }
      } else {
        // push other elements to corrected array
        correctedElements.push(e);
      }
    }

    return correctedElements;
  }

  static makeFoundation(id: string, center: number[], size: number[], color: string) {
    const [cx = 0, cy = 0] = center;
    const [lx = 10, ly = 10, lz = 0.1] = size;
    return {
      type: ObjectType.Foundation,
      cx: cx,
      cy: cy,
      cz: lz / 2,
      lx: lx,
      ly: ly,
      lz: lz,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      color: color,
      textureType: FoundationTexture.NoTexture,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      hvacSystem: { ...DEFAULT_HVAC_SYSTEM },
      id: id,
    } as FoundationModel;
  }

  static makeWall(
    id: string,
    pId: string,
    size: number[],
    color: string,
    overhang = 0.3,
    leftPoint: number[],
    rightPoint: number[],
    leftConnectId?: string,
    rightConnectId?: string,
  ) {
    const [ly, lz] = size;
    const [lpx, lpy] = leftPoint;
    const [rpx, rpy] = rightPoint;
    const cx = (lpx + rpx) / 2;
    const cy = (lpy + rpy) / 2;
    const lx = Math.hypot(lpx - rpx, lpy - rpy);

    let angle = Math.atan2(rpy - lpy, rpx - lpx);
    angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Wall,
      cx: cx,
      cy: cy,
      cz: 0,
      lx: lx,
      ly: ly,
      lz: lz,
      parapet: actionState.wallParapet,
      eavesLength: overhang,
      rValue: actionState.wallRValue ?? 3,
      fill: WallFill.Full,
      leftUnfilledHeight: 0.5,
      rightUnfilledHeight: 0.5,
      leftTopPartialHeight: actionState.wallHeight - 0.5,
      rightTopPartialHeight: actionState.wallHeight - 0.5,
      relativeAngle: angle,
      leftPoint: [lpx, lpy, 0],
      rightPoint: [rpx, rpy, 0],
      leftJoints: leftConnectId ? [leftConnectId] : [],
      rightJoints: rightConnectId ? [rightConnectId] : [],
      textureType: actionState.wallTexture ?? WallTexture.Default,
      color: color,
      volumetricHeatCapacity: actionState.wallVolumetricHeatCapacity ?? 0.5,
      wallStructure: actionState.wallStructure ?? WallStructure.Default,
      studSpacing: actionState.wallStructureSpacing ?? 2,
      studWidth: actionState.wallStructureWidth ?? 0.1,
      studColor: actionState.wallStructureColor ?? '#ffffff',
      opacity: actionState.wallOpacity !== undefined ? actionState.wallOpacity : 0.5,
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

  static makeDoor(id: string, pId: string, fId: string, center: number[], size: number[], color: string) {
    const actionState = useStore.getState().actionState;
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
      doorType: actionState.doorType,
      filled: actionState.doorFilled,
      interior: actionState.doorInterior,
      archHeight: actionState.doorArchHeight,
      textureType: actionState.doorTexture ?? DoorTexture.Default,
      color: color,
      uValue: actionState.doorUValue ?? 0.5,
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

  static makeWindow(id: string, pId: string, fId: string, center: number[], size: number[]) {
    const actionState = useStore.getState().actionState;
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
      leftShutter: actionState.windowShutterLeft,
      rightShutter: actionState.windowShutterRight,
      shutterColor: actionState.windowShutterColor,
      shutterWidth: actionState.windowShutterWidth,
      horizontalMullion: actionState.windowHorizontalMullion,
      verticalMullion: actionState.windowVerticalMullion,
      mullionWidth: actionState.windowMullionWidth,
      horizontalMullionSpacing: actionState.windowHorizontalMullionSpacing,
      verticalMullionSpacing: actionState.windowVerticalMullionSpacing,
      mullionColor: actionState.windowMullionColor,
      frame: actionState.windowFrame,
      frameWidth: actionState.windowFrameWidth,
      sillWidth: RoofUtil.isTypeRoof(ObjectType.Wall) ? 0 : actionState.windowSillWidth,
      windowType: actionState.windowType,
      empty: actionState.windowEmpty,
      interior: actionState.windowInterior,
      archHeight: actionState.windowArchHeight,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      color: actionState.windowColor ?? '#ffffff', // frame color
      tint: actionState.windowTint ?? '#73D8FF', // glass color
      opacity: actionState.windowOpacity !== undefined ? actionState.windowOpacity : 0.5,
      uValue: actionState.windowUValue ?? 0.5,
      normal: [0, -1, 0],
      rotation: [0, 0, 0],
      parentId: pId,
      parentType: ObjectType.Wall,
      foundationId: fId,
      id: id,
    } as WindowModel;
  }

  static makeGableRoof(id: string, fId: string, wId: string, rise: number, color: string) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
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

  static makePyramidRoof(id: string, fId: string, wId: string, rise: number, color: string) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
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

  static makeMansardRoof(id: string, fId: string, wId: string, rise: number, color: string, ridgeLength = 1) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
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

  static makeGambrelRoof(id: string, fId: string, wId: string, rise: number, color: string) {
    const xPercent = 0.35;
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: rise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: color,
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
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

  static makeHipRoof(id: string, fId: string, wId: string, rise: number, color: string, ridgeLength = 2) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
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
}
