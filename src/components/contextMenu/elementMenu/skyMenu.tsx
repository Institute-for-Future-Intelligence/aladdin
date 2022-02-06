/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, InputNumber, Menu, Radio, Space } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Theme } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';

export const SkyMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const language = useStore(Selector.language);
  const airAttenuationCoefficient = useStore(Selector.world.airAttenuationCoefficient) ?? 0.01;

  const lang = { lng: language };

  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  const setAxes = (checked: boolean) => {
    setCommonStore((state) => {
      state.viewState.axes = checked;
    });
  };

  const setTheme = (theme: string) => {
    setCommonStore((state) => {
      state.viewState.theme = theme;
    });
  };

  const setAirAttenuationCoefficient = (value: number) => {
    setCommonStore((state) => {
      state.world.airAttenuationCoefficient = value;
    });
  };

  return (
    <>
      <Menu.Item key={'axes'}>
        <Checkbox
          checked={axes}
          onChange={(e) => {
            const checked = e.target.checked;
            const undoableCheck = {
              name: 'Show Axes',
              timestamp: Date.now(),
              checked: checked,
              undo: () => {
                setAxes(!undoableCheck.checked);
              },
              redo: () => {
                setAxes(undoableCheck.checked);
              },
            } as UndoableCheck;
            addUndoable(undoableCheck);
            setAxes(checked);
          }}
        >
          {i18n.t('skyMenu.Axes', lang)}
        </Checkbox>
      </Menu.Item>
      <SubMenu key={'theme'} title={i18n.t('skyMenu.Theme', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={theme}
          style={{ height: '135px' }}
          onChange={(e) => {
            const oldTheme = theme;
            const newTheme = e.target.value;
            const undoableChange = {
              name: 'Select Theme',
              timestamp: Date.now(),
              oldValue: oldTheme,
              newValue: newTheme,
              undo: () => {
                setTheme(undoableChange.oldValue as string);
              },
              redo: () => {
                setTheme(undoableChange.newValue as string);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            setTheme(newTheme);
          }}
        >
          <Radio style={radioStyle} value={Theme.Default}>
            {i18n.t('skyMenu.ThemeDefault', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Desert}>
            {i18n.t('skyMenu.ThemeDesert', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Forest}>
            {i18n.t('skyMenu.ThemeForest', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Grassland}>
            {i18n.t('skyMenu.ThemeGrassland', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>

      <Menu>
        <Menu.Item style={{ paddingLeft: '36px' }} key={'air-attenuation-coefficient'}>
          <Space style={{ width: '250px' }}>{i18n.t('skyMenu.SunlightAttenuationCoefficientInAir', lang) + ':'}</Space>
          <InputNumber
            min={0}
            max={0.1}
            step={0.001}
            precision={3}
            value={airAttenuationCoefficient}
            onChange={(value) => {
              if (value) {
                const oldAttenuationCoefficient = airAttenuationCoefficient;
                const newAttenuationCoefficient = value;
                const undoableChange = {
                  name: 'Set Sunlight Attenuation Coefficient of Air',
                  timestamp: Date.now(),
                  oldValue: oldAttenuationCoefficient,
                  newValue: newAttenuationCoefficient,
                  undo: () => {
                    setAirAttenuationCoefficient(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setAirAttenuationCoefficient(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setAirAttenuationCoefficient(newAttenuationCoefficient);
              }
            }}
          />
        </Menu.Item>
      </Menu>
    </>
  );
};
