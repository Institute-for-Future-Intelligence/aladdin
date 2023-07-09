/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { useMemo } from 'react';
import { ScaleLinear } from 'd3-scale';

type VerticalAxisProps = {
  yScale: ScaleLinear<number, number>;
  pixelsPerTick: number;
  name: string;
};

const TICK_LENGTH = 3;

export const VerticalAxis = ({ yScale, pixelsPerTick, name }: VerticalAxisProps) => {
  const range = yScale.range();

  const ticks = useMemo(() => {
    const height = range[0] - range[1];
    const numberOfTicksTarget = Math.floor(height / pixelsPerTick);
    return yScale.ticks(numberOfTicksTarget).map((value) => ({
      value,
      yOffset: yScale(value),
    }));
  }, [yScale, pixelsPerTick]);

  return (
    <>
      {/* Title */}
      <text
        x={0}
        y={-25}
        style={{
          fontSize: '14px',
          textAnchor: 'middle',
          fill: 'black',
        }}
      >
        {name}
      </text>

      {/* Vertical line */}
      <line x1={0} x2={0} y1={0} y2={yScale(range[1])} stroke="black" strokeWidth={2} />

      {/* Ticks and labels */}
      {ticks.map(({ value, yOffset }) => (
        <g key={value} transform={`translate(0, ${yOffset})`} shapeRendering={'crispEdges'}>
          <line x1={-TICK_LENGTH} x2={0} stroke="black" strokeWidth={0.5} />
          <text
            key={value}
            style={{
              fontSize: '10px',
              textAnchor: 'middle',
              alignmentBaseline: 'central',
              transform: 'translateX(-10px)',
            }}
          >
            {value}
          </text>
        </g>
      ))}
    </>
  );
};
