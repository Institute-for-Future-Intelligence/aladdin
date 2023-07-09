/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import { VerticalAxis } from './VerticalAxis';
import { DatumEntry } from '../types';

const MARGIN = { top: 60, right: 40, bottom: 30, left: 40 };

const COLORS = ['#e0ac2b', '#e85252', '#6689c6', '#9a6fb0', '#a53253', '#69b3a2'];

type ParallelCoordinatesProps = {
  width: number;
  height: number;
  data: DatumEntry[];
  variables: string[];
};

type YScale = d3Scale.ScaleLinear<number, number>;

export const ParallelCoordinates = ({ width, height, data, variables }: ParallelCoordinatesProps) => {
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allGroups = [...new Set(data.map((d) => d.group as string))];

  // Compute a xScale: spread all Y axis along the chart width
  const xScale = d3Scale.scalePoint<string>().range([0, boundsWidth]).domain(variables).padding(0);

  // Compute the yScales: 1 scale per variable
  let yScales: { [name: string]: YScale } = {};
  variables.forEach((variable) => {
    yScales[variable] = d3Scale.scaleLinear().range([boundsHeight, 0]).domain([0, 8]);
  });

  // Color Scale
  const colorScale = d3Scale.scaleOrdinal<string>().domain(allGroups).range(COLORS);

  // Compute lines
  const lineGenerator = d3Shape.line();

  const allLines = data.map((series, i) => {
    const allCoordinates = variables.map((variable) => {
      const yScale = yScales[variable];
      const x = xScale(variable) ?? 0; // I don't understand the type of scalePoint. IMO x cannot be undefined since I'm passing it something of type Variable.
      const y = yScale(series[variable] as number);
      const coordinate: [number, number] = [x, y];
      return coordinate;
    });

    const d = lineGenerator(allCoordinates);

    if (!d) {
      return undefined;
    }

    return <path key={i} d={d} stroke={colorScale(series.group as string)} fill="none" />;
  });

  // Compute Axes
  const allAxes = variables.map((variable, i) => {
    const yScale = yScales[variable];
    return (
      <g key={i} transform={'translate(' + xScale(variable) + ',0)'}>
        <VerticalAxis yScale={yScale} pixelsPerTick={40} name={variable} />
      </g>
    );
  });

  return (
    <svg width={width} height={height}>
      <g width={boundsWidth} height={boundsHeight} transform={`translate(${[MARGIN.left, MARGIN.top].join(',')})`}>
        {allLines}
        {allAxes}
      </g>
    </svg>
  );
};
