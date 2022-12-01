import { useEffect, useMemo, useState } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { WallModel, WallDisplayMode, WallStructure } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { Util } from 'src/Util';
import * as Selector from 'src/stores/selector';
import { Vector3 } from 'three';

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
      wallModel.displayMode === undefined ||
      wallModel.bottomHeight === undefined
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
            if (wall.displayMode === undefined) {
              wall.displayMode = WallDisplayMode.All;
            }
            if (wall.bottomHeight === undefined) {
              wall.bottomHeight = 0.5;
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
  const [handleSize, setHandleSize] = useState(size);

  useEffect(() => {
    if (orthographic) {
      setHandleSize(Math.max(0.3, 15 / cameraZoom));
    } else {
      const panCenter = useStore.getState().viewState.panCenter;
      const p = new Vector3(...panCenter);
      const c = new Vector3(...cameraPosition);
      const distance = c.distanceTo(p);
      setHandleSize(Math.max(0.3, distance / 100));
    }
  }, [cameraPosition, cameraZoom]);

  return handleSize;
};
