/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { Line } from '@react-three/drei';
import React from 'react';

export interface WallAuxiliaryType {
  show: boolean;
  direction: 'x' | 'y' | 'xy' | null;
  position: number[] | null;
}

const WallAuxiliaryLine = React.memo(
  ({
    hx,
    hy,
    position,
    direction,
    color,
  }: {
    hx: number;
    hy: number;
    position: number[] | null;
    direction: 'x' | 'y' | 'xy' | null;
    color: string;
  }) => {
    if (position === null) return null;

    const [x, y] = position;
    const points: [number, number, number][] = [];

    if (direction === 'x') {
      points.push([-hx, y, 0]);
      points.push([hx, y, 0]);
    } else if (direction === 'y') {
      points.push([x, -hy, 0]);
      points.push([x, hy, 0]);
    } else if (direction === 'xy') {
      return (
        <>
          <Line
            points={[
              [-hx, y, 0],
              [hx, y, 0],
            ]}
            color={color}
          />
          <Line
            points={[
              [x, -hy, 0],
              [x, hy, 0],
            ]}
            color={color}
          />
        </>
      );
    } else {
      return null;
    }

    return <Line points={points} color={color} />;
  },
);

export default WallAuxiliaryLine;
