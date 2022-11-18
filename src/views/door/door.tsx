/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from '../window/windowResizeHandle';
import { ThreeEvent } from '@react-three/fiber';
import RectangleDoor from './rectangleDoor';
import ArchedDoor from './archedDoor';
import { useUpdateOldDoors } from './hooks';
import { ArchResizeHandle } from '../window/windowHandleWrapper';

export interface DoorProps extends DoorModel {
  position: number[];
  dimension: number[];
}

interface DoorHandleWapperProps {
  dimension: number[];
  doorType: DoorType;
}

const DoorHandleWapper = React.memo(({ dimension, doorType }: DoorHandleWapperProps) => {
  const [hx, hy, hz] = dimension.map((val) => val / 2);
  const isAddingNewDoor = hx === 0 && hz === 0;

  if (isAddingNewDoor) {
    return null;
  }

  return (
    <group name={'Door handle wrapper'}>
      <WindowResizeHandle x={-hx} z={hz} handleType={ResizeHandleType.UpperLeft} />
      <WindowResizeHandle x={hx} z={hz} handleType={ResizeHandleType.UpperRight} />
      {doorType === DoorType.Arched && <ArchResizeHandle z={hz} />}
    </group>
  );
});

const Door = (doorModel: DoorProps) => {
  useUpdateOldDoors(doorModel);

  const {
    id,
    position,
    dimension,
    textureType,
    selected = false,
    locked = false,
    color = 'white',
    doorType = DoorType.Default,
    archHeight = 1,
  } = doorModel;

  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;

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
        !useStore.getState().isAddingElement() &&
        !selected
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
        return <ArchedDoor dimension={dimensionData} color={color} selected={selected} locked={locked} />;
    }
  };

  const dimensionData = useMemo(() => [lx, ly, lz, archHeight], [lx, lz, archHeight]);

  return (
    <group
      name={`Door group ${id}`}
      position={[cx, -0.01, cz]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {renderDoor()}
      {selected && !locked && <DoorHandleWapper dimension={dimensionData} doorType={doorType} />}
    </group>
  );
};

export default React.memo(Door);
