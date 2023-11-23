/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { DesignProblem, EvolutionMethod, ObjectiveFunctionType, SearchMethod } from '../../../types';
import { showInfo } from '../../../helpers';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const SolarPanelTiltAnglePsoWizard = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const params = useStore(Selector.evolutionaryAlgorithmState).particleSwarmOptimizationParams;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const objectiveFunctionTypeRef = useRef<ObjectiveFunctionType>(
    Math.min(params.objectiveFunctionType, ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT),
  );
  const searchMethodRef = useRef<SearchMethod>(params.searchMethod);
  const swarmSizeRef = useRef<number>(params.swarmSize);
  const maximumStepsRef = useRef<number>(params.maximumSteps);
  const vmaxRef = useRef<number>(params.vmax ?? 0.01);
  const inertiaRef = useRef<number>(params.inertia ?? 0.8);
  const cognitiveCoefficientRef = useRef<number>(params.cognitiveCoefficient ?? 0.1);
  const socialCoefficientRef = useRef<number>(params.socialCoefficient ?? 0.1);
  const convergenceThresholdRef = useRef<number>(params.convergenceThreshold);
  const localSearchRadiusRef = useRef<number>(params.localSearchRadius);
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
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem = DesignProblem.SOLAR_PANEL_TILT_ANGLE;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.objectiveFunctionType =
        objectiveFunctionTypeRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.searchMethod = searchMethodRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.swarmSize = swarmSizeRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.maximumSteps = maximumStepsRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.cognitiveCoefficient =
        cognitiveCoefficientRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.socialCoefficient = socialCoefficientRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.vmax = vmaxRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.inertia = inertiaRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.convergenceThreshold =
        convergenceThresholdRef.current;
      state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.localSearchRadius = localSearchRadiusRef.current;
    });
  };

  const run = () => {
    if (!runEvolution) {
      showInfo(t('message.EvolutionStarted', lang));
    }
    updateStoreParams();
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      usePrimitiveStore.getState().set((state) => {
        state.runEvolution = !state.runEvolution;
      });
      setCommonStore((state) => {
        state.evolutionMethod = EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION;
        state.evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem = DesignProblem.SOLAR_PANEL_TILT_ANGLE;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Particle Swarm Optimization for Solar Panel Tilt Angle',
            timestamp: new Date().getTime(),
          };
        }
      });
    }, 100);
  };

  const { t } = useTranslation();

  return (
    <>
      <Modal
        width={640}
        open={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {t('optimizationMenu.SolarPanelTiltAngleOptimization', lang) + ': '}
            {t('optimizationMenu.ParticleSwarmOptimizationSettings', lang)}
          </div>
        }
        footer={[
          <Button
            key="Cancel"
            onClick={() => {
              setDialogVisible(false);
            }}
          >
            {t('word.Cancel', lang)}
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
            {t('word.Run', lang)}
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
            {t('optimizationMenu.Objective', lang) + ':'}
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
                {t('optimizationMenu.ObjectiveFunctionDailyTotalYield', lang)}
              </Option>
              <Option key={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT} value={ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT}>
                {t('optimizationMenu.ObjectiveFunctionYearlyTotalYield', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.SwarmSize', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={10}
              max={100}
              style={{ width: '100%' }}
              precision={0}
              value={swarmSizeRef.current}
              step={1}
              formatter={(a) => Number(a).toFixed(0)}
              onChange={(value) => {
                swarmSizeRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.MaximumSteps', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={5}
              max={100}
              step={1}
              style={{ width: '100%' }}
              precision={0}
              value={maximumStepsRef.current}
              formatter={(a) => Number(a).toFixed(0)}
              onChange={(value) => {
                maximumStepsRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.CognitiveCoefficient', lang) + ' [0, 1]: '}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: '100%' }}
              precision={2}
              value={cognitiveCoefficientRef.current}
              step={0.01}
              onChange={(value) => {
                cognitiveCoefficientRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.SocialCoefficient', lang) + ' [0, 1]: '}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: '100%' }}
              precision={2}
              value={socialCoefficientRef.current}
              step={0.01}
              onChange={(value) => {
                socialCoefficientRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.InertiaWeight', lang) + ' [0, 1]: '}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: '100%' }}
              precision={2}
              value={inertiaRef.current}
              step={0.01}
              onChange={(value) => {
                inertiaRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.MaximumVelocity', lang) + ' [0.001, 0.1]: '}
          </Col>
          <Col className="gutter-row" span={12}>
            <InputNumber
              min={0.001}
              max={0.1}
              style={{ width: '100%' }}
              precision={3}
              value={vmaxRef.current}
              step={0.001}
              onChange={(value) => {
                vmaxRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.ConvergenceThreshold', lang) + ' [0, 0.1]: '}
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
                convergenceThresholdRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={12}>
            {t('optimizationMenu.SearchMethod', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={12}>
            <Select
              defaultValue={searchMethodRef.current}
              style={{ width: '100%' }}
              value={searchMethodRef.current}
              onChange={(value) => {
                searchMethodRef.current = Number(value);
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option
                key={SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION}
                value={SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION}
              >
                {t('optimizationMenu.GlobalSearchUniformSelection', lang)}
              </Option>
              <Option
                key={SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION}
                value={SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION}
              >
                {t('optimizationMenu.LocalSearchRandomOptimization', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        {searchMethodRef.current === SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION && (
          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={12}>
              {t('optimizationMenu.LocalSearchRadius', lang) + ' ([0, 1]: '}
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
                  localSearchRadiusRef.current = Number(value);
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>
        )}
      </Modal>
    </>
  );
};

// don't wrap this with React.memo as changedRef would be saved
export default SolarPanelTiltAnglePsoWizard;
