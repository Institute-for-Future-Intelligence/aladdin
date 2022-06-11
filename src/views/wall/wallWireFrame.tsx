/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { HALF_PI } from '../../constants';

interface WallWireFrameProps {
  selected: boolean;
  lineColor: string;
  lineWidth: number;
  x: number;
  z: number;
  leftHeight?: number;
  rightHeight?: number;
}

const WallWireFrame = React.memo(
  ({
    selected,
    lineColor = 'black',
    lineWidth = 0.2,
    x,
    z,
    leftHeight = 2 * z,
    rightHeight = 2 * z,
  }: WallWireFrameProps) => {
    const lowerLeft: [number, number, number] = [-x, -z, 0];
    const lowerRight: [number, number, number] = [x, -z, 0];
    const upperLeft: [number, number, number] = [-x, leftHeight - z, 0];
    const upperRight: [number, number, number] = [x, rightHeight - z, 0];

    return (
      <React.Fragment>
        <group rotation={[HALF_PI, 0, 0]}>
          <Line points={[upperLeft, lowerLeft, lowerRight, upperRight]} color={lineColor} lineWidth={lineWidth} />
          {selected && <Line points={[upperLeft, upperRight]} lineWidth={lineWidth} color={lineColor} />}
        </group>
      </React.Fragment>
    );
  },
);

export default WallWireFrame;
