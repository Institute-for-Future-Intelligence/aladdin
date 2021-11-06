/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from './stores/common';
import styled from 'styled-components';
import { Checkbox, Dropdown, Input, InputNumber, Menu, Modal, Radio, Select, Space } from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import About from './about';
import { saveImage } from './helpers';
import { Discretization, Language } from './types';
import * as Selector from './stores/selector';

import solar_radiation_to_box from './examples/solar_radiation_to_box.json';
import sun_beam_at_center from './examples/sun_beam_at_center.json';
import office_building_01 from './examples/office_building_01.json';
import solar_farm_01 from './examples/solar_farm_01.json';
import solar_farm_02 from './examples/solar_farm_02.json';
import solar_trackers from './examples/solar_trackers.json';
import simple_house_01 from './examples/simple_house_01.json';

import i18n from './i18n/i18n';
import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';
import { Util } from './Util';

const { SubMenu } = Menu;
const { Option } = Select;

const radioStyle = {
  display: 'block',
  height: '30px',
  paddingLeft: '10px',
  lineHeight: '30px',
};

const StyledImage = styled.img`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  transition: 0.5s;
  opacity: 1;
  cursor: pointer;

  &:hover {
    opacity: 0.5;
  }
`;

export interface MainMenuProps {
  readLocalFile: () => void;
  writeLocalFile: () => boolean;
  set2DView: (selected: boolean) => void;
  collectDailyLightSensorData: () => void;
  collectYearlyLightSensorData: () => void;
  setPvDailyIndividualOutputs: (b: boolean) => void;
  analyzePvDailyYield: () => void;
  setPvYearlyIndividualOutputs: (b: boolean) => void;
  analyzePvYearlyYield: () => void;
  canvas?: HTMLCanvasElement;

  [key: string]: any;
}

const MainMenu = ({
  readLocalFile,
  writeLocalFile,
  set2DView,
  collectDailyLightSensorData,
  collectYearlyLightSensorData,
  setPvDailyIndividualOutputs,
  analyzePvDailyYield,
  setPvYearlyIndividualOutputs,
  analyzePvYearlyYield,
  canvas,
  ...rest
}: MainMenuProps) => {
  const setCommonStore = useStore((state) => state.set);
  const language = useStore((state) => state.language);
  const localFileName = useStore((state) => state.localFileName);
  const timesPerHour = useStore((state) => state.world.timesPerHour);
  const discretization = useStore((state) => state.world.discretization);
  const solarPanelGridCellSize = useStore((state) => state.world.solarPanelGridCellSize);
  const orthographic = useStore(Selector.viewstate.orthographic);
  const showInfoPanel = useStore((state) => state.viewState.showInfoPanel);
  const showMapPanel = useStore((state) => state.viewState.showMapPanel);
  const showWeatherPanel = useStore((state) => state.viewState.showWeatherPanel);
  const showStickyNotePanel = useStore((state) => state.viewState.showStickyNotePanel);
  const [aboutUs, setAboutUs] = useState(false);
  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const lang = { lng: language };
  const isMac = Util.getOS()?.startsWith('Mac');

  const openAboutUs = (on: boolean) => {
    setAboutUs(on);
  };

  const gotoAboutPage = () => {
    openAboutUs(true);
  };

  const takeScreenshot = () => {
    if (canvas) {
      // TODO
      saveImage('screenshot.png', canvas.toDataURL('image/png'));
    }
  };

  const loadFile = (e: any) => {
    let input: any;
    switch (e.key) {
      case 'solar_radiation_to_box':
        input = solar_radiation_to_box;
        break;
      case 'sun_beam_at_center':
        input = sun_beam_at_center;
        break;
      case 'office_building_01':
        input = office_building_01;
        break;
      case 'solar_farm_01':
        input = solar_farm_01;
        break;
      case 'solar_farm_02':
        input = solar_farm_02;
        break;
      case 'solar_trackers':
        input = solar_trackers;
        break;
      case 'simple_house_01':
        input = simple_house_01;
        break;
    }
    if (input) {
      setCommonStore((state) => {
        state.world = input.world;
        state.viewState = input.view;
        state.elements = input.elements;
        state.notes = input.notes ?? [];
      });
    }
  };

  const menu = (
    <Menu>
      <SubMenu key={'file'} title={i18n.t('menu.fileSubMenu', lang)}>
        <Menu.Item key="open-local-file" onClick={readLocalFile}>
          {i18n.t('menu.file.OpenLocalFile', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+O)</label>
        </Menu.Item>
        <Menu.Item
          key="save-local-file"
          onClick={() => {
            setDownloadDialogVisible(true);
          }}
        >
          {i18n.t('menu.file.SaveToDownloadFolder', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+S)</label>
        </Menu.Item>
        <Menu.Item key="screenshot" onClick={takeScreenshot}>
          {i18n.t('menu.file.TakeScreenshot', lang)}
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'view'} title={i18n.t('menu.viewSubMenu', lang)}>
        <Menu.Item key={'orthographic-check-box'}>
          <Checkbox
            checked={orthographic}
            onChange={(e) => {
              set2DView(e.target.checked);
            }}
          >
            {i18n.t('menu.view.TwoDimensionalView', lang)}
            <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+U)</label>
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'info-panel-check-box'}>
          <Checkbox
            checked={showInfoPanel}
            onChange={(e) => {
              setCommonStore((state) => {
                state.viewState.showInfoPanel = e.target.checked;
              });
            }}
          >
            {i18n.t('menu.view.SiteInformation', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'map-panel-check-box'}>
          <Checkbox
            checked={showMapPanel}
            onChange={(e) => {
              setCommonStore((state) => {
                state.viewState.showMapPanel = e.target.checked;
              });
            }}
          >
            {i18n.t('menu.view.Map', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'weather-panel-check-box'}>
          <Checkbox
            checked={showWeatherPanel}
            onChange={(e) => {
              setCommonStore((state) => {
                state.viewState.showWeatherPanel = e.target.checked;
              });
            }}
          >
            {i18n.t('menu.view.WeatherData', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'sticky-note-panel-check-box'}>
          <Checkbox
            checked={showStickyNotePanel}
            onChange={(e) => {
              setCommonStore((state) => {
                state.viewState.showStickyNotePanel = e.target.checked;
              });
            }}
          >
            {i18n.t('menu.view.StickyNote', lang)}
          </Checkbox>
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'sensors'} title={i18n.t('menu.sensorsSubMenu', lang)}>
        <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
          {i18n.t('menu.sensors.CollectDailyData', lang)}
        </Menu.Item>
        <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
          {i18n.t('menu.sensors.CollectYearlyData', lang)}
        </Menu.Item>
        <SubMenu key={'sensor-simulation-options'} title={i18n.t('word.Options', lang)}>
          <Menu>
            <Menu.Item key={'sensor-simulation-sampling-frequency'}>
              <Space style={{ width: '150px' }}>{i18n.t('menu.sensors.SamplingFrequency', lang) + ':'}</Space>
              <InputNumber
                min={1}
                max={60}
                step={1}
                style={{ width: 60 }}
                precision={0}
                value={timesPerHour}
                formatter={(a) => Number(a).toFixed(0)}
                onChange={(value) => {
                  setCommonStore((state) => {
                    state.world.timesPerHour = value;
                  });
                }}
              />
              <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.sensors.TimesPerHour', lang)}</Space>
            </Menu.Item>
          </Menu>
        </SubMenu>
      </SubMenu>
      <SubMenu key={'solar-panels'} title={i18n.t('menu.solarPanelsSubMenu', lang)}>
        <Menu.Item
          key={'solar-panel-daily-yield'}
          onClick={() => {
            setCommonStore((state) => {
              state.simulationInProgress = true;
              console.log('simulation started', state.simulationInProgress);
            });
            setPvDailyIndividualOutputs(false);
            analyzePvDailyYield();
          }}
        >
          {i18n.t('menu.solarPanels.AnalyzeDailyYield', lang)}
        </Menu.Item>
        <Menu.Item
          key={'solar-panel-yearly-yield'}
          onClick={() => {
            setPvYearlyIndividualOutputs(false);
            analyzePvYearlyYield();
          }}
        >
          {i18n.t('menu.solarPanels.AnalyzeYearlyYield', lang)}
        </Menu.Item>
        <SubMenu key={'solar-panel-simulation-options'} title={i18n.t('word.Options', lang)}>
          <Menu>
            <Menu.Item key={'solar-panel-simulation-sampling-frequency'}>
              <Space style={{ width: '150px' }}>{i18n.t('menu.sensors.SamplingFrequency', lang) + ':'}</Space>
              <InputNumber
                min={1}
                max={60}
                step={1}
                style={{ width: 60 }}
                precision={0}
                value={timesPerHour}
                formatter={(a) => Number(a).toFixed(0)}
                onChange={(value) => {
                  setCommonStore((state) => {
                    state.world.timesPerHour = value;
                  });
                }}
              />
              <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.sensors.TimesPerHour', lang)}</Space>
            </Menu.Item>
            <Menu.Item key={'solar-panel-discretization'}>
              <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanels.PanelDiscretization', lang) + ':'}</Space>
              <Select
                style={{ width: '165px' }}
                value={discretization ?? Discretization.EXACT}
                onChange={(value) => {
                  setCommonStore((state) => {
                    state.world.discretization = value;
                  });
                }}
              >
                <Option key={Discretization.EXACT} value={Discretization.EXACT}>
                  {i18n.t('menu.solarPanels.Exact', lang)}
                </Option>
                )
                <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
                  {i18n.t('menu.solarPanels.Approximate', lang)}
                </Option>
                )
              </Select>
            </Menu.Item>
            {discretization === Discretization.APPROXIMATE && (
              <Menu.Item key={'solar-panel-simulation-grid-cell-size'}>
                <Space style={{ width: '150px' }}>Grid Cell Size: </Space>
                <InputNumber
                  min={0.1}
                  max={5}
                  step={0.1}
                  style={{ width: 60 }}
                  precision={1}
                  value={solarPanelGridCellSize ?? 0.5}
                  formatter={(a) => Number(a).toFixed(1)}
                  onChange={(value) => {
                    setCommonStore((state) => {
                      state.world.solarPanelGridCellSize = value;
                    });
                  }}
                />
                <Space style={{ paddingLeft: '10px' }}>m</Space>
              </Menu.Item>
            )}
          </Menu>
        </SubMenu>
      </SubMenu>
      <SubMenu key={'examples'} title={i18n.t('menu.examplesSubMenu', lang)}>
        <Menu.Item key="solar_radiation_to_box" onClick={loadFile}>
          {i18n.t('menu.examples.SolarRadiationToBox', lang)}
        </Menu.Item>
        <Menu.Item key="sun_beam_at_center" onClick={loadFile}>
          {i18n.t('menu.examples.SunBeamAndHeliodon', lang)}
        </Menu.Item>
        <Menu.Item key="solar_farm_01" onClick={loadFile}>
          {i18n.t('menu.examples.SolarFarm', lang)}
        </Menu.Item>
        <Menu.Item key="solar_farm_02" onClick={loadFile}>
          {i18n.t('menu.examples.SolarFarmInRealWorld', lang)}
        </Menu.Item>
        <Menu.Item key="solar_trackers" onClick={loadFile}>
          {i18n.t('menu.examples.SolarTrackers', lang)}
        </Menu.Item>
        <Menu.Item key="simple_house_01" onClick={loadFile}>
          {i18n.t('menu.examples.SimpleHouse', lang)}
        </Menu.Item>
        <Menu.Item key="office_building_01" onClick={loadFile}>
          {i18n.t('menu.examples.OfficeBuilding', lang)}
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'language'} title={i18n.t('menu.languageSubMenu', lang)}>
        <Radio.Group
          value={language}
          style={{ height: '170px' }}
          onChange={(e) => {
            setCommonStore((state) => {
              state.language = e.target.value;
              switch (state.language) {
                case 'zh_cn':
                  state.locale = zhCN;
                  break;
                case 'zh_tw':
                  state.locale = zhTW;
                  break;
                case 'es':
                  state.locale = esES;
                  break;
                case 'tr':
                  state.locale = trTR;
                  break;
                default:
                  state.locale = enUS;
              }
            });
          }}
        >
          <Radio style={radioStyle} value={'en'}>
            {Language.English}
          </Radio>
          <Radio style={radioStyle} value={'zh_cn'}>
            {Language.Chinese_Simplified}
          </Radio>
          <Radio style={radioStyle} value={'zh_tw'}>
            {Language.Chinese_Traditional}
          </Radio>
          <Radio style={radioStyle} value={'tr'}>
            {Language.Turkish}
          </Radio>
          <Radio style={radioStyle} value={'es'}>
            {Language.Spanish}
          </Radio>
        </Radio.Group>
      </SubMenu>
      <Menu.Item key="about" onClick={gotoAboutPage}>
        {i18n.t('menu.AboutUs', lang)}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Modal
        title={i18n.t('menu.file.DownloadAs', lang)}
        visible={downloadDialogVisible}
        onOk={() => {
          setConfirmLoading(true);
          if (writeLocalFile()) {
            setDownloadDialogVisible(false);
          }
          setConfirmLoading(false);
        }}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setDownloadDialogVisible(false);
        }}
      >
        <Input
          placeholder="File name"
          value={localFileName}
          onPressEnter={writeLocalFile}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCommonStore((state) => {
              state.localFileName = e.target.value;
            });
          }}
        />
      </Modal>
      <Dropdown overlay={menu} trigger={['click']}>
        <StyledImage src={logo} title={i18n.t('tooltip.clickToOpenMenu', lang)} />
      </Dropdown>
      {aboutUs && <About openAboutUs={openAboutUs} />}
    </>
  );
};

export default React.memo(MainMenu);
