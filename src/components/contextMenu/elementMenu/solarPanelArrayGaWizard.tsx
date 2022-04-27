/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select, Slider } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import {
  DesignProblem,
  EvolutionMethod,
  GeneticAlgorithmSelectionMethod,
  ObjectiveFunctionType,
  SearchMethod,
} from '../../../types';
import { showInfo } from '../../../helpers';
import { DefaultSolarPanelArrayLayoutConstraints } from '../../../stores/DefaultSolarPanelArrayLayoutConstraints';
import { Util } from '../../../Util';
import { HALF_PI } from '../../../constants';

const { Option } = Select;

const SolarPanelArrayGaWizard = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const runEvolution = useStore(Selector.runEvolution);
  const constraints = useStore(Selector.solarPanelArrayLayoutConstraints);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const params = useStore(Selector.evolutionaryAlgorithmState).geneticAlgorithmParams;
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
      state.evolutionaryAlgorithmState.geneticAlgorithmParams.problem = DesignProblem.SOLAR_PANEL_TILT_ANGLE;
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
    });
  };

  const run = () => {
    if (!runEvolution) {
      showInfo(i18n.t('message.EvolutionStarted', lang));
    }
    updateStoreParams();
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        state.evolutionMethod = EvolutionMethod.GENETIC_ALGORITHM;
        state.evolutionaryAlgorithmState.geneticAlgorithmParams.problem = DesignProblem.SOLAR_PANEL_ARRAY;
        state.runEvolution = !state.runEvolution;
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
            {i18n.t('optimizationMenu.SolarPanelArrayLayout', lang) + ': '}
            {i18n.t('optimizationMenu.GeneticAlgorithmSettings', lang)}
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
              <Option key={ObjectiveFunctionType.DAILY_TOTAL_OUTPUT} value={ObjectiveFunctionType.DAILY_TOTAL_OUTPUT}>
                {i18n.t('optimizationMenu.ObjectiveFunctionDailyTotalOutput', lang)}
              </Option>
              <Option key={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT} value={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT}>
                {i18n.t('optimizationMenu.ObjectiveFunctionYearlyTotalOutput', lang)}
              </Option>
              <Option
                key={ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT}
                value={ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT}
              >
                {i18n.t('optimizationMenu.ObjectiveFunctionDailyAverageOutput', lang)}
              </Option>
              <Option
                key={ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT}
                value={ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT}
              >
                {i18n.t('optimizationMenu.ObjectiveFunctionYearlyAverageOutput', lang)}
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
            {i18n.t('optimizationMenu.PopulationSize', lang) + ':'}
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
            {i18n.t('optimizationMenu.MaximumGenerations', lang) + ':'}
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
              formatter={(a) => Number(a).toFixed(2)}
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
              formatter={(a) => Number(a).toFixed(2)}
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
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => {
                mutationRateRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {i18n.t('optimizationMenu.ConvergenceThreshold', lang) + ' [0, 0.1]: '}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={0.001}
              max={0.1}
              style={{ width: '100%' }}
              precision={3}
              value={convergenceThresholdRef.current}
              step={0.001}
              formatter={(a) => Number(a).toFixed(3)}
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
                formatter={(a) => Number(a).toFixed(2)}
                onChange={(value) => {
                  localSearchRadiusRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>
        )}

        <Row gutter={6} style={{ paddingBottom: '0px' }}>
          <Col className="gutter-row" span={12}>
            {i18n.t('optimizationMenu.TiltAngleRange', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <Slider
              style={{ paddingBottom: 0, paddingTop: 0, marginTop: '10px', marginBottom: '10px' }}
              range
              onChange={(value) => {
                minimumTiltAngleRef.current = Util.toRadians(value[0]);
                maximumTiltAngleRef.current = Util.toRadians(value[1]);
                setUpdateFlag(!updateFlag);
              }}
              min={-90}
              max={90}
              defaultValue={[Util.toDegrees(minimumTiltAngleRef.current), Util.toDegrees(maximumTiltAngleRef.current)]}
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

        <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '6px' }}>
          <Col className="gutter-row" span={12}>
            {i18n.t('optimizationMenu.RowsPerRackRange', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <Slider
              style={{ paddingBottom: 0, paddingTop: 0, marginTop: '10px', marginBottom: '10px' }}
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

        <Row gutter={6} style={{ paddingBottom: '0px', paddingTop: '6px' }}>
          <Col className="gutter-row" span={12}>
            {i18n.t('optimizationMenu.InterRowSpacingRange', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <Slider
              style={{ paddingBottom: 0, paddingTop: 0, marginTop: '10px', marginBottom: '2px' }}
              range
              onChange={(value) => {
                minimumInterRowSpacingRef.current = value[0];
                maximumInterRowSpacingRef.current = value[1];
                setUpdateFlag(!updateFlag);
              }}
              min={2}
              max={10}
              defaultValue={[minimumInterRowSpacingRef.current, maximumInterRowSpacingRef.current]}
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
      </Modal>
    </>
  );
};

// don't wrap this with React.memo as changedRef would be saved
export default SolarPanelArrayGaWizard;
