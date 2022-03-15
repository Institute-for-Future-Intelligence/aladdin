/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, SolarStructure } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
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

export interface DailySolarUpdraftTowerYieldPanelProps {
  city: string | null;
}

const DailySolarUpdraftTowerYieldPanel = ({ city }: DailySolarUpdraftTowerYieldPanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const countSolarStructuresByType = useStore(Selector.countSolarStructuresByType);
  const dailyYield = useStore(Selector.dailyUpdraftTowerYield);
  const individualOutputs = useStore(Selector.dailyUpdraftTowerIndividualOutputs);
  const panelX = useStore(Selector.viewState.dailyUpdraftTowerYieldPanelX);
  const panelY = useStore(Selector.viewState.dailyUpdraftTowerYieldPanelY);
  const updraftTowerLabels = useStore(Selector.updraftTowerLabels);

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
  const updraftTowerSumRef = useRef(new Map<string, number>());

  const lang = { lng: language };
  const responsiveHeight = 100;

  useEffect(() => {
    let s = 0;
    updraftTowerSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            updraftTowerSumRef.current.set(prop, (updraftTowerSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyYield]);

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
      state.viewState.dailyUpdraftTowerYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyUpdraftTowerYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyUpdraftTowerYieldPanel = false;
    });
  };

  const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
  useEffect(() => {
    if (towerCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        state.dailyUpdraftTowerIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towerCount]);

  const labelX = 'Hour';
  const labelY = i18n.t('updraftTowerYieldPanel.YieldPerHour', lang);
  let totalTooltip = '';
  if (individualOutputs) {
    updraftTowerSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip += i18n.t('word.Total', lang) + ': ' + sum.toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }

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
              {i18n.t('updraftTowerYieldPanel.UpdraftTowerDailyYield', lang)}:{' '}
              {i18n.t('sensorPanel.WeatherDataFrom', lang)}
              {' ' + city} | {moment(now).format('MM/DD')}
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
            type={GraphDataType.DailyUpdraftTowerYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dailyYield}
            labels={updraftTowerLabels}
            height={responsiveHeight}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center' }}>
            {individualOutputs && towerCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('updraftTowerYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <Space style={{ cursor: 'default' }}>
                {i18n.t('updraftTowerYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {i18n.t('word.kWh', lang)}
              </Space>
            )}
            {towerCount > 1 && (
              <Switch
                title={i18n.t('updraftTowerYieldPanel.ShowOutputsOfIndividualUpdraftTowers', lang)}
                checkedChildren={<UnorderedListOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={individualOutputs}
                onChange={(checked) => {
                  if (towerCount === 0) {
                    showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                    return;
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      state.runDailySimulationForUpdraftTower = true;
                      state.pauseDailySimulationForUpdraftTower = false;
                      state.simulationInProgress = true;
                      state.dailyUpdraftTowerIndividualOutputs = checked;
                    });
                  }, 100);
                }}
              />
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
                    state.runDailySimulationForUpdraftTower = true;
                    state.pauseDailySimulationForUpdraftTower = false;
                    state.simulationInProgress = true;
                  });
                }, 100);
              }}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-Updraft-tower-yield', {}).then(() => {
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

export default React.memo(DailySolarUpdraftTowerYieldPanel);
