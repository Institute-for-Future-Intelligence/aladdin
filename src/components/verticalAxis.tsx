/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { ScaleLinear } from 'd3-scale';

type VerticalAxisProps = {
  name: string;
  yScale: ScaleLinear<number, number>;
  tickLength: number;
  type: string;
};

const DEFAULT_TICK_LENGTH = 5;

const VerticalAxis = ({ yScale, tickLength, name, type }: VerticalAxisProps) => {
  const range = yScale.range();

  const ticks = useMemo(() => {
    const height = range[0] - range[1];
    const numberOfTicks = type === 'number' ? Math.floor(height / tickLength) : 1;
    return yScale.ticks(numberOfTicks).map((value) => ({
      value,
      yOffset: yScale(value),
    }));
  }, [yScale, tickLength, type]);

  return (
    <>
      {/* Title */}
      <text
        x={0}
        y={-25}
        style={{
          fontSize: '11px',
          textAnchor: 'middle',
          fill: 'dimgray',
          // rotate: '-10deg',
        }}
      >
        {name}
      </text>

      {/* Vertical line */}
      <line x1={0} x2={0} y1={0} y2={yScale(range[1])} stroke="black" strokeWidth={2} />

      {/* Ticks and labels */}
      {ticks.map(({ value, yOffset }) => (
        <g key={value} transform={`translate(0, ${yOffset})`} shapeRendering={'crispEdges'}>
          <line x1={-DEFAULT_TICK_LENGTH} x2={0} stroke="black" strokeWidth={1} />
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

export default React.memo(VerticalAxis);
