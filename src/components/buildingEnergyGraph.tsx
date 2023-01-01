/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
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
import { ChartType, DatumEntry, GraphDataType } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';
import LineGraphMenu from './lineGraphMenu';

export interface BuildinEnergyGraphProps {
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

const BuildinEnergyGraph = ({
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
}: BuildinEnergyGraphProps) => {
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
  }, [lineCount, dataSource]);

  const getRepresentations = useMemo(() => {
    const representations = [];
    let defaultSymbol;
    for (let i = 0; i < lineCount; i++) {
      let name = '';
      switch (type) {
        case GraphDataType.DailyBuildingEnergy:
        case GraphDataType.YearlyBuildingEnergy:
          name = labels && labels[i] ? labels[i] : 'Energy' + (i + 1);
          break;
      }
      const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
      const symbol = createSymbol(SYMBOLS[i], symbolSize, symbolCount, opacity);
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
            <ResponsiveContainer width="100%" height={`100%`}>
              {chartType === ChartType.Area ? (
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

export default BuildinEnergyGraph;
