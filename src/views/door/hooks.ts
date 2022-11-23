/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { DoorTexture, ObjectType } from 'src/types';
import DoorTextureDefault from 'src/resources/door_edge.png';
import DoorTexture00 from 'src/resources/tiny_white_square.png';
import DoorTexture01 from 'src/resources/door_01.png';
import DoorTexture02 from 'src/resources/door_02.png';
import DoorTexture03 from 'src/resources/door_03.png';
import DoorTexture04 from 'src/resources/door_04.png';
import DoorTexture05 from 'src/resources/door_05.png';
import DoorTexture06 from 'src/resources/door_06.png';
import DoorTexture07 from 'src/resources/door_07.png';
import DoorTexture08 from 'src/resources/door_08.png';
import DoorTexture09 from 'src/resources/door_09.png';
import DoorTexture10 from 'src/resources/door_10.png';
import DoorTexture11 from 'src/resources/door_11.png';
import DoorTexture12 from 'src/resources/door_12.png';
import { TextureLoader } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from 'src/stores/common';
import { fileChanged } from 'src/stores/selector';
import { DoorModel, DoorType } from 'src/models/DoorModel';

export const useDoorTexture = (textureType: DoorTexture, doorType: DoorType, lx?: number, lz?: number) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case DoorTexture.Default:
        textureImg = DoorTextureDefault;
        break;
      case DoorTexture.NoTexture:
        textureImg = DoorTexture00;
        break;
      case DoorTexture.Texture01:
        textureImg = DoorTexture01;
        break;
      case DoorTexture.Texture02:
        textureImg = DoorTexture02;
        break;
      case DoorTexture.Texture03:
        textureImg = DoorTexture03;
        break;
      case DoorTexture.Texture04:
        textureImg = DoorTexture04;
        break;
      case DoorTexture.Texture05:
        textureImg = DoorTexture05;
        break;
      case DoorTexture.Texture06:
        textureImg = DoorTexture06;
        break;
      case DoorTexture.Texture07:
        textureImg = DoorTexture07;
        break;
      case DoorTexture.Texture08:
        textureImg = DoorTexture08;
        break;
      case DoorTexture.Texture09:
        textureImg = DoorTexture09;
        break;
      case DoorTexture.Texture10:
        textureImg = DoorTexture10;
        break;
      case DoorTexture.Texture11:
        textureImg = DoorTexture11;
        break;
      case DoorTexture.Texture12:
        textureImg = DoorTexture12;
        break;
      default:
        textureImg = DoorTexture02;
    }

    return new TextureLoader().load(textureImg, (texture) => {
      if (lx !== undefined && lz !== undefined) {
        texture.offset.set(0.5, 0.5);
        texture.repeat.set(1 / lx, 1 / lz);
      }
      setTexture(texture);
      invalidate();
    });
  }, [textureType, doorType, lx, lz]);

  const [texture, setTexture] = useState(textureLoader);
  const { invalidate } = useThree();
  return texture;
};

export const useUpdateOldDoors = (doorModel: DoorModel) => {
  const isFileChangedFlag = useStore(fileChanged);
  useEffect(() => {
    if (doorModel.doorType === undefined || doorModel.archHeight === undefined || doorModel.filled === undefined) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === doorModel.id && e.type === ObjectType.Door) {
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
        }
      });
    }
  }, [isFileChangedFlag]);
};
