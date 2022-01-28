/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { HALF_PI } from '../../constants';

interface WallWireFrameProps {
  x: number;
  z: number;
  leftHeight?: number;
  rightHeight?: number;
}

const WallWireFrame = React.memo(({ x, z, leftHeight = 2 * z, rightHeight = 2 * z }: WallWireFrameProps) => {
  const lineWidth = 0.2;

  const lowerLeft: [number, number, number] = [-x, -z, 0];
  const lowerRight: [number, number, number] = [x, -z, 0];
  const upperLeft: [number, number, number] = [-x, leftHeight - z, 0];
  const upperRight: [number, number, number] = [x, rightHeight - z, 0];

  return (
    <React.Fragment>
      <group rotation={[HALF_PI, 0, 0]}>
        <Line points={[lowerLeft, lowerRight]} lineWidth={lineWidth} />
        <Line points={[lowerLeft, upperLeft]} lineWidth={lineWidth} />
        <Line points={[lowerRight, upperRight]} lineWidth={lineWidth} />
        <Line points={[upperLeft, upperRight]} lineWidth={lineWidth} />
      </group>
    </React.Fragment>
  );
});

export default WallWireFrame;
