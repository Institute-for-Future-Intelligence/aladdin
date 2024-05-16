/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Button, Space } from 'antd';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../views/hooks';

const Container = styled.div`
  position: absolute;
  left: calc(100vw / 2 - 50px);
  width: 100px;
  bottom: 6px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  z-index: 10000; // must be larger than that of the spinner so that this can be clicked
`;

const SimulationControlPanel = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const simulationPaused = usePrimitiveStore(Selector.simulationPaused);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);

  const lang = useLanguage();

  const cancel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.runDailyThermalSimulation = false;
      state.runYearlyThermalSimulation = false;
      state.pauseDailyThermalSimulation = false;
      state.pauseYearlyThermalSimulation = false;

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
    });

    setCommonStore((state) => {
      if (loggable) {
        state.actionInfo = {
          name: 'Cancel Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const pause = () => {
    usePrimitiveStore.getState().set((state) => {
      if (state.runDailyThermalSimulation) {
        state.pauseDailyThermalSimulation = true;
      }
      if (state.runYearlyThermalSimulation) {
        state.pauseYearlyThermalSimulation = true;
      }

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
    });

    setCommonStore((state) => {
      if (loggable) {
        state.actionInfo = {
          name: 'Pause Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const resume = () => {
    usePrimitiveStore.getState().set((state) => {
      if (state.runDailyThermalSimulation) {
        state.pauseDailyThermalSimulation = false;
      }
      if (state.runYearlyThermalSimulation) {
        state.pauseYearlyThermalSimulation = false;
      }

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
    });

    setCommonStore((state) => {
      if (loggable) {
        state.actionInfo = {
          name: 'Resume Simulation',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const { t } = useTranslation();

  return (
    <Container style={{ bottom: showDesignInfoPanel ? '42px' : '6px' }}>
      <Space direction={'horizontal'} style={{ color: 'antiquewhite', fontSize: '10px' }}>
        <Button type="primary" onClick={cancel} title={t('message.CancelSimulation', lang)}>
          {t('word.Cancel', lang)}
        </Button>
        {!simulationPaused && (
          <Button type="primary" onClick={pause} title={t('message.PauseSimulation', lang)}>
            {t('word.Pause', lang)}
          </Button>
        )}
        {simulationPaused && (
          <Button type="primary" onClick={resume} title={t('message.ResumeSimulation', lang)}>
            {t('word.Resume', lang)}
          </Button>
        )}
      </Space>
    </Container>
  );
});

export default SimulationControlPanel;
