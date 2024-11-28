/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Col, Row, Space, Switch, Popover } from 'antd';
import { saveCsv, screenshot, showInfo } from '../helpers';
import {
  CameraOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks';

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
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
  direction: rtl;
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
`;

export interface DailyFresnelReflectorYieldPanelProps {
  city: string | null;
}

const DailyFresnelReflectorYieldPanel = React.memo(({ city }: DailyFresnelReflectorYieldPanelProps) => {
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const countElementsByType = useStore(Selector.countElementsByType);
  const dailyYield = useDataStore(Selector.dailyFresnelReflectorYield);
  const individualOutputs = useStore(Selector.dailyFresnelReflectorIndividualOutputs);
  const panelRect = useStore(Selector.viewState.dailyFresnelReflectorYieldPanelRect);
  const fresnelReflectorLabels = useDataStore(Selector.fresnelReflectorLabels);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const reflectorSumRef = useRef(new Map<string, number>());

  const lang = useLanguage();

  useEffect(() => {
    let s = 0;
    reflectorSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (Object.hasOwn(datum, prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            reflectorSumRef.current.set(prop, (reflectorSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
    // sum does not change when we run a breakdown simulation; so we use updateFlag to trigger re-rendering
    setUpdateFlag(!updateFlag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyYield]);

  useEffect(() => {
    setCurPosition({
      x: Math.max(panelRect?.x, wOffset - window.innerWidth),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.max(panelRect?.x, wOffset - window.innerWidth),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyFresnelReflectorYieldPanelRect) {
                state.viewState.dailyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.dailyFresnelReflectorYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyFresnelReflectorYieldPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      resizeObserverRef.current?.disconnect();
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
      if (!state.viewState.dailyFresnelReflectorYieldPanelRect) {
        state.viewState.dailyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.dailyFresnelReflectorYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyFresnelReflectorYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyFresnelReflectorYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Fresnel Reflector Daily Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const fresnelReflectorCount = countElementsByType(ObjectType.FresnelReflector);
  useEffect(() => {
    if (fresnelReflectorCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyFresnelReflectorIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresnelReflectorCount, individualOutputs]);

  const { t } = useTranslation();
  const labelX = t('word.Hour', lang);
  const labelY = t('fresnelReflectorYieldPanel.YieldPerHour', lang);
  const emptyGraph = dailyYield && dailyYield[0] ? Object.keys(dailyYield[0]).length === 0 : true;

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'dailyFresnelReflectorYieldPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'dailyFresnelReflectorYieldPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 400) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {t('fresnelReflectorYieldPanel.FresnelReflectorDailyYield', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
              </span>
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
              {t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyFresnelReflectorYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dailyYield}
            labels={fresnelReflectorLabels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelX}
            labelY={labelY}
            unitY={t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {individualOutputs && fresnelReflectorCount > 1 && reflectorSumRef.current.size > 0 ? (
                <Popover
                  title={[...reflectorSumRef.current.entries()].map((e, i) => (
                    <React.Fragment key={i}>
                      <Row style={{ textAlign: 'right' }}>
                        <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                          {e[0] + ': '}
                        </Col>
                        <Col span={8}>{e[1].toFixed(3)}</Col>
                      </Row>
                      {i === reflectorSumRef.current.size - 1 && (
                        <>
                          <hr></hr>
                          <div style={{ textAlign: 'right' }}>
                            {t('word.Total', lang) + ': ' + sum.toFixed(3) + ' ' + t('word.kWh', lang)}
                          </div>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                >
                  <Space style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                    {t('shared.OutputBreakdown', lang)}
                  </Space>
                </Popover>
              ) : (
                <Space style={{ cursor: 'default' }}>
                  {t('fresnelReflectorYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {t('word.kWh', lang)}
                </Space>
              )}
              {fresnelReflectorCount > 1 && (
                <Switch
                  title={t('fresnelReflectorYieldPanel.ShowOutputsOfIndividualFresnelReflectors', lang)}
                  checkedChildren={<UnorderedListOutlined />}
                  unCheckedChildren={<UnorderedListOutlined />}
                  checked={individualOutputs}
                  onChange={(checked) => {
                    if (fresnelReflectorCount === 0) {
                      showInfo(t('analysisManager.NoFresnelReflectorForAnalysis', lang));
                      return;
                    }
                    showInfo(t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        if (state.graphState) state.graphState.dailyFresnelReflectorIndividualOutputs = checked;
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Daily Simulation For Fresnel Reflectors: ' + (checked ? 'Individual' : 'Total'),
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.runDailySimulationForFresnelReflectors = true;
                        state.pauseDailySimulationForFresnelReflectors = false;
                        state.simulationInProgress = true;
                      });
                    }, 100);
                  }}
                />
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  if (fresnelReflectorCount === 0) {
                    showInfo(t('analysisManager.NoFresnelReflectorForAnalysis', lang));
                    return;
                  }
                  showInfo(t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Daily Simulation For Fresnel Reflectors',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                    usePrimitiveStore.getState().set((state) => {
                      state.runDailySimulationForFresnelReflectors = true;
                      state.pauseDailySimulationForFresnelReflectors = false;
                      state.simulationInProgress = true;
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<CameraOutlined />}
                title={t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'daily-fresnel-reflector-yield').then(() => {
                    showInfo(t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Daily Fresnel Reflector Yield Graph',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  });
                }}
              />
              {dailyYield && dailyYield.length > 0 && (
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(dailyYield, 'daily-fresnel-yield.csv');
                    showInfo(t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Daily Fresnel Reflector Yield Result as CSV',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  }}
                />
              )}
            </Space>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
});

export default DailyFresnelReflectorYieldPanel;
