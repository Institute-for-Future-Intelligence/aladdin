/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { ScaleLinear } from 'd3-scale';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { updateSelectedProperty } from '../cloudProjectUtil';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { InputNumber, Popover } from 'antd';
import { Range } from '../types';

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
  value?: number;
};

const DEFAULT_TICK_LENGTH = 5;

const VerticalAxis = ({
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
  value,
}: VerticalAxisProps) => {
  const setCommonStore = useStore(Selector.set);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const projectInfo = useStore(Selector.projectInfo);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const minRef = useRef<number>(min);
  const maxRef = useRef<number>(max);

  const lang = { lng: language };
  const isOwner = user.uid === projectInfo.owner;
  const range = yScale.range();

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
  }, [yScale, tickLength, type, tickIntegers]);

  const localSelect = () => {
    setCommonStore((state) => {
      state.projectInfo.selectedProperty = state.projectInfo.selectedProperty !== variable ? variable : null;
    });
    usePrimitiveStore.setState((state) => {
      state.updateProjectsFlag = !state.updateProjectsFlag;
    });
  };

  const select = () => {
    if (isOwner && projectInfo.owner && projectInfo.title) {
      updateSelectedProperty(
        projectInfo.owner,
        projectInfo.title,
        projectInfo.selectedProperty !== variable ? variable : null,
      ).then(() => {
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
          fontWeight: projectInfo.selectedProperty === variable ? 'bold' : 'normal',
        }}
      >
        {name}
      </text>
    );
  };

  const money = variable === 'profit' || variable === 'unitCost' || variable === 'sellingPrice';

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
                value={minRef.current}
                onChange={(value) => {
                  minRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
              <br />
              <InputNumber
                style={{ width: '240px' }}
                addonBefore={createLabel(i18n.t('word.Maximum', lang) + (money ? ' $' : ''), 80)}
                addonAfter={unit}
                value={maxRef.current}
                onChange={(value) => {
                  setCommonStore((state) => {
                    if (state.projectInfo.ranges) {
                      let index = -1;
                      let range = null;
                      for (const [i, r] of state.projectInfo.ranges.entries()) {
                        if (r.variable === variable) {
                          index = i;
                          range = r;
                          break;
                        }
                      }
                      if (index >= 0 && range) {
                        state.projectInfo.ranges[index] = {
                          variable: range.variable,
                          minimum: range.minimum,
                          maximum: value,
                        } as Range;
                      } else {
                        state.projectInfo.ranges.push({ variable, minimum: min, maximum: value } as Range);
                      }
                    } else {
                      state.projectInfo.ranges = [{ variable, minimum: min, maximum: value } as Range];
                    }
                  });
                  maxRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
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
                maximumFractionDigits: 3,
              }) + (variable === 'profit' ? 'K' : '')
            : (variable === 'orientation'
                ? i18n.t(value === 0 ? 'solarPanelMenu.Landscape' : 'solarPanelMenu.Portrait', lang) +
                  (value === 0 ? ' (▭)' : ' (▯)')
                : value.toFixed(digits)) + (unit !== '' ? unit : '')}
        </text>
      )}

      {/* Invisible vertical line for interactions */}
      <line
        x1={0}
        x2={0}
        y1={yScale(min)}
        y2={yScale(max)}
        stroke="gold"
        strokeWidth={10}
        onClick={select}
        style={{ cursor: 'pointer' }}
        strokeOpacity={projectInfo.selectedProperty === variable ? 0.5 : 0}
      />
      {/* Visible vertical line */}
      <line x1={0} x2={0} y1={yScale(min)} y2={yScale(max)} stroke="black" strokeWidth={2} />

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
            {name === 'Orientation' ? (value === 0 ? '▭' : '▯') : value}
          </text>
        </g>
      ))}
    </>
  );
};

export default React.memo(VerticalAxis);
