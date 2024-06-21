/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Util } from 'src/Util';
import { Object3D, Object3DEventMap, Vector3 } from 'three';
import { RoofSegmentGroupUserData } from '../roof/roofRenderer';
import { useStore } from 'src/stores/common';
import { HALF_PI } from 'src/constants';
import { SurfaceType } from './refSolarPanel';
import { ObjectType, TrackerType } from 'src/types';

export class SolarPanelUtil {
  static setSelected(id: string, b: boolean) {
    useStore.getState().set((state) => {
      if (!state.multiSelectionsMode) {
        if (b) {
          state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
          state.selectedElementIdSet.clear();
          state.selectedElementIdSet.add(id);
        } else {
          if (state.selectedElement?.id === id) {
            state.selectedElement = null;
          }
          if (state.selectedElementIdSet.has(id)) {
            state.selectedElementIdSet.delete(id);
          }
        }
      }
    });
  }

  static getSurfaceType(parentType?: ObjectType, normal?: Vector3) {
    if (!normal || !parentType) return SurfaceType.Horizontal;
    if (parentType === ObjectType.Wall) {
      return SurfaceType.Vertical;
    } else if (Util.isEqual(normal.z, 1)) {
      return SurfaceType.Horizontal;
    } else if (parentType === ObjectType.Cuboid) {
      return SurfaceType.Vertical;
    } else {
      return SurfaceType.Inclined;
    }
  }

  static findParentGroup(obj: Object3D<Object3DEventMap>, names: string[]): Object3D<Object3DEventMap> | null {
    const parent = obj.parent;
    if (!parent) return null;
    for (const name of names) {
      if (parent.name.includes(name)) return parent;
    }
    return SolarPanelUtil.findParentGroup(parent, names);
  }

  static getRoofId(object: Object3D<Object3DEventMap> | null): string | null {
    if (!object) return null;
    const roofId = object.userData.roofId as string;
    if (roofId) return roofId;
    return SolarPanelUtil.getRoofId(object.parent);
  }

  static getRoofSegmentData(object: Object3D<Object3DEventMap> | null): RoofSegmentGroupUserData | null {
    if (!object) return null;
    const { roofId, foundation, centroid, roofSegments } = object.userData;
    if (!roofId || !foundation || !centroid || !roofSegments) return SolarPanelUtil.getRoofSegmentData(object.parent);
    return { roofId, foundation, centroid, roofSegments } as RoofSegmentGroupUserData;
  }

  static getRelativeAzimuth(angle: number) {
    if (angle > Math.PI) return angle - Math.PI * 2;
    if (angle < -Math.PI) return angle + Math.PI * 2;
    return angle;
  }

  static isTrackerEnabled = (surfaceType: SurfaceType, trackerType: TrackerType) => {
    return surfaceType === SurfaceType.Horizontal && trackerType !== TrackerType.NO_TRACKER;
  };
}
