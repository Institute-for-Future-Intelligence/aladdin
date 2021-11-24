/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../stores/common';
import { ObjectType } from '../types';
import * as Selector from '../stores/selector';

export const ElementGrid = React.memo(
  ({ args, objectType }: { args: [lx: number, ly: number, lz: number]; objectType: ObjectType }) => {
    const enableFineGrid = useStore(Selector.enableFineGrid);

    const [unit, setUnit] = useState(1);
    const [lineWidth, setLineWidth] = useState(0.5);

    const lineColor = objectType === ObjectType.Foundation ? '#444444' : '#444444';

    useEffect(() => {
      if (enableFineGrid) {
        setUnit(0.4);
        setLineWidth(0.2);
      } else {
        setUnit(1);
        setLineWidth(0.5);
      }
    }, [enableFineGrid]);

    const lx = args[0] / 2;
    const ly = args[1] / 2;
    const lz = args[2] / 2;

    const pointsX: number[] = [0];
    const pointsY: number[] = [0];

    for (let i = unit; i <= lx; i += unit) {
      pointsX.push(i);
      pointsX.push(-i);
    }

    for (let i = unit; i <= ly; i += unit) {
      pointsY.push(i);
      pointsY.push(-i);
    }

    return (
      <group position={[0, 0, lz + 0.01]}>
        {pointsX.map((value) => {
          return (
            <Line
              key={value}
              points={[
                [value, -ly, 0],
                [value, ly, 0],
              ]}
              color={lineColor}
              lineWidth={lineWidth}
              // depthWrite={false}
            />
          );
        })}
        {pointsY.map((value) => {
          return (
            <Line
              key={value}
              points={[
                [-lx, value, 0],
                [lx, value, 0],
              ]}
              color={lineColor}
              lineWidth={lineWidth}
            />
          );
        })}
      </group>
    );
  },
);

export default React.memo(ElementGrid);
