/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, SolarStructure } from '../types';
import { MONTHS } from '../constants';
import { Util } from '../Util';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 85px;
  right: 36px;
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

export interface YearlySolarUpdraftTowerYieldPanelProps {
  city: string | null;
}

const YearlySolarUpdraftTowerYieldPanel = ({ city }: YearlySolarUpdraftTowerYieldPanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const daysPerYear = useStore(Selector.world.sutDaysPerYear) ?? 6;
  const now = useStore(Selector.world.date);
  const yearlyYield = useStore(Selector.yearlyUpdraftTowerYield);
  const individualOutputs = useStore(Selector.yearlyUpdraftTowerIndividualOutputs);
  const labels = useStore(Selector.updraftTowerLabels);
  const countSolarStructuresByType = useStore(Selector.countSolarStructuresByType);
  const panelX = useStore(Selector.viewState.yearlyUpdraftTowerYieldPanelX);
  const panelY = useStore(Selector.viewState.yearlyUpdraftTowerYieldPanelY);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(panelX) ? 0 : Math.max(panelX, wOffset - window.innerWidth),
    y: isNaN(panelY) ? 0 : Math.min(panelY, window.innerHeight - hOffset),
  });
  const [sum, setSum] = useState(0);
  const towerSumRef = useRef(new Map<string, number>());

  const responsiveHeight = 100;
  const referenceX = MONTHS[Math.floor((Util.daysIntoYear(now) / 365) * 12)];
  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    towerSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            towerSumRef.current.set(prop, (towerSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
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
        x: Math.max(panelX, wOffset - window.innerWidth),
        y: Math.min(panelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.yearlyUpdraftTowerYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyUpdraftTowerYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyUpdraftTowerYieldPanel = false;
    });
  };

  const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
  useEffect(() => {
    if (towerCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        state.yearlyUpdraftTowerIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towerCount]);

  const labelX = i18n.t('word.Month', lang);
  const labelY = i18n.t('updraftTowerYieldPanel.Yield', lang);
  const yearScaleFactor = 12 / daysPerYear;
  let totalTooltip = '';
  towerSumRef.current.forEach(
    (value, key) => (totalTooltip += key + ': ' + (value * yearScaleFactor).toFixed(2) + '\n'),
  );
  totalTooltip += '——————————\n';
  totalTooltip +=
    i18n.t('word.Total', lang) + ': ' + (sum * yearScaleFactor).toFixed(2) + ' ' + i18n.t('word.kWh', lang);

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container ref={nodeRef}>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>
              {i18n.t('updraftTowerYieldPanel.UpdraftTowerYearlyYield', lang)}:{' '}
              {i18n.t('sensorPanel.WeatherDataFrom', lang)}
              {' ' + city}
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
            type={GraphDataType.YearlyUpdraftTowerYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={yearlyYield.map(({ Daylight, Clearness, ...item }) => item)}
            labels={labels}
            height={responsiveHeight}
            dataKeyAxisX={'Month'}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          <Space style={{ alignSelf: 'center' }}>
            {towerCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('updraftTowerYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <Space>
                {i18n.t('updraftTowerYieldPanel.YearlyTotal', lang)}:{(sum * yearScaleFactor).toFixed(2)}{' '}
                {i18n.t('word.kWh', lang)}
              </Space>
            )}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={() => {
                if (towerCount === 0) {
                  showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    state.simulationInProgress = true;
                    state.runYearlySimulationForUpdraftTower = true;
                    state.pauseYearlySimulationForUpdraftTower = false;
                  });
                }, 100);
              }}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-updraft-tower-yield', {}).then(() => {
                  showInfo(i18n.t('message.ScreenshotSaved', lang));
                });
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlySolarUpdraftTowerYieldPanel);
