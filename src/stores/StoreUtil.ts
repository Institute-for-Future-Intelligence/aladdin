/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from './common';
import { ObjectType } from 'src/types';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { DEFAULT_PARAPET_SETTINGS } from 'src/views/wall/parapet';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { GROUND_ID, VERSION } from 'src/constants';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { ElementModel } from 'src/models/ElementModel';
import { Util } from 'src/Util';

// should put this inside immerSet function, because it mutate state directly
export class StoreUtil {
  static updateOldFile(state: CommonStoreState) {
    if (Util.compareVersion(state.version, VERSION)) {
      if (state.viewState.ambientLightIntensity) {
        state.viewState.ambientLightIntensity *= 2;
      }
      if (state.viewState.directLightIntensity) {
        state.viewState.directLightIntensity *= 3.5;
      }
    }

    const elementMap = new Map<string, ElementModel>();
    for (const e of state.elements) {
      elementMap.set(e.id, e);
    }
    for (const e of state.elements) {
      switch (e.type) {
        case ObjectType.Foundation: {
          // TODO: fix these bugs that are tentatively corrected here
          if (e.parentId !== GROUND_ID) {
            console.error('Error: ' + e.parentId + ' is not ground!');
            e.parentId = GROUND_ID;
          }
          break;
        }
        case ObjectType.Wall: {
          const wall = e as WallModel;
          if (wall.wallStructure === undefined) {
            wall.wallStructure = WallStructure.Default;
          }
          if (wall.structureSpacing === undefined) {
            wall.structureSpacing = 2;
          }
          if (wall.structureWidth === undefined) {
            wall.structureWidth = 0.1;
          }
          if (wall.structureColor === undefined) {
            wall.structureColor = 'white';
          }
          if (wall.opacity === undefined) {
            wall.opacity = 0.5;
          }
          if (wall.fill === undefined) {
            wall.fill = WallFill.Full;
          }
          if (wall.unfilledHeight === undefined) {
            wall.unfilledHeight = 0.5;
          }
          if (wall.leftUnfilledHeight === undefined || wall.rightUnfilledHeight === undefined) {
            const val = wall.unfilledHeight ?? 0.5;
            wall.leftUnfilledHeight = val;
            wall.rightUnfilledHeight = val;
          }
          if (wall.leftTopPartialHeight === undefined || wall.rightTopPartialHeight === undefined) {
            wall.leftTopPartialHeight = wall.lz;
            wall.rightTopPartialHeight = wall.lz;
          }
          if (wall.eavesLength === undefined) {
            if (wall.roofId) {
              const el = elementMap.get(wall.roofId);
              if (el && el.type === ObjectType.Roof) {
                const roof = el as RoofModel;
                wall.eavesLength = roof.overhang !== undefined ? roof.overhang : 0.3;
              } else {
                wall.eavesLength = 0.3;
              }
            }
          }
          if (wall.parapet === undefined) {
            wall.parapet = { ...DEFAULT_PARAPET_SETTINGS };
          }

          if (wall.roofId) {
            const el = elementMap.get(wall.roofId);
            if (el && el.type === ObjectType.Roof) {
              const roof = el as RoofModel;
              if (
                roof.roofType === RoofType.Pyramid ||
                roof.roofType === RoofType.Hip ||
                roof.roofType === RoofType.Mansard
              ) {
                wall.leftRoofHeight = undefined;
                wall.rightRoofHeight = undefined;
              }
            }
          }
          break;
        }
        case ObjectType.Window: {
          const window = e as WindowModel;
          if (window.horizontalMullion === undefined) {
            window.horizontalMullion = window.mullion;
          }
          if (window.verticalMullion === undefined) {
            window.verticalMullion = window.mullion;
          }
          if (window.mullionWidth === undefined) {
            window.mullionWidth = 0.06;
          }
          if (window.horizontalMullionSpacing === undefined) {
            window.horizontalMullionSpacing = window.mullionSpacing ?? 0.5;
          }
          if (window.verticalMullionSpacing === undefined) {
            window.verticalMullionSpacing = window.mullionSpacing ?? 0.5;
          }
          if (window.tint === undefined) {
            window.tint = '#73D8FF';
          }
          if (window.opacity === undefined) {
            window.opacity = 0.5;
          }
          if (window.shutter) {
            window.leftShutter = window.shutter.showLeft;
            window.rightShutter = window.shutter.showRight;
            window.shutterColor = window.shutter.color;
            window.shutterWidth = window.shutter.width;
            window.shutter = undefined;
          }
          if (window.shutterColor === undefined) {
            window.shutterColor = 'gray';
          }
          if (window.shutterWidth === undefined) {
            window.shutterWidth = 0.5;
          }
          if (window.mullionColor === undefined) {
            window.mullionColor = 'white';
          }
          if (window.frame === undefined) {
            window.frame = false;
          }
          if (window.color === undefined) {
            window.color = 'white';
          }
          if (window.frameWidth === undefined) {
            window.frameWidth = 0.1;
          }
          if (window.windowType === undefined) {
            window.windowType = WindowType.Default;
          }
          if (window.archHeight === undefined) {
            window.archHeight = 1;
          }
          break;
        }
        case ObjectType.Door: {
          const door = e as DoorModel;
          if (door.doorType === undefined) {
            door.doorType = DoorType.Default;
          }
          if (door.archHeight === undefined) {
            door.archHeight = 1;
          }
          if (door.filled === undefined) {
            door.filled = true;
          }
          break;
        }
        case ObjectType.Roof: {
          const roof = e as RoofModel;
          if (roof.ceiling === undefined) {
            roof.ceiling = false;
          }
          if (roof.roofType === RoofType.Gambrel) {
            const gambrelRoof = roof as GambrelRoofModel;
            if (gambrelRoof.frontRidgePoint === undefined) {
              gambrelRoof.frontRidgePoint = gambrelRoof.frontRidgeLeftPoint
                ? [...gambrelRoof.frontRidgeLeftPoint]
                : [0.35, 0.5];
              gambrelRoof.frontRidgeLeftPoint = undefined;
              gambrelRoof.frontRidgeRightPoint = undefined;
            }
            if (gambrelRoof.backRidgePoint === undefined) {
              gambrelRoof.backRidgePoint = gambrelRoof.backRidgeLeftPoint
                ? [...gambrelRoof.backRidgeLeftPoint]
                : [-0.35, 0.5];
              gambrelRoof.backRidgeLeftPoint = undefined;
              gambrelRoof.backRidgeRightPoint = undefined;
            }
            if (gambrelRoof.topRidgePoint === undefined) {
              gambrelRoof.topRidgePoint = gambrelRoof.topRidgeLeftPoint ? [...gambrelRoof.topRidgeLeftPoint] : [0, 1];
              gambrelRoof.topRidgeLeftPoint = undefined;
              gambrelRoof.topRidgeRightPoint = undefined;
            }
          }
        }
      }
    }
  }
}
