/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { SensorModel } from '../../../models/SensorModel';

export const SensorMenu = () => {
  const language = useStore(Selector.language);
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const addUndoable = useStore(Selector.addUndoable);
  const sensor = useStore(Selector.selectedElement) as SensorModel;

  const [labelText, setLabelText] = useState<string>(sensor?.label ?? '');
  const lang = { lng: language };

  useEffect(() => {
    if (sensor) {
      setLabelText(sensor.label ?? '');
    }
  }, [sensor?.label]);

  const updateElementLabelText = () => {
    if (sensor) {
      const oldLabel = sensor.label;
      const undoableChange = {
        name: 'Set Sensor Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: sensor.id,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
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
    sensor && (
      <>
        <Copy keyName={'sensor-copy'} />
        <Cut keyName={'sensor-cut'} />
        <Lock keyName={'sensor-lock'} />
        <Menu.Item key={'sensor-show-label'}>
          <Checkbox checked={!!sensor?.showLabel} onChange={showElementLabel}>
            {i18n.t('solarCollectorMenu.KeepShowingLabel', lang)}
          </Checkbox>
        </Menu.Item>
        <Menu>
          <Menu.Item key={'sensor-label-text'} style={{ paddingLeft: '36px' }}>
            <Input
              addonBefore={i18n.t('solarCollectorMenu.Label', lang) + ':'}
              value={labelText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
              onPressEnter={updateElementLabelText}
              onBlur={updateElementLabelText}
            />
          </Menu.Item>
        </Menu>
      </>
    )
  );
};
