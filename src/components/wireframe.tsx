/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';

export interface WireframeProps {
  args: [x: number, y: number, z: number];
  lineColor?: string;
  lineWidth?: number;
}

const Wireframe = ({ args, lineColor = 'black', lineWidth = 0.2 }: WireframeProps) => {
  const groundImage = useStore(Selector.viewState.groundImage);

  const [wireframeColor, setWireframeColor] = useState(lineColor);
  const [wireframeWidth, setWireframeWidth] = useState(lineWidth);

  const hx = args[0] / 2;
  const hy = args[1] / 2;
  const hz = args[2] / 2;
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  useEffect(() => {
    setWireframeColor(groundImage ? 'white' : lineColor);
    setWireframeWidth(groundImage ? lineWidth * 2 : lineWidth);
  }, [groundImage]);

  return (
    <group>
      {/* bottom face */}
      <Line
        points={[
          [positionLL.x, positionLL.y, -hz],
          [positionLR.x, positionLR.y, -hz],
        ]}
        name={'Line LL-LR Lower Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[
          [positionLR.x, positionLR.y, -hz],
          [positionUR.x, positionUR.y, -hz],
        ]}
        name={'Line LR-UR Lower Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[
          [positionUR.x, positionUR.y, -hz],
          [positionUL.x, positionUL.y, -hz],
        ]}
        name={'Line UR-UL Lower Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[
          [positionUL.x, positionUL.y, -hz],
          [positionLL.x, positionLL.y, -hz],
        ]}
        name={'Line UL-LL Lower Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />

      {/* top face */}
      <Line
        points={[positionLL, positionLR]}
        name={'Line LL-LR Upper Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[positionLR, positionUR]}
        name={'Line LR-UR Upper Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[positionUR, positionUL]}
        name={'Line UR-UL Upper Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[positionUL, positionLL]}
        name={'Line UL-LL Upper Face'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />

      {/* vertival lines */}
      <Line
        points={[[positionLL.x, positionLL.y, -hz], positionLL]}
        name={'Line LL-LL Vertical'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[[positionLR.x, positionLR.y, -hz], positionLR]}
        name={'Line LR-LR Vertical'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[[positionUL.x, positionUL.y, -hz], positionUL]}
        name={'Line UL-UL Vertical'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
      <Line
        points={[[positionUR.x, positionUR.y, -hz], positionUR]}
        name={'Line UR-UR Vertical'}
        lineWidth={wireframeWidth}
        color={wireframeColor}
      />
    </group>
  );
};

export default React.memo(Wireframe);
