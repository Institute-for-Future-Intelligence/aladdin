/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Button, Space } from 'antd';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: absolute;
  left: calc(100vw / 2 - 50px);
  width: 100px;
  bottom: 6px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  z-index: 10000; // must be larger than that of the spinner so that this can be clicked
`;

const SimulationControlPanel = () => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const simulationPaused = useStore(Selector.simulationPaused);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);

  const lang = { lng: language };

  const cancel = () => {
    setCommonStore((state) => {
      state.runStaticSimulation = false;
      state.runDynamicSimulation = false;
      state.pauseSimulation = false;

      state.runDailyLightSensor = false;
      state.runYearlyLightSensor = false;
      state.pauseDailyLightSensor = false;
      state.pauseYearlyLightSensor = false;

      state.runDailySimulationForSolarPanels = false;
      state.runYearlySimulationForSolarPanels = false;
      state.pauseDailySimulationForSolarPanels = false;
      state.pauseYearlySimulationForSolarPanels = false;

      state.runDailySimulationForParabolicTroughs = false;
      state.runYearlySimulationForParabolicTroughs = false;
      state.pauseDailySimulationForParabolicTroughs = false;
      state.pauseYearlySimulationForParabolicTroughs = false;

      state.runDailySimulationForParabolicDishes = false;
      state.runYearlySimulationForParabolicDishes = false;
      state.pauseDailySimulationForParabolicDishes = false;
      state.pauseYearlySimulationForParabolicDishes = false;

      state.runDailySimulationForFresnelReflectors = false;
      state.runYearlySimulationForFresnelReflectors = false;
      state.pauseDailySimulationForFresnelReflectors = false;
      state.pauseYearlySimulationForFresnelReflectors = false;

      state.runDailySimulationForHeliostats = false;
      state.runYearlySimulationForHeliostats = false;
      state.pauseDailySimulationForHeliostats = false;
      state.pauseYearlySimulationForHeliostats = false;

      if (loggable) {
        state.actionInfo = {
          name: 'Cancel Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const pause = () => {
    setCommonStore((state) => {
      if (state.runDynamicSimulation) {
        state.pauseSimulation = true;
      }

      if (state.runDailyLightSensor) {
        state.pauseDailyLightSensor = true;
      }
      if (state.runYearlyLightSensor) {
        state.pauseYearlyLightSensor = true;
      }

      if (state.runDailySimulationForSolarPanels) {
        state.pauseDailySimulationForSolarPanels = true;
      }
      if (state.runYearlySimulationForSolarPanels) {
        state.pauseYearlySimulationForSolarPanels = true;
      }

      if (state.runDailySimulationForParabolicTroughs) {
        state.pauseDailySimulationForParabolicTroughs = true;
      }
      if (state.runYearlySimulationForParabolicTroughs) {
        state.pauseYearlySimulationForParabolicTroughs = true;
      }

      if (state.runDailySimulationForParabolicDishes) {
        state.pauseDailySimulationForParabolicDishes = true;
      }
      if (state.runYearlySimulationForParabolicDishes) {
        state.pauseYearlySimulationForParabolicDishes = true;
      }

      if (state.runDailySimulationForFresnelReflectors) {
        state.pauseDailySimulationForFresnelReflectors = true;
      }
      if (state.runYearlySimulationForFresnelReflectors) {
        state.pauseYearlySimulationForFresnelReflectors = true;
      }

      if (state.runDailySimulationForHeliostats) {
        state.pauseDailySimulationForHeliostats = true;
      }
      if (state.runYearlySimulationForHeliostats) {
        state.pauseYearlySimulationForHeliostats = true;
      }

      if (loggable) {
        state.actionInfo = {
          name: 'Pause Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const resume = () => {
    setCommonStore((state) => {
      if (state.runDynamicSimulation) {
        state.pauseSimulation = false;
      }

      if (state.runDailyLightSensor) {
        state.pauseDailyLightSensor = false;
      }
      if (state.runYearlyLightSensor) {
        state.pauseYearlyLightSensor = false;
      }

      if (state.runDailySimulationForSolarPanels) {
        state.pauseDailySimulationForSolarPanels = false;
      }
      if (state.runYearlySimulationForSolarPanels) {
        state.pauseYearlySimulationForSolarPanels = false;
      }

      if (state.runDailySimulationForParabolicTroughs) {
        state.pauseDailySimulationForParabolicTroughs = false;
      }
      if (state.runYearlySimulationForParabolicTroughs) {
        state.pauseYearlySimulationForParabolicTroughs = false;
      }

      if (state.runDailySimulationForParabolicDishes) {
        state.pauseDailySimulationForParabolicDishes = false;
      }
      if (state.runYearlySimulationForParabolicDishes) {
        state.pauseYearlySimulationForParabolicDishes = false;
      }

      if (state.runDailySimulationForFresnelReflectors) {
        state.pauseDailySimulationForFresnelReflectors = false;
      }
      if (state.runYearlySimulationForFresnelReflectors) {
        state.pauseYearlySimulationForFresnelReflectors = false;
      }

      if (state.runDailySimulationForHeliostats) {
        state.pauseDailySimulationForHeliostats = false;
      }
      if (state.runYearlySimulationForHeliostats) {
        state.pauseYearlySimulationForHeliostats = false;
      }

      if (loggable) {
        state.actionInfo = {
          name: 'Resume Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  return (
    <Container style={{ bottom: showDesignInfoPanel ? '42px' : '6px' }}>
      <Space direction={'horizontal'} style={{ color: 'antiquewhite', fontSize: '10px' }}>
        <Button type="primary" onClick={cancel} title={i18n.t('message.CancelSimulation', lang)}>
          {i18n.t('word.Cancel', lang)}
        </Button>
        {!simulationPaused && (
          <Button type="primary" onClick={pause} title={i18n.t('message.PauseSimulation', lang)}>
            {i18n.t('word.Pause', lang)}
          </Button>
        )}
        {simulationPaused && (
          <Button type="primary" onClick={resume} title={i18n.t('message.ResumeSimulation', lang)}>
            {i18n.t('word.Resume', lang)}
          </Button>
        )}
      </Space>
    </Container>
  );
};

export default React.memo(SimulationControlPanel);
