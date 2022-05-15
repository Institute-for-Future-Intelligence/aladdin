/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { InputNumber, Menu, Select, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';

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
          <InputNumber
            min={1}
            max={60}
            step={1}
            style={{ width: 72 }}
            precision={0}
            value={cspTimesPerHour ?? 4}
            formatter={(a) => Number(a).toFixed(0)}
            onChange={(value) => {
              setCommonStore((state) => {
                state.world.cspTimesPerHour = value;
              });
            }}
          />
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
