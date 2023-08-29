/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { useDataStore } from '../../../stores/commonData';

const CspSimulationSettings = ({ name }: { name: string }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const cspTimesPerHour = useStore(Selector.world.cspTimesPerHour);
  const cspDaysPerYear = useStore(Selector.world.cspDaysPerYear);
  const cspGridCellSize = useStore(Selector.world.cspGridCellSize);

  const lang = { lng: language };
  const { SubMenu } = Menu;
  const { Option } = Select;

  return (
    <SubMenu key={name + '-analysis-options'} title={i18n.t('menu.AnalysisOptions', lang)}>
      <Menu>
        <Menu.Item key={name + '-simulation-sampling-frequency'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
          <Select
            style={{ width: '72px' }}
            value={cspTimesPerHour ?? 4}
            onChange={(value) => {
              setCommonStore((state) => {
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
        </Menu.Item>
        <Menu.Item key={name + '-simulation-sampling-days'}>
          <Select
            style={{ marginLeft: '150px', width: '72px' }}
            value={cspDaysPerYear ?? 6}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.cspDaysPerYear = value;
              });
              // clear the results stored in the common store
              useDataStore.setState((state) => {
                state.yearlyParabolicTroughYield = [];
                state.yearlyParabolicDishYield = [];
                state.yearlyFresnelReflectorYield = [];
                state.yearlyHeliostatYield = [];
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
        <Menu.Item key={name + '-simulation-grid-cell-size'}>
          <Space style={{ width: '150px' }}>{i18n.t('menu.option.GridCellSize', lang) + ':'}</Space>
          <InputNumber
            min={0.1}
            max={20}
            step={0.05}
            style={{ width: 72 }}
            precision={2}
            value={cspGridCellSize ?? 0.5}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.cspGridCellSize = value;
              });
            }}
          />
          <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
        </Menu.Item>
      </Menu>
    </SubMenu>
  );
};

export default CspSimulationSettings;
