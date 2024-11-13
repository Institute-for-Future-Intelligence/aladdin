/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScaleLinear } from 'd3-scale';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { addRange, updateRanges, updateSelectedProperty } from '../cloudProjectUtil';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { ConfigProvider, InputNumber, Popover, Slider } from 'antd';
import { Range } from '../types';
import { Filter, FilterType } from '../Filter';
import { UndoableChange } from '../undo/UndoableChange';

type VerticalAxisProps = {
  variable: string;
  name: string;
  unit: string;
  yScale: ScaleLinear<number, number>;
  tickLength: number;
  tickIntegers: boolean;
  type: string;
  digits: number;
  min: number;
  max: number;
  step: number;
  value?: number;
  filter?: Filter;
  hover?: (i: number) => void;
};

const DEFAULT_TICK_LENGTH = 5;

const VerticalAxis = React.memo(
  ({
    yScale,
    tickLength,
    tickIntegers,
    variable,
    name,
    unit,
    type,
    digits,
    min,
    max,
    step,
    value,
    filter,
    hover,
  }: VerticalAxisProps) => {
    const setCommonStore = useStore(Selector.set);
    const user = useStore(Selector.user);
    const addUndoable = useStore(Selector.addUndoable);
    const language = useStore(Selector.language);
    const owner = useStore(Selector.projectOwner);
    const projectTitle = useStore(Selector.projectTitle);
    const selectedProperty = useStore(Selector.projectSelectedProperty);
    const loggable = useStore(Selector.loggable);

    const [updateFlag, setUpdateFlag] = useState<boolean>(false);
    const minRef = useRef<number>(min);
    const maxRef = useRef<number>(max);

    useEffect(() => {
      minRef.current = min;
    }, [min]);

    useEffect(() => {
      maxRef.current = max;
    }, [max]);

    const lang = { lng: language };
    const isOwner = user.uid === owner;
    const range = yScale.range();
    const areaHeight = yScale(min) - yScale(max);
    const areaWidth = 40;

    const ticks = useMemo(() => {
      const height = range[0] - range[1];
      const numberOfTicks = type === 'number' ? Math.floor(height / tickLength) : 1;
      const ticks = tickIntegers
        ? yScale.ticks(numberOfTicks).filter((tick) => Number.isInteger(tick))
        : yScale.ticks(numberOfTicks);
      return ticks.map((value) => ({
        value,
        yOffset: yScale(value),
      }));
    }, [yScale, tickLength, type, tickIntegers, range]);

    const localSelect = () => {
      setCommonStore((state) => {
        state.projectState.selectedProperty = state.projectState.selectedProperty !== variable ? variable : null;
        if (loggable) {
          state.actionInfo = {
            name: 'Select Property',
            timestamp: new Date().getTime(),
            details: state.projectState.selectedProperty,
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.updateProjectsFlag = true;
      });
    };

    const select = () => {
      if (isOwner && owner && projectTitle) {
        updateSelectedProperty(owner, projectTitle, selectedProperty !== variable ? variable : null).then(() => {
          localSelect();
        });
      } else {
        localSelect();
      }
    };

    const createLabel = (text: string, width: number) => {
      return <span style={{ display: 'block', width: width + 'px' }}>{text}</span>;
    };

    const createTitle = () => {
      return (
        <text
          onClick={select}
          x={0}
          y={-20}
          style={{
            fontSize: '10px',
            textAnchor: 'middle',
            fill: 'dimgray',
            cursor: 'pointer',
            fontWeight: selectedProperty === variable ? 'bold' : 'normal',
          }}
        >
          {name}
        </text>
      );
    };

    const money = useMemo(() => {
      return (
        variable === 'yearlyProfit' ||
        variable === 'unitCost' ||
        variable === 'sellingPrice' ||
        variable === 'totalYearlyCost'
      );
    }, [variable]);

    const getMin = () => {
      if (
        variable === 'totalYearlyCost' ||
        variable === 'totalYearlyYield' ||
        variable === 'meanYearlyYield' ||
        variable === 'unitCost' ||
        variable === 'poleHeight' ||
        variable === 'interRowSpacing'
      )
        return 0;
      if (variable === 'tiltAngle') return -90;
      if (variable === 'latitude') return -90;
      if (variable === 'rowWidth') return 1;
      return Number.MIN_SAFE_INTEGER;
    };

    const getMax = () => {
      if (variable === 'tiltAngle') return 90;
      if (variable === 'latitude') return 90;
      return Number.MAX_SAFE_INTEGER;
    };

    const setMin = (newValue: number | null) => {
      if (newValue === null) return;
      const oldValue = minRef.current;
      const undoableChange = {
        name: 'Set Minimum: ' + name,
        timestamp: Date.now(),
        oldValue,
        newValue,
        undo: () => {
          setRangeMinimum(oldValue);
        },
        redo: () => {
          setRangeMinimum(newValue);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setRangeMinimum(newValue);
    };

    const setRangeMinimum = (value: number) => {
      setCommonStore((state) => {
        if (state.projectState.ranges) {
          let index = -1;
          let range = null;
          for (const [i, r] of state.projectState.ranges.entries()) {
            if (r.variable === variable) {
              index = i;
              range = r;
              break;
            }
          }
          if (index >= 0 && range) {
            state.projectState.ranges[index] = {
              variable: range.variable,
              minimum: value,
              maximum: range.maximum,
            } as Range;
            if (user.uid && state.projectState.title) {
              updateRanges(user.uid, state.projectState.title, state.projectState.ranges).then(() => {
                // ignore
              });
            }
          } else {
            const r = { variable, minimum: value, maximum: max } as Range;
            state.projectState.ranges.push(r);
            if (user.uid && state.projectState.title) {
              addRange(user.uid, state.projectState.title, r).then(() => {
                // ignore
              });
            }
          }
        } else {
          const r = { variable, minimum: value, maximum: max } as Range;
          state.projectState.ranges = [r];
          if (user.uid && state.projectState.title) {
            addRange(user.uid, state.projectState.title, r).then(() => {
              // ignore
            });
          }
        }
      });
      minRef.current = Number(value);
      setUpdateFlag(!updateFlag);
    };

    const setMax = (newValue: number | null) => {
      if (newValue === null) return;
      const oldValue = maxRef.current;
      const undoableChange = {
        name: 'Set Maximum: ' + name,
        timestamp: Date.now(),
        oldValue,
        newValue,
        undo: () => {
          setRangeMaximum(oldValue);
        },
        redo: () => {
          setRangeMaximum(newValue);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setRangeMaximum(newValue);
    };

    const setRangeMaximum = (value: number) => {
      setCommonStore((state) => {
        if (state.projectState.ranges) {
          let index = -1;
          let range = null;
          for (const [i, r] of state.projectState.ranges.entries()) {
            if (r.variable === variable) {
              index = i;
              range = r;
              break;
            }
          }
          if (index >= 0 && range) {
            state.projectState.ranges[index] = {
              variable: range.variable,
              minimum: range.minimum,
              maximum: value,
            } as Range;
            if (user.uid && state.projectState.title) {
              updateRanges(user.uid, state.projectState.title, state.projectState.ranges);
            }
          } else {
            const r = { variable, minimum: min, maximum: value } as Range;
            state.projectState.ranges.push(r);
            if (user.uid && state.projectState.title) {
              addRange(user.uid, state.projectState.title, r);
            }
          }
        } else {
          const r = { variable, minimum: min, maximum: value } as Range;
          state.projectState.ranges = [r];
          if (user.uid && state.projectState.title) {
            addRange(user.uid, state.projectState.title, r);
          }
        }
      });
      maxRef.current = Number(value);
      setUpdateFlag(!updateFlag);
    };

    return (
      <>
        {/* Title */}
        {variable !== 'orientation' ? (
          <Popover
            content={
              <div>
                <InputNumber
                  style={{ width: '240px' }}
                  addonBefore={createLabel(i18n.t('word.Minimum', lang) + (money ? ' $' : ''), 80)}
                  addonAfter={unit}
                  min={getMin()}
                  max={maxRef.current - step}
                  step={step}
                  value={minRef.current}
                  onPressEnter={(e) => setMin(Number.parseFloat((e.target as HTMLInputElement).value))}
                  onStep={(value) => setMin(value)}
                />
                <br />
                <InputNumber
                  style={{ width: '240px' }}
                  addonBefore={createLabel(i18n.t('word.Maximum', lang) + (money ? ' $' : ''), 80)}
                  addonAfter={unit}
                  min={minRef.current + step}
                  max={getMax()}
                  step={step}
                  value={maxRef.current}
                  onPressEnter={(e) => setMax(Number.parseFloat((e.target as HTMLInputElement).value))}
                  onStep={(value) => setMax(value)}
                />
              </div>
            }
          >
            {createTitle()}
          </Popover>
        ) : (
          <>{createTitle()}</>
        )}
        {value !== undefined && (
          <text
            x={0}
            y={-8}
            style={{
              fontSize: '9px',
              textAnchor: 'middle',
              fill: 'dimgray',
            }}
          >
            {money
              ? value.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: digits,
                }) + (variable === 'yearlyProfit' || variable === 'totalYearlyCost' ? 'K' : '')
              : (variable === 'orientation'
                  ? i18n.t(value === 0 ? 'solarPanelMenu.Landscape' : 'solarPanelMenu.Portrait', lang) +
                    (value === 0 ? ' (▭)' : ' (▯)')
                  : value.toFixed(digits)) + (unit !== '' ? unit : '')}
          </text>
        )}

        {/* filter track */}
        {filter && filter.type === FilterType.Between && (
          <rect
            x={-5}
            y={yScale(filter.upperBound ?? max)}
            width={10}
            height={yScale(filter?.lowerBound ?? min) - yScale(filter?.upperBound ?? max)}
            fill={'lightgray'}
          />
        )}

        <rect
          x={-areaWidth / 2}
          y={0}
          width={areaWidth}
          height={areaHeight}
          fill="gold"
          fillOpacity={selectedProperty === variable ? 0.25 : 0}
        />

        {/* Ticks and labels */}
        {ticks.map(({ value, yOffset }) => (
          <g key={value} transform={`translate(0, ${yOffset})`} shapeRendering={'crispEdges'}>
            <line x1={-DEFAULT_TICK_LENGTH} x2={0} stroke="black" strokeWidth={1} />
            <text
              key={value}
              style={{
                fontSize: '10px',
                textAnchor: 'start',
                alignmentBaseline: 'central',
                transform: 'translateX(-25px)',
              }}
            >
              {variable === 'orientation' ? (value === 0 ? '▭' : '▯') : value}
            </text>
          </g>
        ))}

        {/* Visible vertical line */}
        <line x1={0} x2={0} y1={yScale(min)} y2={yScale(max)} stroke="black" strokeWidth={2} />

        {filter && filter.type === FilterType.Between && (
          <foreignObject x={-areaWidth / 2} y={4} width={areaWidth} height={areaHeight - 3}>
            <ConfigProvider
              theme={{
                components: {
                  Slider: {
                    railBg: 'black',
                    railSize: 0,
                    handleSize: 8,
                  },
                },
              }}
            >
              <Slider
                style={{ marginLeft: areaWidth / 2 + 'px' }}
                min={min}
                max={max}
                step={(max - min) / 100}
                value={[filter.lowerBound ?? min, filter.upperBound ?? max]}
                onChange={(values) => {
                  if (filter) {
                    filter.lowerBound = values[0];
                    filter.upperBound = values[1];
                    if (hover) hover(-1);
                    setCommonStore((state) => {
                      if (state.projectState.filters) {
                        let index = -1;
                        for (const [i, f] of state.projectState.filters.entries()) {
                          if (f.variable === variable) {
                            index = i;
                            break;
                          }
                        }
                        if (index >= 0) {
                          state.projectState.filters[index] = {
                            variable: filter.variable,
                            type: filter.type,
                            lowerBound: filter.lowerBound,
                            upperBound: filter.upperBound,
                          } as Filter;
                        } else {
                          const f = {
                            variable,
                            type: filter.type,
                            lowerBound: filter.lowerBound,
                            upperBound: filter.upperBound,
                          } as Filter;
                          state.projectState.filters.push(f);
                        }
                      }
                    });
                    setUpdateFlag(!updateFlag);
                  }
                }}
                range={true}
                vertical
              />
            </ConfigProvider>
          </foreignObject>
        )}
      </>
    );
  },
);

export default VerticalAxis;
