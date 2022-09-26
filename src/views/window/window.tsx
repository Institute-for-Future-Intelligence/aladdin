/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide, MeshStandardMaterial } from 'three';
import { Box, Plane } from '@react-three/drei';
import { WindowModel } from 'src/models/WindowModel';
import { CommonStoreState, useStore } from 'src/stores/common';
import { ActionType, ObjectType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowWireFrame from './windowWireFrame';
import WindowHandleWrapper from './windowHandleWrapper';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
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
  mullionWidth = 0.06,
  mullionSpacing = 0.5,
  tint = '#73D8FF',
  opacity = 0.5,
  shutter,
}: WindowModel) => {
  // legacy problem
  if (Math.abs(cy) < 0.001) {
    cy = 0.1;
  }

  const setCommonStore = useStore(Selector.set);
  const isAddingElement = useStore(Selector.isAddingElement);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const addedWallIdRef = useRef(useStore.getState().addedWallId);
  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);

  const [wlx, setWlx] = useState(lx);
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

  // subscribe common store
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      addedWallIdRef.current = state.addedWallId;
      objectTypeToAddRef.current = state.objectTypeToAdd;
      moveHandleTypeRef.current = state.moveHandleType;
      resizeHandleTypeRef.current = state.resizeHandleType;
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (parent) {
      setWlx(lx * parent.lx);
      setWlz(lz * parent.lz);
      setWcx(cx * parent.lx);
      setWcy(0.33 * parent.ly);
      setWcz(cz * parent.lz);
    }
  }, [lx, lz, cx, cz, parent?.lx, parent?.ly, parent?.lz]);

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
    if (e.button === 2 || addedWallIdRef.current) return; // ignore right-click
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Window group ${id}`) {
      if (
        !moveHandleTypeRef.current &&
        !resizeHandleTypeRef.current &&
        objectTypeToAddRef.current === ObjectType.None &&
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

  if (shutter === undefined) {
    shutter = defaultShutter;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WindowModel).shutter = defaultShutter;
          break;
        }
      }
    });
  }
  const shutterLength = useMemo(() => shutter.width * wlx, [wlx, shutter]);
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
          <meshBasicMaterial side={DoubleSide} color={tint} opacity={opacity} transparent={true} />
        </Plane>

        {/* wireframes */}
        <WindowWireFrame
          lx={wlx}
          lz={wlz}
          mullionWidth={mullionWidth}
          mullionSpacing={mullionSpacing}
          lineColor={locked && selected ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor}
          lineWidth={selected && locked ? 0.5 : lineWidth}
        />
      </group>

      <Shutter
        cx={shutterPosX}
        lx={shutterLength}
        lz={wlz}
        color={shutter.color}
        showLeft={shutter.showLeft}
        showRight={shutter.showRight}
      />

      <Plane
        args={[ly, wlz]}
        position={[-wlx / 2, ly / 2, 0]}
        rotation={[HALF_PI, HALF_PI, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[ly, wlz]}
        position={[wlx / 2, ly / 2, 0]}
        rotation={[HALF_PI, -HALF_PI, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[wlx, ly]}
        position={[0, ly / 2, wlz / 2]}
        rotation={[Math.PI, 0, 0]}
        material={material}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
      <Plane
        args={[wlx, ly]}
        position={[0, ly / 2, -wlz / 2]}
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
