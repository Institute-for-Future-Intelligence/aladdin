/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Color, DoubleSide, MeshStandardMaterial } from 'three';
import { Box, Plane } from '@react-three/drei';
import { WindowModel } from 'src/models/WindowModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowWireFrame from './windowWireFrame';
import WindowHandleWrapper from './windowHandleWrapper';
import { DEFAULT_WINDOW_SHINESS, HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';

const material = new MeshStandardMaterial({ color: 'white', side: DoubleSide });
export const defaultShutter = { showLeft: false, showRight: false, color: 'grey', width: 0.5 };

interface ShutterProps {
  cx: number;
  lx: number;
  lz: number;
  color: string;
  showLeft: boolean;
  showRight: boolean;
}

const Shutter = ({ cx, lx, lz, color, showLeft, showRight }: ShutterProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  return (
    <group name={'Shutter Group'}>
      {showRight && (
        <Box args={[lx, 0.1, lz]} position={[cx, 0, 0]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
          <meshStandardMaterial color={color} />
        </Box>
      )}
      {showLeft && (
        <Box args={[lx, 0.1, lz]} position={[-cx, 0, 0]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
          <meshStandardMaterial color={color} />
        </Box>
      )}
    </group>
  );
};

const useUpdataOldFiles = (id: string) => {
  useEffect(() => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
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
          break;
        }
      }
    });
  }, []);
};

const Window = ({
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
  mullion = true,
  mullionWidth = 0.06,
  mullionSpacing = 0.5,
  tint = '#73D8FF',
  opacity = 0.5,
  shutter,
  mullionColor = 'white',
  frame = false,
  color = 'white',
}: WindowModel) => {
  // legacy problem
  if (Math.abs(cy) < 0.001) {
    cy = 0.1;
  }
  useUpdataOldFiles(id);

  const setCommonStore = useStore(Selector.set);
  const isAddingElement = useStore(Selector.isAddingElement);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const windowShiness = useStore(Selector.viewState.windowShiness);

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

  const parent = useStore(parentSelector);

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
  const shutterPosX = useMemo(() => ((shutterLength + wlx) / 2) * 1.05, [wlx, shutterLength]);

  return (
    <group
      key={id}
      name={`Window group ${id}`}
      position={[wcx, 0, wcz]}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      <group position={[0, wcy, 0]}>
        <Plane name={'window ' + id} args={[wlx, wlz]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhongMaterial
            specular={new Color('white')}
            shininess={windowShiness ?? DEFAULT_WINDOW_SHINESS}
            color={tint}
            side={DoubleSide}
            opacity={opacity}
            transparent={true}
          />
        </Plane>

        {/* wireframes */}
        <WindowWireFrame
          lx={wlx}
          lz={wlz}
          showMullion={mullion}
          mullionWidth={mullionWidth}
          mullionSpacing={mullionSpacing}
          mullionColor={mullionColor}
          lineColor={locked && selected ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor}
          lineWidth={selected && locked ? 0.5 : lineWidth}
        />
      </group>

      {shutter && (
        <Shutter
          cx={shutterPosX}
          lx={shutterLength}
          lz={wlz}
          color={shutter.color}
          showLeft={shutter.showLeft}
          showRight={shutter.showRight}
        />
      )}

      <Plane
        args={[wly, wlz]}
        position={[-wlx / 2, wly / 2, 0]}
        rotation={[HALF_PI, HALF_PI, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[wly, wlz]}
        position={[wlx / 2, wly / 2, 0]}
        rotation={[HALF_PI, -HALF_PI, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[wlx, wly]}
        position={[0, wly / 2, wlz / 2]}
        rotation={[Math.PI, 0, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[wlx, wly]}
        position={[0, wly / 2, -wlz / 2]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />

      {/* handles */}
      {selected && !locked && <WindowHandleWrapper lx={wlx} lz={wlz} />}
    </group>
  );
};

export default React.memo(Window);
