/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 *
 * Not sure why I wanted wireframe to be treated differently in a previous version
 * when there is a ground image.
 */

import React from 'react';
import { Line } from '@react-three/drei';

export interface WireframeProps {
  hx: number;
  hy: number;
  hz: number;
  lineColor?: string;
  lineWidth?: number;
}

const Wireframe = ({ hx, hy, hz, lineColor = 'black', lineWidth = 0.2 }: WireframeProps) => {
  return (
    <Line
      points={[
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        // draw vertical line between faces
        [hx, -hy, hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        // draw vertical line between faces
        [hx, hy, hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
        // draw vertical line between faces
        [-hx, hy, hz],
        [-hx, hy, -hz],
        [-hx, -hy, -hz],
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
        [-hx, -hy, hz],
      ]}
      name={'Wireframe'}
      userData={{ unintersectable: true }}
      lineWidth={lineWidth}
      color={lineColor}
    />
  );
};

export default React.memo(Wireframe);
