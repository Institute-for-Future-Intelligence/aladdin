/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { DoorTexture, ObjectType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from '../window/windowResizeHandle';
import { ThreeEvent } from '@react-three/fiber';
import RectangleDoor from './rectangleDoor';
import ArchedDoor from './archedDoor';
import { useDoorTexture, useUpdateOldDoors } from './hooks';
import { ArchResizeHandle } from '../window/windowHandleWrapper';
import { DoubleSide, FrontSide, MeshStandardMaterial } from 'three';
import { Plane } from '@react-three/drei';
import { HALF_PI, INVALID_ELEMENT_COLOR } from 'src/constants';

export interface DoorProps extends DoorModel {
  position: number[];
  dimension: number[];
}

interface DoorHandleWapperProps {
  dimension: number[];
  doorType: DoorType;
}

interface DoorSealPlanesProps {
  dimension: number[];
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: FrontSide });

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

const DoorSealPlanes = React.memo(({ dimension }: DoorSealPlanesProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const [lx, ly, lz] = dimension;
  const [hx, hy, hz] = dimension.map((val) => val / 2);
  const renderSealPlane = (args: [width: number, height: number], position: ArgsType, rotation?: ArgsType) => (
    <Plane
      name={'Door seal plane'}
      args={args}
      position={position}
      rotation={rotation}
      material={sealPlanesMaterial}
      receiveShadow={shadowEnabled}
    />
  );
  return (
    <group name={'Door seal planes group'}>
      {renderSealPlane([ly, lz], [-hx, hy, 0], [HALF_PI, HALF_PI, 0])}
      {renderSealPlane([ly, lz], [hx, hy, 0], [HALF_PI, -HALF_PI, 0])}
      {renderSealPlane([lx, ly], [0, hy, hz], [Math.PI, 0, 0])}
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
    filled = true,
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

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    const intersectableObjects = e.intersections.filter(
      (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
    );
    if (e.intersections.length > 0 && intersectableObjects[0].eventObject.name === `Door group ${id}`) {
      selectMe();
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Door;
      });
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || addedWallIdRef.current) return; // ignore right-click
    const intersectableObjects = e.intersections.filter(
      (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
    );
    if (e.intersections.length > 0 && intersectableObjects[0].eventObject.name === `Door group ${id}`) {
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
  };

  const renderDoor = () => {
    switch (doorType) {
      case DoorType.Default:
        return (
          <RectangleDoor
            dimension={dimension}
            color={color}
            selected={selected}
            locked={locked}
            material={doorMaterial}
            filled={filled}
          />
        );
      case DoorType.Arched:
        return (
          <ArchedDoor
            dimension={dimensionData}
            color={color}
            selected={selected}
            locked={locked}
            material={doorMaterial}
            filled={filled}
          />
        );
    }
  };

  const texture = useDoorTexture(textureType, doorType, lx, lz);

  const dimensionData = useMemo(() => [lx, ly, lz, archHeight], [lx, lz, archHeight]);

  const doorMaterial = useMemo(() => {
    if (!filled) {
      return new MeshStandardMaterial({
        opacity: color === INVALID_ELEMENT_COLOR ? 0.5 : 0,
        color: color,
        transparent: true,
        side: DoubleSide,
      });
    }
    let matColor;
    if (textureType === DoorTexture.Default || textureType === DoorTexture.NoTexture) {
      matColor = color;
    }
    return new MeshStandardMaterial({ map: texture, color: matColor, side: FrontSide });
  }, [color, textureType, texture, filled]);

  return (
    <group
      name={`Door group ${id}`}
      position={[cx, 0, cz]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {renderDoor()}

      {selected && !locked && <DoorHandleWapper dimension={dimensionData} doorType={doorType} />}

      <DoorSealPlanes dimension={dimensionData} />
    </group>
  );
};

export default React.memo(Door);