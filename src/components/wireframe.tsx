/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 *
 * Not sure why I wanted wireframe to be treated differently in a previous version
 * when there is a ground image.
 */

import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';

export interface WireframeProps {
  hx: number;
  hy: number;
  hz: number;
  lineColor?: string;
  lineWidth?: number;
}

const Wireframe = ({ hx, hy, hz, lineColor = 'black', lineWidth = 0.2 }: WireframeProps) => {
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  return (
    <group>
      {/* bottom face */}
      <Line
        points={[
          [positionLL.x, positionLL.y, -hz],
          [positionLR.x, positionLR.y, -hz],
        ]}
        name={'Line LL-LR Lower Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[
          [positionLR.x, positionLR.y, -hz],
          [positionUR.x, positionUR.y, -hz],
        ]}
        name={'Line LR-UR Lower Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[
          [positionUR.x, positionUR.y, -hz],
          [positionUL.x, positionUL.y, -hz],
        ]}
        name={'Line UR-UL Lower Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[
          [positionUL.x, positionUL.y, -hz],
          [positionLL.x, positionLL.y, -hz],
        ]}
        name={'Line UL-LL Lower Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />

      {/* top face */}
      <Line
        points={[positionLL, positionLR]}
        name={'Line LL-LR Upper Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[positionLR, positionUR]}
        name={'Line LR-UR Upper Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[positionUR, positionUL]}
        name={'Line UR-UL Upper Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[positionUL, positionLL]}
        name={'Line UL-LL Upper Face'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />

      {/* vertival lines */}
      <Line
        points={[[positionLL.x, positionLL.y, -hz], positionLL]}
        name={'Line LL-LL Vertical'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[[positionLR.x, positionLR.y, -hz], positionLR]}
        name={'Line LR-LR Vertical'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[[positionUL.x, positionUL.y, -hz], positionUL]}
        name={'Line UL-UL Vertical'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[[positionUR.x, positionUR.y, -hz], positionUR]}
        name={'Line UR-UR Vertical'}
        userData={{ unintersectable: true }}
        lineWidth={lineWidth}
        color={lineColor}
      />
    </group>
  );
};

export default React.memo(Wireframe);
