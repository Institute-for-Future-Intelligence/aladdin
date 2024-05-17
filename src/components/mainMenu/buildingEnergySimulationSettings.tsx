/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { InputNumber, MenuProps, Select, Space } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useLanguage } from 'src/hooks';
import * as Selector from '../../stores/selector';

const { Option } = Select;

const SamplingFrequencySelect = () => {
  const lang = useLanguage();
  const timesPerHour = useStore(Selector.world.timesPerHour);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
      <Select
        style={{ width: '72px' }}
        value={timesPerHour ?? 4}
        onChange={(value) => {
          useStore.getState().set((state) => {
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
    </MenuItem>
  );
};

const SimulationSamplingDaysSelect = () => {
  const lang = useLanguage();
  const daysPerYear = useStore(Selector.world.daysPerYear);

  return (
    <MenuItem noPadding stayAfterClick>
      <Select
        style={{ marginLeft: '150px', width: '72px' }}
        value={daysPerYear ?? 6}
        onChange={(value) => {
          useStore.getState().set((state) => {
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
    </MenuItem>
  );
};

const EnergyGridCellSizeInput = () => {
  const solarRadiationHeatmapGridCellSize = useStore(Selector.world.solarRadiationHeatmapGridCellSize);
  const lang = useLanguage();

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.building.EnergyGridCellSize', lang) + ':'}</Space>
      <InputNumber
        min={0.1}
        max={5}
        step={0.05}
        style={{ width: 72 }}
        precision={2}
        value={solarRadiationHeatmapGridCellSize ?? 0.5}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            state.world.solarRadiationHeatmapGridCellSize = value;
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
    </MenuItem>
  );
};

export const buildingEnergySimulationSettingsSubmenu = () => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [
    // building-energy-simulation-sampling-frequency
    {
      key: 'building-energy-simulation-sampling-frequency',
      label: <SamplingFrequencySelect />,
    },
    // building-energy-simulation-sampling-days
    {
      key: 'building-energy-simulation-sampling-days',
      label: <SimulationSamplingDaysSelect />,
    },
    // building-energy-simulation-grid-cell-size
    {
      key: 'building-energy-simulation-grid-cell-size',
      label: <EnergyGridCellSizeInput />,
    },
  ];

  return items;
};
