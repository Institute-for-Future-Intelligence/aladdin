/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space, Switch } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { Discretization } from '../../../types';
import { Util } from '../../../Util';
import { useDataStore } from '../../../stores/commonData';

const PvSimulationSettings = () => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const daysPerYear = useStore(Selector.world.daysPerYear);
  const gridCellSize = useStore(Selector.world.pvGridCellSize);
  const discretization = useStore(Selector.world.discretization);
  const noAnimationForSolarPanelSimulation = useStore(Selector.world.noAnimationForSolarPanelSimulation);

  const lang = { lng: language };
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={'solar-panel-energy-analysis-options'} title={i18n.t('menu.solarPanel.EnergyAnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={'solar-panel-simulation-sampling-frequency'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
          <Select
            style={{ width: '72px' }}
            value={timesPerHour ?? 4}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.timesPerHour = value;
              });
            }}
          >
            {/* sampling interval must be a factor of 60 (e.g., 8 is not)*/}
            <Option key={1} value={1}>
              1
            </Option>
            <Option key={2} value={2}>
              2
            </Option>
            <Option key={3} value={3}>
              3
            </Option>
            <Option key={4} value={4}>
              4
            </Option>
            <Option key={6} value={6}>
              6
            </Option>
            <Option key={12} value={12}>
              12
            </Option>
            <Option key={30} value={30}>
              30
            </Option>
          </Select>
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.option.TimesPerHour', lang)}</Space>
        </Menu.Item>
        <Menu.Item key={'solar-panel-simulation-sampling-days'}>
          <Select
            style={{ marginLeft: '150px', width: '72px' }}
            value={daysPerYear ?? 6}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.daysPerYear = value;
              });
              // clear the results stored in the common store
              useDataStore.setState((state) => {
                state.yearlyPvYield = [];
              });
            }}
          >
            <Option key={4} value={4}>
              4
            </Option>
            <Option key={6} value={6}>
              6
            </Option>
            <Option key={12} value={12}>
              12
            </Option>
          </Select>
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.option.DaysPerYear', lang)}</Space>
        </Menu.Item>
        <Menu.Item key={'solar-panel-discretization'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanel.PanelDiscretization', lang) + ':'}</Space>
          <Select
            style={{ width: '165px' }}
            value={discretization ?? Discretization.APPROXIMATE}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.discretization = value;
              });
            }}
          >
            <Option key={Discretization.EXACT} value={Discretization.EXACT}>
              {i18n.t('menu.solarPanel.Exact', lang)}
            </Option>
            <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
              {i18n.t('menu.solarPanel.Approximate', lang)}
            </Option>
          </Select>
        </Menu.Item>
        {(!discretization || discretization === Discretization.APPROXIMATE) && (
          <Menu.Item key={'solar-panel-simulation-grid-cell-size'}>
            <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanel.EnergyGridCellSize', lang) + ':'}</Space>
            <InputNumber
              min={0.1}
              max={5}
              step={0.05}
              style={{ width: 72 }}
              precision={2}
              value={gridCellSize ?? 0.5}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.world.pvGridCellSize = value;
                });
              }}
            />
            <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
          </Menu.Item>
        )}
        {!Util.hasMovingParts(elements) && (
          <Menu.Item key={'solar-panel-simulation-no-animation'}>
            <Space style={{ width: '280px' }}>
              {i18n.t('menu.solarPanel.SolarPanelSimulationNoAnimation', lang) + ':'}
            </Space>
            <Switch
              checked={noAnimationForSolarPanelSimulation}
              onChange={(checked) => {
                setCommonStore((state) => {
                  state.world.noAnimationForSolarPanelSimulation = checked;
                });
              }}
            />
          </Menu.Item>
        )}
      </Menu>
    </SubMenu>
  );
};

export default PvSimulationSettings;
