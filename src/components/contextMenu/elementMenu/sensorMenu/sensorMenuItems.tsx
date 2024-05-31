/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { SensorModel } from 'src/models/SensorModel';
import { useLanguage } from 'src/hooks';
import { useLabel, useLabelShow, useLabelText } from '../menuHooks';
import { MenuItem } from '../../menuItems';
import { Checkbox, Input, Space } from 'antd';
import i18n from 'src/i18n/i18n';
import React from 'react';

interface SensorMenuItemProps {
  sensor: SensorModel;
  children?: React.ReactNode;
}

export const SensorShowLabelCheckbox = ({ sensor }: SensorMenuItemProps) => {
  const lang = useLanguage();
  const showLabel = useLabelShow(sensor);

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!sensor.showLabel} onChange={showLabel}>
        {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const SensorLabelTextInput = ({ sensor }: SensorMenuItemProps) => {
  const lang = useLanguage();
  const { labelText, setLabelText } = useLabel(sensor);
  const updateLabelText = useLabelText(sensor, labelText);

  return (
    <MenuItem stayAfterClick>
      <Space style={{ width: '80px' }}>{i18n.t('labelSubMenu.LabelText', lang) + ':'}</Space>
      <Input
        style={{ width: '150px' }}
        value={labelText}
        onChange={(e) => setLabelText(e.target.value)}
        onPressEnter={updateLabelText}
        onBlur={updateLabelText}
      />
    </MenuItem>
  );
};
