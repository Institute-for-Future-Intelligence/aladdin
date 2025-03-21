/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Torus, Cone, Circle, Plane, Box } from '@react-three/drei';
import { ActionType, MoveHandleType, ResizeHandleType, RotateHandleType } from '../types';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';

export interface RotateHandleProps {
  id: string;
  position: [x: number, y: number, z: number];
  color?: string;
  ratio: number;
  handleType: RotateHandleType;
  hoverHandle: (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => void;
  noHoverHandle: () => void;
}

const RotateHandle = React.memo(
  ({ id, position, ratio, handleType, hoverHandle, noHoverHandle }: RotateHandleProps) => {
    const selectMe = useStore(Selector.selectMe);

    const rotateHandleType = useStore(Selector.rotateHandleType);
    const hoveredHandle = useStore(Selector.hoveredHandle);

    const color =
      hoveredHandle === handleType || rotateHandleType === handleType ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR;

    const rotationHandleLMesh = <meshBasicMaterial color={color} />;

    return (
      <group position={position} rotation={[HALF_PI, 0, 0]} scale={ratio} name={handleType}>
        <group>
          <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
            {rotationHandleLMesh}
          </Torus>
          <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
            {rotationHandleLMesh}
          </Cone>
          <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
            {rotationHandleLMesh}
          </Circle>
        </group>
        <Box
          name={handleType}
          args={[0.45, 0.45, 0.15]}
          position={[0, 0.05, 0]}
          rotation={[-HALF_PI, 0, 0]}
          visible={false}
          onPointerDown={(e) => {
            selectMe(id, e, ActionType.Rotate);
          }}
          onPointerOver={(e) => {
            hoverHandle(e, handleType);
          }}
          onPointerOut={noHoverHandle}
        />
      </group>
    );
  },
);

export default RotateHandle;
