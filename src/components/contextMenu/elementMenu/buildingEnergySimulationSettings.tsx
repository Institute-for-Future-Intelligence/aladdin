/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { useLanguage } from '../../../hooks';

const BuildingEnergySimulationSettings = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const daysPerYear = useStore(Selector.world.daysPerYear);
  const gridCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);

  const lang = useLanguage();
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={'building-energy-analysis-options'} title={i18n.t('menu.building.EnergyAnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={'building-energy-simulation-sampling-frequency'}>
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
              if (value === null) return;
              setCommonStore((state) => {
                state.world.solarRadiationHeatmapGridCellSize = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
        </Menu.Item>
        {/*{!Util.hasMovingParts(elements) && (*/}
        {/*  <Menu.Item key={'building-energy-simulation-no-animation'}>*/}
        {/*    <Space style={{ width: '300px' }}>*/}
        {/*      {i18n.t('menu.building.BuildingEnergySimulationNoAnimation', lang) + ':'}*/}
        {/*    </Space>*/}
        {/*    <Switch*/}
        {/*      checked={noAnimationForThermalSimulation}*/}
        {/*      onChange={(checked) => {*/}
        {/*        setCommonStore((state) => {*/}
        {/*          state.world.noAnimationForThermalSimulation = checked;*/}
        {/*        });*/}
        {/*      }}*/}
        {/*    />*/}
        {/*  </Menu.Item>*/}
        {/*)}*/}
      </Menu>
    </SubMenu>
  );
});

export default BuildingEnergySimulationSettings;
