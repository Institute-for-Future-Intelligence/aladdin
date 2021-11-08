/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import { GraphDataType, ObjectType } from '../types';
import { MONTHS } from '../constants';
import { Util } from '../Util';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { screenshot } from '../helpers';
import { ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 600px;
  height: 400px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface YearlyPvYieldPanelProps {
  city: string | null;
  individualOutputs: boolean;
  setIndividualOutputs: (b: boolean) => void;
  analyzeYearlyPvYield: () => void;
}

const YearlyPvYieldPanel = ({
  city,
  individualOutputs = false,
  setIndividualOutputs,
  analyzeYearlyPvYield,
}: YearlyPvYieldPanelProps) => {
  const language = useStore((state) => state.language);
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const yearlyYield = useStore((state) => state.yearlyPvYield);
  const solarPanelLabels = useStore((state) => state.solarPanelLabels);
  const countElementsByType = useStore((state) => state.countElementsByType);
  const now = useStore((state) => state.world.date);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.yearlyPvYieldPanelX) ? 0 : Math.max(viewState.yearlyPvYieldPanelX, wOffset - window.innerWidth),
    y: isNaN(viewState.yearlyPvYieldPanelY) ? 0 : Math.min(viewState.yearlyPvYieldPanelY, window.innerHeight - hOffset),
  });
  const [sum, setSum] = useState(0);
  const panelSumRef = useRef(new Map<string, number>());

  const responsiveHeight = 100;
  const referenceX = MONTHS[Math.floor((Util.daysIntoYear(now) / 365) * 12)];
  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    panelSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            panelSumRef.current.set(prop, (panelSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
  }, [yearlyYield]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(viewState.yearlyPvYieldPanelX, wOffset - window.innerWidth),
        y: Math.min(viewState.yearlyPvYieldPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.yearlyPvYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyPvYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyPvYieldPanel = false;
    });
  };

  const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
  useEffect(() => {
    if (solarPanelCount < 2 && individualOutputs) {
      setIndividualOutputs(false);
    }
  }, [solarPanelCount]);

  const labelX = 'Month';
  const labelY = i18n.t('solarPanelYieldPanel.Yield', lang);
  let totalTooltip = '';
  if (individualOutputs) {
    panelSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip += i18n.t('word.Total', lang) + ': ' + sum.toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }

  return (
    <ReactDraggable
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>
              {i18n.t('solarPanelYieldPanel.SolarPanelYearlyYield', lang)}:{i18n.t('sensorPanel.WeatherDataFrom', lang)}{' '}
              {city}
            </span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.YearlyPvYeild}
            dataSource={yearlyYield.map(({ Daylight, Clearness, ...item }) => item)}
            labels={solarPanelLabels}
            height={responsiveHeight}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'natural'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          <Space style={{ alignSelf: 'center' }}>
            {individualOutputs && solarPanelCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('solarPanelYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <Space>
                {i18n.t('solarPanelYieldPanel.YearlyTotal', lang)}:{sum.toFixed(2)} {i18n.t('word.kWh', lang)}
              </Space>
            )}
            {solarPanelCount > 1 && (
              <Switch
                title={i18n.t('solarPanelYieldPanel.ShowOutputsOfIndividualSolarPanels', lang)}
                checkedChildren={<UnorderedListOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={individualOutputs}
                onChange={(checked) => {
                  setIndividualOutputs(checked);
                  analyzeYearlyPvYield();
                }}
              />
            )}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={analyzeYearlyPvYield}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-pv-yield', {});
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyPvYieldPanel);
