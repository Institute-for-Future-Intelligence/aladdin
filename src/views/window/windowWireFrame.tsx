/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';

interface WindowWireFrameProps {
  x: number;
  z: number;
  lineColor: string;
  lineWidth?: number;
}

const WindowWireFrame = ({ x, z, lineColor, lineWidth = 1 }: WindowWireFrameProps) => {
  return (
    <React.Fragment>
      <Line
        points={[
          [-x, 0, -z],
          [x, 0, -z],
          [x, 0, z],
          [-x, 0, z],
          [-x, 0, -z],
        ]}
        linewidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[
          [-x, 0, 0],
          [x, 0, 0],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
      <Line
        points={[
          [0, 0, -z],
          [0, 0, z],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
    </React.Fragment>
  );
};

export default React.memo(WindowWireFrame);
