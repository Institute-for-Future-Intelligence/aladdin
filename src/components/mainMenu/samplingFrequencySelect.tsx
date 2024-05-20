/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { useLanguage } from 'src/hooks';
import React, { useMemo } from 'react';
import { EnergyModelingType } from '../../types';
import * as Selector from '../../stores/selector';

const { Option } = Select;

export const SamplingFrequencySelect = React.memo(({ type }: { type: EnergyModelingType }) => {
  const defaultTimesPerHour = useStore(Selector.world.timesPerHour);
  const cspTimesPerHour = useStore(Selector.world.cspTimesPerHour);
  const sutTimesPerHour = useStore(Selector.world.sutTimesPerHour);

  const lang = useLanguage();

  const timesPerHour = useMemo(() => {
    switch (type) {
      case EnergyModelingType.CSP:
        return cspTimesPerHour;
      case EnergyModelingType.SUT:
        return sutTimesPerHour;
      default:
        return defaultTimesPerHour;
    }
  }, [type, defaultTimesPerHour, cspTimesPerHour, sutTimesPerHour]);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
      <Select
        style={{ width: '72px' }}
        value={timesPerHour ?? 4}
        onChange={(value) => {
          useStore.getState().set((state) => {
            switch (type) {
              case EnergyModelingType.CSP:
                state.world.cspTimesPerHour = value;
                break;
              case EnergyModelingType.SUT:
                state.world.sutTimesPerHour = value;
                break;
              default:
                state.world.timesPerHour = value;
                break;
            }
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
});
