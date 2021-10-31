/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from './stores/common';
import styled from 'styled-components';
import { Checkbox, Dropdown, Input, InputNumber, Menu, Modal, Radio, Select, Space } from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import { saveAs } from 'file-saver';
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
import i18n from './i18n';

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
  const timesPerHour = useStore((state) => state.world.timesPerHour);
  const discretization = useStore((state) => state.world.discretization);
  const solarPanelGridCellSize = useStore((state) => state.world.solarPanelGridCellSize);
  const heliodonRadius = useStore((state) => state.heliodonRadius);
  const orthographic = useStore(Selector.viewstate.orthographic);
  const showInfoPanel = useStore((state) => state.viewState.showInfoPanel);
  const showMapPanel = useStore((state) => state.viewState.showMapPanel);
  const showWeatherPanel = useStore((state) => state.viewState.showWeatherPanel);
  const showStickyNotePanel = useStore((state) => state.viewState.showStickyNotePanel);
  const exportContent = useStore((state) => state.exportContent);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('aladdin.json');
  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [aboutUs, setAboutUs] = useState(false);

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

  const showDownloadDialog = () => {
    setDownloadDialogVisible(true);
  };

  const writeLocalFile = () => {
    setConfirmLoading(true);
    const blob = new Blob([JSON.stringify(exportContent())], { type: 'application/json' });
    saveAs(blob, fileName);
    setConfirmLoading(false);
    setDownloadDialogVisible(false);
  };

  const readLocalFile = () => {
    const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
    fileDialog.onchange = (e) => {
      if (fileDialog.files && fileDialog.files.length > 0) {
        let reader = new FileReader();
        reader.readAsText(fileDialog.files[0]);
        setFileName(fileDialog.files[0].name);
        reader.onload = (e) => {
          if (reader.result) {
            const input = JSON.parse(reader.result.toString());
            setCommonStore((state) => {
              state.world = input.world;
              state.viewState = input.view;
              state.elements = input.elements;
              state.notes = input.notes ?? [];
            });
          }
          fileDialog.value = '';
        };
      }
    };
    fileDialog.click();
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
        // @ts-ignore
        state.world = input.world;
        // @ts-ignore
        state.viewState = input.view;
        // @ts-ignore
        state.elements = input.elements;
        state.notes = input.notes ?? [];
      });
    }
  };

  const lng = { lng: language };

  const menu = (
    <Menu>
      <SubMenu key={'file'} title={i18n.t('menu.fileSubMenu', lng)}>
        <Menu.Item key="open-local-file" onClick={readLocalFile}>
          {i18n.t('menu.file.OpenLocalFile', lng)}
        </Menu.Item>
        <Menu.Item key="save-local-file" onClick={showDownloadDialog}>
          {i18n.t('menu.file.SaveToDownloadFolder', lng)}
        </Menu.Item>
        <Menu.Item key="screenshot" onClick={takeScreenshot}>
          {i18n.t('menu.file.TakeScreenshot', lng)}
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'view'} title={i18n.t('menu.viewSubMenu', lng)}>
        <Menu.Item key={'orthographic-check-box'}>
          <Checkbox
            checked={orthographic}
            onChange={(e) => {
              const checked = e.target.checked;
              setCommonStore((state) => {
                state.viewState.orthographic = checked;
                state.viewState.enableRotate = !checked;
                state.orthographicChanged = true;
                if (checked) {
                  state.viewState.cameraPosition.x = 0;
                  state.viewState.cameraPosition.y = 0;
                  state.viewState.cameraPosition.z = Math.min(50, heliodonRadius * 4);
                  state.viewState.panCenter.x = 0;
                  state.viewState.panCenter.y = 0;
                  state.viewState.panCenter.z = 0;
                }
              });
            }}
          >
            {i18n.t('menu.view.TwoDimensionalView', lng)}
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
            {i18n.t('menu.view.SiteInformation', lng)}
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
            {i18n.t('menu.view.Map', lng)}
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
            {i18n.t('menu.view.WeatherData', lng)}
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
            {i18n.t('menu.view.StickyNote', lng)}
          </Checkbox>
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'sensors'} title={i18n.t('menu.sensorsSubMenu', lng)}>
        <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
          {i18n.t('menu.sensors.CollectDailyData', lng)}
        </Menu.Item>
        <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
          {i18n.t('menu.sensors.CollectYearlyData', lng)}
        </Menu.Item>
        <SubMenu key={'sensor-simulation-options'} title={i18n.t('word.Options', lng)}>
          <Menu>
            <Menu.Item key={'sensor-simulation-sampling-frequency'}>
              <Space style={{ width: '150px' }}>Sampling Frequency: </Space>
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
              <Space style={{ paddingLeft: '10px' }}>Times per Hour</Space>
            </Menu.Item>
          </Menu>
        </SubMenu>
      </SubMenu>
      <SubMenu key={'solar-panels'} title={i18n.t('menu.solarPanelsSubMenu', lng)}>
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
          {i18n.t('menu.solarPanels.AnalyzeDailyYield', lng)}
        </Menu.Item>
        <Menu.Item
          key={'solar-panel-yearly-yield'}
          onClick={() => {
            setPvYearlyIndividualOutputs(false);
            analyzePvYearlyYield();
          }}
        >
          {i18n.t('menu.solarPanels.AnalyzeYearlyYield', lng)}
        </Menu.Item>
        <SubMenu key={'solar-panel-simulation-options'} title={i18n.t('word.Options', lng)}>
          <Menu>
            <Menu.Item key={'solar-panel-simulation-sampling-frequency'}>
              <Space style={{ width: '150px' }}>Sampling Frequency: </Space>
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
              <Space style={{ paddingLeft: '10px' }}>Times per Hour</Space>
            </Menu.Item>
            <Menu.Item key={'solar-panel-discretization'}>
              <Space style={{ width: '150px' }}>Panel Discretization: </Space>
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
                  {Discretization.EXACT}
                </Option>
                )
                <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
                  {Discretization.APPROXIMATE}
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
      <SubMenu key={'examples'} title={i18n.t('menu.examplesSubMenu', lng)}>
        <Menu.Item key="solar_radiation_to_box" onClick={loadFile}>
          {i18n.t('menu.examples.SolarRadiationToBox', lng)}
        </Menu.Item>
        <Menu.Item key="sun_beam_at_center" onClick={loadFile}>
          {i18n.t('menu.examples.SunBeamAndHeliodon', lng)}
        </Menu.Item>
        <Menu.Item key="solar_farm_01" onClick={loadFile}>
          {i18n.t('menu.examples.SolarFarm', lng)}
        </Menu.Item>
        <Menu.Item key="solar_farm_02" onClick={loadFile}>
          {i18n.t('menu.examples.SolarFarmInRealWorld', lng)}
        </Menu.Item>
        <Menu.Item key="solar_trackers" onClick={loadFile}>
          {i18n.t('menu.examples.SolarTrackers', lng)}
        </Menu.Item>
        <Menu.Item key="simple_house_01" onClick={loadFile}>
          {i18n.t('menu.examples.SimpleHouse', lng)}
        </Menu.Item>
        <Menu.Item key="office_building_01" onClick={loadFile}>
          {i18n.t('menu.examples.OfficeBuilding', lng)}
        </Menu.Item>
      </SubMenu>
      <SubMenu key={'language'} title={i18n.t('menu.languageSubMenu', lng)}>
        <Radio.Group
          value={language}
          style={{ height: '170px' }}
          onChange={(e) => {
            setCommonStore((state) => {
              state.language = e.target.value;
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
        {i18n.t('menu.AboutUs', lng)}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Modal
        title="Download as"
        visible={downloadDialogVisible}
        onOk={writeLocalFile}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setDownloadDialogVisible(false);
        }}
      >
        <Input
          placeholder="File name"
          value={fileName}
          onPressEnter={writeLocalFile}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFileName(e.target.value);
          }}
        />
      </Modal>
      <Dropdown overlay={menu} trigger={['click']}>
        <StyledImage src={logo} title={i18n.t('tooltip.clickToOpenMenu', lng)} />
      </Dropdown>
      {aboutUs && <About openAboutUs={openAboutUs} />}
    </>
  );
};

export default React.memo(MainMenu);
