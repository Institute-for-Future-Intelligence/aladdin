/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { SensorModel } from '../../../models/SensorModel';

export const SensorMenu = () => {
  const language = useStore(Selector.language);
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);

  const sensor = getSelectedElement() as SensorModel;
  const [labelText, setLabelText] = useState<string>(sensor?.label ?? '');
  const lang = { lng: language };

  const updateElementLabelText = () => {
    if (sensor) {
      const oldLabel = sensor.label;
      const undoableChange = {
        name: 'Set Sensor Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        undo: () => {
          updateElementLabelById(sensor.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(sensor.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(sensor.id, labelText);
    }
  };

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (sensor) {
      const undoableCheck = {
        name: 'Show Sensor Label',
        timestamp: Date.now(),
        checked: !sensor.showLabel,
        undo: () => {
          updateElementShowLabelById(sensor.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(sensor.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(sensor.id, e.target.checked);
    }
  };

  return (
    <>
      <Copy keyName={'sensor-copy'} />
      <Cut keyName={'sensor-cut'} />
      <Menu.Item key={'sensor-show-label'}>
        <Checkbox checked={!!sensor?.showLabel} onChange={showElementLabel}>
          {i18n.t('sensorMenu.KeepShowingLabel', lang)}
        </Checkbox>
      </Menu.Item>
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
    </>
  );
};
