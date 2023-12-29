/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { InputNumber, MenuProps, Select, Space } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useDataStore } from 'src/stores/commonData';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/views/hooks';

const { Option } = Select;

const SamplingFrequencySelect = () => {
  const cspTimesPerHour = useStore(Selector.world.cspTimesPerHour);
  const lang = useLanguage();

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
      <Select
        style={{ width: '72px' }}
        value={cspTimesPerHour ?? 4}
        onChange={(value) => {
          useStore.getState().set((state) => {
            state.world.cspTimesPerHour = value;
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
  const cspDaysPerYear = useStore(Selector.world.cspDaysPerYear);

  return (
    <MenuItem noPadding stayAfterClick>
      <Select
        style={{ marginLeft: '150px', width: '72px' }}
        value={cspDaysPerYear ?? 6}
        onChange={(value) => {
          useStore.getState().set((state) => {
            state.world.cspDaysPerYear = value;
          });
          // clear the results stored in the common store
          useDataStore.setState({
            yearlyParabolicTroughYield: [],
            yearlyParabolicDishYield: [],
            yearlyFresnelReflectorYield: [],
            yearlyHeliostatYield: [],
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

const GridCellSizeInput = () => {
  const cspGridCellSize = useStore(Selector.world.cspGridCellSize);
  const lang = useLanguage();

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.GridCellSize', lang) + ':'}</Space>
      <InputNumber
        min={0.1}
        max={20}
        step={0.05}
        style={{ width: 72 }}
        precision={2}
        value={cspGridCellSize ?? 0.5}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            state.world.cspGridCellSize = value;
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
    </MenuItem>
  );
};

export const cspSimulationSettings = (name: string) => {
  const items: MenuProps['items'] = [
    // simulation-sampling-frequency
    {
      key: `${name}-simulation-sampling-frequency`,
      label: <SamplingFrequencySelect />,
    },
    // simulation-sampling-days
    {
      key: `${name}-simulation-sampling-days`,
      label: <SimulationSamplingDaysSelect />,
    },
    // simulation-grid-cell-size
    {
      key: `${name}-simulation-grid-cell-size`,
      label: <GridCellSizeInput />,
    },
  ];

  return items;
};
