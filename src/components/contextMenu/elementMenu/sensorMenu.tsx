/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { SensorModel } from '../../../models/SensorModel';
import { ObjectType } from '../../../types';
import { useLabel, useLabelShow, useLabelText, useSelectedElement } from './menuHooks';

export const SensorMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const sensor = useSelectedElement(ObjectType.Sensor) as SensorModel | undefined;

  const { labelText, setLabelText } = useLabel(sensor);
  const showLabel = useLabelShow(sensor);
  const updateLabelText = useLabelText(sensor, labelText);

  if (!sensor) return null;

  const lang = { lng: language };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'sensor-copy'} />
      <Cut keyName={'sensor-cut'} />
      <Lock keyName={'sensor-lock'} />
      <Menu.Item key={'sensor-show-label'}>
        <Checkbox checked={!!sensor?.showLabel} onChange={showLabel}>
          {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
        </Checkbox>
      </Menu.Item>
      <Menu>
        <Menu.Item key={'sensor-label-text'} style={{ paddingLeft: '36px' }}>
          <Input
            addonBefore={i18n.t('labelSubMenu.LabelText', lang) + ':'}
            value={labelText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
            onPressEnter={updateLabelText}
            onBlur={updateLabelText}
          />
        </Menu.Item>
      </Menu>
    </Menu.ItemGroup>
  );
});
