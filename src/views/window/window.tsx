/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Color, DoubleSide, FrontSide, MeshStandardMaterial, Shape } from 'three';
import { Box } from '@react-three/drei';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowHandleWrapper from './windowHandleWrapper';
import { DEFAULT_WINDOW_SHINESS } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';
import RectangleWindow from './rectangleWindow';
import { WallModel } from 'src/models/WallModel';
import ArchWindow from './archWindow';

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
  color: string;
};

export type WireframeDataType = {
  lineColor: string;
  lineWidth: number;
  selected: boolean;
  locked: boolean;
};

interface ShutterProps {
  cx: number;
  lx: number;
  lz: number;
  color: string;
  showLeft: boolean;
  showRight: boolean;
  spacing: number;
}

const Shutter = ({ cx, lx, lz, color, showLeft, showRight, spacing }: ShutterProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  return (
    <group name={'Shutter Group'}>
      {showRight && (
        <Box
          args={[lx, 0.1, lz]}
          position={[cx + spacing, 0, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
      {showLeft && (
        <Box
          args={[lx, 0.1, lz]}
          position={[-cx - spacing, 0, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
    </group>
  );
};

export const useWireframeData = (selected: boolean, locked: boolean, lineWidth: number, lineColor: string) => {
  return { lineWidth, lineColor };
};

const useUpdataOldFiles = (windowModel: WindowModel) => {
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
  }, []);
};

const Window = (windowModel: WindowModel) => {
  let {
    id,
    parentId,
    lx,
    ly,
    lz,
    cx,
    cy,
    cz,
    selected,
    locked,
    lineWidth = 0.2,
    lineColor = 'black',
    mullion: showMullion = true,
    mullionWidth = 0.06,
    mullionSpacing = 0.5,
    tint = '#73D8FF',
    opacity = 0.5,
    shutter,
    mullionColor = 'white',
    frame = false,
    color = 'white',
    frameWidth = 0.1,
    windowType = WindowType.Default,
    archHeight,
  } = windowModel;

  // legacy problem
  if (Math.abs(cy) < 0.001) {
    cy = 0.1;
  }
  useUpdataOldFiles(windowModel);

  const setCommonStore = useStore(Selector.set);
  const isAddingElement = useStore(Selector.isAddingElement);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const windowShiness = useStore(Selector.viewState.windowShiness);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const night = sunlightDirection.z <= 0;
  const material = useMemo(
    () => new MeshStandardMaterial({ color: 'white', side: night ? FrontSide : DoubleSide }),
    [night],
  );

  const [wlx, setWlx] = useState(lx);
  const [wly, setWly] = useState(ly);
  const [wlz, setWlz] = useState(lz);
  const [wcx, setWcx] = useState(cx);
  const [wcy, setWcy] = useState(cy);
  const [wcz, setWcz] = useState(cz);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector) as WallModel;

  useEffect(() => {
    if (parent) {
      setWlx(lx * parent.lx);
      setWly(parent.ly);
      setWlz(lz * parent.lz);
      setWcx(cx * parent.lx);
      setWcz(cz * parent.lz);
      if (cy > 0) {
        setWcy(0.33 * parent.ly);
      } else {
        setWcy(cy);
      }
    }
  }, [lx, ly, lz, cx, cy, cz, parent?.lx, parent?.ly, parent?.lz]);

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

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || useStore.getState().addedWallId) return; // ignore right-click
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Window group ${id}`) {
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
  };

  const onContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Window group ${id}`) {
      if (!selected) {
        selectMe();
      }
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Window;
      });
    }
  };

  const shutterLength = useMemo(() => shutter?.width ?? 0.5 * wlx, [wlx, shutter]);
  const shutterPosX = useMemo(() => ((shutterLength + wlx) / 2) * 1.025, [wlx, shutterLength]);

  const glassMaterial = useMemo(
    () => (
      <meshPhongMaterial
        specular={new Color('white')}
        shininess={windowShiness ?? DEFAULT_WINDOW_SHINESS}
        color={tint}
        side={DoubleSide}
        opacity={opacity}
        transparent={true}
      />
    ),
    [windowShiness, tint, opacity],
  );

  const dimensionData = useMemo(() => {
    if (archHeight !== undefined) {
      return [wlx, wly, wlz, archHeight];
    }
    return [wlx, wly, wlz];
  }, [wlx, wly, wlz, archHeight]);

  const positionData = useMemo(() => [wcx, wcy, wcz], [wcx, wcy, wcz]);

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
    () => ({ showFrame: frame, width: frameWidth, color } as FrameDataType),
    [frame, frameWidth, color],
  );

  const wireframeData = useMemo(
    () => ({ lineColor, lineWidth, selected, locked } as WireframeDataType),
    [lineColor, lineWidth, selected, locked],
  );

  const renderWindow = () => {
    switch (windowType) {
      case WindowType.Default:
        return (
          <RectangleWindow
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            glassMaterial={glassMaterial}
          />
        );
      case WindowType.Arch:
        return (
          <ArchWindow
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            glassMaterial={glassMaterial}
          />
        );
    }
  };

  return (
    <group
      key={id}
      name={`Window group ${id}`}
      position={[wcx, 0, wcz]}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      {renderWindow()}

      {shutter && (
        <Shutter
          cx={shutterPosX}
          lx={shutterLength}
          lz={wlz}
          color={shutter.color}
          showLeft={shutter.showLeft}
          showRight={shutter.showRight}
          spacing={frame ? frameWidth / 2 : 0}
        />
      )}

      {/* handles */}
      {selected && !locked && <WindowHandleWrapper lx={wlx} lz={wlz} windowType={windowType} />}
    </group>
  );
};

export default React.memo(Window);
