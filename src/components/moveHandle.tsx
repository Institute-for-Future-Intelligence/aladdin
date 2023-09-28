/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Sphere } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import { HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_COLOR_1, MOVE_HANDLE_COLOR_2, MOVE_HANDLE_COLOR_3 } from 'src/constants';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Mesh } from 'three';
import * as Selector from '../stores/selector';

interface MoveHandleProps {
  position: number[];
  size: number;
  handleType: MoveHandleType;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => void;
  onPointerOut: () => void;
}

const MoveHandle = ({ handleType, position, size, onPointerDown, onPointerOver, onPointerOut }: MoveHandleProps) => {
  const moveHandleType = useStore(Selector.moveHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const handleRef = useRef<Mesh>();

  const [cx, cy, cz] = position;

  let handleColor = MOVE_HANDLE_COLOR_1;
  if (cx === 0 && cy === 0) {
    handleColor = MOVE_HANDLE_COLOR_3;
  } else if (cx === 0) {
    handleColor = MOVE_HANDLE_COLOR_2;
  } else if (cy === 0) {
    handleColor = MOVE_HANDLE_COLOR_1;
  }

  const color = hoveredHandle === handleType || moveHandleType === handleType ? HIGHLIGHT_HANDLE_COLOR : handleColor;

  return (
    <Sphere
      ref={handleRef}
      name={handleType}
      args={[size / 2, 6, 6, 0, Math.PI]}
      position={[cx, cy, cz]}
      onPointerDown={onPointerDown}
      onPointerOver={(e) => {
        onPointerOver(e, handleType);
      }}
      onPointerOut={onPointerOut}
    >
      <meshBasicMaterial color={color} />
    </Sphere>
  );
};

export default MoveHandle;
