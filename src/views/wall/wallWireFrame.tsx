/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { HALF_PI } from '../../constants';

interface WallWireFrameProps {
  lineColor: string;
  lineWidth: number;
  x: number;
  z: number;
  leftHeight?: number;
  rightHeight?: number;
  center?: number[];
  centerLeft?: number[];
  centerRight?: number[];
}

const WallWireFrame = React.memo(
  ({
    lineColor = 'black',
    lineWidth = 0.2,
    x,
    z,
    leftHeight = 2 * z,
    rightHeight = 2 * z,
    center,
    centerLeft,
    centerRight,
  }: WallWireFrameProps) => {
    const lowerLeft: [number, number, number] = [-x, -z + 0.001, 0.001];
    const lowerRight: [number, number, number] = [x, -z + 0.001, 0.001];
    const upperLeft: [number, number, number] = [-x, leftHeight - z - 0.001, 0.001];
    const upperRight: [number, number, number] = [x, rightHeight - z - 0.001, 0.001];

    const points = [upperLeft, lowerLeft, lowerRight, upperRight];
    const lx = x * 2;

    if (centerRight) {
      const cr: [number, number, number] = [centerRight[0] * lx, centerRight[1] - z, 0.001];
      points.push(cr);
    }

    if (center) {
      const c: [number, number, number] = [center[0] * lx, center[1] - z, 0.001];
      points.push(c);
    }

    if (centerLeft) {
      const cl: [number, number, number] = [centerLeft[0] * lx, centerLeft[1] - z, 0.001];
      points.push(cl);
    }

    points.push(upperLeft);

    return (
      <React.Fragment>
        <group rotation={[HALF_PI, 0, 0]}>
          <Line points={points} color={lineColor} lineWidth={lineWidth} />
        </group>
      </React.Fragment>
    );
  },
);

export default WallWireFrame;
