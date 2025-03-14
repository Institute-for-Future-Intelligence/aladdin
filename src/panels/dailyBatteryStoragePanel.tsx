/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../stores/selector';
import { useEffect, useRef, useState } from 'react';
import { ChartType, DatumEntry, GraphDataType, ObjectType } from 'src/types';
import { useDailyEnergySorter } from 'src/analysis/energyHooks';
import { useStore } from 'src/stores/common';
import { useLanguage, useWeather } from 'src/hooks';
import { Util } from 'src/Util';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import React from 'react';
import { Rectangle } from 'src/models/Rectangle';
import { styled } from 'styled-components';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from 'src/constants';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { Button, Col, Popover, Row, Space, Switch } from 'antd';
import LineGraph from 'src/components/lineGraph';
import { saveCsv, screenshot, showInfo } from 'src/helpers';
import {
  CameraOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { SolarPanelModel } from 'src/models/SolarPanelModel';

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

interface Props {
  city: string | null;
}

const DailyBatteryStoragePanel = ({ city }: Props) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const now = new Date(useStore(Selector.world.date));
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const individualOutputs = useStore(Selector.dailyBatteryStorageIndividualOutputs);
  const hasSolarPanels = Util.hasSolarPanels(useStore.getState().elements);
  const panelRect = useStore(Selector.viewState.dailyBatteryStorageEnergyPanelRect);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const clearDailySimulationResultsFlag = usePrimitiveStore(Selector.clearDailySimulationResultsFlag);

  const resizeObserverRef = useRef<ResizeObserver>();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.offsetWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.offsetHeight + 100 : panelRect ? panelRect.height + 100 : 500;

  const [graphDataSource, setGraphDataSource] = useState<DatumEntry[] | null>(null);
  const [graphLabels, setGraphLabels] = useState<string[]>();

  const weather = useWeather(city);
  const lang = useLanguage();
  const { t } = useTranslation();
  const { batteryStorageData, batterySurplusEnergyMap } = useDailyEnergySorter(now, weather, hasSolarPanels);

  const getBatteryCountInGraph = (data: DatumEntry[] | null) => {
    if (!data) return 0;
    let count = 0;
    Object.keys(data[0]).forEach((key) => {
      if (key !== 'Hour') {
        count++;
      }
    });
    return count;
  };

  const batteryCountInGraph = getBatteryCountInGraph(batteryStorageData);
  const isIndividual = individualOutputs && batteryCountInGraph > 1;

  useEffect(() => {
    setGraphDataSource(null);
  }, [clearDailySimulationResultsFlag]);

  useEffect(() => {
    if (!batteryStorageData) return;
    if (isIndividual) {
      setGraphDataSource(batteryStorageData);
      setGraphLabels(getLabels(batteryStorageData));
    } else {
      const dataSource: DatumEntry[] = [];
      for (let i = 0; i < 24; i++) {
        let total = 0;
        const hourlyData = batteryStorageData[i];
        Object.keys(hourlyData).forEach((key) => {
          if (key !== 'Hour') {
            total += Number(hourlyData[key]);
          }
        });
        dataSource.push({ Hour: i, Total: total });
      }
      setGraphDataSource(dataSource);
      setGraphLabels(getLabels(dataSource));
    }
  }, [batteryStorageData, isIndividual]);

  const getRemainingBreakdownArray = () => {
    const arr: { key: string; value: number }[] = [];
    batterySurplusEnergyMap.forEach((value, key) => {
      arr.push({ key: key.slice(0, 4), value });
    });
    return arr;
  };

  const getDailyRemaining = () => {
    let total = 0;
    batterySurplusEnergyMap.forEach((value) => {
      total += value;
    });
    return total;
  };

  const getLabels = (data: DatumEntry[]) => {
    const labels: string[] = [];
    Object.keys(data[0]).forEach((key) => {
      if (key !== 'Hour') {
        labels.push(key);
      }
    });
    return labels;
  };

  const getConnectedBatteryCountInScene = () => {
    const idSet = new Set<string>();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).batteryStorageId) {
        idSet.add((e as SolarPanelModel).batteryStorageId!);
      }
    }
    let count = 0;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.BatteryStorage && idSet.has(e.id)) {
        count++;
      }
    }
    return count;
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.dailyBatteryStorageEnergyPanelRect) {
        state.viewState.dailyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.dailyBatteryStorageEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyBatteryStorageEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyBatteryStorageEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Daily Battery Storage Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const toggleIndividualOutputs = (checked: boolean) => {
    setCommonStore((state) => {
      if (state.graphState) state.graphState.dailyBatteryStorageIndividualOutputs = checked;
      if (loggable) {
        state.actionInfo = {
          name: 'Toggle Daily Battery Storage Individual Outputs' + checked,
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCommonStore((state) => {
        if (!state.viewState.dailyBatteryStorageEnergyPanelRect) {
          state.viewState.dailyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
        }
        state.viewState.dailyBatteryStorageEnergyPanelRect.x = Math.max(panelRect?.x, wOffset - window.innerWidth);
        state.viewState.dailyBatteryStorageEnergyPanelRect.y = Math.min(panelRect?.y, window.innerHeight - hOffset);
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyBatteryStorageEnergyPanelRect) {
                state.viewState.dailyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.dailyBatteryStorageEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyBatteryStorageEnergyPanelRect.height = wrapperRef.current.offsetHeight;
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

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);
  const labelX = t('word.Hour', lang);
  const labelY = t('word.Energy', lang);
  const emptyGraph = !graphDataSource;

  const DailyRemaining = getDailyRemaining();

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={panelRect}
      onStop={onDragEnd}
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'dailyBatteryStoragePanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'dailyBatteryStoragePanel' ? Z_INDEX_FRONT_PANEL : 9 }}
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
              {t('batteryStoragePanel.DailyChargeDischargeCurve', lang) + ': '}
              <span style={{ fontSize: '10px' }}>{moment(now).format('MM/DD')}</span>
            </span>
            <span style={{ cursor: 'pointer' }} onTouchStart={() => closePanel()} onMouseDown={() => closePanel()}>
              {t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyBatteryStorageEnergy}
            chartType={isIndividual ? ChartType.Line : ChartType.Area}
            dataSource={graphDataSource ?? []}
            labels={graphLabels}
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
            <>
              <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
                {/* daily total */}
                {isIndividual && graphDataSource ? (
                  <>
                    <Popover
                      title={t('shared.OutputBreakdown', lang)}
                      content={getRemainingBreakdownArray().map(({ key, value }, i, arr) => (
                        <React.Fragment key={i}>
                          <Row style={{ textAlign: 'right' }}>
                            <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                              {key + ': '}
                            </Col>
                            <Col span={8}>{value.toFixed(3)}</Col>
                          </Row>
                          {i === arr.length - 1 && (
                            <>
                              <hr></hr>
                              <div style={{ textAlign: 'right' }}>
                                {t('word.Total', lang) + ': ' + DailyRemaining.toFixed(3) + ' ' + t('word.kWh', lang)}
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
                  </>
                ) : (
                  <>
                    {DailyRemaining > 0 && (
                      <Space style={{ cursor: 'default' }}>
                        {`${t('batteryStoragePanel.DailySurplus', lang)}: ${DailyRemaining.toFixed(3)} ${t(
                          'word.kWh',
                          lang,
                        )}`}
                      </Space>
                    )}
                  </>
                )}

                {/* individual output switch */}
                {batteryCountInGraph > 1 && (
                  <Switch
                    title={t('batteryStoragePanel.ShowResultsOfIndividualBatteryStorages', lang)}
                    checkedChildren={<UnorderedListOutlined />}
                    unCheckedChildren={<UnorderedListOutlined />}
                    checked={isIndividual}
                    onChange={toggleIndividualOutputs}
                  />
                )}

                {/* update button */}
                <Button
                  type="default"
                  icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                  title={t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                  onClick={() => {
                    const connectedBatteryInScene = getConnectedBatteryCountInScene();
                    if (connectedBatteryInScene === 0) {
                      showInfo(t('analysisManager.NoBatteryStorageForAnalysis', lang));
                      return;
                    } else if (connectedBatteryInScene === 1) {
                      useStore.getState().set((state) => {
                        state.graphState.dailyBatteryStorageIndividualOutputs = false;
                      });
                    } else {
                      useStore.getState().set((state) => {
                        state.graphState.dailyBatteryStorageIndividualOutputs = true;
                      });
                    }
                    showInfo(t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Daily Simulation For Battery Storages',
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.simulationInProgress = true;
                        state.runDailySimulationForBatteryStorages = true;
                        state.runDailyThermalSimulation = true;
                      });
                    }, 100);
                  }}
                />

                <Button
                  type="default"
                  icon={<CameraOutlined />}
                  title={t('word.SaveAsImage', lang)}
                  onClick={() => {
                    screenshot('line-graph-' + labelX + '-' + labelY, 'daily-battery-storage-energy').then(() => {
                      showInfo(t('message.ScreenshotSaved', lang));
                      if (loggable) {
                        setCommonStore((state) => {
                          state.actionInfo = {
                            name: 'Take Screenshot of Battery Storage Daily Energy Graph',
                            timestamp: new Date().getTime(),
                          };
                        });
                      }
                    });
                  }}
                />

                {graphDataSource && graphDataSource.length > 0 && (
                  <Button
                    type="default"
                    icon={<SaveOutlined />}
                    title={t('word.SaveAsCsv', lang)}
                    onClick={() => {
                      saveCsv(graphDataSource, 'daily-battery-storage-energy.csv');
                      showInfo(t('message.CsvFileSaved', lang));
                      if (loggable) {
                        setCommonStore((state) => {
                          state.actionInfo = {
                            name: 'Export Battery Storage Daily Energy Result as CSV',
                            timestamp: new Date().getTime(),
                          };
                        });
                      }
                    }}
                  />
                )}
              </Space>
            </>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default DailyBatteryStoragePanel;
