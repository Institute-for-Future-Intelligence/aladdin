/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSolarPanel } from '@fortawesome/free-solid-svg-icons';
import { Space } from 'antd';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: absolute;
  bottom: 40px;
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
  left: calc(100vw / 2 - 50px);
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: 100px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

export interface DesignInfoPanelProps {}

const DesignInfoPanel = ({}: DesignInfoPanelProps) => {
  const language = useStore(Selector.language);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const countAllSolarPanels = useStore(Selector.countAllSolarPanels);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const daytime = sunlightDirection.y > 0;
  const lang = { lng: language };

  useEffect(() => {}, []);

  const color = daytime ? 'navajowhite' : 'antiquewhite';
  const solarPanelCount = countAllSolarPanels();

  return (
    <Container>
      <ColumnWrapper>
        <Space direction={'horizontal'} style={{ color: color, fontSize: '10px' }}>
          <FontAwesomeIcon
            title={i18n.t('designInfoPanel.ClickToRecountSolarPanels', lang)}
            icon={faSolarPanel}
            size={'3x'}
            color={color}
            onClick={() => {
              setUpdateFlag(!updateFlag);
            }}
            style={{ paddingLeft: '10px', cursor: 'pointer' }}
          />
          <label>{solarPanelCount}</label>
        </Space>
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(DesignInfoPanel);
