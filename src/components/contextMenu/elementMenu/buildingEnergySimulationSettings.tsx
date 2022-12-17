/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space, Switch } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { Util } from '../../../Util';

const BuildingEnergySimulationSettings = () => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const daysPerYear = useStore(Selector.world.daysPerYear);
  const gridCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);
  const noAnimationForThermalSimulation = useStore(Selector.world.noAnimationForThermalSimulation);

  const lang = { lng: language };
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={'building-energy-analysis-options'} title={i18n.t('menu.building.EnergyAnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={'building-energy-simulation-sampling-frequency'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
          <InputNumber
            min={1}
            max={60}
            step={1}
            style={{ width: 72 }}
            precision={0}
            value={timesPerHour ?? 4}
            formatter={(a) => Number(a).toFixed(0)}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.timesPerHour = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.option.TimesPerHour', lang)}</Space>
        </Menu.Item>
        <Menu.Item key={'building-energy-simulation-sampling-days'}>
          <Select
            style={{ marginLeft: '150px', width: '72px' }}
            value={daysPerYear ?? 6}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.daysPerYear = value;
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
        <Menu.Item key={'building-energy-simulation-grid-cell-size'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.building.EnergyGridCellSize', lang) + ':'}</Space>
          <InputNumber
            min={0.1}
            max={5}
            step={0.05}
            style={{ width: 72 }}
            precision={2}
            value={gridCellSize ?? 0.5}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.solarRadiationHeatmapGridCellSize = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
        </Menu.Item>
        {!Util.hasMovingParts(elements) && (
          <Menu.Item key={'building-energy-simulation-no-animation'}>
            <Space style={{ width: '300px' }}>
              {i18n.t('menu.building.BuildingEnergySimulationNoAnimation', lang) + ':'}
            </Space>
            <Switch
              checked={noAnimationForThermalSimulation}
              onChange={(checked) => {
                setCommonStore((state) => {
                  state.world.noAnimationForThermalSimulation = checked;
                });
              }}
            />
          </Menu.Item>
        )}
      </Menu>
    </SubMenu>
  );
};

export default BuildingEnergySimulationSettings;
