/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Line } from '@react-three/drei';
import React from 'react';
import { LineData } from '../LineData';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../../stores/selector';
import { Orientation } from 'src/types';
import { Vector3 } from 'three';

interface HeatmapLinesProps {
  lx: number;
  ly: number;
  lz: number;
  orientation: Orientation;
  modelWidth: number;
  modelLength: number;
}
const LinesGroup = ({ lx, ly, lz, orientation, modelLength, modelWidth }: HeatmapLinesProps) => {
  const lines: LineData[] = [];
  const [hx, hy, hz] = [lx / 2, ly / 2, lz / 2];
  let mx, my;
  if (orientation === Orientation.portrait) {
    mx = Math.max(1, Math.round(lx / modelWidth));
    my = Math.max(1, Math.round(ly / modelLength));
  } else {
    mx = Math.max(1, Math.round(lx / modelLength));
    my = Math.max(1, Math.round(ly / modelWidth));
  }
  const dx = lx / mx;
  const dy = ly / my;
  for (let i = 0; i <= mx; i++) {
    lines.push({
      points: [new Vector3(-hx + i * dx, -hy, hz), new Vector3(-hx + i * dx, hy, hz)],
    } as LineData);
  }
  for (let i = 0; i <= my; i++) {
    lines.push({
      points: [new Vector3(-hx, -hy + i * dy, hz), new Vector3(hx, -hy + i * dy, hz)],
    } as LineData);
  }

  return (
    <group name={'Solar Panel Heatmap Lines Group'} position={[0, 0, 0.005]}>
      {lines.map((lineData, index) => {
        return (
          <Line
            name={'Solar Panel Lines'}
            key={index}
            userData={{ unintersectable: true }}
            points={lineData.points}
            lineWidth={0.2}
          />
        );
      })}
    </group>
  );
};

const HeatmapLines = React.memo(({ lx, ly, lz, orientation, modelLength, modelWidth }: HeatmapLinesProps) => {
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  if (!showSolarRadiationHeatmap) return null;
  return (
    <LinesGroup lx={lx} ly={ly} lz={lz} orientation={orientation} modelLength={modelLength} modelWidth={modelWidth} />
  );
});

export default HeatmapLines;
