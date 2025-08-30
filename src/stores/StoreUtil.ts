/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from './common';
import { ObjectType } from 'src/types';
import { WallModel } from 'src/models/WallModel';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { HALF_PI, LIGHT_INTENSITY_CHANGED_VERSION } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { Util } from 'src/Util';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { SolarPanelUtil } from 'src/views/solarPanel/SolarPanelUtil';
import { Vector3 } from 'three';

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
          case ObjectType.Wall: {
            const wall = e as WallModel;
            if (wall.roofId) {
              const el = elementMap.get(wall.roofId);
              if (el && el.type === ObjectType.Roof) {
                const roof = el as RoofModel;
                if (
                  roof.roofType === RoofType.Pyramid ||
                  roof.roofType === RoofType.Hip ||
                  roof.roofType === RoofType.Mansard
                ) {
                  delete wall.leftRoofHeight;
                  delete wall.rightRoofHeight;
                }
              }
            }
            break;
          }
          case ObjectType.Roof: {
            const roof = e as RoofModel;
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
