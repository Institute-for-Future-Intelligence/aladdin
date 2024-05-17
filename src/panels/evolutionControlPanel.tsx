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
import { useLanguage } from '../hooks';

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

const EvolutionControlPanel = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const evolutionPaused = usePrimitiveStore(Selector.evolutionPaused);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);

  const { t } = useTranslation();
  const lang = useLanguage();

  const cancel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.runStaticSimulation = false;
      state.pauseSimulation = false;
      state.runEvolution = false;
      state.pauseEvolution = false;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Cancel Evolution',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const pause = () => {
    usePrimitiveStore.getState().set((state) => {
      state.pauseSimulation = true;
      if (state.runEvolution) {
        state.pauseEvolution = true;
      }
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Pause Evolution',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const resume = () => {
    usePrimitiveStore.getState().set((state) => {
      state.pauseSimulation = false;
      if (state.runEvolution) {
        state.pauseEvolution = false;
      }
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Resume Evolution',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  return (
    <Container style={{ bottom: showDesignInfoPanel ? '42px' : '6px' }}>
      <Space direction={'horizontal'} style={{ color: 'antiquewhite', fontSize: '10px' }}>
        <Button type="primary" onClick={cancel} title={t('message.CancelEvolution', lang)}>
          {t('word.Cancel', lang)}
        </Button>
        {!evolutionPaused && (
          <Button type="primary" onClick={pause} title={t('message.PauseEvolution', lang)}>
            {t('word.Pause', lang)}
          </Button>
        )}
        {evolutionPaused && (
          <Button type="primary" onClick={resume} title={t('message.ResumeEvolution', lang)}>
            {t('word.Resume', lang)}
          </Button>
        )}
      </Space>
    </Container>
  );
});

export default EvolutionControlPanel;
