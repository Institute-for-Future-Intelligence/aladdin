import React, { useMemo, useRef, useState } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { RoofTexture } from 'src/types';
import { UndoableMoveSolarPanelOnRoof } from 'src/undo/UndoableMove';

import RoofTextureDefault from 'src/resources/roof_edge.png';
import RoofTexture00 from 'src/resources/roof_00.png';
import RoofTexture01 from 'src/resources/roof_01.png';
import RoofTexture02 from 'src/resources/roof_02.png';
import RoofTexture03 from 'src/resources/roof_03.png';
import RoofTexture04 from 'src/resources/roof_04.png';
import RoofTexture05 from 'src/resources/roof_05.png';
import RoofTexture06 from 'src/resources/roof_06.png';
import RoofTexture07 from 'src/resources/roof_07.png';
import { RepeatWrapping, TextureLoader } from 'three';

export const useSolarPanelUndoable = () => {
  const grabRef = useRef<ElementModel | null>(null);
  const oldPostionRef = useRef<number[] | null>(null);
  const oldRotationRef = useRef<number[] | null>(null);
  const oldNormalRef = useRef<number[] | null>(null);

  const addUndoableMove = (sp: SolarPanelModel) => {
    if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
      const undoabeMove = {
        name: 'Move Solar Panel On Roof',
        timestamp: Date.now(),
        id: sp.id,
        oldPos: [...oldPostionRef.current],
        newPos: [sp.cx, sp.cy, sp.cz],
        oldRot: [...oldRotationRef.current],
        newRot: [...sp.rotation],
        oldNor: [...oldNormalRef.current],
        newNor: [...sp.normal],
        undo: () => {
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.oldPos];
                e.rotation = [...undoabeMove.oldRot];
                e.normal = [...undoabeMove.oldNor];
                break;
              }
            }
          });
        },
        redo: () => {
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.newPos];
                e.rotation = [...undoabeMove.newRot];
                e.normal = [...undoabeMove.newNor];
                break;
              }
            }
          });
        },
      } as UndoableMoveSolarPanelOnRoof;
      useStore.getState().addUndoable(undoabeMove);
    }
  };

  const undoMove = () => {
    useStore.getState().set((state) => {
      if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
        for (const e of state.elements) {
          if (e.id === grabRef.current?.id) {
            e.cx = oldPostionRef.current[0];
            e.cy = oldPostionRef.current[1];
            e.cz = oldPostionRef.current[2];
            e.rotation = [...oldRotationRef.current];
            e.normal = [...oldNormalRef.current];
            break;
          }
        }
      }
    });
  };

  const setOldRefData = (elem: ElementModel) => {
    grabRef.current = elem;
    oldPostionRef.current = [elem.cx, elem.cy, elem.cz];
    oldRotationRef.current = [...elem.rotation];
    oldNormalRef.current = [...elem.normal];
  };

  return { grabRef, addUndoableMove, undoMove, setOldRefData };
};

export const useRoofTexture = (textureType: RoofTexture) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case RoofTexture.NoTexture:
        textureImg = RoofTexture00;
        break;
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
        textureImg = RoofTextureDefault;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      switch (textureType) {
        case RoofTexture.NoTexture:
        case RoofTexture.Default:
          texture.repeat.set(4, 4);
          break;
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
