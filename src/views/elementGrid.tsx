/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { GRID_RATIO, FINE_GRID_SCALE, NORMAL_GRID_SCALE } from '../constants';
import { Euler, Vector3 } from 'three';

interface ElementGridProps {
  hx: number;
  hy: number;
  hz: number;
  position?: Vector3;
  rotation?: Euler;
}

export const ElementGrid = React.memo(({ hx, hy, hz, position, rotation }: ElementGridProps) => {
  const enableFineGrid = useStore(Selector.enableFineGrid);
  const groundImage = useStore(Selector.viewState.groundImage);
  const lineColor = groundImage ? '#888888' : '#444444';

  const maxSize = Math.max(hx, hy);
  const [step, setStep] = useState(Math.floor(maxSize / 50) + 1);
  const [lineWidth, setLineWidth] = useState(0.5);

  useEffect(() => {
    if (enableFineGrid) {
      setStep((Math.floor(maxSize / 25) + 1) * FINE_GRID_SCALE);
      setLineWidth(groundImage ? 0.05 : 0.1);
    } else {
      setStep((Math.floor(maxSize / 25) + 1) * NORMAL_GRID_SCALE);
      setLineWidth((groundImage ? 0.05 : 0.1) * GRID_RATIO);
    }
  }, [enableFineGrid, maxSize, groundImage]);

  const pointsX = useMemo(() => {
    const p: number[] = [0];
    for (let i = step; i <= hx; i += step) {
      p.push(i);
      p.push(-i);
    }
    return p;
  }, [step, hx]);

  const pointsY = useMemo(() => {
    const p: number[] = [0];
    for (let i = step; i <= hy; i += step) {
      p.push(i);
      p.push(-i);
    }
    return p;
  }, [step, hy]);

  return (
    <group position={position ?? [0, 0, hz + 0.01]} rotation={rotation}>
      {pointsX.map((value) => {
        return (
          <Line
            key={value}
            points={[
              [value, -hy, 0],
              [value, hy, 0],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
            userData={{ unintersectable: true }}
          />
        );
      })}
      {pointsY.map((value) => {
        return (
          <Line
            key={value}
            points={[
              [-hx, value, 0],
              [hx, value, 0],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
            userData={{ unintersectable: true }}
          />
        );
      })}
    </group>
  );
});
