/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { useEffect, useMemo } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { WallModel, WallFill, WallStructure } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { Util } from 'src/Util';
import * as Selector from 'src/stores/selector';
import { Vector3 } from 'three';
import { ObjectType } from 'src/types';
import { RoofModel } from 'src/models/RoofModel';

export const useElements = (id: string, leftWallId?: string, rightWallId?: string, roofId?: string) => {
  const isElementTriggerWallChange = (elem: ElementModel) => {
    return elem.parentId === id || elem.id === roofId;
  };

  const leftWall = useStore((state) => {
    if (leftWallId) {
      for (const e of state.elements) {
        if (e.id === leftWallId) {
          return e as WallModel;
        }
      }
    }
    return null;
  });

  const rightWall = useStore((state) => {
    if (rightWallId) {
      for (const e of state.elements) {
        if (e.id === rightWallId) {
          return e as WallModel;
        }
      }
    }
    return null;
  });

  const elementsTriggerChange = useStore((state) => JSON.stringify(state.elements.filter(isElementTriggerWallChange)));

  const elementsOnWall = useMemo(
    () => useStore.getState().elements.filter((el) => isElementTriggerWallChange(el) && Util.isLegalOnWall(el.type)),
    [elementsTriggerChange],
  );

  return { elementsOnWall, leftWall, rightWall };
};

export const useUpdataOldFiles = (wallModel: WallModel) => {
  const fileChanged = useStore(Selector.fileChanged);
  useEffect(() => {
    if (
      wallModel.wallStructure === undefined ||
      wallModel.structureSpacing === undefined ||
      wallModel.structureWidth === undefined ||
      wallModel.structureColor === undefined ||
      wallModel.opacity === undefined ||
      wallModel.fill === undefined ||
      wallModel.unfilledHeight === undefined ||
      wallModel.eavesLength === undefined
    ) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === wallModel.id) {
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
            if (wall.eavesLength === undefined) {
              const roof = state.elements.find((e) => e.id === wall.roofId && e.type === ObjectType.Roof) as RoofModel;
              if (roof) {
                wall.eavesLength = roof.overhang !== undefined ? roof.overhang : 0.3;
              } else {
                wall.eavesLength = 0.3;
              }
            }
            break;
          }
        }
      });
    }
  }, [fileChanged]);
};

export const useHandleSize = (size = 0.3) => {
  const orthographic = useStore((state) => state.viewState.orthographic);
  const cameraPosition = useStore((state) => state.viewState.cameraPosition);
  const cameraZoom = useStore((state) => state.viewState.cameraZoom);

  let handleSize = size;

  if (orthographic) {
    handleSize = Math.max(size, 15 / cameraZoom);
  } else {
    const panCenter = useStore.getState().viewState.panCenter;
    const p = new Vector3(...panCenter);
    const c = new Vector3(...cameraPosition);
    const distance = c.distanceTo(p);
    handleSize = Math.max(size, distance / 100);
  }

  return handleSize;
};
