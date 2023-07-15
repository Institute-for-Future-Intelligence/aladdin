/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { ScaleLinear } from 'd3-scale';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

type VerticalAxisProps = {
  variable: string;
  name: string;
  unit: string;
  yScale: ScaleLinear<number, number>;
  tickLength: number;
  type: string;
  digits: number;
  min: number;
  max: number;
  value?: number;
};

const DEFAULT_TICK_LENGTH = 5;

const VerticalAxis = ({
  yScale,
  tickLength,
  variable,
  name,
  unit,
  type,
  digits,
  min,
  max,
  value,
}: VerticalAxisProps) => {
  const language = useStore(Selector.language);
  const lang = { lng: language };

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
        y={-20}
        style={{
          fontSize: '10px',
          textAnchor: 'middle',
          fill: 'dimgray',
        }}
      >
        {name}
      </text>
      {value !== undefined && (
        <text
          x={0}
          y={-8}
          style={{
            fontSize: '9px',
            textAnchor: 'middle',
            fill: 'dimgray',
          }}
        >
          {variable === 'profit'
            ? value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 3,
              })
            : (variable === 'orientation'
                ? i18n.t(value === 0 ? 'solarPanelMenu.Landscape' : 'solarPanelMenu.Portrait', lang)
                : value.toFixed(digits)) + (unit !== '' ? unit : '')}
        </text>
      )}

      {/* Vertical line */}
      <line x1={0} x2={0} y1={yScale(min)} y2={yScale(max)} stroke="black" strokeWidth={2} />

      {/* Ticks and labels */}
      {ticks.map(({ value, yOffset }) => (
        <g key={value} transform={`translate(0, ${yOffset})`} shapeRendering={'crispEdges'}>
          <line x1={-DEFAULT_TICK_LENGTH} x2={0} stroke="black" strokeWidth={1} />
          <text
            key={value}
            style={{
              fontSize: '10px',
              textAnchor: 'start',
              alignmentBaseline: 'central',
              transform: 'translateX(-25px)',
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
