/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createSymbol, SYMBOLS } from './symbols';
import { DatumEntry, GraphDataType } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';
import BuildingEnergyGraphMenu from './buildingEnergyGraphMenu';
import { PRESET_COLORS } from '../constants';

export interface BuildingEnergyGraphProps {
  type: GraphDataType;
  hasSolarPanels: boolean;
  dataSource: DatumEntry[];
  labels: string[];
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

const BuildingEnergyGraph = ({
  type,
  dataSource,
  hasSolarPanels,
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
}: BuildingEnergyGraphProps) => {
  const [buildingCount, setBuildingCount] = useState<number>(0);
  const [buildingId, setBuildingId] = useState<string | undefined>();
  const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
  const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
  const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [symbolSize, setSymbolSize] = useState<number>(1);
  const [barCategoryGap, setBarCategoryGap] = useState<number>(2);

  //init
  useEffect(() => {
    if (!dataSource || dataSource.length === 0) {
      return;
    }
    // there are four lines for each dataset [Heater, AC, Solar, Net] when there are solar panels
    const n = hasSolarPanels ? 4 : 3;
    const len =
      (Array.isArray(dataSource) ? Object.keys(dataSource[0]).length - 1 : Object.keys(dataSource).length - 1) / n;
    if (buildingCount !== len) {
      setBuildingCount(len);
    }
    if (len === 1) {
      if (dataSource[0]) {
        for (const k in dataSource[0]) {
          if (k.startsWith('Heater')) {
            setBuildingId(k.length > 6 ? k.substring(6).trim() : undefined);
            break;
          }
        }
      }
    }
  }, [dataSource]);

  const getRepresentations = useMemo(() => {
    const representations = [];
    const n = hasSolarPanels ? 4 : 3;
    let defaultSymbol;
    const barStrokeColor = 'gray';
    const barStrokeWidth = 1;
    for (let i = 0; i < buildingCount; i++) {
      let name = buildingCount > 1 ? labels[i * n] : buildingId ? 'Heater ' + buildingId : 'Heater';
      representations.push(
        <Bar
          key={i * n}
          name={name}
          dataKey={name}
          stroke={barStrokeColor}
          fill={'#FA8072'}
          opacity={legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25}
          strokeWidth={barStrokeWidth}
          isAnimationActive={false}
          stackId={'stack' + i}
        />,
      );
      name = buildingCount > 1 ? labels[i * n + 1] : buildingId ? 'AC ' + buildingId : 'AC';
      representations.push(
        <Bar
          key={i * n + 1}
          name={name}
          dataKey={name}
          stroke={barStrokeColor}
          fill={'#00BFFF'}
          opacity={legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25}
          strokeWidth={barStrokeWidth}
          isAnimationActive={false}
          stackId={'stack' + i}
        />,
      );
      if (hasSolarPanels) {
        name = buildingCount > 1 ? labels[i * n + 2] : buildingId ? 'Solar ' + buildingId : 'Solar';
        representations.push(
          <Bar
            key={i * n + 2}
            name={name}
            dataKey={name}
            stroke={barStrokeColor}
            fill={'#3CB371'}
            opacity={legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25}
            strokeWidth={barStrokeWidth}
            isAnimationActive={false}
            stackId={'stack' + i}
          />,
        );
      }
    }
    const m = n - 1;
    for (let i = 0; i < buildingCount; i++) {
      let name = buildingCount > 1 ? labels[i * n + m] : buildingId ? 'Net' + buildingId : 'Net';
      const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
      const symbol = createSymbol(SYMBOLS[i], symbolSize, symbolCount, opacity);
      if (i === 0) defaultSymbol = symbol;
      representations.push(
        <Line
          key={i * n + m}
          type={curveType}
          name={name}
          dataKey={name}
          stroke={PRESET_COLORS[i]}
          opacity={legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25}
          strokeWidth={lineWidth}
          dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
          isAnimationActive={false}
        />,
      );
    }
    return representations;
  }, [type, curveType, labels, buildingCount, buildingId, lineWidth, symbolCount, symbolSize, legendDataKey]);

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
              <ComposedChart
                data={dataSource}
                stackOffset={'sign'}
                barGap={0}
                barCategoryGap={barCategoryGap}
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
                <ReferenceLine y={0} stroke="#888" />
                {buildingCount > 0 && (
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="plainline"
                    verticalAlign="top"
                    height={36}
                    onMouseLeave={onMouseLeaveLegend}
                    onMouseEnter={onMouseEnterLegend}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            <BuildingEnergyGraphMenu
              symbolSize={symbolSize}
              lineWidth={lineWidth}
              barCategoryGap={barCategoryGap}
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
              changeBarCategoryGap={(value) => {
                setBarCategoryGap(value);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BuildingEnergyGraph;
