/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
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
import { createSymbol } from './symbols';
import { PRESET_COLORS } from '../constants';
import { DatumEntry } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';
import { SYMBOLS } from './symbolConstants';

export interface SutBiaxialLineGraphProps {
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

const SutBiaxialLineGraph = React.memo(
  ({
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
  }: SutBiaxialLineGraphProps) => {
    const [lineCount, setLineCount] = useState<number>(0);
    const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
    const horizontalGridLines = true;
    const verticalGridLines = true;
    const lineWidth = 2;
    const symbolSize = 1;

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
    }, [dataSource]);

    const getLines = useMemo(() => {
      const lines = [];
      let defaultSymbol;
      lines.push(
        <Line
          yAxisId="left"
          key={'ambient-temperature'}
          type={curveType}
          name={'T_Ambient'}
          dataKey={'T_Ambient'}
          stroke={PRESET_COLORS[0]}
          strokeDasharray={'5 5'}
          opacity={0.5}
          strokeWidth={lineWidth}
          dot={false}
          isAnimationActive={false}
        />,
      );
      for (let i = 0; i < lineCount; i++) {
        let name = 'T_Tower' + (i + 1);
        let opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
        let symbol = createSymbol(SYMBOLS[2 * i], symbolSize, dataSource.length, symbolCount, opacity);
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
        name = 'V_Tower' + (i + 1);
        opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
        symbol = createSymbol(SYMBOLS[2 * i + 1], symbolSize, dataSource.length, symbolCount, opacity);
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
      return lines;
    }, [curveType, lineCount, lineWidth, symbolCount, symbolSize, legendDataKey]);

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
            id={'biaxial-line-graph-' + labelX + '-' + labelY1 + '-' + labelY2}
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
                  <Tooltip formatter={(value) => Number(value).toFixed(fractionDigits)} />
                  <CartesianGrid
                    vertical={verticalGridLines}
                    horizontal={horizontalGridLines}
                    stroke={'rgba(128, 128, 128, 0.3)'}
                  />
                  <ReferenceLine yAxisId="left" x={referenceX} stroke="orange" strokeWidth={2} />
                  <XAxis dataKey={dataKeyAxisX ?? labelX} fontSize={'10px'}>
                    <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                  </XAxis>
                  <YAxis domain={[yMin1, yMax1]} yAxisId="left" fontSize={'10px'}>
                    <Label
                      dx={-15}
                      value={labelY1 + (unitY1 ? ' (' + unitY1 + ')' : '')}
                      offset={0}
                      angle={-90}
                      position="center"
                    />
                  </YAxis>
                  <YAxis domain={[yMin2, yMax2]} yAxisId="right" orientation={'right'} fontSize={'10px'}>
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
  },
);

export default SutBiaxialLineGraph;
