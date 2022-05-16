/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import RoofTexture01 from 'src/resources/roof_01.png';
import RoofTexture02 from 'src/resources/roof_02.png';
import RoofTexture03 from 'src/resources/roof_03.png';
import RoofTexture04 from 'src/resources/roof_04.png';
import RoofTexture05 from 'src/resources/roof_05.png';
import RoofTexture06 from 'src/resources/roof_06.png';
import RoofTexture07 from 'src/resources/roof_07.png';

import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../stores/common';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofModel,
  RoofTexture,
  RoofType,
} from '../../models/RoofModel';
import * as Selector from '../../stores/selector';
import PyramidRoof from './pyramidRoof';
import GableRoof from './gableRoof';
import HipRoof from './hipRoof';
import GambrelRoof from './gambrelRoof';
import { UndoableResizeRoofHeight } from 'src/undo/UndoableResize';
import MansardRoof from './mansardRoof';
import { RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { ObjectType } from '../../types';

export interface ConvexGeoProps {
  points: Vector3[];
  direction: number;
  length: number;
}

export const handleUndoableResizeRoofHeight = (elemId: string, oldHeight: number, newHeight: number) => {
  const undoableResizeRoofHeight = {
    name: 'Resize Roof Height',
    timestamp: Date.now(),
    resizedElementId: elemId,
    resizedElementType: ObjectType.Roof,
    oldHeight: oldHeight,
    newHeight: newHeight,
    undo: () => {
      useStore
        .getState()
        .updateRoofHeight(undoableResizeRoofHeight.resizedElementId, undoableResizeRoofHeight.oldHeight);
    },
    redo: () => {
      useStore
        .getState()
        .updateRoofHeight(undoableResizeRoofHeight.resizedElementId, undoableResizeRoofHeight.newHeight);
    },
  } as UndoableResizeRoofHeight;
  useStore.getState().addUndoable(undoableResizeRoofHeight);
};

export const useRoofTexture = (textureType: RoofTexture) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case RoofTexture.Texture01:
        textureImg = RoofTexture01;
        break;
      case RoofTexture.Texture02:
        textureImg = RoofTexture02;
        break;
      case RoofTexture.Texture03:
        textureImg = RoofTexture03;
        break;
      case RoofTexture.Texture04:
        textureImg = RoofTexture04;
        break;
      case RoofTexture.Texture05:
        textureImg = RoofTexture05;
        break;
      case RoofTexture.Texture06:
        textureImg = RoofTexture06;
        break;
      case RoofTexture.Texture07:
        textureImg = RoofTexture07;
        break;
      default:
        textureImg = RoofTexture01;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      switch (textureType) {
        case RoofTexture.Texture01:
          texture.repeat.set(0.5, 0.5);
          break;
        case RoofTexture.Texture03:
          texture.repeat.set(0.9, 0.9);
          break;
        case RoofTexture.Texture04:
        case RoofTexture.Texture05:
        case RoofTexture.Texture06:
          texture.repeat.set(0.75, 0.75);
          break;
        default:
          texture.repeat.set(0.5, 0.5);
      }
      setTexture(texture);
    });
  }, [textureType]);

  const [texture, setTexture] = useState(textureLoader);
  return texture;
};

const Roof = (props: RoofModel) => {
  const { id, wallsId, roofType } = props;

  const removeElementById = useStore(Selector.removeElementById);

  useEffect(() => {
    if (wallsId.length === 0) {
      removeElementById(id, false);
    }
  }, [wallsId]);

  const renderRoof = () => {
    switch (roofType) {
      case RoofType.Pyramid:
        return <PyramidRoof {...(props as PyramidRoofModel)} />;
      case RoofType.Gable:
        return <GableRoof {...(props as GableRoofModel)} />;
      case RoofType.Hip:
        return <HipRoof {...(props as HipRoofModel)} />;
      case RoofType.Gambrel:
        return <GambrelRoof {...(props as GambrelRoofModel)} />;
      case RoofType.Mansard:
        return <MansardRoof {...(props as MansardRoofModel)} />;
      default:
        return null;
    }
  };

  return renderRoof();
};

export default Roof;
