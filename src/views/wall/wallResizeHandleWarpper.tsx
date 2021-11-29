/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Box } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import { ActionType, ResizeHandleType, ResizeHandleType as RType } from 'src/types';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../../constants';
import * as Selector from '../../stores/selector';

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
  const buildingWallID = useStore(Selector.buildingWallID);

  const [hovered, setHovered] = useState(false);

  const handleRef = useRef<Mesh>(null);

  const color = // handleType === RType.UpperRight ? 'blue' : 'white';
    highLight ||
    hovered ||
    handleType === resizeHandleType ||
    (buildingWallID && (handleType === RType.LowerRight || handleType === RType.UpperRight))
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
        if (!buildingWallID) {
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
        setCommonStore((state) => {
          state.enableOrbitController = true;
        });
      }}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
});

const WallResizeHandleWarpper = React.memo(({ x, z, id, highLight }: WallResizeHandleWarpperProps) => {
  const orthographic = useStore(Selector.viewState.orthographic);
  return (
    <React.Fragment>
      <WallResizeHandle x={-x} z={-z} id={id} handleType={RType.LowerLeft} highLight={highLight} />
      <WallResizeHandle x={x} z={-z} id={id} handleType={RType.LowerRight} highLight={highLight} />
      {!orthographic && <WallResizeHandle x={-x} z={z} id={id} handleType={RType.UpperLeft} highLight={highLight} />}
      {!orthographic && <WallResizeHandle x={x} z={z} id={id} handleType={RType.UpperRight} highLight={highLight} />}
    </React.Fragment>
  );
});

export default WallResizeHandleWarpper;
