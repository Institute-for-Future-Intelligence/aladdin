/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo } from 'react';
import { Color, DoubleSide, Euler, Vector3 } from 'three';
import { Box } from '@react-three/drei';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { MoveHandleType, ObjectType, ResizeHandleType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowHandleWrapper from './windowHandleWrapper';
import { DEFAULT_WINDOW_SHININESS, HALF_PI } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';
import RectangleWindow from './rectangleWindow';
import ArchedWindow from './archedWindow';
import { RulerOnWall } from '../rulerOnWall';
import { Util } from '../../Util';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useRefStore } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import PolygonalWindow from './polygonalWindow';

export const defaultShutter = { showLeft: false, showRight: false, color: 'grey', width: 0.5 };

export type MullionDataType = {
  showMullion: boolean;
  width: number;
  spacingX: number;
  spacingY: number;
  color: string;
};

export type FrameDataType = {
  showFrame: boolean;
  width: number;
  sillWidth: number;
  color: string;
};

export type WireframeDataType = {
  lineColor: string;
  lineWidth: number;
  selected: boolean;
  locked: boolean;
  opacity: number;
};

interface ShutterProps {
  cx: number;
  cz?: number;
  lx: number;
  lz: number;
  color: string;
  showLeft: boolean;
  showRight: boolean;
  spacing: number;
}

export const Shutter = ({ cx, cz = 0, lx, lz, color, showLeft, showRight, spacing }: ShutterProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  if (showHeatFluxes) {
    return null;
  }

  return (
    <group name={'Shutter Group'}>
      {showRight && (
        <Box
          args={[lx, 0.1, lz]}
          position={[cx + spacing, 0, cz]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
      {showLeft && (
        <Box
          args={[lx, 0.1, lz]}
          position={[-cx - spacing, 0, cz]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
    </group>
  );
};

const useUpdateOldFiles = (windowModel: WindowModel) => {
  const fileChanged = useStore(Selector.fileChanged);
  useEffect(() => {
    if (
      windowModel.mullion === undefined ||
      windowModel.mullionWidth === undefined ||
      windowModel.mullionSpacing === undefined ||
      windowModel.tint === undefined ||
      windowModel.opacity === undefined ||
      windowModel.shutter === undefined ||
      windowModel.mullionColor === undefined ||
      windowModel.frame === undefined ||
      windowModel.color === undefined ||
      windowModel.frameWidth === undefined ||
      windowModel.windowType === undefined ||
      windowModel.archHeight === undefined
    ) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === windowModel.id) {
            const w = e as WindowModel;
            if (w.mullion === undefined) {
              w.mullion = true;
            }
            if (w.mullionWidth === undefined) {
              w.mullionWidth = 0.06;
            }
            if (w.mullionSpacing === undefined) {
              w.mullionSpacing = 0.5;
            }
            if (w.tint === undefined) {
              w.tint = '#73D8FF';
            }
            if (w.opacity === undefined) {
              w.opacity = 0.5;
            }
            if (w.shutter === undefined) {
              w.shutter = defaultShutter;
            }
            if (w.mullionColor === undefined) {
              w.mullionColor = 'white';
            }
            if (w.frame === undefined) {
              w.frame = false;
            }
            if (w.color === undefined) {
              w.color = 'white';
            }
            if (w.frameWidth === undefined) {
              w.frameWidth = 0.1;
            }
            if (w.windowType === undefined) {
              w.windowType = WindowType.Default;
            }
            if (w.archHeight === undefined) {
              w.archHeight = 1;
            }
            break;
          }
        }
      });
    }
  }, [fileChanged]);
};

export const WINDOW_GROUP_NAME = 'Window Group';

const Window = (windowModel: WindowModel) => {
  const {
    id,
    parentId,
    foundationId,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz,
    rotation,
    selected,
    locked,
    lineWidth = 0.2,
    lineColor = 'black',
    mullion: showMullion = true,
    mullionWidth = 0.06,
    mullionSpacing = 0.5,
    tint = '#73D8FF',
    opacity = 0.5,
    shutter = defaultShutter,
    mullionColor = 'white',
    frame = false,
    color = 'white',
    frameWidth = 0.1,
    sillWidth = 0.1,
    windowType = WindowType.Default,
    archHeight,
    parentType = ObjectType.Wall, // undefined is wall
    polygonTop = [0, 0.5],
  } = windowModel;

  const GROUP_NAME = `${WINDOW_GROUP_NAME} ${id}`;

  useUpdateOldFiles(windowModel);

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
        case MoveHandleType.Mid:
        case ResizeHandleType.UpperLeft:
        case ResizeHandleType.UpperRight:
        case ResizeHandleType.LowerLeft:
        case ResizeHandleType.LowerRight:
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || useStore.getState().addedWallId) return; // ignore right-click
    if (!selected && isAllowedToSelectMe(e)) {
      selectMe();
    }

    if (isClickedOnHandles(e)) {
      const handleType = e.intersections[0].eventObject.name;
      switch (handleType) {
        case MoveHandleType.Mid: {
          useRefStore.getState().setEnableOrbitController(false);
          usePrimitiveStore.setState((state) => {
            state.showWallIntersectionPlaneId = parentId;
            state.oldParentId = parentId;
            state.oldFoundationId = foundationId;
          });
          setCommonStore((state) => {
            state.moveHandleType = handleType;
            state.selectedElement = state.elements.find((e) => e.selected) as ElementModel;
          });
          break;
        }
        case ResizeHandleType.UpperLeft: {
          onClickResizeHandle(handleType, new Vector3(lx / 2, 0, -lz / 2));
          break;
        }
        case ResizeHandleType.UpperRight: {
          onClickResizeHandle(handleType, new Vector3(-lx / 2, 0, -lz / 2));
          break;
        }
        case ResizeHandleType.LowerLeft: {
          onClickResizeHandle(handleType, new Vector3(lx / 2, 0, lz / 2));
          break;
        }
        case ResizeHandleType.LowerRight: {
          onClickResizeHandle(handleType, new Vector3(-lx / 2, 0, lz / 2));
          break;
        }
        case ResizeHandleType.Arch: {
          onClickResizeHandle(handleType, new Vector3(0, 0, 0));
          break;
        }
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (useStore.getState().addedWallId) return;
    if (isAllowedToSelectMe(e)) {
      !selected && selectMe();
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Window;
      });
    }
  };

  const euler = useMemo(() => {
    if (parentType === ObjectType.Roof) {
      const [x, y, z] = rotation;
      return new Euler().fromArray([x - HALF_PI, y, z, 'ZXY']);
    } else {
      return new Euler();
    }
  }, [parentType, rotation]);

  const glassMaterial = useMemo(
    () => (
      <meshPhongMaterial
        specular={new Color('white')}
        shininess={windowShininess ?? DEFAULT_WINDOW_SHININESS}
        color={tint}
        side={DoubleSide}
        opacity={opacity}
        transparent={true}
      />
    ),
    [windowShininess, tint, opacity],
  );

  const dimensionData = useMemo(() => {
    if (archHeight !== undefined) {
      return [lx, ly, lz, archHeight];
    }
    return [lx, ly, lz];
  }, [lx, ly, lz, archHeight]);

  const positionData = useMemo(() => {
    if (parentType === ObjectType.Roof) {
      return [cx, 0.05, cz];
    } else {
      return [cx, cy, cz];
    }
  }, [cx, cy, cz, parentType]);

  const mullionData = useMemo(
    () =>
      ({
        showMullion,
        width: mullionWidth,
        spacingX: mullionSpacing,
        spacingY: mullionSpacing,
        color: mullionColor,
      } as MullionDataType),
    [showMullion, mullionWidth, mullionSpacing, mullionColor],
  );

  const frameData = useMemo(
    () => ({ showFrame: frame, width: frameWidth, color, sillWidth } as FrameDataType),
    [frame, frameWidth, color, sillWidth],
  );

  const wireframeData = useMemo(
    () => ({ lineColor, lineWidth, selected, locked, opacity } as WireframeDataType),
    [lineColor, lineWidth, selected, locked, opacity],
  );

  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);

  const renderWindow = () => {
    switch (windowType) {
      case WindowType.Default:
        return (
          <RectangleWindow
            id={windowModel.id}
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            shutter={shutter}
            glassMaterial={glassMaterial}
            showHeatFluxes={showHeatFluxes}
            area={Util.getWindowArea(windowModel)}
            empty={!!windowModel.empty}
            interior={!!windowModel.interior}
          />
        );
      case WindowType.Arched:
        return (
          <ArchedWindow
            id={windowModel.id}
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            shutter={shutter}
            glassMaterial={glassMaterial}
            showHeatFluxes={showHeatFluxes}
            area={Util.getWindowArea(windowModel)}
            empty={!!windowModel.empty}
            interior={!!windowModel.interior}
          />
        );
      case WindowType.Polygonal:
        return (
          <PolygonalWindow
            dimension={dimensionData}
            polygonTop={polygonTop}
            position={positionData}
            glassMaterial={glassMaterial}
            empty={!!windowModel.empty}
            interior={!!windowModel.interior}
            wireframeData={wireframeData}
            frameData={frameData}
            shutter={shutter}
          />
        );
    }
  };

  const positionY = parentType === ObjectType.Roof ? cy : 0;

  return (
    <group
      key={id}
      name={GROUP_NAME}
      position={[cx, positionY, cz]}
      rotation={euler}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      onPointerMove={() => {
        /* Do Not Delete! Capture event for wall pointer move*/
      }}
    >
      {renderWindow()}

      {/* ruler */}
      {selected && <RulerOnWall element={windowModel} />}

      {/* handles */}
      {selected && !locked && (
        <WindowHandleWrapper
          id={id}
          parentId={parentId}
          foundationId={foundationId}
          lx={lx}
          lz={lz}
          polygonTop={polygonTop}
          rotation={rotation}
          windowType={windowType}
          parentType={parentType}
        />
      )}
    </group>
  );
};

export default React.memo(Window);
