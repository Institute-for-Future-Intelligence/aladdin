/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useRef } from 'react';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from '../window/windowResizeHandle';
import { ThreeEvent } from '@react-three/fiber';
import RectangleDoor from './rectangleDoor';

export interface DoorProps extends DoorModel {
  position: number[];
  dimension: number[];
}

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
          <WindowResizeHandle x={-lx} z={lz} handleType={ResizeHandleType.UpperLeft} />
          <WindowResizeHandle x={lx} z={lz} handleType={ResizeHandleType.UpperRight} />
        </>
      )}
    </group>
  );
};

const Door = (doorModel: DoorProps) => {
  const {
    id,
    position,
    dimension,
    textureType,
    selected = false,
    locked = false,
    color = 'white',
    doorType = DoorType.Default,
  } = doorModel;

  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;

  const hx = lx / 2;
  const hz = lz / 2;

  const isAddingElement = useStore(Selector.isAddingElement);
  const setCommonStore = useStore(Selector.set);

  const addedWallIdRef = useRef(useStore.getState().addedWallId);

  const selectMe = () => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          e.selected = true;
          state.selectedElement = e;
        } else {
          e.selected = false;
        }
      }
    });
  };

  const handleContextMenu = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Door group ${id}`) {
      selectMe();
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Door;
      });
    }
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || addedWallIdRef.current) return; // ignore right-click
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Door group ${id}`) {
      if (
        !useStore.getState().moveHandleType &&
        !useStore.getState().resizeHandleType &&
        useStore.getState().objectTypeToAdd === ObjectType.None &&
        !selected &&
        !isAddingElement()
      ) {
        selectMe();
      }
    }
  }, []);

  const renderDoor = () => {
    switch (doorType) {
      case DoorType.Default:
        return (
          <RectangleDoor
            dimension={dimension}
            textureType={textureType}
            color={color}
            selected={selected}
            locked={locked}
          />
        );
      case DoorType.Arched:
        return null;
    }
  };

  return (
    <group
      name={`Door group ${id}`}
      position={[cx, -0.01, cz]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {renderDoor()}
      {selected && !locked && <DoorHandleWapper lx={hx} lz={hz} />}
    </group>
  );
};

export default React.memo(Door);
