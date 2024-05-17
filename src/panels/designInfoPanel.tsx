/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import SolarPanelImage from '../assets/solar-panel.png';
import HeliostatImage from '../assets/heliostat.png';
import LightBulbImage from '../assets/light_bulb.png';
import DiameterImage from '../assets/diameter.png';
import AreaImage from '../assets/area.png';
import React from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { Space } from 'antd';
import i18n from '../i18n/i18n';
import { BuildingCompletionStatus, ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Util } from 'src/Util';
import { FoundationModel } from '../models/FoundationModel';
import { useLanguage } from '../hooks';

const Container = styled.div`
  position: absolute;
  bottom: 40px;
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
  tab-index: -1; // set to be not focusable
  z-index: 7; // must be less than other panels
`;

interface ColumnWrapperProps {
  $projectView: boolean;
}

const ColumnWrapper = styled.div<ColumnWrapperProps>`
  background: #282c34;
  position: absolute;
  top: 0;
  left: ${(p) => (p.$projectView ? 'calc(3 * 100vw / 4 - 120px)' : 'calc(100vw / 2 - 120px)')};
  align-self: center;
  align-content: center;
  align-items: center;
  margin: 0;
  width: 240px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

const DesignInfoPanel = React.memo(() => {
  const elements = useStore(Selector.elements);
  const countElementsByType = useStore(Selector.countElementsByType);
  const countSolarPanelsOnRack = useStore(Selector.countSolarPanelsOnRack);
  const getParent = useStore(Selector.getParent);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const sceneRadius = useStore(Selector.sceneRadius);
  const projectView = useStore(Selector.projectView);

  const selectedElement = useStore((state) => {
    if (state.selectedElement === null) return null;
    return state.elements.find((e) => e.id === state.selectedElement?.id);
  });

  let solarPanelCount = 0;
  let solarPanelDailyYield = 0;
  let heliostatCount = 0;

  if (selectedElement) {
    if (selectedElement.type === ObjectType.SolarPanel) {
      solarPanelCount = countSolarPanelsOnRack(selectedElement.id);
      solarPanelDailyYield = (selectedElement as SolarPanelModel).dailyYield ?? 0;
    } else if (selectedElement.type === ObjectType.Polygon) {
      const parent = getParent(selectedElement);
      if (parent) {
        solarPanelCount = Util.countAllChildSolarPanels(parent.id);
        solarPanelDailyYield = Util.countAllChildSolarPanelDailyYields(parent.id);
      }
    } else {
      solarPanelCount = Util.countAllChildSolarPanels(selectedElement.id);
      solarPanelDailyYield = Util.countAllChildSolarPanelDailyYields(selectedElement.id);
      heliostatCount = Util.countAllChildElementsByType(selectedElement.id, ObjectType.Heliostat);
    }
  } else {
    solarPanelCount = Util.countAllSolarPanels();
    solarPanelDailyYield = Util.countAllSolarPanelDailyYields();
    heliostatCount = countElementsByType(ObjectType.Heliostat);
  }

  const lang = useLanguage();
  const daytime = sunlightDirection.y > 0;
  const color = daytime ? 'navajowhite' : 'antiquewhite';
  const filter = daytime
    ? 'invert(85%) sepia(45%) saturate(335%) hue-rotate(329deg) brightness(100%) contrast(101%)'
    : 'invert(95%) sepia(7%) saturate(1598%) hue-rotate(312deg) brightness(106%) contrast(96%)';

  // Do NOT put this in useMemo. Otherwise, it will crash the app.
  const isBuilding =
    selectedElement &&
    selectedElement.type === ObjectType.Foundation &&
    !(selectedElement as FoundationModel).notBuilding &&
    Util.getBuildingCompletionStatus(selectedElement as FoundationModel, elements) ===
      BuildingCompletionStatus.COMPLETE;

  return (
    <Container>
      <ColumnWrapper $projectView={projectView}>
        <Space direction={'horizontal'} style={{ color: color, fontSize: '10px' }}>
          {solarPanelCount > 0 && (
            <>
              <img
                alt={'Solar panel count'}
                title={i18n.t('designInfoPanel.NumberOfSelectedSolarPanels', lang)}
                src={SolarPanelImage}
                height={24}
                width={36}
                style={{ paddingLeft: '10px', cursor: 'pointer', filter: 'invert(100%) ' }}
              />
              <span>{solarPanelCount}</span>
            </>
          )}
          {heliostatCount > 0 && (
            <>
              <img
                alt={'Heliostat count'}
                title={i18n.t('designInfoPanel.NumberOfSelectedHeliostats', lang)}
                src={HeliostatImage}
                height={24}
                width={36}
                style={{
                  paddingLeft: '10px',
                  marginTop: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  filter: 'invert(100%) ',
                }}
              />
              <span>{heliostatCount}</span>
            </>
          )}
          {solarPanelDailyYield > 0 && (
            <>
              <img
                title={i18n.t('designInfoPanel.ElectricityGeneratedDailyBySolarPanels', lang)}
                alt={'Electricity'}
                src={LightBulbImage}
                height={24}
                width={24}
                style={{
                  filter: filter,
                  marginLeft: '10px',
                  marginTop: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                }}
              />
              <span>{solarPanelDailyYield.toFixed(1) + ' ' + i18n.t('word.kWh', lang)}</span>
            </>
          )}
          {!selectedElement && (
            <>
              <img
                title={i18n.t('designInfoPanel.SceneDiameter', lang)}
                alt={'Diameter'}
                src={DiameterImage}
                height={20}
                width={20}
                style={{
                  filter: filter,
                  marginLeft: '10px',
                  marginTop: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                }}
              />
              <span>{sceneRadius * 2 + ' ' + i18n.t('word.MeterAbbreviation', lang)}</span>
            </>
          )}
          {isBuilding && (
            <>
              <img
                title={i18n.t('designInfoPanel.BuildingArea', lang)}
                alt={'Area'}
                src={AreaImage}
                height={20}
                width={20}
                style={{
                  filter: filter,
                  marginLeft: '10px',
                  marginTop: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                }}
              />
              <span>
                {Util.getBuildingArea(selectedElement as FoundationModel, elements).toFixed(2) +
                  ' ' +
                  i18n.t('word.MeterAbbreviation', lang)}
                <sup>2</sup>
              </span>
            </>
          )}
        </Space>
      </ColumnWrapper>
    </Container>
  );
});

export default DesignInfoPanel;
