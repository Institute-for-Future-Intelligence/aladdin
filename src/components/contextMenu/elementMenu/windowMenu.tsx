/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel, WindowType } from '../../../models/WindowModel';
import { Checkbox, Divider, Menu, Radio } from 'antd';
import i18n from 'src/i18n/i18n';
import WindowShutterSubMenu from './windowShutterSubMenu';
import SubMenu from 'antd/lib/menu/SubMenu';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from 'src/types';
import WindowItemSelection from './windowItemSelection';
import WindowNumberInput from './windowNumberInput';
import { radioStyle } from './wallMenu';
import { UndoableChange } from 'src/undo/UndoableChange';

export enum WindowDataType {
  Color = 'Color',
  Tint = 'Tint',
  Opacity = 'Opacity',
  MullionWidth = 'MullionWidth',
  MullionSpacing = 'MullionSpacing',
  MullionColor = 'MullionColor',
  FrameWidth = 'FrameWidth',
  Width = 'Width',
  Height = 'Height',
  Insulation = 'Insulation',
}

type ItemSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

type NumberDialogSettingType = {
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

const SelectionDialogSettings = {
  Tint: { attributeKey: 'tint' },
  Opacity: { attributeKey: 'opaticy' },
  Color: { attributeKey: 'color' },
  MullionColor: { attributeKey: 'mullionColor' },
};

const NumberDialogSettings = {
  Opacity: { attributeKey: 'opacity', range: [0, 1], step: 0.1 },
  Width: { attributeKey: 'lx', range: [0.1, 100], step: 0.1 },
  Height: { attributeKey: 'lz', range: [0.1, 100], step: 0.1 },
  MullionWidth: { attributeKey: 'mullionWidth', range: [0, 0.2], step: 0.1, unit: 'word.MeterAbbreviation' },
  MullionSpacing: { attributeKey: 'mullionSpacing', range: [0.1, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  FrameWidth: { attributeKey: 'frameWidth', range: [0.05, 0.2], step: 0.01, unit: 'word.MeterAbbreviation' },
};

const getSelectedWindow = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Window) {
      return el as WindowModel;
    }
  }
  return null;
};

export const WindowMenu = () => {
  const window = useStore(getSelectedWindow);
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const updateWindowMullionById = useStore(Selector.updateWindowMullionById);
  const updateWindowTypeById = useStore(Selector.updateWindowTypeById);

  const [visibleType, setVisibleType] = useState<WindowDataType | null>(null);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const updateWindowFrameById = (id: string, checked: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WindowModel).frame = checked;
          break;
        }
      }
    });
  };

  const renderCut = () => {
    if (!window || window.locked) {
      return null;
    }
    return <Cut keyName={'window-cut'} />;
  };

  const renderMenuItem = (dataType: WindowDataType) => {
    return (
      <Menu.Item
        key={`window-${dataType}`}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setApplyCount(0);
          setVisibleType(dataType);
        }}
      >
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </Menu.Item>
    );
  };

  const renderMullionSubMenu = () => {
    if (!window) return null;

    return (
      <SubMenu key={'window-mullion'} title={i18n.t('windowMenu.Mullion', lang)} style={{ paddingLeft: '24px' }}>
        <Menu.Item key={'mullion'}>
          <Checkbox
            checked={window.mullion}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Mullion',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: window.id,
                selectedElementType: window.type,
                undo: () => {
                  updateWindowMullionById(window.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateWindowMullionById(window.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateWindowMullionById(window.id, checked);
              setCommonStore((state) => {
                state.actionState.windowMullion = checked;
              });
            }}
          >
            {i18n.t('windowMenu.Mullion', { lng: language })}
          </Checkbox>
        </Menu.Item>

        <Divider plain style={{ margin: '6px' }} />

        {renderMenuItem(WindowDataType.MullionWidth)}
        {renderMenuItem(WindowDataType.MullionSpacing)}
        {renderMenuItem(WindowDataType.MullionColor)}
      </SubMenu>
    );
  };

  const renderFrameSubMenu = () => {
    if (!window) return null;

    return (
      <SubMenu key={'window-frame'} title={i18n.t('windowMenu.Frame', lang)} style={{ paddingLeft: '24px' }}>
        <Menu.Item key={'frame'}>
          <Checkbox
            checked={window.frame}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Frame',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: window.id,
                selectedElementType: window.type,
                undo: () => {
                  updateWindowFrameById(window.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateWindowFrameById(window.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateWindowFrameById(window.id, checked);
              setCommonStore((state) => {
                state.actionState.windowFrame = checked;
              });
            }}
          >
            {i18n.t('windowMenu.Frame', { lng: language })}
          </Checkbox>
        </Menu.Item>

        <Divider plain style={{ margin: '6px' }} />

        {renderMenuItem(WindowDataType.FrameWidth)}
        {renderMenuItem(WindowDataType.Color)}
      </SubMenu>
    );
  };

  const renderTypeSubMenu = () => {
    if (!window) {
      return null;
    }
    return (
      <SubMenu key={'window-type'} title={i18n.t('windowMenu.WindowType', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={window.windowType ?? WindowType.Default}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Window Type',
              timestamp: Date.now(),
              oldValue: window.windowType,
              newValue: e.target.value,
              changedElementId: window.id,
              changedElementType: window.type,
              undo: () => {
                updateWindowTypeById(undoableChange.changedElementId, undoableChange.oldValue as WindowType);
              },
              redo: () => {
                updateWindowTypeById(undoableChange.changedElementId, undoableChange.newValue as WindowType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateWindowTypeById(window.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.windowType = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={WindowType.Default}>
            {i18n.t('windowMenu.Default', lang)}
          </Radio>
          <Radio style={radioStyle} value={WindowType.Arched}>
            {i18n.t('windowMenu.Arched', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderDialogs = () => {
    switch (visibleType) {
      case WindowDataType.Tint:
      case WindowDataType.MullionColor:
      case WindowDataType.Color: {
        const setting = SelectionDialogSettings[visibleType] as ItemSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowItemSelection
            window={window!}
            dataType={visibleType}
            attributeKey={setting.attributeKey}
            setDialogVisible={() => setVisibleType(null)}
          />
        );
      }
      case WindowDataType.Opacity:
      case WindowDataType.Width:
      case WindowDataType.Height:
      case WindowDataType.MullionSpacing:
      case WindowDataType.MullionWidth:
      case WindowDataType.FrameWidth: {
        const setting = NumberDialogSettings[visibleType] as NumberDialogSettingType;
        if (!setting) return null;
        return (
          <WindowNumberInput
            windowElement={window!}
            dataType={visibleType}
            attributeKey={setting.attributeKey}
            range={setting.range}
            step={setting.step}
            setDialogVisible={() => setVisibleType(null)}
            unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
          />
        );
      }
    }
  };

  if (!window) return null;
  return (
    <Menu.ItemGroup>
      <Copy keyName={'window-copy'} />
      {renderCut()}
      <Lock keyName={'window-lock'} />

      {!window.locked && (
        <>
          {renderMenuItem(WindowDataType.Width)}
          {renderMenuItem(WindowDataType.Height)}
          {renderMenuItem(WindowDataType.Opacity)}
          {renderMenuItem(WindowDataType.Tint)}
          {renderTypeSubMenu()}
          {renderMullionSubMenu()}
          {renderFrameSubMenu()}
          <WindowShutterSubMenu windowId={window.id} />
          {renderDialogs()}
        </>
      )}
    </Menu.ItemGroup>
  );
};
