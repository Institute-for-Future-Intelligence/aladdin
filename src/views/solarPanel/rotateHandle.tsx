/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Circle, Cone, Plane, Torus } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React, { useEffect } from 'react';
import { HALF_PI } from 'src/constants';

const RotateHandle = React.memo(
  ({
    positionY,
    name,
    onPointerDown,
  }: {
    name: string;
    positionY: number;
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  }) => {
    return (
      <group name={name} position={[0, positionY, 0]} rotation={[HALF_PI, 0, 0]} onPointerDown={onPointerDown}>
        <Torus args={[0.15, 0.05, 6, 8, (3 / 2) * Math.PI]} rotation={[HALF_PI, 0, HALF_PI]}>
          <meshBasicMaterial color={'white'} />
        </Torus>
        <Cone args={[0.1, 0.1, 6]} rotation={[HALF_PI, 0, 0]} position={[0.15, 0, 0.05]}>
          <meshBasicMaterial color={'white'} />
        </Cone>
        <Circle args={[0.05, 6]} rotation={[0, HALF_PI, 0]} position={[0, 0, 0.15]}>
          <meshBasicMaterial color={'white'} />
        </Circle>
        <Plane args={[0.35, 0.35]} position={[0, 0.05, 0]} rotation={[-HALF_PI, 0, 0]} visible={false} />
      </group>
    );
  },
);

export default RotateHandle;
