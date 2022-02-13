/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { InputNumber, Space } from 'antd';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: absolute;
  top: 110px;
  left: 0;
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
  z-index: 8; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  background: #282c34;
  position: absolute;
  top: 0;
  left: calc(100vw / 2 - 100px);
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: 200px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

const HeatmapControlPanel = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);

  const lang = { lng: language };

  return (
    <Container>
      <ColumnWrapper>
        <Space direction={'horizontal'} style={{ color: 'antiquewhite', fontSize: '10px' }}>
          {i18n.t('heatmapControlPanel.ColorContrast', lang) + ':'}
          <InputNumber
            title={i18n.t('heatmapControlPanel.ClickUpOrDownArrowButtonsToChange', lang)}
            min={0.5}
            max={50}
            step={0.5}
            style={{ width: 72 }}
            precision={1}
            value={solarRadiationHeatmapMaxValue ?? 5}
            formatter={(a) => Number(a).toFixed(1)}
            onChange={(value) => {
              setCommonStore((state) => {
                state.viewState.solarRadiationHeatMapMaxValue = value;
              });
            }}
          />
        </Space>
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(HeatmapControlPanel);
