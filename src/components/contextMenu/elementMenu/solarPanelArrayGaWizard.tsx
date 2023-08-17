/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select, Slider, Tabs } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import {
  DesignProblem,
  EvolutionMethod,
  GeneticAlgorithmSelectionMethod,
  ObjectiveFunctionType,
  ObjectType,
  Orientation,
  RowAxis,
  SearchMethod,
} from '../../../types';
import { showInfo } from '../../../helpers';
import { DefaultSolarPanelArrayLayoutConstraints } from '../../../stores/DefaultSolarPanelArrayLayoutConstraints';
import { Util } from '../../../Util';
import { HALF_PI } from '../../../constants';
import { PolygonModel } from '../../../models/PolygonModel';
import { FoundationModel } from '../../../models/FoundationModel';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';

const { Option } = Select;
const { TabPane } = Tabs;

const SolarPanelArrayGaWizard = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const pvModules = useStore(Selector.pvModules);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const getParent = useStore(Selector.getParent);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const params = useStore(Selector.evolutionaryAlgorithmState).geneticAlgorithmParams;
  const constraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const geneticAlgorithmWizardSelectedTab = useStore(Selector.geneticAlgorithmWizardSelectedTab);
  const economicsParams = useStore(Selector.economicsParams);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);

  const dragRef = useRef<HTMLDivElement | null>(null);
  const objectiveFunctionTypeRef = useRef<ObjectiveFunctionType>(params.objectiveFunctionType);
  const selectionMethodRef = useRef<GeneticAlgorithmSelectionMethod>(params.selectionMethod);
  const searchMethodRef = useRef<SearchMethod>(params.searchMethod);
  const populationSizeRef = useRef<number>(params.populationSize);
  const maximumGenerationsRef = useRef<number>(params.maximumGenerations);
  const mutationRateRef = useRef<number>(params.mutationRate);
  const selectionRateRef = useRef<number>(params.selectionRate ?? 0.5);
  const crossoverRateRef = useRef<number>(params.crossoverRate ?? 0.5);
  const convergenceThresholdRef = useRef<number>(params.convergenceThreshold);
  const localSearchRadiusRef = useRef<number>(params.localSearchRadius);
  const minimumTiltAngleRef = useRef<number>(constraints.minimumTiltAngle ?? -HALF_PI);
  const maximumTiltAngleRef = useRef<number>(constraints.maximumTiltAngle ?? HALF_PI);
  const minimumRowsPerRackRef = useRef<number>(constraints.minimumRowsPerRack);
  const maximumRowsPerRackRef = useRef<number>(constraints.maximumRowsPerRack);
  const minimumInterRowSpacingRef = useRef<number>(constraints.minimumInterRowSpacing);
  const maximumInterRowSpacingRef = useRef<number>(constraints.maximumInterRowSpacing);
  const okButtonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

  const lang = { lng: language };
  const rowAxisRef = useRef<RowAxis>(constraints.rowAxis ?? RowAxis.leftRight);
  const foundation = polygon ? (getParent(polygon) as FoundationModel) : undefined;
  const originalSolarPanels = foundation
    ? (getChildrenOfType(ObjectType.SolarPanel, foundation.id) as SolarPanelModel[])
    : undefined;
  const pvModelNameRef = useRef<string>(
    originalSolarPanels && originalSolarPanels.length > 0
      ? originalSolarPanels[0].pvModelName
      : constraints.pvModelName ?? 'CS6X-355P-FG',
  );
  const orientationRef = useRef<Orientation>(
    originalSolarPanels && originalSolarPanels.length > 0
      ? originalSolarPanels[0].orientation
      : constraints.orientation ?? Orientation.landscape,
  );
  const poleHeightRef = useRef<number>(
    originalSolarPanels && originalSolarPanels.length > 0
      ? originalSolarPanels[0].poleHeight
      : constraints.poleHeight ?? 1,
  );
  const poleSpacingRef = useRef<number>(
    originalSolarPanels && originalSolarPanels.length > 0
      ? originalSolarPanels[0].poleSpacing
      : constraints.poleSpacing ?? 3,
  );
  const marginRef = useRef<number>(constraints.margin ?? 0);
  const electricitySellingPriceRef = useRef<number>(economicsParams.electricitySellingPrice);
  const operationalCostPerUnitRef = useRef<number>(economicsParams.operationalCostPerUnit);

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  // save the values in the common store to persist the user's last settings
  const updateStoreParams = () => {
    setCommonStore((state) => {
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.problem = DesignProblem.SOLAR_PANEL_ARRAY;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.objectiveFunctionType = objectiveFunctionTypeRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.selectionMethod = selectionMethodRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.searchMethod = searchMethodRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.populationSize = populationSizeRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.maximumGenerations = maximumGenerationsRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.selectionRate = selectionRateRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.crossoverRate = crossoverRateRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.mutationRate = mutationRateRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.convergenceThreshold = convergenceThresholdRef.current;
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.localSearchRadius = localSearchRadiusRef.current;
      if (!state.solarPanelArrayLayoutConstraints)
        state.solarPanelArrayLayoutConstraints = new DefaultSolarPanelArrayLayoutConstraints();
      state.solarPanelArrayLayoutConstraints.minimumRowsPerRack = minimumRowsPerRackRef.current;
      state.solarPanelArrayLayoutConstraints.maximumRowsPerRack = maximumRowsPerRackRef.current;
      state.solarPanelArrayLayoutConstraints.minimumTiltAngle = minimumTiltAngleRef.current;
      state.solarPanelArrayLayoutConstraints.maximumTiltAngle = maximumTiltAngleRef.current;
      state.solarPanelArrayLayoutConstraints.minimumInterRowSpacing = minimumInterRowSpacingRef.current;
      state.solarPanelArrayLayoutConstraints.maximumInterRowSpacing = maximumInterRowSpacingRef.current;
      state.solarPanelArrayLayoutConstraints.poleHeight = poleHeightRef.current;
      state.solarPanelArrayLayoutConstraints.poleSpacing = poleSpacingRef.current;
      state.solarPanelArrayLayoutConstraints.pvModelName = pvModelNameRef.current;
      state.solarPanelArrayLayoutConstraints.rowAxis = rowAxisRef.current;
      state.solarPanelArrayLayoutConstraints.orientation = orientationRef.current;
      state.solarPanelArrayLayoutConstraints.margin = marginRef.current;
      state.economicsParams.operationalCostPerUnit = operationalCostPerUnitRef.current;
      state.economicsParams.electricitySellingPrice = electricitySellingPriceRef.current;
    });
  };

  const run = () => {
    if (!runEvolution) {
      showInfo(i18n.t('message.EvolutionStarted', lang));
    }
    updateStoreParams();
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      usePrimitiveStore.setState((state) => {
        state.runEvolution = !state.runEvolution;
      });
      setCommonStore((state) => {
        state.evolutionMethod = EvolutionMethod.GENETIC_ALGORITHM;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Genetic Algorithm for Solar Panel Array Layout',
            timestamp: new Date().getTime(),
          };
        }
      });
    }, 100);
  };

  return (
    <>
      <Modal
        width={640}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('optimizationMenu.SolarPanelArrayLayout', lang) +
              ': ' +
              i18n.t('optimizationMenu.GeneticAlgorithmSettings', lang)}
          </div>
        }
        footer={[
          <Button
            key="Cancel"
            onClick={() => {
              setDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="Run"
            type="primary"
            ref={okButtonRef}
            onClick={() => {
              run();
              setDialogVisible(false);
            }}
          >
            {i18n.t('word.Run', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setDialogVisible(false);
        }}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Tabs
          defaultActiveKey={geneticAlgorithmWizardSelectedTab}
          type="card"
          onChange={(key) => {
            setCommonStore((state) => {
              state.geneticAlgorithmWizardSelectedTab = key;
            });
          }}
        >
          <TabPane tab={i18n.t('optimizationMenu.Parameters', lang)} key="1">
            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.Objective', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  defaultValue={objectiveFunctionTypeRef.current}
                  style={{ width: '100%' }}
                  value={objectiveFunctionTypeRef.current}
                  onChange={(value) => {
                    objectiveFunctionTypeRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  <Option
                    key={ObjectiveFunctionType.DAILY_TOTAL_OUTPUT}
                    value={ObjectiveFunctionType.DAILY_TOTAL_OUTPUT}
                  >
                    {i18n.t('optimizationMenu.ObjectiveFunctionDailyTotalYield', lang)}
                  </Option>
                  <Option
                    key={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT}
                    value={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT}
                  >
                    {i18n.t('optimizationMenu.ObjectiveFunctionYearlyTotalYield', lang)}
                  </Option>
                  <Option
                    key={ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT}
                    value={ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT}
                  >
                    {i18n.t('optimizationMenu.ObjectiveFunctionDailyMeanYield', lang)}
                  </Option>
                  <Option
                    key={ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT}
                    value={ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT}
                  >
                    {i18n.t('optimizationMenu.ObjectiveFunctionYearlyMeanYield', lang)}
                  </Option>
                  <Option key={ObjectiveFunctionType.DAILY_PROFIT} value={ObjectiveFunctionType.DAILY_PROFIT}>
                    {i18n.t('optimizationMenu.ObjectiveFunctionDailyProfit', lang)}
                  </Option>
                  <Option key={ObjectiveFunctionType.YEARLY_PROFIT} value={ObjectiveFunctionType.YEARLY_PROFIT}>
                    {i18n.t('optimizationMenu.ObjectiveFunctionYearlyProfit', lang)}
                  </Option>
                </Select>
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.GeneticAlgorithmSelectionMethod', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  defaultValue={selectionMethodRef.current}
                  style={{ width: '100%' }}
                  value={selectionMethodRef.current}
                  onChange={(value) => {
                    selectionMethodRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  <Option
                    key={GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL}
                    value={GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL}
                  >
                    {i18n.t('optimizationMenu.RouletteWheel', lang)}
                  </Option>
                  <Option
                    key={GeneticAlgorithmSelectionMethod.TOURNAMENT}
                    value={GeneticAlgorithmSelectionMethod.TOURNAMENT}
                  >
                    {i18n.t('optimizationMenu.Tournament', lang)}
                  </Option>
                </Select>
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.PopulationSize', lang) + ' [10, 100]:'}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={10}
                  max={100}
                  style={{ width: '100%' }}
                  precision={0}
                  value={populationSizeRef.current}
                  step={1}
                  formatter={(a) => Number(a).toFixed(0)}
                  onChange={(value) => {
                    populationSizeRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.MaximumGenerations', lang) + ' [5, 100]:'}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={5}
                  max={100}
                  step={1}
                  style={{ width: '100%' }}
                  precision={0}
                  value={maximumGenerationsRef.current}
                  formatter={(a) => Number(a).toFixed(0)}
                  onChange={(value) => {
                    maximumGenerationsRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.SelectionRate', lang) + ' [0, 1]: '}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={0}
                  max={1}
                  style={{ width: '100%' }}
                  precision={2}
                  value={selectionRateRef.current}
                  step={0.01}
                  onChange={(value) => {
                    selectionRateRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.CrossoverRate', lang) + ' [0, 1]: '}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={0}
                  max={1}
                  style={{ width: '100%' }}
                  precision={2}
                  value={crossoverRateRef.current}
                  step={0.01}
                  onChange={(value) => {
                    crossoverRateRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.MutationRate', lang) + ' [0, 1]: '}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={0}
                  max={1}
                  style={{ width: '100%' }}
                  precision={2}
                  value={mutationRateRef.current}
                  step={0.01}
                  onChange={(value) => {
                    mutationRateRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.ConvergenceThreshold', lang) + ' (0, 0.1]: '}
              </Col>
              <Col className="gutter-row" span={12}>
                <InputNumber
                  min={0.001}
                  max={0.1}
                  style={{ width: '100%' }}
                  precision={3}
                  value={convergenceThresholdRef.current}
                  step={0.001}
                  onChange={(value) => {
                    convergenceThresholdRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '4px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.SearchMethod', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  defaultValue={searchMethodRef.current}
                  style={{ width: '100%' }}
                  value={searchMethodRef.current}
                  onChange={(value) => {
                    searchMethodRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  <Option
                    key={SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION}
                    value={SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION}
                  >
                    {i18n.t('optimizationMenu.GlobalSearchUniformSelection', lang)}
                  </Option>
                  <Option
                    key={SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION}
                    value={SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION}
                  >
                    {i18n.t('optimizationMenu.LocalSearchRandomOptimization', lang)}
                  </Option>
                </Select>
              </Col>
            </Row>

            {searchMethodRef.current === SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION && (
              <Row gutter={6} style={{ paddingBottom: '4px' }}>
                <Col className="gutter-row" span={12}>
                  {i18n.t('optimizationMenu.LocalSearchRadius', lang) + ' ([0, 1]: '}
                </Col>
                <Col className="gutter-row" span={12}>
                  <InputNumber
                    min={0}
                    max={1}
                    style={{ width: '100%' }}
                    precision={2}
                    value={localSearchRadiusRef.current}
                    step={0.01}
                    onChange={(value) => {
                      localSearchRadiusRef.current = value;
                      setUpdateFlag(!updateFlag);
                    }}
                  />
                </Col>
              </Row>
            )}
          </TabPane>

          <TabPane tab={i18n.t('optimizationMenu.Variables', lang)} key="2">
            <Row gutter={6}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.TiltAngleRange', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  range
                  onChange={(value) => {
                    minimumTiltAngleRef.current = Util.toRadians(value[0]);
                    maximumTiltAngleRef.current = Util.toRadians(value[1]);
                    setUpdateFlag(!updateFlag);
                  }}
                  min={-90}
                  max={90}
                  defaultValue={[
                    Util.toDegrees(minimumTiltAngleRef.current),
                    Util.toDegrees(maximumTiltAngleRef.current),
                  ]}
                  marks={{
                    '-90': {
                      style: {
                        fontSize: '10px',
                      },
                      label: '-90°',
                    },
                    '-45': {
                      style: {
                        fontSize: '10px',
                      },
                      label: '-45°',
                    },
                    '0': {
                      style: {
                        fontSize: '10px',
                      },
                      label: '0°',
                    },
                    '45': {
                      style: {
                        fontSize: '10px',
                      },
                      label: '45°',
                    },
                    '90': {
                      style: {
                        fontSize: '10px',
                      },
                      label: '90°',
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.RowsPerRackRange', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  range
                  onChange={(value) => {
                    minimumRowsPerRackRef.current = value[0];
                    maximumRowsPerRackRef.current = value[1];
                    setUpdateFlag(!updateFlag);
                  }}
                  min={1}
                  max={9}
                  defaultValue={[minimumRowsPerRackRef.current, maximumRowsPerRackRef.current]}
                  marks={{
                    1: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 1,
                    },
                    2: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 2,
                    },
                    3: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 3,
                    },
                    4: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 4,
                    },
                    5: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 5,
                    },
                    6: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 6,
                    },
                    7: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 7,
                    },
                    8: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 8,
                    },
                    9: {
                      style: {
                        fontSize: '10px',
                      },
                      label: 9,
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6}>
              <Col className="gutter-row" span={12}>
                {i18n.t('optimizationMenu.InterRowSpacingRange', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  range
                  onChange={(value) => {
                    minimumInterRowSpacingRef.current = value[0];
                    maximumInterRowSpacingRef.current = value[1];
                    setUpdateFlag(!updateFlag);
                  }}
                  min={1}
                  max={10}
                  defaultValue={[minimumInterRowSpacingRef.current, maximumInterRowSpacingRef.current]}
                  marks={{
                    1: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '1m',
                    },
                    3: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '3m',
                    },
                    5: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '5m',
                    },
                    7: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '7m',
                    },
                    9: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '9m',
                    },
                  }}
                />
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={i18n.t('optimizationMenu.Constants', lang)} key="3">
            <Row gutter={6} style={{ paddingBottom: '6px', paddingTop: '0px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('polygonMenu.SolarPanelArrayModel', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  defaultValue="Custom"
                  style={{ width: '100%' }}
                  value={pvModelNameRef.current}
                  onChange={(value) => {
                    pvModelNameRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  {Object.keys(pvModules).map((key) => (
                    <Option key={key} value={key}>
                      {key}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '6px', paddingTop: '8px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('polygonMenu.SolarPanelArrayRowAxis', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  style={{ width: '100%' }}
                  value={rowAxisRef.current}
                  onChange={(value) => {
                    rowAxisRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  <Option key={RowAxis.leftRight} value={RowAxis.leftRight}>
                    {i18n.t('polygonMenu.SolarPanelArrayLeftRightRowAxis', lang)}
                  </Option>
                  <Option key={RowAxis.upDown} value={RowAxis.upDown}>
                    {i18n.t('polygonMenu.SolarPanelArrayUpDownRowAxis', lang)}
                  </Option>
                </Select>
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '6px', paddingTop: '8px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('polygonMenu.SolarPanelArrayOrientation', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Select
                  style={{ width: '100%' }}
                  value={orientationRef.current}
                  onChange={(value) => {
                    orientationRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                >
                  <Option key={Orientation.portrait} value={Orientation.portrait}>
                    {i18n.t('solarPanelMenu.Portrait', lang)}
                  </Option>
                  <Option key={Orientation.landscape} value={Orientation.landscape}>
                    {i18n.t('solarPanelMenu.Landscape', lang)}
                  </Option>
                </Select>
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '12px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('polygonMenu.SolarPanelArrayMargin', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  style={{ paddingBottom: 0, paddingTop: 0, marginTop: '16px', marginBottom: '16px' }}
                  onChange={(value) => {
                    marginRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                  min={0}
                  max={5}
                  step={0.1}
                  defaultValue={marginRef.current}
                  marks={{
                    0: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '0m',
                    },
                    1: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '1m',
                    },
                    2: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '2m',
                    },
                    3: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '3m',
                    },
                    4: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '4m',
                    },
                    5: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '5m',
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '12px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('solarCollectorMenu.PoleHeight', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  style={{ paddingBottom: 0, paddingTop: 0, marginTop: '16px', marginBottom: '16px' }}
                  onChange={(value) => {
                    poleHeightRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                  min={0}
                  max={10}
                  step={0.1}
                  defaultValue={poleHeightRef.current}
                  marks={{
                    0: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '0m',
                    },
                    2: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '2m',
                    },
                    4: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '4m',
                    },
                    6: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '6m',
                    },
                    8: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '8m',
                    },
                    10: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '10m',
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '12px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('solarPanelMenu.PoleSpacing', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  style={{ paddingBottom: 0, paddingTop: 0, marginTop: '16px', marginBottom: '16px' }}
                  onChange={(value) => {
                    poleSpacingRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                  min={2}
                  max={10}
                  step={0.1}
                  defaultValue={poleSpacingRef.current}
                  marks={{
                    2: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '2m',
                    },
                    4: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '4m',
                    },
                    6: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '6m',
                    },
                    8: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '8m',
                    },
                    10: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '10m',
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '12px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('economicsPanel.OperationalCostPerUnit', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  style={{ paddingBottom: 0, paddingTop: 0, marginTop: '16px', marginBottom: '16px' }}
                  onChange={(value) => {
                    operationalCostPerUnitRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                  min={0.1}
                  max={1}
                  step={0.01}
                  defaultValue={operationalCostPerUnitRef.current}
                  marks={{
                    0.1: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '10¢',
                    },
                    0.3: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '30¢',
                    },
                    0.5: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '50¢',
                    },
                    0.7: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '70¢',
                    },
                    0.9: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '90¢',
                    },
                  }}
                />
              </Col>
            </Row>

            <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '12px' }}>
              <Col className="gutter-row" span={12}>
                {i18n.t('economicsPanel.ElectricitySellingPrice', lang) + ':'}
              </Col>
              <Col className="gutter-row" span={12}>
                <Slider
                  style={{ paddingBottom: 0, paddingTop: 0, marginTop: '16px', marginBottom: '16px' }}
                  onChange={(value) => {
                    electricitySellingPriceRef.current = value;
                    setUpdateFlag(!updateFlag);
                  }}
                  min={0.1}
                  max={1}
                  step={0.01}
                  defaultValue={electricitySellingPriceRef.current}
                  marks={{
                    0.1: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '10¢',
                    },
                    0.3: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '30¢',
                    },
                    0.5: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '50¢',
                    },
                    0.7: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '70¢',
                    },
                    0.9: {
                      style: {
                        fontSize: '10px',
                      },
                      label: '90¢',
                    },
                  }}
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Modal>
    </>
  );
};

export default React.memo(SolarPanelArrayGaWizard);
