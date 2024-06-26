/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PRESET_COLORS } from '../constants';
import { GraphDataType, DatumEntry } from '../types';
import BarGraphMenu from './barGraphMenu';

export interface BarGraphProps {
  type: GraphDataType;
  dataSource: DatumEntry[];
  height: number;
  dataKeyAxisX?: string;
  labelX?: string;
  labelY?: string;
  unitX?: string;
  unitY?: string;
  yMin?: string | number;
  yMax?: string | number;
  fractionDigits?: number;
  referenceX?: number | string;
  color?: string;
}

const BarGraph = React.memo(
  ({
    type,
    dataSource,
    height,
    dataKeyAxisX,
    labelX,
    labelY,
    unitX,
    unitY,
    yMin = 'auto',
    yMax = 'auto',
    fractionDigits = 2,
    referenceX,
    color,
  }: BarGraphProps) => {
    const [dataSetCount, setDataSetCount] = useState<number>(0);
    const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
    const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
    const [legendDataKey, setLegendDataKey] = useState<string | null>(null);

    //init
    useEffect(() => {
      if (!dataSource || dataSource.length === 0) {
        return;
      }
      const len = Array.isArray(dataSource)
        ? Object.keys(dataSource[0]).length - 1
        : Object.keys(dataSource).length - 1;
      if (dataSetCount !== len) {
        setDataSetCount(len);
      }
    }, [dataSource]);

    const getBars = useMemo(() => {
      const bars = [];
      for (let i = 0; i < dataSetCount; i++) {
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
            name = 'Radiation';
            break;
        }
        const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
        bars.push(
          <Bar
            key={i}
            name={name}
            dataKey={name}
            fill={color ? color : PRESET_COLORS[i]}
            opacity={opacity}
            isAnimationActive={false}
          />,
        );
      }
      return bars;
    }, [dataSetCount, legendDataKey, color, type]);

    const onMouseDown = () => {};

    // @ts-expect-error ignore
    const onMouseEnterLegend = (o) => {
      setLegendDataKey(o.dataKey);
    };

    const onMouseLeaveLegend = () => {
      setLegendDataKey(null);
    };

    return (
      <>
        {dataSource && (
          // need two div wrappers to disable the responsiveness of ResponsiveContainer
          <div
            id={'bar-graph-' + labelX + '-' + labelY}
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
                <BarChart
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
                  {getBars}
                  {dataSetCount > 1 && (
                    <Legend
                      iconType="plainline"
                      verticalAlign="top"
                      height={36}
                      onMouseLeave={onMouseLeaveLegend}
                      onMouseEnter={onMouseEnterLegend}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
              <BarGraphMenu
                horizontalGrid={horizontalGridLines}
                verticalGrid={verticalGridLines}
                changeHorizontalGrid={(checked) => {
                  setHorizontalGridLines(checked);
                }}
                changeVerticalGrid={(checked) => {
                  setVerticalGridLines(checked);
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  },
);

export default BarGraph;
