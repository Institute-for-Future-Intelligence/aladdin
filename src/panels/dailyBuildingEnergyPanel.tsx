/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { BuildingCompletionStatus, DatumEntry, Design, DesignProblem, GraphDataType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Popover, Space } from 'antd';
import { ReloadOutlined, CaretRightOutlined, SaveOutlined, CameraOutlined } from '@ant-design/icons';
import { saveCsv, screenshot, showError, showInfo, showWarning } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDailyEnergySorter } from '../analysis/energyHooks';
import BuildingEnergyGraph from '../components/buildingEnergyGraph';
import { Util } from '../Util';
import { checkBuilding, CheckStatus } from '../analysis/heatTools';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../hooks';
import { createDesign } from 'src/cloudProjectUtil';
import { arrayRemove, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from 'src/firebase';

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

export interface DailyBuildingEnergyPanelProps {
  city: string | null;
}

const DailyBuildingEnergyPanel = React.memo(({ city }: DailyBuildingEnergyPanelProps) => {
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const now = new Date(useStore(Selector.world.date));
  const panelRect = useStore(Selector.viewState.dailyBuildingEnergyPanelRect);
  const flagOfDailySimulation = usePrimitiveStore(Selector.flagOfDailySimulation);
  const runDailySimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);
  const clearDailySimulationResultsFlag = usePrimitiveStore(Selector.clearDailySimulationResultsFlag);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const hasSolarPanels = Util.hasSolarPanels(useStore.getState().elements);
  const setTotalBuildingHeater = useDataStore(Selector.setTotalBuildingHeater);
  const setTotalBuildingAc = useDataStore(Selector.setTotalBuildingAc);
  const setTotalBuildingSolarPanel = useDataStore(Selector.setTotalBuildingSolarPanel);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 460;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [data, setData] = useState<DatumEntry[]>([]);
  const [heaterSum, setHeaterSum] = useState(0);
  const [acSum, setAcSum] = useState(0);
  const [solarPanelSum, setSolarPanelSum] = useState(0);
  const [labels, setLabels] = useState(['Heater', 'AC', 'Net']);
  const [hasBattery, setHasBattery] = useState(false);
  const [showNet, setShowNet] = useState(true);

  const lang = useLanguage();
  const weather = useWeather(city);
  const tooltipHeaterBreakdown = useRef<string[]>([]);
  const tooltipAcBreakdown = useRef<string[]>([]);
  const tooltipSolarPanelBreakdown = useRef<string[]>([]);
  const tooltipSummaryBreakdown = useRef<string[]>([]);
  // const tooltipGridBreakdown = useRef<string[]>([]);
  // const tooltipNetBreakdown = useRef<string[]>([]);

  useEffect(() => {
    if (runDailySimulation) {
      clearResults();
    }
  }, [runDailySimulation]);

  useEffect(() => {
    clearResults();
  }, [clearDailySimulationResultsFlag]);

  const clearResults = () => {
    setData([]);
    setHeaterSum(0);
    setAcSum(0);
    setSolarPanelSum(0);
    setLabels([]);
    setHasBattery(false);
  };

  const { sum, sumHeaterMap, sumAcMap, sumSolarPanelMap, summaryMap, dataLabels } = useDailyEnergySorter(
    now,
    weather,
    hasSolarPanels,
  );

  const updateDesign = async (heating: number, cooling: number, solar: number, net: number) => {
    const userid = useStore.getState().user.uid;
    const projectTitle = useStore.getState().projectState.title;
    const designTitle = useStore.getState().cloudFile;

    if (!designTitle || !userid || !projectTitle) {
      console.log('no design title, userid or projectTitle');
      return;
    }
    const lang = { lng: useStore.getState().language };
    usePrimitiveStore.getState().set((state) => {
      state.waiting = true;
    });

    usePrimitiveStore.getState().setChanged(false);
    try {
      const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
      const documentSnapshot = await getDoc(projectDocRef);
      if (documentSnapshot.exists()) {
        const data_1 = documentSnapshot.data();
        if (data_1) {
          const updatedDesigns: Design[] = [];
          updatedDesigns.push(...data_1.designs);
          // Get the index of the design to be modified by the title
          let index = -1;
          for (const [i, d] of updatedDesigns.entries()) {
            if (d.title === designTitle) {
              index = i;
              break;
            }
          }

          // If found, update the design in the array
          if (index >= 0) {
            // Update design from the current parameters and results and the new thumbnail
            const prompt = updatedDesigns[index].prompt;
            const data = updatedDesigns[index].data;
            updatedDesigns[index] = createDesign(
              DesignProblem.BUILDING_DESIGN,
              designTitle,
              updatedDesigns[index].thumbnail,
            );
            if (prompt && data) {
              updatedDesigns[index].prompt = prompt;
              updatedDesigns[index].data = data;
            }
            // update simulation result
            updatedDesigns[index].heating = heating;
            updatedDesigns[index].cooling = cooling;
            updatedDesigns[index].solar = solar;
            updatedDesigns[index].net = net;
            updatedDesigns[index].modelChanged = false;
            usePrimitiveStore.getState().set((state) => {
              state.modelChanged = false;
            });

            // Finally, upload the updated design array back to Firestore
            try {
              const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);

              await updateDoc(projectDocRef, { designs: updatedDesigns });
            } catch (error) {
              showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
            } finally {
              // Update the cached array in the local storage via the common store
              useStore.getState().set((state_1) => {
                state_1.projectState.designs = updatedDesigns;
              });
              usePrimitiveStore.getState().set((state_2) => {
                state_2.updateProjectsFlag = true;
                state_2.waiting = false;
              });
            }
          }
        }
      }
    } catch (error) {
      showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
    }
  };

  const updateHiddenParameters = async () => {
    const hiddenParameters = useStore.getState().projectState.hiddenParameters;
    let counter = 0;
    hiddenParameters?.forEach((p) => {
      if (p === 'heating' || p === 'cooling' || p === 'solar' || p === 'net') counter++;
    });
    if (counter !== 4) return;

    const userid = useStore.getState().user.uid;

    if (userid && userid === useStore.getState().projectState.owner) {
      const projectTitle = useStore.getState().projectState.title;
      if (projectTitle) {
        const lang = { lng: useStore.getState().language };
        try {
          await updateDoc(doc(firestore, 'users', userid, 'projects', projectTitle), {
            hiddenParameters: arrayRemove('heating', 'cooling', 'solar', 'net'),
          });
        } catch (error) {
          showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
        }

        useStore.getState().set((state) => {
          if (state.projectState.hiddenParameters) {
            state.projectState.hiddenParameters = state.projectState.hiddenParameters.filter(
              (p) => p !== 'heating' && p !== 'cooling' && p !== 'solar' && p !== 'net',
            );
          }
        });
      }
    } else {
      useStore.getState().set((state) => {
        if (state.projectState.hiddenParameters) {
          state.projectState.hiddenParameters = state.projectState.hiddenParameters.filter(
            (p) => p !== 'heating' && p !== 'cooling' && p !== 'solar' && p !== 'net',
          );
        }
      });
    }
  };

  useEffect(() => {
    const hasBattery = sum[0] !== undefined && Object.keys(sum[0]).findIndex((key) => key.includes('Battery')) !== -1;
    const showNet = ![...summaryMap.keys()].find((key: string) => key.slice(0, 4) === 'Grid');
    setHasBattery(hasBattery);
    setShowNet(showNet);
    setData(sum);
    let sumHeater = 0;
    let sumAc = 0;
    let sumSolarPanel = 0;
    const multiple = sumHeaterMap.size > 1;
    if (sumHeaterMap) {
      tooltipHeaterBreakdown.current = [];
      for (const key of sumHeaterMap.keys()) {
        const val = sumHeaterMap.get(key);
        if (val) {
          sumHeater += val;
          if (multiple) {
            tooltipHeaterBreakdown.current.push(key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang));
          }
        }
      }
    }
    if (sumAcMap) {
      tooltipAcBreakdown.current = [];
      for (const key of sumAcMap.keys()) {
        const val = sumAcMap.get(key);
        if (val) {
          sumAc += val;
          if (multiple) {
            tooltipAcBreakdown.current.push(key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang));
          }
        }
      }
    }
    if (sumSolarPanelMap && sumSolarPanelMap.size > 0) {
      tooltipSolarPanelBreakdown.current = [];
      for (const key of sumSolarPanelMap.keys()) {
        const val = sumSolarPanelMap.get(key);
        if (val) {
          sumSolarPanel += val;
          if (multiple) {
            tooltipSolarPanelBreakdown.current.push(key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang));
          }
        }
      }
    }

    if (useStore.getState().designProjectType === DesignProblem.BUILDING_DESIGN) {
      if (sumHeater !== 0 || sumAc !== 0 || sumSolarPanel !== 0) {
        updateDesign(sumHeater, sumAc, sumSolarPanel, sumHeater + sumAc - sumSolarPanel);
        updateHiddenParameters();
      }
    }
    setHeaterSum(sumHeater);
    setAcSum(sumAc);
    setSolarPanelSum(sumSolarPanel);
    // for logger
    setTotalBuildingHeater(sumHeater);
    setTotalBuildingAc(sumAc);
    setTotalBuildingSolarPanel(sumSolarPanel);
    let keysNumber = 3;
    if (hasSolarPanels) keysNumber++;
    if (hasBattery) keysNumber += 2;
    const countBuildings = (Object.keys(sum[0]).length - 1) / keysNumber;
    if (countBuildings > 1) {
      const labels = [];
      let i = 0;
      for (let index = 0; index < countBuildings; index++) {
        // If the data label is not set, we will give it a default label by its index,
        // but some labels may be set, so we have to use an incrementer here.
        if (!dataLabels[index]) i++;
        const id = dataLabels[index] ?? i;
        const l = ['Heater ' + id, 'AC ' + id];
        if (hasSolarPanels) {
          l.push('Solar ' + id);
        }
        if (hasBattery) {
          l.push('Battery ' + id);
          l.push('Grid ' + id);
        }
        l.push('Net ' + id);
        labels.push(...l);
      }
      setLabels(labels);
    } else {
      const labels = ['Heater', 'AC'];
      if (hasSolarPanels) {
        labels.push('Solar');
      }
      if (hasBattery) {
        labels.push('Battery');
        labels.push('Grid');
      }
      labels.push('Net');
      setLabels(labels);
    }
  }, [flagOfDailySimulation]);

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
              if (!state.viewState.dailyBuildingEnergyPanelRect) {
                state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
              }
              state.viewState.dailyBuildingEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyBuildingEnergyPanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.dailyBuildingEnergyPanelRect) {
        state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
      }
      state.viewState.dailyBuildingEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyBuildingEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyBuildingEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Daily Building Energy Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const summarySection = () => {
    if (summaryMap.size === 0) return null;
    else if (summaryMap.size === 1) {
      if (heaterSum !== 0 || acSum !== 0) {
        for (const [key, val] of summaryMap) {
          if (key.slice(0, 3) === 'Net') {
            return (
              <Space style={{ cursor: 'default' }}>
                {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + val.toFixed(1)}
              </Space>
            );
          } else if (key.slice(0, 4) === 'Grid') {
            return (
              <Space style={{ cursor: 'default' }}>
                {i18n.t('buildingEnergyPanel.Grid', lang) + ': ' + val.toFixed(1)}
              </Space>
            );
          }
        }
      }
    } else {
      let isAllNet = true;
      let netSum = 0;
      let isAllGrid = true;
      let gridSum = 0;

      const content: string[] = [];
      for (const [key, val] of summaryMap) {
        if (key.slice(0, 3) === 'Net') {
          if (heaterSum !== 0 || acSum !== 0) {
            netSum += val;
          }
          isAllGrid = false;
        } else if (key.slice(0, 4) === 'Grid') {
          if (heaterSum !== 0 || acSum !== 0) {
            gridSum += val;
          }
          isAllNet = false;
        }
        content.push(key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang));
      }
      content.sort((a, b) => a.localeCompare(b));
      return (
        <Popover
          content={content.map((val, i) => {
            if (isAllNet) return <div key={i}>{val.slice(4)}</div>;
            if (isAllGrid) return <div key={i}>{val.slice(5)}</div>;
            return <div key={i}>{val}</div>;
          })}
        >
          {isAllNet && (
            <Space style={{ cursor: 'default' }}>
              {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + netSum.toFixed(1)}{' '}
            </Space>
          )}
          {isAllGrid && (
            <Space
              style={{
                cursor: 'default',
              }}
            >
              {i18n.t('buildingEnergyPanel.Grid', lang) + ': ' + gridSum.toFixed(1)}
            </Space>
          )}
          {!isAllGrid && !isAllNet && (
            <Space
              style={{
                cursor: 'help',
                border: 'solid black 1px',
                padding: '5px',
                borderColor: 'lightgrey',
                borderRadius: '6px',
              }}
            >
              {i18n.t('buildingEnergyPanel.Summary', lang)}
            </Space>
          )}
        </Popover>
      );
    }
    return null;
  };

  const labelX = i18n.t('word.Hour', lang);
  const labelY = i18n.t('word.Energy', lang);
  const emptyGraph = data && data[0] ? Object.keys(data[0]).length === 0 : true;

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
          state.selectedFloatingWindow = 'dailyBuildingEnergyPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'dailyBuildingEnergyPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 360) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('buildingEnergyPanel.DailyBuildingEnergy', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
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
              {`${i18n.t('word.Close', lang)}`}
            </span>
          </Header>
          <BuildingEnergyGraph
            type={GraphDataType.DailyBuildingEnergy}
            dataSource={data}
            hasSolarPanels={hasSolarPanels}
            hasBattery={hasBattery}
            showNet={showNet}
            labels={labels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {tooltipHeaterBreakdown.current.length === 0 ? (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(1)}
                </Space>
              ) : (
                <Popover
                  content={tooltipHeaterBreakdown.current.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                >
                  <Space style={{ cursor: 'help' }}>
                    {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(1)}
                  </Space>
                </Popover>
              )}
              {tooltipAcBreakdown.current.length === 0 ? (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(1)}
                </Space>
              ) : (
                <Popover
                  content={tooltipAcBreakdown.current.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                >
                  <Space style={{ cursor: 'help' }}>
                    {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(1)}
                  </Space>
                </Popover>
              )}
              {solarPanelSum !== 0 && (
                <>
                  {tooltipSolarPanelBreakdown.current.length === 0 ? (
                    <Space style={{ cursor: 'default' }}>
                      {i18n.t('buildingEnergyPanel.SolarPanel', lang) + ': ' + solarPanelSum.toFixed(1)}
                    </Space>
                  ) : (
                    <Popover
                      content={tooltipSolarPanelBreakdown.current.map((e, i) => (
                        <div key={i}>{e}</div>
                      ))}
                    >
                      <Space style={{ cursor: 'help' }}>
                        {i18n.t('buildingEnergyPanel.SolarPanel', lang) + ': ' + solarPanelSum.toFixed(1)}
                      </Space>
                    </Popover>
                  )}
                </>
              )}
              {summarySection()}

              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={i18n.t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  const elements = useStore.getState().elements;
                  const countElementsByType = useStore.getState().countElementsByType;
                  const getChildrenOfType = useStore.getState().getChildrenOfType;
                  const checkResult = checkBuilding(elements, countElementsByType, getChildrenOfType);
                  if (checkResult.status === CheckStatus.NO_BUILDING) {
                    showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                    return;
                  }
                  if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
                    let errorType;
                    switch (checkResult.buildingCompletion) {
                      case BuildingCompletionStatus.WALL_DISJOINED:
                        errorType = i18n.t('message.WallsAreNotConnected', lang);
                        break;
                      case BuildingCompletionStatus.WALL_EMPTY:
                        errorType = i18n.t('message.BuildingContainsEmptyWall', lang);
                        break;
                      case BuildingCompletionStatus.ROOF_MISSING:
                        errorType = i18n.t('message.BuildingRoofMissing', lang);
                        break;
                      default:
                        errorType = i18n.t('message.UnknownErrors', lang);
                    }
                    showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang) + ': ' + errorType);
                    return;
                  }
                  if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
                    showWarning(i18n.t('message.SimulationWillStartDespiteWarnings', lang));
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    selectNone();
                    usePrimitiveStore.getState().set((state) => {
                      state.runDailyThermalSimulation = true;
                      state.pauseDailyThermalSimulation = false;
                      state.simulationInProgress = true;
                    });
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Daily Building Energy Analysis',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<CameraOutlined />}
                title={i18n.t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'daily-building-energy').then(() => {
                    showInfo(i18n.t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Daily Building Energy Graph',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  });
                }}
              />
              {data && data.length > 0 && (
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={i18n.t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(data, 'daily-building-energy.csv');
                    showInfo(i18n.t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Daily Building Energy Result as CSV',
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

export default DailyBuildingEnergyPanel;
