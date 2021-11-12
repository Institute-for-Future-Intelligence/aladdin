/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from '../../../stores/selector';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';

export const SensorMenu = () => {
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectedElement = getSelectedElement();
  const [labelText, setLabelText] = useState<string>(selectedElement?.label ?? '');
  const lang = { lng: language };

  const updateElementLabelText = () => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { label: labelText });
      // setUpdateFlag(!updateFlag);
    }
  };

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { showLabel: e.target.checked });
      // setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Menu>
        <Menu.Item key={'sensor-label-text'} style={{ paddingLeft: '36px' }}>
          <Input
            addonBefore={i18n.t('sensorMenu.Label', lang) + ':'}
            value={labelText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
            onPressEnter={updateElementLabelText}
            onBlur={updateElementLabelText}
          />
        </Menu.Item>
      </Menu>
      <Menu.Item key={'sensor-show-label'}>
        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
          {i18n.t('sensorMenu.KeepShowingLabel', lang)}
        </Checkbox>
      </Menu.Item>
    </>
  );
};
