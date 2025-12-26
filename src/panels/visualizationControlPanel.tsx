/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { InputNumber, Space } from 'antd';
import i18n from '../i18n/i18n';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useLanguage } from '../hooks';

const Container = styled.div`
  position: absolute;
  left: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-self: center;
  align-content: center;
  align-items: center;
  padding: 0;
  opacity: 100%;
  user-select: none;
  z-index: 7; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  background: #282c34;
  position: absolute;
  top: 0;
  left: calc(100vw / 2 - 100px);
  align-self: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: 200px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

const VisualizationControlPanel = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const showSiteInfoPanel = useStore(Selector.viewState.showSiteInfoPanel);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);

  const lang = useLanguage();

  return (
    <Container style={{ top: showSiteInfoPanel ? '110px' : '80px' }}>
      <ColumnWrapper
        style={{
          width: showHeatFluxes ? '420px' : '170px',
          left: showHeatFluxes ? 'calc(100vw / 2 - 200px)' : 'calc(100vw / 2 - 80px)',
        }}
      >
        <Space direction={'horizontal'} style={{ color: 'antiquewhite', fontSize: '10px' }}>
          {i18n.t('visualizationControlPanel.ColorContrast', lang) + ':'}
          <InputNumber
            title={i18n.t('visualizationControlPanel.ClickUpOrDownArrowButtonsToChange', lang)}
            min={0.5}
            max={50}
            step={0.5}
            style={{ width: 70 }}
            precision={1}
            value={solarRadiationHeatmapMaxValue ?? 5}
            onChange={(value) => {
              if (value === null) return;
              setCommonStore((state) => {
                state.viewState.solarRadiationHeatMapMaxValue = value;
              });
            }}
          />
          {showHeatFluxes && (
            <>
              {i18n.t('visualizationControlPanel.FluxScale', lang) + ':'}
              <InputNumber
                title={i18n.t('visualizationControlPanel.ClickUpOrDownArrowButtonsToChange', lang)}
                min={1}
                max={50}
                step={1}
                style={{ width: 65 }}
                precision={0}
                value={heatFluxScaleFactor ?? 20}
                onChange={(value) => {
                  if (value === null) return;
                  setCommonStore((state) => {
                    state.viewState.heatFluxScaleFactor = value;
                  });
                }}
              />
              {i18n.t('visualizationControlPanel.FluxWidth', lang) + ':'}
              <InputNumber
                title={i18n.t('visualizationControlPanel.ClickUpOrDownArrowButtonsToChange', lang)}
                min={1}
                max={5}
                step={1}
                style={{ width: 55 }}
                precision={0}
                value={heatFluxWidth ?? 1}
                onChange={(value) => {
                  if (value === null) return;
                  setCommonStore((state) => {
                    state.viewState.heatFluxWidth = value;
                  });
                }}
              />
            </>
          )}
        </Space>
      </ColumnWrapper>
    </Container>
  );
});

export default VisualizationControlPanel;
