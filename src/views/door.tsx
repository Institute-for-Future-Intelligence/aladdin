/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, TextureLoader } from 'three';
import { Plane } from '@react-three/drei';
import { HALF_PI } from 'src/constants';
import { DoorModel } from 'src/models/DoorModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ActionType, DoorTexture, ObjectType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from './window/windowResizeHandle';

import DoorTexture00 from 'src/resources/door_00.png';
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

interface DoorHandleWapperProps {
  lx: number;
  lz: number;
}

const DoorHandleWapper = ({ lx, lz }: DoorHandleWapperProps) => {
  const isSettingNewWindow = lx === 0 && lz === 0;
  return (
    <group>
      {!isSettingNewWindow && (
        <>
          <WindowResizeHandle x={-lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperLeft} />
          <WindowResizeHandle x={lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperRight} />
        </>
      )}
    </group>
  );
};

const Door = ({ id, parentId, cx, cz, lx, lz, selected, locked, textureType }: DoorModel) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case DoorTexture.Default:
        textureImg = DoorTexture01;
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
      texture.repeat.set(1, 1);
      setTexture(texture);
    });
  }, [textureType]);

  const [texture, setTexture] = useState(textureLoader);

  const selectMe = useStore(Selector.selectMe);
  const isAddingElement = useStore(Selector.isAddingElement);
  const setCommonStore = useStore(Selector.set);

  const addedWallIdRef = useRef(useStore.getState().addedWallId);

  const [wlx, setWlx] = useState(lx);
  const [wlz, setWlz] = useState(lz);
  const [wcx, setWcx] = useState(cx);
  const [wcz, setWcz] = useState(cz);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector);

  useEffect(() => {
    if (parent) {
      setWlx(lx * parent.lx);
      setWlz(lz * parent.lz);
      setWcx(cx * parent.lx);
      setWcz(cz * parent.lz);
    }
  }, [lx, lz, cx, cz, parent?.lx, parent?.lz]);

  return (
    <group key={id} name={`Door group ${id}`} position={[wcx, -0.01, wcz]}>
      <Plane
        name={`Door ${id}`}
        args={[wlx, wlz]}
        rotation={[HALF_PI, 0, 0]}
        onContextMenu={(e) => {
          if (!selected) {
            selectMe(id, e, ActionType.Select);
          }
          if (e.intersections[0].object.name === `Door ${id}`) {
            setCommonStore((state) => {
              state.contextMenuObjectType = ObjectType.Door;
            });
          }
        }}
        onPointerDown={(e) => {
          if (e.button === 2 || addedWallIdRef.current) return; // ignore right-click
          if (e.intersections[0].object.name === `Door ${id}`) {
            if (
              !useStore.getState().moveHandleType &&
              !useStore.getState().resizeHandleType &&
              useStore.getState().objectTypeToAdd === ObjectType.None &&
              !selected &&
              !isAddingElement()
            ) {
              selectMe(id, e, ActionType.Select);
            }
          }
        }}
      >
        <meshBasicMaterial map={texture} side={DoubleSide} />
      </Plane>
      {selected && !locked && <DoorHandleWapper lx={wlx} lz={wlz} />}
    </group>
  );
};

export default React.memo(Door);
