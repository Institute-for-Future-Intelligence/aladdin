/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
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
import { DatumEntry, GraphDataType } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';

export interface BiaxialLineGraphProps {
  type1: GraphDataType;
  type2: GraphDataType;
  dataSource: DatumEntry[];
  height: number;
  dataKeyAxisX?: string;
  labelX?: string;
  labelY1?: string;
  labelY2?: string;
  unitX?: string;
  unitY1?: string;
  unitY2?: string;
  yMin1?: string | number;
  yMax1?: string | number;
  yMin2?: string | number;
  yMax2?: string | number;
  curveType?: CurveType;
  referenceX?: number | string;
  fractionDigits?: number;
  symbolCount?: number;
}

const BiaxialLineGraph = ({
  type1,
  type2,
  dataSource,
  height,
  dataKeyAxisX,
  labelX,
  labelY1,
  labelY2,
  unitX,
  unitY1,
  unitY2,
  yMin1 = 'auto',
  yMax1 = 'auto',
  yMin2 = 'auto',
  yMax2 = 'auto',
  curveType = 'linear',
  referenceX,
  fractionDigits = 2,
  symbolCount = 12,
}: BiaxialLineGraphProps) => {
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
    let len = Array.isArray(dataSource) ? Object.keys(dataSource[0]).length - 1 : Object.keys(dataSource).length - 1;
    len--; // subtract one because the first one is the ambient temperature, which is shared among SUTs
    if (lineCount !== len / 2) {
      setLineCount(len / 2);
    }
  }, [lineCount, dataSource]);

  const getLines = useMemo(() => {
    const lines = [];
    let defaultSymbol;
    lines.push(
      <Line
        yAxisId="left"
        key={'ambient-temperature'}
        type={curveType}
        name={'Ambient Temperature'}
        dataKey={'Ambient Temperature'}
        stroke={PRESET_COLORS[0]}
        strokeDasharray={'5 5'}
        opacity={0.5}
        strokeWidth={lineWidth}
        dot={false}
        isAnimationActive={false}
      />,
    );
    for (let i = 0; i < lineCount; i++) {
      let name = '';
      switch (type1) {
        case GraphDataType.DailyUpdraftTowerAirTemperature:
          name = 'Temperature Tower' + (i + 1);
          break;
      }
      const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
      if (name !== '') {
        const symbol = createSymbol(SYMBOLS[2 * i], symbolSize, symbolCount, opacity);
        if (i === 0) defaultSymbol = symbol;
        const isMeasured = name.startsWith('Measured');
        lines.push(
          <Line
            yAxisId="left"
            key={'left-' + i}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[2 * i]}
            strokeDasharray={isMeasured ? '5 5' : ''}
            opacity={isMeasured ? opacity / 2 : opacity}
            strokeWidth={lineWidth}
            dot={!isMeasured && symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
            isAnimationActive={false}
          />,
        );
      }
      name = '';
      switch (type2) {
        case GraphDataType.DailyUpdraftTowerWindSpeed:
          name = 'Wind Speed Tower' + (i + 1);
          break;
      }
      if (name !== '') {
        const symbol = createSymbol(SYMBOLS[2 * i + 1], symbolSize, symbolCount, opacity);
        lines.push(
          <Line
            yAxisId="right"
            key={'right-' + i}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[2 * i + 1]}
            opacity={opacity}
            strokeWidth={lineWidth}
            dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
            isAnimationActive={false}
          />,
        );
      }
    }
    return lines;
  }, [type1, curveType, lineCount, lineWidth, symbolCount, symbolSize, legendDataKey]);

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
          id={'biaxial-line-graph-' + labelX + '-' + labelY1 + '-' + labelY2}
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
                <Tooltip formatter={(value: number) => value.toFixed(fractionDigits)} />
                <CartesianGrid
                  vertical={verticalGridLines}
                  horizontal={horizontalGridLines}
                  stroke={'rgba(128, 128, 128, 0.3)'}
                />
                <ReferenceLine yAxisId="left" x={referenceX} stroke="orange" strokeWidth={2} />
                <XAxis dataKey={dataKeyAxisX ?? labelX}>
                  <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                </XAxis>
                <YAxis domain={[yMin1, yMax1]} yAxisId="left">
                  <Label
                    dx={-15}
                    value={labelY1 + (unitY1 ? ' (' + unitY1 + ')' : '')}
                    offset={0}
                    angle={-90}
                    position="center"
                  />
                </YAxis>
                <YAxis domain={[yMin2, yMax2]} yAxisId="right" orientation={'right'}>
                  <Label
                    dx={15}
                    value={labelY2 + (unitY2 ? ' (' + unitY2 + ')' : '')}
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

export default BiaxialLineGraph;
