/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from './common';
import { ObjectType } from 'src/types';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { DEFAULT_PARAPET_SETTINGS } from 'src/views/wall/parapet';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { DEFAULT_HVAC_SYSTEM, GROUND_ID, HALF_PI, LIGHT_INTENSITY_CHANGED_VERSION } from 'src/constants';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { ElementModel } from 'src/models/ElementModel';
import { Util } from 'src/Util';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { SolarPanelUtil } from 'src/views/solarPanel/SolarPanelUtil';
import { Vector3 } from 'three';
import { FoundationModel } from 'src/models/FoundationModel';

export class StoreUtil {
  static updateOldFileData() {
    useStore.getState().set((state) => {
      if (Util.compareVersion(state.version, LIGHT_INTENSITY_CHANGED_VERSION)) {
        if (state.viewState.ambientLightIntensity) {
          state.viewState.ambientLightIntensity *= 3;
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
            const foundation = e as FoundationModel;
            // TODO: fix these bugs that are tentatively corrected here
            if (e.parentId !== GROUND_ID) {
              console.error('Error: ' + e.parentId + ' is not ground!');
              e.parentId = GROUND_ID;
            }
            if (!foundation.hvacSystem) {
              foundation.hvacSystem = { ...DEFAULT_HVAC_SYSTEM };
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
            break;
          }
          case ObjectType.SolarPanel: {
            const solarPanel = e as SolarPanelModel;
            if (solarPanel.version === undefined) {
              solarPanel.version = 1;
              switch (solarPanel.parentType) {
                case undefined:
                case ObjectType.Foundation: {
                  solarPanel.parentType = ObjectType.Foundation;
                  const foundation = elementMap.get(solarPanel.parentId);
                  if (foundation) {
                    solarPanel.cx = solarPanel.cx * foundation.lx;
                    solarPanel.cy = solarPanel.cy * foundation.ly;
                    solarPanel.cz = solarPanel.cz * foundation.lz;
                  }
                  // for PD layout
                  if (solarPanel.rotation[2] !== 0) {
                    solarPanel.rotation = [0, 0, 0];
                  }
                  break;
                }
                case ObjectType.Cuboid: {
                  const cuboid = elementMap.get(solarPanel.parentId);
                  if (cuboid) {
                    solarPanel.cx = solarPanel.cx * cuboid.lx;
                    solarPanel.cy = solarPanel.cy * cuboid.ly;
                    solarPanel.cz = solarPanel.cz * cuboid.lz;
                    solarPanel.rotation = SolarPanelUtil.getRotationOnCuboid(
                      new Vector3().fromArray(solarPanel.normal),
                    );
                    // for PD layout
                    if (Util.isEqual(0, solarPanel.rotation[0]) && solarPanel.rotation[2] !== 0) {
                      solarPanel.rotation = [0, 0, 0];
                    }
                  }
                  break;
                }
                case ObjectType.Wall: {
                  solarPanel.normal = [0, -1, 0];
                  solarPanel.rotation = [HALF_PI, 0, 0];
                  break;
                }
                case ObjectType.Roof: {
                  if (solarPanel.foundationId) {
                    const foundation = elementMap.get(solarPanel.foundationId);
                    if (foundation) {
                      solarPanel.cx = solarPanel.cx * foundation.lx;
                      solarPanel.cy = solarPanel.cy * foundation.ly;
                      solarPanel.cz = solarPanel.cz + foundation.lz / 2;
                    }
                  }
                  break;
                }
              }
            }
            break;
          }
        }
      }
    });
  }
}
