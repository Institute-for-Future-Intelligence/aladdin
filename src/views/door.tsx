/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, TextureLoader } from 'three';
import { Box, Line, Plane } from '@react-three/drei';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { DoorModel } from 'src/models/DoorModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ActionType, DoorTexture, ObjectType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from './window/windowResizeHandle';

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

interface DoorHandleWapperProps {
  lx: number;
  lz: number;
}

interface DoorWireFrameProps {
  lx: number;
  lz: number;
  lineColor: string;
  lineWidth?: number;
}

interface DoorFrameProps {
  lx: number;
  lz: number;
  color: string;
}

const DoorHandleWapper = ({ lx, lz }: DoorHandleWapperProps) => {
  const isSettingNewWindow = lx === 0 && lz === 0;
  return (
    <group>
      {!isSettingNewWindow && (
        <>
          <WindowResizeHandle x={-lx} z={lz} handleType={ResizeHandleType.UpperLeft} />
          <WindowResizeHandle x={lx} z={lz} handleType={ResizeHandleType.UpperRight} />
        </>
      )}
    </group>
  );
};

const DoorWireFrame = React.memo(({ lx, lz, lineColor, lineWidth = 0.2 }: DoorWireFrameProps) => {
  const ul: [number, number, number] = [-lx, 0, lz];
  const ur: [number, number, number] = [lx, 0, lz];
  const ll: [number, number, number] = [-lx, 0, -lz];
  const lr: [number, number, number] = [lx, 0, -lz];
  return <Line points={[ul, ll, lr, ur, ul]} lineWidth={lineWidth} color={lineColor} />;
});

const DoorFrame = React.memo(({ lx, lz, color }: DoorFrameProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const material = useMemo(() => <meshStandardMaterial attach="material" color={color} />, [color]);

  const width = 0.1;
  const halfWidth = width / 2;

  return (
    <group name={'Door Frame Group'}>
      {/* top */}
      <Box position={[0, 0, lz / 2]} args={[lx, width, width]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2 + halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box
        position={[lx / 2 - halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const Door = ({ id, parentId, cx, cz, lx, lz, selected, locked, textureType, color = 'white' }: DoorModel) => {
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

  const hx = wlx / 2;
  const hz = wlz / 2;

  return (
    <group key={id} name={`Door group ${id}`} position={[wcx, -0.01, wcz]}>
      <Plane
        name={`Door ${id}`}
        args={[wlx, wlz]}
        rotation={[HALF_PI, 0, 0]}
        onContextMenu={(e) => {
          if (e.intersections[0].object.name === `Door ${id}`) {
            selectMe(id, e, ActionType.Select);
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
        {textureType === DoorTexture.Default || textureType === DoorTexture.NoTexture ? (
          <meshStandardMaterial map={texture} side={DoubleSide} color={color} />
        ) : (
          <meshStandardMaterial map={texture} side={DoubleSide} />
        )}
      </Plane>
      {selected && !locked && <DoorHandleWapper lx={hx} lz={hz} />}
      <DoorWireFrame
        lx={hx}
        lz={hz}
        lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : 'black'}
        lineWidth={selected && locked ? 1 : 0.2}
      />

      <DoorFrame lx={wlx} lz={wlz} color={color} />
    </group>
  );
};

export default React.memo(Door);
