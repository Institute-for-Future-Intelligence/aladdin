/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState, useMemo, useEffect} from 'react';
import {
    LineChart,
    Label,
    Line,
    Legend,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {createSymbol, SYMBOLS} from "./symbols";
import {PRESET_COLORS} from "../constants";
import {RechartsDatumEntry} from "../types";

export interface LinePlotProps {
    dataSource?: RechartsDatumEntry[];
    height: number;
    labelX?: string,
    labelY?: string,
    unitX?: string;
    unitY?: string;
    selectedDataKey?: string | null;

    [key: string]: any;
}

const LinePlot = ({
                      dataSource,
                      height,
                      labelX,
                      labelY,
                      unitX,
                      unitY,
                      selectedDataKey = null,
                      ...rest
                  }: LinePlotProps) => {

    const [lineCount, setLineCount] = useState<number>(0);
    const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
    const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
    const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
    const [lineWidth, setLineWidth] = useState<number>(2);
    const [symbolCount, setSymbolCount] = useState<number>(25);
    const [symbolSize, setSymbolSize] = useState<number>(1);

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
        const lineArr = [];
        let defaultSymbol;
        for (let i = 0; i < lineCount; i++) {
            const opacity = (selectedDataKey === null && legendDataKey === null) ? 1
                : (selectedDataKey === `T${i + 1}` || legendDataKey === `T${i + 1}` ? 1 : 0.25);
            const symbol = createSymbol(
                SYMBOLS[i],
                symbolSize,
                symbolCount,
                opacity
            );
            if (i === 0) defaultSymbol = symbol;
            lineArr.push(
                <Line
                    key={i}
                    type="monotone"
                    dataKey={i === 0 ? `Low` : 'High'}
                    name={i === 0 ? `Low` : 'High'}
                    stroke={PRESET_COLORS[i]}
                    opacity={opacity}
                    strokeWidth={lineWidth}
                    dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
                    isAnimationActive={false}
                />,
            );
        }
        return lineArr;
    }, [lineCount, lineWidth, symbolCount, symbolSize, legendDataKey, selectedDataKey]);

    let refLineX = 0;

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
                                <ReferenceLine x={refLineX} stroke="orange" strokeWidth={2}/>
                                <XAxis dataKey="Month">
                                    <Label
                                        value={labelX + (unitX ? ' (' + unitX + ')' : '')}
                                        offset={0}
                                        position="bottom"
                                    />
                                </XAxis>
                                <YAxis domain={['dataMin - 5', 'auto']}>
                                    <Label
                                        value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                                        angle={-90}
                                        position="insideLeft"
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
