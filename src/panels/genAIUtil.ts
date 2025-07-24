import { DEFAULT_HVAC_SYSTEM, GROUND_ID, TWO_PI } from 'src/constants';
import { DoorModel } from 'src/models/DoorModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { GableRoofModel, PyramidRoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { WindowModel } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { DoorTexture, FoundationTexture, ObjectType, RoofTexture, WallTexture } from 'src/types';
import { RoofUtil } from 'src/views/roof/RoofUtil';

export class GenAIUtil {
  static makeFoundation(id: string, center: number[], size: number[], color: string) {
    const [cx, cy] = center;
    const [lx, ly, lz] = size;
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
    center: number[],
    size: number[],
    color: string,
    leftPoint: number[],
    rightPoint: number[],
    leftConnectId?: string,
    rightConnectId?: string,
  ) {
    const [cx, cy] = center;
    const [lx, ly, lz] = size;
    const [lpx, lpy] = leftPoint;
    const [rpx, rpy] = rightPoint;
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
      eavesLength: actionState.wallEavesLength ?? 0.3,
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
}
