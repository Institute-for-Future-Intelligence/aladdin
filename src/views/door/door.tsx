/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import {
  CanvasTexture,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector3,
} from 'three';
import { Plane } from '@react-three/drei';
import { DEFAULT_WINDOW_SHININESS, HALF_PI, INVALID_ELEMENT_COLOR } from 'src/constants';
import { RulerOnWall } from '../rulerOnWall';
import { Util } from '../../Util';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { useRefStore } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';

interface DoorHandleWrapperProps {
  dimension: number[];
  doorType: DoorType;
}

interface DoorSealPlanesProps {
  dimension: number[];
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: FrontSide });

const DoorHandleWrapper = React.memo(({ dimension, doorType }: DoorHandleWrapperProps) => {
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
    parentId,
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
    opacity = 1,
    frameColor = 'white',
  } = doorModel;

  const GROUP_NAME = `Door Group ${id}`;

  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const windowShininess = useStore(Selector.viewState.windowShininess);

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

  const isAllowedToSelectMe = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    // const intersectableObjects = e.intersections.filter(
    //   (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
    // );
    return (
      e.intersections.length > 0 &&
      e.intersections[0].eventObject.name === GROUP_NAME &&
      !useStore.getState().moveHandleType &&
      !useStore.getState().resizeHandleType &&
      !useStore.getState().isAddingElement() &&
      useStore.getState().objectTypeToAdd === ObjectType.None
    );
  };

  const isClickedOnHandles = (e: ThreeEvent<PointerEvent>) => {
    if (e.eventObject.name === GROUP_NAME && e.intersections.length > 0) {
      switch (e.object.name) {
        case ResizeHandleType.UpperLeft:
        case ResizeHandleType.UpperRight:
        case ResizeHandleType.Arch:
          return true;
      }
    }
    return false;
  };

  const onClickResizeHandle = (handleType: ResizeHandleType, p: Vector3) => {
    useRefStore.getState().setEnableOrbitController(false);
    setPrimitiveStore('showWallIntersectionPlaneId', parentId);
    setCommonStore((state) => {
      state.resizeHandleType = handleType;
      state.resizeAnchor.copy(new Vector3(cx, 0, cz).add(p));
      state.selectedElement = state.elements.find((e) => e.selected) as ElementModel;
    });
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (useStore.getState().addedWallId) return;
    if (isAllowedToSelectMe(e)) {
      !selected && selectMe();
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Door;
      });
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || useStore.getState().addedWallId) return; // ignore right-click
    if (isAllowedToSelectMe(e)) {
      selectMe();
    }

    if (isClickedOnHandles(e)) {
      const handleType = e.intersections[0].eventObject.name;
      switch (handleType) {
        case ResizeHandleType.UpperLeft: {
          onClickResizeHandle(handleType, new Vector3(lx / 2, 0, -lz / 2));
          break;
        }
        case ResizeHandleType.UpperRight: {
          onClickResizeHandle(handleType, new Vector3(-lx / 2, 0, -lz / 2));
          break;
        }
        case ResizeHandleType.Arch: {
          onClickResizeHandle(handleType, new Vector3(0, 0, 0));
          break;
        }
      }
    }
  };

  const getFoundation = useStore(Selector.getFoundation);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

  const renderDoor = () => {
    switch (doorType) {
      case DoorType.Default:
        return (
          <RectangleDoor
            id={id}
            dimension={dimensionData}
            color={color}
            frameColor={frameColor}
            selected={selected}
            locked={locked}
            material={doorMaterial}
            filled={filled}
            showHeatFluxes={showHeatFluxes}
            area={Util.getDoorArea(doorModel)}
            foundation={getFoundation(doorModel)}
          />
        );
      case DoorType.Arched:
        return (
          <ArchedDoor
            id={id}
            dimension={dimensionData}
            color={color}
            frameColor={frameColor}
            selected={selected}
            locked={locked}
            material={doorMaterial}
            filled={filled}
            showHeatFluxes={showHeatFluxes}
            area={Util.getDoorArea(doorModel)}
            foundation={getFoundation(doorModel)}
          />
        );
    }
  };

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
    if (showSolarRadiationHeatmap && heatmapTexture && doorModel.filled) {
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
      if (opacity < 1) {
        return new MeshPhongMaterial({
          specular: 'white',
          shininess: windowShininess ?? DEFAULT_WINDOW_SHININESS,
          color: color,
          side: FrontSide,
          opacity: opacity,
          transparent: true,
        });
      } else {
        return new MeshStandardMaterial({
          map: texture,
          color: color,
          side: FrontSide,
        });
      }
    }
    return new MeshStandardMaterial({ map: texture, side: FrontSide });
  }, [showSolarRadiationHeatmap, heatmapTexture, color, textureType, texture, filled, opacity]);

  return (
    <group name={GROUP_NAME} position={[cx, 0, cz]} onPointerDown={handlePointerDown} onContextMenu={handleContextMenu}>
      {renderDoor()}

      {selected && <RulerOnWall element={doorModel} />}

      {selected && !locked && <DoorHandleWrapper dimension={dimensionData} doorType={doorType} />}

      <DoorSealPlanes dimension={dimensionData} />
    </group>
  );
};

export default React.memo(Door);
