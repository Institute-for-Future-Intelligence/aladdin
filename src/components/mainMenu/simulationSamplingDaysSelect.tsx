/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useLanguage } from 'src/hooks';
import * as Selector from '../../stores/selector';
import React, { useMemo } from 'react';
import { EnergyModelingType } from '../../types';
import { useDataStore } from '../../stores/commonData';
import { DEFAULT_CSP_DAYS_PER_YEAR, DEFAULT_DAYS_PER_YEAR, DEFAULT_SUT_DAYS_PER_YEAR } from 'src/constants';

const { Option } = Select;

export const SimulationSamplingDaysSelect = React.memo(({ type }: { type: EnergyModelingType }) => {
  const defaultDaysPerYear = useStore(Selector.world.daysPerYear) ?? DEFAULT_DAYS_PER_YEAR;
  const cspDaysPerYear = useStore(Selector.world.cspDaysPerYear) ?? DEFAULT_CSP_DAYS_PER_YEAR;
  const sutDaysPerYear = useStore(Selector.world.sutDaysPerYear) ?? DEFAULT_SUT_DAYS_PER_YEAR;

  const lang = useLanguage();

  const daysPerYear = useMemo(() => {
    switch (type) {
      case EnergyModelingType.CSP:
        return cspDaysPerYear;
      case EnergyModelingType.SUT:
        return sutDaysPerYear;
      default:
        return defaultDaysPerYear;
    }
  }, [type, defaultDaysPerYear, cspDaysPerYear, sutDaysPerYear]);

  return (
    <MenuItem noPadding stayAfterClick>
      <Select
        style={{ marginLeft: '150px', width: '72px' }}
        value={daysPerYear}
        onChange={(value) => {
          switch (type) {
            case EnergyModelingType.BUILDING:
              useStore.getState().set((state) => {
                state.world.daysPerYear = value;
              });
              break;
            case EnergyModelingType.PV:
              useStore.getState().set((state) => {
                state.world.daysPerYear = value;
              });
              // clear the results stored in the common store
              useDataStore.setState({
                yearlyPvYield: [],
              });
              break;
            case EnergyModelingType.CSP:
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
              break;
            case EnergyModelingType.SUT:
              useStore.getState().set((state) => {
                state.world.sutDaysPerYear = value;
              });
              // clear the results stored in the common store
              useDataStore.setState({
                yearlyUpdraftTowerYield: [],
              });
              break;
          }
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
});
