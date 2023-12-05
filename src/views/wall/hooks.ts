/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import WallTextureDefault from 'src/resources/wall_edge.png';
import WallTexture00 from 'src/resources/tiny_white_square.png';
import WallTexture01 from 'src/resources/wall_01.png';
import WallTexture02 from 'src/resources/wall_02.png';
import WallTexture03 from 'src/resources/wall_03.png';
import WallTexture04 from 'src/resources/wall_04.png';
import WallTexture05 from 'src/resources/wall_05.png';
import WallTexture06 from 'src/resources/wall_06.png';
import WallTexture07 from 'src/resources/wall_07.png';
import WallTexture08 from 'src/resources/wall_08.png';
import WallTexture09 from 'src/resources/wall_09.png';
import WallTexture10 from 'src/resources/wall_10.png';

import { useMemo, useRef } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { Util } from 'src/Util';
import { RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { ObjectType, WallTexture } from 'src/types';
import { invalidate } from '@react-three/fiber';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { FoundationModel } from 'src/models/FoundationModel';

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

export const useHandleSize = (size = 0.3) => {
  const orthographic = useStore((state) => state.viewState.orthographic);
  const cameraPosition = useStore((state) => state.viewState.cameraPosition);
  const cameraZoom = useStore((state) => state.viewState.cameraZoom);

  let handleSize;

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

export const useWallTexture = (textureType: WallTexture, wallStructure?: WallStructure) => {
  const textureLoader = useMemo(() => new TextureLoader(), []);

  return useMemo(() => {
    let textureImg;
    switch (textureType) {
      case WallTexture.Default:
        textureImg = WallTextureDefault;
        break;
      case WallTexture.NoTexture:
        textureImg = WallTexture00;
        break;
      case WallTexture.Texture01:
        textureImg = WallTexture01;
        break;
      case WallTexture.Texture02:
        textureImg = WallTexture02;
        break;
      case WallTexture.Texture03:
        textureImg = WallTexture03;
        break;
      case WallTexture.Texture04:
        textureImg = WallTexture04;
        break;
      case WallTexture.Texture05:
        textureImg = WallTexture05;
        break;
      case WallTexture.Texture06:
        textureImg = WallTexture06;
        break;
      case WallTexture.Texture07:
        textureImg = WallTexture07;
        break;
      case WallTexture.Texture08:
        textureImg = WallTexture08;
        break;
      case WallTexture.Texture09:
        textureImg = WallTexture09;
        break;
      case WallTexture.Texture10:
        textureImg = WallTexture10;
        break;
      default:
        textureImg = WallTexture00;
    }

    if (wallStructure === WallStructure.Stud) {
      textureImg = WallTexture00;
    }

    return textureLoader.load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      let repeatX = 0.6;
      let repeatY = 0.6;
      switch (textureType) {
        case WallTexture.Default:
          repeatX = 2;
          repeatY = 2;
          break;
        case WallTexture.Texture03:
          repeatX = 2;
          repeatY = 1;
          break;
        case WallTexture.Texture06:
          repeatX = 1;
          repeatY = 1;
          break;
      }
      texture.repeat.set(repeatX, repeatY);
      invalidate();
    });
  }, [textureType, wallStructure]);
};

export const useLatestFoundation = (foundationModel: FoundationModel) => {
  const isFirstRenderRef = useRef(true);
  usePrimitiveStore((state) => state.foundationMovedFlag);

  let foundation = foundationModel;

  if (!isFirstRenderRef.current) {
    const latestFoundation = useStore
      .getState()
      .elements.find((e) => e.id === foundationModel.id && e.type === ObjectType.Foundation);
    if (latestFoundation) {
      foundation = latestFoundation as FoundationModel;
    }
  }

  isFirstRenderRef.current = false;

  return foundation;
};
