/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CanvasTexture, DoubleSide, FrontSide, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping } from 'three';
import { Plane } from '@react-three/drei';
import { HALF_PI, INVALID_ELEMENT_COLOR } from 'src/constants';
import { RulerOnWall } from '../rulerOnWall';
import { Util } from '../../Util';

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

const Door = (doorModel: DoorModel) => {
  useUpdateOldDoors(doorModel);

  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz,
    textureType,
    selected = false,
    locked = false,
    color = 'white',
    doorType = DoorType.Default,
    archHeight = 1,
    filled = true,
  } = doorModel;

  const setCommonStore = useStore(Selector.set);
  const getParent = useStore(Selector.getParent);

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

  const parent = getParent(doorModel);

  const renderDoor = () => {
    switch (doorType) {
      case DoorType.Default:
        return (
          <RectangleDoor
            id={id}
            dimension={dimensionData}
            color={color}
            selected={selected}
            locked={locked}
            material={doorMaterial}
            filled={filled}
            showHeatFluxes={showSolarRadiationHeatmap}
            area={parent ? Util.getDoorArea(doorModel, parent) : 0}
          />
        );
      case DoorType.Arched:
        return (
          <ArchedDoor
            id={id}
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

  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (doorModel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(doorModel.id);
      if (heatmap) {
        const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
        if (t) {
          t.wrapS = RepeatWrapping;
          t.wrapT = RepeatWrapping;
          t.offset.set(-lx / 2, -lz / 2);
          t.center.set(lx / 2, lz / 2);
          t.repeat.set(1 / lx, 1 / lz);
          setHeatmapTexture(t);
        }
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  const texture = useDoorTexture(textureType, doorType, lx, lz);

  const dimensionData = useMemo(() => [lx, ly, lz, archHeight], [lx, ly, lz, archHeight]);

  const doorMaterial = useMemo(() => {
    if (showSolarRadiationHeatmap && heatmapTexture) {
      return new MeshBasicMaterial({
        color: color,
        map: heatmapTexture,
        side: FrontSide,
      });
    }
    if (!filled) {
      return new MeshStandardMaterial({
        opacity: color === INVALID_ELEMENT_COLOR ? 0.5 : 0,
        color: color,
        transparent: true,
        side: DoubleSide,
      });
    }
    if (textureType === DoorTexture.Default || textureType === DoorTexture.NoTexture) {
      return new MeshStandardMaterial({ map: texture, color: color, side: FrontSide });
    }
    return new MeshStandardMaterial({ map: texture, side: FrontSide });
  }, [showSolarRadiationHeatmap, heatmapTexture, color, textureType, texture, filled]);

  return (
    <group
      name={`Door group ${id}`}
      position={[cx, 0, cz]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {renderDoor()}

      {selected && <RulerOnWall element={doorModel} />}

      {selected && !locked && <DoorHandleWapper dimension={dimensionData} doorType={doorType} />}

      <DoorSealPlanes dimension={dimensionData} />
    </group>
  );
};

export default React.memo(Door);
