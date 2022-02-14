/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createSymbol, SYMBOLS } from './symbols';
import { PRESET_COLORS } from '../constants';
import { GraphDataType, DatumEntry } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';

export interface LineGraphProps {
  type: GraphDataType;
  dataSource: DatumEntry[];
  labels?: string[];
  height: number;
  labelX?: string;
  labelY?: string;
  unitX?: string;
  unitY?: string;
  yMin?: string | number;
  yMax?: string | number;
  curveType?: CurveType;
  referenceX?: number | string;
  fractionDigits?: number;
  symbolCount?: number;
}

const LineGraph = ({
  type,
  dataSource,
  labels,
  height,
  labelX,
  labelY,
  unitX,
  unitY,
  yMin = 'auto',
  yMax = 'auto',
  curveType = 'linear',
  referenceX,
  fractionDigits = 2,
  symbolCount = 12,
}: LineGraphProps) => {
  const [lineCount, setLineCount] = useState<number>(0);
  const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
  const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
  const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [symbolSize, setSymbolSize] = useState<number>(1);

  //init
  useEffect(() => {
    if (!dataSource || dataSource.length === 0) {
      return;
    }
    const len = Array.isArray(dataSource) ? Object.keys(dataSource[0]).length - 1 : Object.keys(dataSource).length - 1;
    if (lineCount !== len) {
      setLineCount(len);
    }
  }, [dataSource]);

  const getLines = useMemo(() => {
    const lines = [];
    let defaultSymbol;
    for (let i = 0; i < lineCount; i++) {
      let name = '';
      switch (type) {
        case GraphDataType.MonthlyTemperatures:
          name = i === 0 ? `Low` : 'High';
          break;
        case GraphDataType.SunshineHours:
          name = 'Sunshine';
          break;
        case GraphDataType.HourlyTemperatures:
          name = 'Temperature';
          break;
        case GraphDataType.DaylightData:
          name = 'Daylight';
          break;
        case GraphDataType.ClearnessData:
          name = 'Clearness';
          break;
        case GraphDataType.DailyRadiationSensorData:
        case GraphDataType.YearlyRadiationSensorData:
          name = labels && labels[i] ? labels[i] : 'Radiation' + (i + 1);
          break;
        case GraphDataType.DailyPvYield:
        case GraphDataType.YearlyPvYeild:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Panel' + (i + 1);
          }
          break;
        case GraphDataType.DailyParabolicTroughYield:
        case GraphDataType.YearlyParabolicTroughYeild:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Trough' + (i + 1);
          }
          break;
        case GraphDataType.DailyParabolicDishYield:
        case GraphDataType.YearlyParabolicDishYeild:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Dish' + (i + 1);
          }
          break;
        case GraphDataType.DailyFresnelReflectorYield:
        case GraphDataType.YearlyFresnelReflectorYeild:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Reflector' + (i + 1);
          }
          break;
        case GraphDataType.DailyHeliostatYield:
        case GraphDataType.YearlyHeliostatYeild:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Heliostat' + (i + 1);
          }
          break;
      }
      const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
      const symbol = createSymbol(SYMBOLS[i], symbolSize, symbolCount, opacity);
      if (i === 0) defaultSymbol = symbol;
      lines.push(
        <Line
          key={i}
          type={curveType}
          name={name}
          dataKey={name}
          stroke={PRESET_COLORS[i]}
          opacity={opacity}
          strokeWidth={lineWidth}
          dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
          isAnimationActive={false}
        />,
      );
    }
    return lines;
  }, [labels, lineCount, lineWidth, symbolCount, symbolSize, legendDataKey]);

  // @ts-ignore
  const onMouseDown = (e) => {};

  // @ts-ignore
  const onMouseEnterLegend = (o) => {
    setLegendDataKey(o.dataKey);
  };

  // @ts-ignore
  const onMouseLeaveLegend = (o) => {
    setLegendDataKey(null);
  };

  return (
    <>
      {dataSource && (
        // need two div wrappers to disable the responsiveness of ResponsiveContainer
        <div
          id={'line-graph-' + labelX + '-' + labelY}
          style={{ width: '100%', height: `${height}%`, position: 'relative' }}
        >
          <div
            style={{
              userSelect: 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <ResponsiveContainer width="100%" height={`100%`}>
              <LineChart
                data={dataSource}
                onMouseDown={onMouseDown}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <Tooltip formatter={(value: number) => value.toFixed(fractionDigits) + ' ' + unitY} />
                <CartesianGrid
                  vertical={verticalGridLines}
                  horizontal={horizontalGridLines}
                  stroke={'rgba(128, 128, 128, 0.3)'}
                />
                <ReferenceLine x={referenceX} stroke="orange" strokeWidth={2} />
                <XAxis dataKey={labelX}>
                  <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                </XAxis>
                <YAxis domain={[yMin, yMax]}>
                  <Label
                    dx={-15}
                    value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                    offset={0}
                    angle={-90}
                    position="center"
                  />
                </YAxis>
                {getLines}
                {lineCount > 1 && (
                  <Legend
                    iconType="plainline"
                    verticalAlign="top"
                    height={36}
                    onMouseLeave={onMouseLeaveLegend}
                    onMouseEnter={onMouseEnterLegend}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default LineGraph;
