/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useState} from 'react';
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
import {createSymbol, SYMBOLS} from "./symbols";
import {MONTHS, PRESET_COLORS} from "../constants";
import {GraphType, RechartsDatumEntry} from "../types";
import {useStore} from "../stores/common";
import {Util} from "../util";

export interface LinePlotProps {
    type: GraphType;
    dataSource: RechartsDatumEntry[];
    height: number;
    labelX?: string,
    labelY?: string,
    unitX?: string;
    unitY?: string;

    [key: string]: any;
}

const LinePlot = ({
                      type,
                      dataSource,
                      height,
                      labelX,
                      labelY,
                      unitX,
                      unitY,
                      ...rest
                  }: LinePlotProps) => {

    const [lineCount, setLineCount] = useState<number>(0);
    const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
    const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
    const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
    const [lineWidth, setLineWidth] = useState<number>(2);
    const [symbolCount, setSymbolCount] = useState<number>(25);
    const [symbolSize, setSymbolSize] = useState<number>(1);
    const now = useStore(state => state.date);

    //init
    useEffect(() => {
        if (!dataSource) {
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
                case GraphType.monthlyTemperatures:
                    name = i === 0 ? `Low` : 'High';
                    break;
                case GraphType.sunshineHours:
                    name = 'Sunshine';
                    break;
                case GraphType.hourlyTemperatures:
                    name = 'Temperature';
                    break;
            }
            const opacity = legendDataKey === null ? 1 : (legendDataKey === name ? 1 : 0.25);
            const symbol = createSymbol(
                SYMBOLS[i],
                symbolSize,
                symbolCount,
                opacity
            );
            if (i === 0) defaultSymbol = symbol;
            lines.push(
                <Line
                    key={i}
                    type="monotone"
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
    }, [lineCount, lineWidth, symbolCount, symbolSize, legendDataKey]);

    // @ts-ignore
    const onMouseDown = (e) => {
    };

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
                <div id={'line-plot-' + labelX + '-' + labelY}
                     style={{width: '100%', height: `${height}%`, position: 'relative'}}>
                    <div
                        style={{
                            userSelect: 'none',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0
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
                                }}>
                                <Tooltip formatter={(value: number) => value.toFixed(2) + ' ' + unitY}/>
                                <CartesianGrid
                                    vertical={verticalGridLines}
                                    horizontal={horizontalGridLines}
                                    stroke={"rgba(128, 128, 128, 0.3)"}
                                />
                                <ReferenceLine
                                    x={MONTHS[Math.floor(Util.daysIntoYear(now) / 365 * 12)]}
                                    stroke="orange"
                                    strokeWidth={2}
                                />
                                <XAxis dataKey={labelX}>
                                    <Label
                                        value={labelX + (unitX ? ' (' + unitX + ')' : '')}
                                        offset={0}
                                        position="bottom"
                                    />
                                </XAxis>
                                <YAxis domain={['dataMin - 5', 'auto']}>
                                    <Label
                                        dx={-15}
                                        value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                                        offset={0}
                                        angle={-90}
                                        position="center"
                                    />
                                </YAxis>
                                {getLines}
                                {lineCount > 1 &&
                                <Legend iconType='plainline'
                                        verticalAlign='top'
                                        height={36}
                                        onMouseLeave={onMouseLeaveLegend}
                                        onMouseEnter={onMouseEnterLegend}/>}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
            }
        </>
    );
};

export default LinePlot;
