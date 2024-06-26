/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Circle, Cone, Plane, Torus } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { HALF_PI, RESIZE_HANDLE_COLOR } from 'src/constants';
import { RotateHandleType } from 'src/types';
import { useHandleSize } from '../wall/hooks';
import { useHandle } from './hooks';

interface RotateHandleProps {
  positionY: number;
  name: RotateHandleType;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}
const RotateHandle = React.memo(({ positionY, name, onPointerDown }: RotateHandleProps) => {
  const handleSize = useHandleSize();
  const { _color, _onPointerDown, _onPointerEnter, _onPointerLeave } = useHandle(RESIZE_HANDLE_COLOR);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    onPointerDown(e);
    _onPointerDown();
  };

  return (
    <group
      name={name}
      position={[0, positionY, 0]}
      rotation={[HALF_PI, 0, 0]}
      scale={handleSize * 3}
      onPointerDown={handlePointerDown}
      onPointerEnter={_onPointerEnter}
      onPointerLeave={_onPointerLeave}
    >
      <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
        <meshBasicMaterial color={_color} />
      </Torus>
      <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
        <meshBasicMaterial color={_color} />
      </Cone>
      <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
        <meshBasicMaterial color={_color} />
      </Circle>
      <Plane args={[0.35, 0.35]} position={[0, 0.05, 0]} rotation={[-HALF_PI, 0, 0]} visible={false} />
    </group>
  );
});

export default RotateHandle;
