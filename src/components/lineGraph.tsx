/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
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
import { createSymbol } from './symbols';
import { PRESET_COLORS } from '../constants';
import { ChartType, DatumEntry, GraphDataType } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';
import LineGraphMenu from './lineGraphMenu';
import { SYMBOLS } from './symbolConstants';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

export interface LineGraphProps {
  type: GraphDataType;
  chartType: ChartType;
  selectedIndex?: number;
  dataSource: DatumEntry[];
  labels?: string[];
  height: number;
  dataKeyAxisX?: string;
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
  chartType = ChartType.Line,
  selectedIndex,
  dataSource,
  labels,
  height,
  dataKeyAxisX,
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
  const applyElectricityConsumptions = useStore(Selector.world.applyElectricityConsumptions);

  const [lineCount, setLineCount] = useState<number>(0);
  const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
  const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
  const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [symbolSize, setSymbolSize] = useState<number>(1);

  //init
  useEffect(() => {
    if (!dataSource || dataSource.length === 0 || !dataSource[0]) {
      setLineCount(0);
      return;
    }
    const len = Array.isArray(dataSource) ? Object.keys(dataSource[0]).length - 1 : Object.keys(dataSource).length - 1;
    if (lineCount !== len) {
      setLineCount(len);
    }
  }, [lineCount, dataSource]);

  const getRepresentations = useMemo(() => {
    const representations = [];
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
          if (lineCount === 1) {
            name = 'Temperature';
          } else {
            if (i === 1) {
              name = 'PartonLogan';
            } else if (i === 2) {
              name = 'Ground';
            } else {
              name = 'Sinusoidal';
            }
          }
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
        case GraphDataType.YearlyPvYield:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Panel' + (i + 1);
          }
          break;
        case GraphDataType.DailyParabolicTroughYield:
        case GraphDataType.YearlyParabolicTroughYield:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Trough' + (i + 1);
          }
          break;
        case GraphDataType.DailyParabolicDishYield:
        case GraphDataType.YearlyParabolicDishYield:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Dish' + (i + 1);
          }
          break;
        case GraphDataType.DailyFresnelReflectorYield:
        case GraphDataType.YearlyFresnelReflectorYield:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Reflector' + (i + 1);
          }
          break;
        case GraphDataType.DailyHeliostatYield:
        case GraphDataType.YearlyHeliostatYield:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Heliostat' + (i + 1);
          }
          break;
        case GraphDataType.DailyUpdraftTowerYield:
        case GraphDataType.YearlyUpdraftTowerYield:
          name = labels && labels[i] ? labels[i] : 'Tower' + (i + 1);
          break;
        case GraphDataType.DailyBuildingEnergy:
        case GraphDataType.YearlyBuildingEnergy:
          name = labels && labels[i] ? labels[i] : 'Energy' + (i + 1);
          break;
        case GraphDataType.DailyBatteryStorageEnergy:
        case GraphDataType.YearlyBatteryStorageEnergy:
          if (lineCount === 1) {
            name = 'Total';
          } else {
            name = labels && labels[i] ? labels[i] : 'Battery' + (i + 1);
          }
          break;
      }
      const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
      const symbol = createSymbol(SYMBOLS[i], symbolSize, dataSource.length, symbolCount, opacity);
      if (i === 0) defaultSymbol = symbol;
      const isMeasured = name.startsWith('Measured');
      representations.push(
        chartType === ChartType.Area ? (
          <Area
            key={i}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[i]}
            opacity={opacity}
            strokeWidth={lineWidth}
            dot={false}
            isAnimationActive={false}
          />
        ) : (
          <Line
            key={i}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[i]}
            strokeDasharray={isMeasured ? '5 5' : ''}
            opacity={
              isMeasured ? opacity / 2 : selectedIndex !== undefined && selectedIndex !== i ? opacity / 4 : opacity
            }
            strokeWidth={lineWidth}
            dot={!isMeasured && symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
            isAnimationActive={false}
          />
        ),
      );
    }
    return representations;
  }, [type, chartType, selectedIndex, curveType, labels, lineCount, lineWidth, symbolCount, symbolSize, legendDataKey]);

  const onMouseDown = () => {};

  // @ts-expect-error ignore
  const onMouseEnterLegend = (o) => {
    setLegendDataKey(o.dataKey);
  };

  const onMouseLeaveLegend = () => {
    setLegendDataKey(null);
  };

  const composedChartLines = useMemo(() => {
    const d = dataSource[0];
    if (!d) return null;
    const a = [];
    for (const p in d) {
      if (p === 'Month' || p === 'Utility') continue;
      a.push(p);
    }
    return (
      <>
        {a.map((k) => (
          <Line key={k} dataKey={k} isAnimationActive={false} />
        ))}
      </>
    );
  }, [dataSource]);

  return (
    <>
      {dataSource && (
        // need two div wrappers to disable the responsiveness of ResponsiveContainer
        <div
          id={'line-graph-' + labelX + '-' + labelY}
          style={{ width: '100%', height: `${height}%`, position: 'relative', direction: 'ltr' }}
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
            <ResponsiveContainer width={'100%'} height={`100%`}>
              {type === GraphDataType.YearlyPvYield && applyElectricityConsumptions ? (
                <ComposedChart
                  data={dataSource}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <Bar dataKey="Utility" fill="#FF6347" barSize={20} isAnimationActive={false} />
                  {chartType === ChartType.Area ? (
                    <Area dataKey="Total" isAnimationActive={false} />
                  ) : (
                    composedChartLines
                  )}
                  <Tooltip formatter={(value: number) => value.toFixed(fractionDigits) + ' ' + unitY} />
                  <CartesianGrid
                    vertical={verticalGridLines}
                    horizontal={horizontalGridLines}
                    stroke={'rgba(128, 128, 128, 0.3)'}
                  />
                  <ReferenceLine x={referenceX} stroke="orange" strokeWidth={2} />
                  <XAxis dataKey={dataKeyAxisX ?? labelX} fontSize={'10px'}>
                    <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                  </XAxis>
                  <YAxis domain={[yMin, yMax]} fontSize={'10px'}>
                    <Label
                      dx={-15}
                      value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                      offset={0}
                      angle={-90}
                      position="center"
                    />
                  </YAxis>
                  {lineCount > 1 && (
                    <Legend
                      iconType="plainline"
                      verticalAlign="top"
                      height={36}
                      onMouseLeave={onMouseLeaveLegend}
                      onMouseEnter={onMouseEnterLegend}
                    />
                  )}
                </ComposedChart>
              ) : chartType === ChartType.Area ? (
                <AreaChart
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
                  <XAxis dataKey={dataKeyAxisX ?? labelX} fontSize={'10px'}>
                    <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                  </XAxis>
                  <YAxis domain={[yMin, yMax]} fontSize={'10px'}>
                    <Label
                      dx={-15}
                      value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                      offset={0}
                      angle={-90}
                      position="center"
                    />
                  </YAxis>
                  {getRepresentations}
                  {lineCount > 1 && (
                    <Legend
                      iconType="plainline"
                      verticalAlign="top"
                      height={36}
                      onMouseLeave={onMouseLeaveLegend}
                      onMouseEnter={onMouseEnterLegend}
                    />
                  )}
                </AreaChart>
              ) : (
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
                  <XAxis dataKey={dataKeyAxisX ?? labelX} fontSize={'10px'}>
                    <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                  </XAxis>
                  <YAxis domain={[yMin, yMax]} fontSize={'10px'}>
                    <Label
                      dx={-15}
                      value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                      offset={0}
                      angle={-90}
                      position="center"
                    />
                  </YAxis>
                  {getRepresentations}
                  {lineCount > 1 && (
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      iconType="plainline"
                      verticalAlign="top"
                      height={36}
                      onMouseLeave={onMouseLeaveLegend}
                      onMouseEnter={onMouseEnterLegend}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
            <LineGraphMenu
              lineCount={lineCount}
              symbolSize={symbolSize}
              lineWidth={lineWidth}
              horizontalGrid={horizontalGridLines}
              verticalGrid={verticalGridLines}
              changeHorizontalGrid={(checked) => {
                setHorizontalGridLines(checked);
              }}
              changeVerticalGrid={(checked) => {
                setVerticalGridLines(checked);
              }}
              changeLineWidth={(value) => {
                setLineWidth(value);
              }}
              changeSymbolSize={(value) => {
                setSymbolSize(value);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LineGraph;
