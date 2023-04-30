/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Box } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from 'src/constants';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Mesh, Vector3 } from 'three';
import * as Selector from '../stores/selector';

interface ResizeHandleProps {
  position: number[];
  handleType: ResizeHandleType;
  size: number;
  onPointerOver: (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => void;
  onPointerOut: () => void;
}

const ResizeHandle = ({ handleType, position, size, onPointerOver, onPointerOut }: ResizeHandleProps) => {
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const handleRef = useRef<Mesh>();

  const [cx, cy, cz] = position;
  const color =
    hoveredHandle === handleType || resizeHandleType === handleType ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR;

  const handlePointerDown = () => {
    if (handleRef.current) {
      const anchor = handleRef.current.localToWorld(new Vector3(-cx * 2, -cy * 2, 0));
      useStore.getState().set((state) => {
        state.resizeAnchor.copy(anchor);
        state.resizeHandleType = handleType;
        state.selectedElement = state.elements.find((e) => e.selected) ?? null;
      });
      useRefStore.getState().setEnableOrbitController(false);
    }
  };

  return (
    <Box
      ref={handleRef}
      name={handleType}
      args={[size, size, size]}
      position={[cx, cy, cz]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        onPointerOver(e, handleType);
      }}
      onPointerOut={onPointerOut}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
};

export default ResizeHandle;
