/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../stores/common';
import { ObjectType } from '../types';
import * as Selector from '../stores/selector';
import { FINE_GRID_SCALE } from '../constants';

interface ElementGridProps {
  hx: number;
  hy: number;
  hz: number;
  objectType: ObjectType;
}

export const ElementGrid = React.memo(({ hx, hy, hz, objectType }: ElementGridProps) => {
  const enableFineGrid = useStore(Selector.enableFineGrid);
  const lineColor = '#444444';

  const maxSize = Math.max(hx, hy);
  const [step, setStep] = useState(Math.floor(maxSize / 50) + 1);
  const [lineWidth, setLineWidth] = useState(0.5);

  useEffect(() => {
    if (enableFineGrid) {
      setStep((Math.floor(maxSize / 25) + 1) * FINE_GRID_SCALE);
      setLineWidth(0.1);
    } else {
      setStep(Math.floor(maxSize / 25) + 1);
      setLineWidth(0.5);
    }
  }, [enableFineGrid, maxSize]);

  const pointsX: number[] = [0];
  const pointsY: number[] = [0];

  for (let i = step; i <= hx; i += step) {
    pointsX.push(i);
    pointsX.push(-i);
  }

  for (let i = step; i <= hy; i += step) {
    pointsY.push(i);
    pointsY.push(-i);
  }

  return (
    <group position={[0, 0, hz + 0.01]}>
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
          />
        );
      })}
    </group>
  );
});

export default React.memo(ElementGrid);
