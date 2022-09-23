/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import { ActionType, ResizeHandleType, ResizeHandleType as RType } from 'src/types';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from 'src/constants';
import * as Selector from 'src/stores/selector';

interface ResizeHandlesProps {
  x: number;
  z: number;
  id: string;
  handleType: RType;
  highLight: boolean;
  handleSize?: number;
}

interface WallResizeHandleWarpperProps {
  x: number;
  z: number;
  id: string;
  highLight: boolean;
}

const WallResizeHandle = React.memo(({ x, z, id, handleType, highLight, handleSize = 0.3 }: ResizeHandlesProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const addedWallID = useStore(Selector.addedWallId);

  const [hovered, setHovered] = useState(false);

  const handleRef = useRef<Mesh>(null);

  const color = // handleType === RType.UpperRight ? 'blue' : 'white';
    highLight ||
    hovered ||
    handleType === resizeHandleType ||
    (addedWallID && (handleType === RType.LowerRight || handleType === RType.UpperRight))
      ? HIGHLIGHT_HANDLE_COLOR
      : RESIZE_HANDLE_COLOR;

  let lx = handleSize,
    ly = handleSize,
    lz = handleSize;
  if (handleType === RType.LowerRight || handleType === RType.LowerLeft) {
    lx = handleSize * 1.7;
  } else {
    ly = handleSize / 2;
    lz = handleSize * 1.7;
  }
  return (
    <Box
      name={handleType}
      ref={handleRef}
      args={[lx, ly, lz]}
      position={[x, 0, z]}
      onPointerOver={() => {
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onPointerDown={(e) => {
        if (!addedWallID) {
          selectMe(id, e, ActionType.Resize);
        }
        if (handleRef) {
          if (handleType === ResizeHandleType.LowerLeft || handleType === ResizeHandleType.LowerRight) {
            setCommonStore((state) => {
              const anchor = handleRef.current!.localToWorld(new Vector3(-x * 2, 0, 0));
              state.resizeAnchor.copy(anchor);
            });
          } else if (handleType === ResizeHandleType.UpperLeft || handleType === ResizeHandleType.UpperRight) {
            setCommonStore((state) => {
              const anchor = handleRef.current!.localToWorld(new Vector3(0, 0, -z * 2));
              state.resizeAnchor.copy(anchor);
            });
          }
        }
      }}
      onPointerUp={() => {
        useStoreRef.getState().setEnableOrbitController(true);
      }}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
});

const WallResizeHandleWarpper = React.memo(({ x, z, id, highLight }: WallResizeHandleWarpperProps) => {
  const orthographic = useStore(Selector.viewState.orthographic);
  const handleSize = useHandleSize();

  if (orthographic) {
    z = -z;
  }

  return (
    <React.Fragment>
      <WallResizeHandle
        x={-x}
        z={-z}
        id={id}
        handleType={RType.LowerLeft}
        highLight={highLight}
        handleSize={handleSize}
      />
      <WallResizeHandle
        x={x}
        z={-z}
        id={id}
        handleType={RType.LowerRight}
        highLight={highLight}
        handleSize={handleSize}
      />
      {!orthographic && (
        <WallResizeHandle
          x={-x}
          z={z}
          id={id}
          handleType={RType.UpperLeft}
          highLight={highLight}
          handleSize={handleSize}
        />
      )}
      {!orthographic && (
        <WallResizeHandle
          x={x}
          z={z}
          id={id}
          handleType={RType.UpperRight}
          highLight={highLight}
          handleSize={handleSize}
        />
      )}
    </React.Fragment>
  );
});

export const useHandleSize = () => {
  const orthographic = useStore((state) => state.viewState.orthographic);
  const cameraPosition = useStore((state) => state.viewState.cameraPosition);
  const cameraZoom = useStore((state) => state.viewState.cameraZoom);
  const [handleSize, setHandleSize] = useState(0.3);

  useEffect(() => {
    if (orthographic) {
      setHandleSize(Math.max(0.3, 15 / cameraZoom));
    } else {
      const panCenter = useStore.getState().viewState.panCenter;
      const p = new Vector3(...panCenter);
      const c = new Vector3(...cameraPosition);
      const distance = c.distanceTo(p);
      setHandleSize(Math.max(0.3, distance / 100));
    }
  }, [cameraPosition, cameraZoom]);

  return handleSize;
};

export default WallResizeHandleWarpper;
