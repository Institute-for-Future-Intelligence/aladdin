/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import { DatumEntry } from '../types';
import React from 'react';
import VerticalAxis from './verticalAxis';

const MARGIN = { top: 30, right: 55, bottom: 36, left: 55 };

const COLORS = [
  '#e0ac2b',
  '#e85252',
  '#6689c6',
  '#9a6fb0',
  '#a53253',
  '#69b3a2',
  '#556b2f',
  '#8b008b',
  '#ff1493',
  '#d2691e',
  '#2f4f4f',
  '#dc143c',
];

type ParallelCoordinatesProps = {
  id: string;
  width: number;
  height: number;
  data: DatumEntry[];
  types: string[];
  minima: number[];
  maxima: number[];
  steps: number[];
  variables: string[];
  titles: string[];
  units: string[];
  digits: number[];
  tickIntegers: boolean[];
  hover: Function;
  hoveredIndex: number;
  selectedIndex: number;
};

type YScale = d3Scale.ScaleLinear<number, number>;

const ParallelCoordinates = ({
  id,
  width,
  height,
  data,
  types,
  minima,
  maxima,
  steps,
  variables,
  titles,
  units,
  digits,
  tickIntegers,
  hover,
  hoveredIndex,
  selectedIndex,
}: ParallelCoordinatesProps) => {
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allGroups = [...new Set(data.map((d) => d.group as string))];

  // Compute a xScale: spread all Y axis along the chart width
  const xScale = d3Scale.scalePoint<string>().range([0, boundsWidth]).domain(variables).padding(0);

  // Compute the yScales: 1 scale per variable
  const yScales: { [name: string]: YScale } = {};
  variables.forEach((variable, index) => {
    yScales[variable] = d3Scale
      .scaleLinear()
      .range([boundsHeight, 0])
      .domain([minima[index] ?? 0, maxima[index] ?? 1]);
  });

  // Color Scale
  const colorScale = d3Scale.scaleOrdinal<string>().domain(allGroups).range(COLORS);

  // Compute lines
  const lineGenerator = d3Shape.line();

  const allLines = data.map((e, i) => {
    if (e.invisible) return null;
    const allCoordinates = variables.map((variable) => {
      const yScale = yScales[variable];
      // I don't understand the type of scalePoint. IMO x cannot be undefined since I'm passing it something of type Variable.
      const x = xScale(variable) ?? 0;
      const y = yScale(e[variable] as number);
      return [x, y] as [number, number];
    });

    const d = lineGenerator(allCoordinates);

    if (!d) {
      return undefined;
    }

    return (
      <path
        onMouseOver={() => {
          hover(i);
        }}
        key={i}
        d={d}
        stroke={e.hovered ? 'red' : colorScale(e.group as string)}
        fill="none"
        strokeWidth={e.selected ? 3 : 1}
        strokeDasharray={e.hovered ? '3,3' : 'none'}
      />
    );
  });

  // Compute Axes
  const allAxes = variables.map((variable, i) => {
    const yScale = yScales[variable];
    return (
      <g key={i} transform={'translate(' + xScale(variable) + ',0)'}>
        <VerticalAxis
          yScale={yScale}
          tickLength={40}
          tickIntegers={tickIntegers[i]}
          type={types[i] ?? 'number'}
          variable={variables[i]}
          name={titles[i]}
          unit={units[i]}
          digits={digits[i]}
          min={minima[i]}
          max={maxima[i]}
          step={steps[i]}
          value={
            hoveredIndex >= 0 && !data[hoveredIndex].invisible
              ? (data[hoveredIndex][variable] as number)
              : selectedIndex >= 0 && !data[selectedIndex].invisible
              ? (data[selectedIndex][variable] as number)
              : undefined
          }
        />
      </g>
    );
  });

  return (
    <svg
      id={id}
      width={width}
      height={height}
      onMouseLeave={() => {
        if (hover) hover(-1);
      }}
      onContextMenu={(event) => {
        event.stopPropagation();
      }}
    >
      <g width={boundsWidth} height={boundsHeight} transform={`translate(${[MARGIN.left, MARGIN.top].join(',')})`}>
        {allLines}
        {allAxes}
      </g>
    </svg>
  );
};

export default React.memo(ParallelCoordinates);
