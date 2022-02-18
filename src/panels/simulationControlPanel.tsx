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
  const language = useStore(Selector.language);
  const simulationPaused = useStore(Selector.simulationPaused);

  const lang = { lng: language };

  const cancel = () => {
    setCommonStore((state) => {
      state.runSimulation = false;
      state.runDailySimulationForFresnelReflectors = false;
      state.runYearlySimulationForFresnelReflectors = false;
      state.pauseDailySimulationForFresnelReflectors = false;
      state.pauseYearlySimulationForFresnelReflectors = false;
    });
  };

  const pause = () => {
    setCommonStore((state) => {
      if (state.runDailySimulationForFresnelReflectors) {
        state.pauseDailySimulationForFresnelReflectors = true;
      }
      if (state.runYearlySimulationForFresnelReflectors) {
        state.pauseYearlySimulationForFresnelReflectors = true;
      }
    });
  };

  const resume = () => {
    setCommonStore((state) => {
      if (state.runDailySimulationForFresnelReflectors) {
        state.pauseDailySimulationForFresnelReflectors = false;
      }
      if (state.runYearlySimulationForFresnelReflectors) {
        state.pauseYearlySimulationForFresnelReflectors = false;
      }
    });
  };

  return (
    <Container>
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
