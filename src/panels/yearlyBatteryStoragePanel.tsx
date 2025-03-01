/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
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
import { FLOATING_WINDOW_OPACITY, MONTHS_ABBV, Z_INDEX_FRONT_PANEL } from 'src/constants';
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

const YearlyBatteryStoragePanel = ({ city }: Props) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const now = new Date(useStore(Selector.world.date));
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const individualOutputs = useStore(Selector.yearlyBatteryStorageIndividualOutputs);
  const hasSolarPanels = Util.hasSolarPanels(useStore.getState().elements);
  const panelRect = useStore(Selector.viewState.yearlyBatteryStorageEnergyPanelRect);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlyThermalSimulation);
  const clearYearlySimulationResultsFlag = usePrimitiveStore(Selector.clearYearlySimulationResultsFlag);

  const resizeObserverRef = useRef<ResizeObserver>();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.offsetWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.offsetHeight + 100 : panelRect ? panelRect.height + 100 : 500;

  const [graphDataSource, setGraphDataSource] = useState<DatumEntry[] | null>(null);
  const [graphLabels, setGraphLabels] = useState<string[]>();

  const world = useStore.getState().world;
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;

  const weather = useWeather(city);
  const lang = useLanguage();
  const { t } = useTranslation();
  const { batteryStorageData } = useDailyEnergySorter(now, weather, hasSolarPanels, true);

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

  const yearlyBatteryStorageDataRef = useRef<DatumEntry[]>([]);

  const startRef = useRef(false);
  const countRef = useRef(0);

  useEffect(() => {
    if (runYearlySimulation) {
      setGraphDataSource(null);
      yearlyBatteryStorageDataRef.current = [];
      countRef.current = 0;
      startRef.current = true;
    }
  }, [runYearlySimulation, clearYearlySimulationResultsFlag]);

  useEffect(() => {
    if (!batteryStorageData || !startRef.current) return;

    const monthlyDataSource: DatumEntry = { Month: MONTHS_ABBV[now.getMonth()] };
    Object.keys(batteryStorageData[0]).forEach((key) => {
      let total = 0;
      if (key !== 'Hour') {
        for (let i = 0; i < 24; i++) {
          total += Number(batteryStorageData[i][key]);
        }
        monthlyDataSource[key] = total * 30;
      }
    });
    yearlyBatteryStorageDataRef.current.push({ ...monthlyDataSource });

    if (isIndividual) {
      setGraphDataSource([...yearlyBatteryStorageDataRef.current]);
    } else {
      setGraphDataSource(getTotalFromIndividual(yearlyBatteryStorageDataRef.current));
    }
    setGraphLabels(getLabels(monthlyDataSource));

    countRef.current++;
    if (countRef.current === (useStore.getState().world.daysPerYear ?? 6)) {
      startRef.current = false;
    }
  }, [batteryStorageData, isIndividual]);

  const getTotalFromIndividual = (data: DatumEntry[]) => {
    const res: DatumEntry[] = [];
    for (let i = 0; i < data.length; i++) {
      let total = 0;
      Object.keys(data[i]).forEach((key) => {
        if (key !== 'Month') {
          total += Number(data[i][key]);
        }
      });
      res.push({ Month: data[i]['Month'], Total: total });
    }
    return res;
  };

  const getTotalBreakdownArray = () => {
    const data = yearlyBatteryStorageDataRef.current;
    const arr: { key: string; total: number }[] = [];
    if (data.length === 0) return arr;

    Object.keys(data[0]).forEach((key) => {
      if (key !== 'Month') {
        let total = 0;
        for (let i = 0; i < data.length; i++) {
          total += Number(data[i][key]);
        }
        arr.push({ key, total: total * monthInterval });
      }
    });
    return arr;
  };

  const getYearlyTotal = () => {
    const data = yearlyBatteryStorageDataRef.current;
    if (data.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      Object.keys(data[i]).forEach((key) => {
        if (key !== 'Month') {
          total += Number(data[i][key]);
        }
      });
    }
    return total * monthInterval;
  };

  const getLabels = (data: DatumEntry) => {
    const labels: string[] = [];
    Object.keys(data).forEach((key) => {
      if (key !== 'Month') {
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
      if (!state.viewState.yearlyBatteryStorageEnergyPanelRect) {
        state.viewState.yearlyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.yearlyBatteryStorageEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyBatteryStorageEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyBatteryStorageEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Yearly Battery Storage Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const toggleIndividualOutputs = (checked: boolean) => {
    setCommonStore((state) => {
      if (state.graphState) state.graphState.yearlyBatteryStorageIndividualOutputs = checked;
      if (loggable) {
        state.actionInfo = {
          name: 'Toggle Yearly Battery Storage Individual Outputs' + checked,
          timestamp: new Date().getTime(),
        };
      }
    });
    if (yearlyBatteryStorageDataRef.current.length > 0) {
      if (checked) {
        setGraphDataSource([...yearlyBatteryStorageDataRef.current]);
      } else {
        setGraphDataSource(getTotalFromIndividual(yearlyBatteryStorageDataRef.current));
      }
    }
  };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCommonStore((state) => {
        if (!state.viewState.yearlyBatteryStorageEnergyPanelRect) {
          state.viewState.yearlyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
        }
        state.viewState.yearlyBatteryStorageEnergyPanelRect.x = Math.max(panelRect?.x, wOffset - window.innerWidth);
        state.viewState.yearlyBatteryStorageEnergyPanelRect.y = Math.min(panelRect?.y, window.innerHeight - hOffset);
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
              if (!state.viewState.yearlyBatteryStorageEnergyPanelRect) {
                state.viewState.yearlyBatteryStorageEnergyPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.yearlyBatteryStorageEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.yearlyBatteryStorageEnergyPanelRect.height = wrapperRef.current.offsetHeight;
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
  const labelX = t('word.Month', lang);
  const labelY = t('word.Energy', lang);
  const emptyGraph = !graphDataSource;

  const yearlyTotal = getYearlyTotal();

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
          state.selectedFloatingWindow = 'monthlyBatteryStoragePanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'monthlyBatteryStoragePanel' ? Z_INDEX_FRONT_PANEL : 9 }}
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
              {t('batteryStoragePanel.YearlyStorage', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
              </span>
            </span>
            <span style={{ cursor: 'pointer' }} onTouchStart={() => closePanel()} onMouseDown={() => closePanel()}>
              {t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.YearlyBatteryStorageEnergy}
            chartType={isIndividual ? ChartType.Line : ChartType.Area}
            dataSource={graphDataSource ?? []}
            labels={graphLabels}
            height={100}
            dataKeyAxisX={'Month'}
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
                {/* yearly total */}
                {isIndividual && graphDataSource ? (
                  <>
                    <Popover
                      title={t('shared.OutputBreakdown', lang)}
                      content={getTotalBreakdownArray().map(({ key, total }, i, arr) => (
                        <React.Fragment key={i}>
                          <Row style={{ textAlign: 'right' }}>
                            <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                              {key + ': '}
                            </Col>
                            <Col span={8}>{total.toFixed(3)}</Col>
                          </Row>
                          {i === arr.length - 1 && (
                            <>
                              <hr></hr>
                              <div style={{ textAlign: 'right' }}>
                                {t('word.Total', lang) + ': ' + yearlyTotal.toFixed(3) + ' ' + t('word.kWh', lang)}
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
                    {yearlyTotal > 0 && (
                      <Space style={{ cursor: 'default' }}>
                        {`${t('word.Total', lang)}: ${yearlyTotal.toFixed(3)} ${t('word.kWh', lang)}`}
                      </Space>
                    )}
                  </>
                )}

                {/* individual output switch */}
                {batteryCountInGraph > 1 && graphDataSource && (
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
                        state.graphState.yearlyBatteryStorageIndividualOutputs = false;
                      });
                    } else {
                      useStore.getState().set((state) => {
                        state.graphState.yearlyBatteryStorageIndividualOutputs = true;
                      });
                    }
                    showInfo(t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Yearly Simulation For Battery Storages',
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.simulationInProgress = true;
                        state.runYearlySimulationForBatteryStorages = true;
                        state.runYearlyThermalSimulation = true;
                      });
                    }, 100);
                  }}
                />

                <Button
                  type="default"
                  icon={<CameraOutlined />}
                  title={t('word.SaveAsImage', lang)}
                  onClick={() => {
                    screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-battery-storage-energy').then(() => {
                      showInfo(t('message.ScreenshotSaved', lang));
                      if (loggable) {
                        setCommonStore((state) => {
                          state.actionInfo = {
                            name: 'Take Screenshot of Battery Storage Yearly Energy Graph',
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
                      saveCsv(graphDataSource, 'yearly-battery-storage-energy.csv');
                      showInfo(t('message.CsvFileSaved', lang));
                      if (loggable) {
                        setCommonStore((state) => {
                          state.actionInfo = {
                            name: 'Export Battery Storage Yearly Energy Result as CSV',
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

export default YearlyBatteryStoragePanel;
