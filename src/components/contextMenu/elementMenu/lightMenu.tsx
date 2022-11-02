/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { InputNumber, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { LightModel } from '../../../models/LightModel';

export const LightMenu = () => {
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const light = useStore(Selector.selectedElement) as LightModel;

  const lang = { lng: language };

  return (
    light && (
      <>
        <Copy keyName={'light-copy'} />
        <Cut keyName={'light-cut'} />
        <Lock keyName={'light-lock'} />
        <Menu>
          <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'light-intensity'}>
            <Space style={{ width: '60px' }}>{i18n.t('lightMenu.Intensity', lang)}:</Space>
            <InputNumber
              min={0.01}
              max={10}
              step={0.01}
              precision={2}
              value={light.intensity}
              onChange={(value) => {
                if (value) {
                  const oldValue = light.intensity;
                  const newValue = value;
                  const undoableChange = {
                    name: 'Set Light Intensity',
                    timestamp: Date.now(),
                    oldValue: oldValue,
                    newValue: newValue,
                    undo: () => {
                      //setAlbedo(undoableChange.oldValue as number);
                    },
                    redo: () => {
                      //setAlbedo(undoableChange.newValue as number);
                    },
                  } as UndoableChange;
                  addUndoable(undoableChange);
                  //setAlbedo(newValue);
                }
              }}
            />
          </Menu.Item>
        </Menu>
      </>
    )
  );
};
