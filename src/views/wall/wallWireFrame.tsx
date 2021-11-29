/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';

interface WallWireFrameProps {
  x: number;
  z: number;
  lineWidth?: number;
}

const WallWireFrame = React.memo(({ x, z, lineWidth = 0.2 }: WallWireFrameProps) => {
  return (
    <React.Fragment>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Line
          points={[
            [-x, -z, 0],
            [-x, z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [-x, -z, 0],
            [x, -z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [x, z, 0],
            [-x, z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [x, z, 0],
            [x, -z, 0],
          ]}
          lineWidth={lineWidth}
        />
      </group>
    </React.Fragment>
  );
});

export default WallWireFrame;
