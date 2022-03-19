/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space, Switch } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { Util } from '../../../Util';

const SutSimulationSettings = () => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const sutTimesPerHour = useStore(Selector.world.sutTimesPerHour);
  const sutDaysPerYear = useStore(Selector.world.sutDaysPerYear);
  const sutGridCellSize = useStore(Selector.world.sutGridCellSize);
  const noAnimation = useStore(Selector.world.noAnimationForSolarUpdraftTowerSimulation);

  const lang = { lng: language };
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={'sut-analysis-options'} title={i18n.t('menu.AnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={'sut-simulation-sampling-frequency'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
          <InputNumber
            min={1}
            max={60}
            step={1}
            style={{ width: 72 }}
            precision={0}
            value={sutTimesPerHour ?? 4}
            formatter={(a) => Number(a).toFixed(0)}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.sutTimesPerHour = value;
              });
            }}
          />
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
            formatter={(a) => Number(a).toFixed(1)}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.sutGridCellSize = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
        </Menu.Item>
        {!Util.hasMovingParts(elements) && (
          <Menu.Item key={'solar-updraft-tower-simulation-no-animation'}>
            <Space style={{ width: '280px' }}>
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
};

export default SutSimulationSettings;
