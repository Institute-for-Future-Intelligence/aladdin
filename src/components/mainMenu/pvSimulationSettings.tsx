/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { InputNumber, MenuProps, Select, Space, Switch } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useDataStore } from 'src/stores/commonData';
import { Discretization } from 'src/types';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/views/hooks';

const { Option } = Select;

const SamplingFrequencySelect = () => {
  const timesPerHour = useStore(Selector.world.timesPerHour);
  const lang = useLanguage();

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
          // clear the results stored in the common store
          useDataStore.setState({
            yearlyPvYield: [],
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

const DiscretizationSelect = () => {
  const lang = useLanguage();
  const discretization = useStore(Selector.world.discretization);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanel.PanelDiscretization', lang) + ':'}</Space>
      <Select
        style={{ width: '165px' }}
        value={discretization ?? Discretization.APPROXIMATE}
        onChange={(value) => {
          useStore.getState().set((state) => {
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
    </MenuItem>
  );
};

const EnergyGridCellSizeInput = () => {
  const pvGridCellSize = useStore(Selector.world.pvGridCellSize);
  const lang = useLanguage();

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanel.EnergyGridCellSize', lang) + ':'}</Space>
      <InputNumber
        min={0.1}
        max={5}
        step={0.05}
        style={{ width: 72 }}
        precision={2}
        value={pvGridCellSize ?? 0.5}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            state.world.pvGridCellSize = value;
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
    </MenuItem>
  );
};

const SolarPanelSimulationNoAnimationSwitch = () => {
  const lang = useLanguage();
  const noAnimationForSolarPanelSimulation = useStore(Selector.world.noAnimationForSolarPanelSimulation);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '280px' }}>{i18n.t('menu.solarPanel.SolarPanelSimulationNoAnimation', lang) + ':'}</Space>
      <Switch
        checked={noAnimationForSolarPanelSimulation}
        onChange={(checked) => {
          useStore.getState().set((state) => {
            state.world.noAnimationForSolarPanelSimulation = checked;
          });
        }}
      />
    </MenuItem>
  );
};

export const pvSimulationSettings = (hasMovingParts: boolean) => {
  const lang = { lng: useStore.getState().language };
  const discretization = useStore.getState().world.discretization;

  const items: MenuProps['items'] = [
    // solar-panel-simulation-sampling-frequency
    {
      key: 'solar-panel-simulation-sampling-frequency',
      label: <SamplingFrequencySelect />,
    },
    // solar-panel-simulation-sampling-days
    {
      key: 'solar-panel-simulation-sampling-days',
      label: <SimulationSamplingDaysSelect />,
    },
    // solar-panel-discretization
    {
      key: 'solar-panel-discretization',
      label: <DiscretizationSelect />,
    },
  ];

  // solar-panel-simulation-grid-cell-size
  if (!discretization || discretization === Discretization.APPROXIMATE) {
    items.push({
      key: 'solar-panel-simulation-grid-cell-size',
      label: <EnergyGridCellSizeInput />,
    });
  }

  // solar-panel-simulation-no-animation
  if (!hasMovingParts) {
    items.push({
      key: 'solar-panel-simulation-no-animation',
      label: <SolarPanelSimulationNoAnimationSwitch />,
    });
  }

  return items;
};
