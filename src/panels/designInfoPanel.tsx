/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import SolarPanelImage from '../assets/solar-panel.png';
import HeliostatImage from '../assets/heliostat.png';

import React, { useEffect, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAltH, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { Space } from 'antd';
import i18n from '../i18n/i18n';
import { ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';

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
  z-index: 7; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  background: #282c34;
  position: absolute;
  top: 0;
  left: calc(100vw / 2 - 120px);
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: 240px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

export interface DesignInfoPanelProps {}

const DesignInfoPanel = ({}: DesignInfoPanelProps) => {
  const language = useStore(Selector.language);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const countElementsByType = useStore(Selector.countElementsByType);
  const countAllChildElementsByType = useStore(Selector.countAllChildElementsByType);
  const countAllSolarPanels = useStore(Selector.countAllSolarPanels);
  const countAllSolarPanelDailyYields = useStore(Selector.countAllSolarPanelDailyYields);
  const countAllChildSolarPanels = useStore(Selector.countAllChildSolarPanels);
  const countAllChildSolarPanelDailyYields = useStore(Selector.countAllChildSolarPanelDailyYields);
  const countSolarPanelsOnRack = useStore(Selector.countSolarPanelsOnRack);
  const sceneRadius = useStore(Selector.sceneRadius);
  const updateDesignInfoFlag = useStore(Selector.updateDesignInfoFlag);
  const selectedElement = useStore(Selector.selectedElement);
  const getParent = useStore(Selector.getParent);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [solarPanelCount, setSolarPanelCount] = useState<number>(0);
  const [heliostatCount, setHeliostatCount] = useState<number>(0);
  const [solarPanelDailyYield, setSolarPanelDailyYield] = useState<number>(0);
  const daytime = sunlightDirection.y > 0;
  const lang = { lng: language };

  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.type === ObjectType.SolarPanel) {
        setSolarPanelCount(countSolarPanelsOnRack(selectedElement.id));
        setSolarPanelDailyYield((selectedElement as SolarPanelModel).dailyYield ?? 0);
      } else if (selectedElement.type === ObjectType.Polygon) {
        const parent = getParent(selectedElement);
        if (parent) {
          setSolarPanelCount(countAllChildSolarPanels(parent.id));
          setSolarPanelDailyYield(countAllChildSolarPanelDailyYields(parent.id));
        }
      } else {
        setSolarPanelCount(countAllChildSolarPanels(selectedElement.id));
        setSolarPanelDailyYield(countAllChildSolarPanelDailyYields(selectedElement.id));
        setHeliostatCount(countAllChildElementsByType(selectedElement.id, ObjectType.Heliostat));
      }
    } else {
      setSolarPanelCount(countAllSolarPanels());
      setSolarPanelDailyYield(countAllSolarPanelDailyYields());
      setHeliostatCount(countElementsByType(ObjectType.Heliostat));
    }
    setUpdateFlag(!updateFlag);
  }, [sceneRadius, updateDesignInfoFlag, selectedElement]);

  const color = daytime ? 'navajowhite' : 'antiquewhite';

  return (
    <Container>
      <ColumnWrapper>
        <Space direction={'horizontal'} style={{ color: color, fontSize: '10px' }}>
          {solarPanelCount > 0 && (
            <>
              <img
                title={i18n.t('designInfoPanel.NumberOfSelectedSolarPanels', lang)}
                src={SolarPanelImage}
                height={24}
                width={36}
                onClick={() => {
                  setUpdateFlag(!updateFlag);
                }}
                style={{ paddingLeft: '10px', cursor: 'pointer', filter: 'invert(100%) ' }}
              />
              <label>{solarPanelCount}</label>
            </>
          )}
          {heliostatCount > 0 && (
            <>
              <img
                title={i18n.t('designInfoPanel.NumberOfSelectedHeliostats', lang)}
                src={HeliostatImage}
                height={24}
                width={36}
                onClick={() => {
                  setUpdateFlag(!updateFlag);
                }}
                style={{ paddingLeft: '10px', cursor: 'pointer', filter: 'invert(100%) ' }}
              />
              <label>{heliostatCount}</label>
            </>
          )}
          {solarPanelDailyYield > 0 && (
            <>
              <FontAwesomeIcon
                title={i18n.t('designInfoPanel.ElectricityGeneratedDailyBySolarPanels', lang)}
                icon={faLightbulb}
                size={'3x'}
                color={color}
                style={{ paddingLeft: '10px', cursor: 'pointer' }}
              />
              <label>{solarPanelDailyYield.toFixed(1) + ' ' + i18n.t('word.kWh', lang)}</label>
            </>
          )}
          {!selectedElement && (
            <>
              <FontAwesomeIcon
                title={i18n.t('designInfoPanel.SceneRadius', lang)}
                icon={faArrowsAltH}
                size={'3x'}
                color={color}
                onClick={() => {
                  setUpdateFlag(!updateFlag);
                }}
                style={{ paddingLeft: '10px', cursor: 'pointer' }}
              />
              <label>{sceneRadius + ' ' + i18n.t('word.MeterAbbreviation', lang)}</label>
            </>
          )}
        </Space>
      </ColumnWrapper>
    </Container>
  );
};

export default React.memo(DesignInfoPanel);