/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space, Switch } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { Util } from '../../../Util';
import { useDataStore } from '../../../stores/commonData';
import { useLanguage } from '../../../hooks';

const SutSimulationSettings = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const sutTimesPerHour = useStore(Selector.world.sutTimesPerHour);
  const sutDaysPerYear = useStore(Selector.world.sutDaysPerYear);
  const sutGridCellSize = useStore(Selector.world.sutGridCellSize);
  const noAnimation = useStore(Selector.world.noAnimationForSolarUpdraftTowerSimulation);

  const lang = useLanguage();
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={'sut-analysis-options'} title={i18n.t('menu.AnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={'sut-simulation-sampling-frequency'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
          <Select
            style={{ width: '72px' }}
            value={sutTimesPerHour ?? 4}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.sutTimesPerHour = value;
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
        <Menu.Item key={'sut-simulation-sampling-days'}>
          <Select
            style={{ marginLeft: '150px', width: '72px' }}
            value={sutDaysPerYear ?? 6}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.sutDaysPerYear = value;
              });
              // clear the results stored in the common store
              useDataStore.setState({
                yearlyUpdraftTowerYield: [],
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
        <Menu.Item key={'sut-simulation-grid-cell-size'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.GridCellSize', lang) + ':'}</Space>
          <InputNumber
            min={0.1}
            max={20}
            step={0.1}
            style={{ width: 72 }}
            precision={1}
            value={sutGridCellSize ?? 1}
            onChange={(value) => {
              if (value === null) return;
              setCommonStore((state) => {
                state.world.sutGridCellSize = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
        </Menu.Item>
        {!Util.hasMovingParts(elements) && (
          <Menu.Item key={'solar-updraft-tower-simulation-no-animation'}>
            <Space style={{ width: '320px' }}>
              {i18n.t('menu.solarUpdraftTower.SolarUpdraftTowerSimulationNoAnimation', lang) + ':'}
            </Space>
            <Switch
              checked={noAnimation}
              onChange={(checked) => {
                setCommonStore((state) => {
                  state.world.noAnimationForSolarUpdraftTowerSimulation = checked;
                });
              }}
            />
          </Menu.Item>
        )}
      </Menu>
    </SubMenu>
  );
});

export default SutSimulationSettings;
