/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel } from '../../../models/WindowModel';
import MullionWidthInput from './windowMullionWidthInput';
import MullionSpacingInput from './windowMullionSpacingInput';
import { Checkbox, Divider, Menu } from 'antd';
import i18n from 'src/i18n/i18n';
import WindowShutterSubMenu from './windowShutterSubMenu';
import SubMenu from 'antd/lib/menu/SubMenu';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from 'src/types';
import WindowItemSelection from './windowItemSelection';
import WindowOpacityInput from './windowOpacityInput';

export enum WindowDataType {
  Color = 'Color',
  Tint = 'Tint',
  Opacity = 'Opacity',
  MullionWidth = 'MullionWidth',
  MullionSpacing = 'MullionSpacing',
}

type ItemSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

const DialogSetting = {
  Color: { attributeKey: 'color' },
  Tint: { attributeKey: 'tint' },
  Opacity: { attributeKey: 'opaticy' },
  MullionWidth: { attributeKey: 'mullionWidth' },
  MullionSpacing: { attributeKey: 'mullionSpacing' },
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

  const [visibleType, setVisibleType] = useState<WindowDataType | null>(null);

  const lang = { lng: language };
  const paddingLeft = '36px';

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
      </SubMenu>
    );
  };

  const renderDialogs = () => {
    switch (visibleType) {
      case WindowDataType.Color:
      case WindowDataType.Tint:
        const setting = DialogSetting[visibleType] as ItemSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowItemSelection
            window={window!}
            dataType={visibleType}
            attributeKey={setting.attributeKey}
            setDialogVisible={() => setVisibleType(null)}
          />
        );
      case WindowDataType.Opacity:
        return <WindowOpacityInput setDialogVisible={() => setVisibleType(null)} />;
      case WindowDataType.MullionSpacing:
        return <MullionSpacingInput setDialogVisible={() => setVisibleType(null)} />;
      case WindowDataType.MullionWidth:
        return <MullionWidthInput setDialogVisible={() => setVisibleType(null)} />;
    }
  };

  if (!window) return null;
  return (
    <Menu.ItemGroup>
      {renderCut()}
      <Copy keyName={'window-copy'} />
      <Lock keyName={'window-lock'} />

      {!window.locked && (
        <>
          {renderMenuItem(WindowDataType.Opacity)}

          {renderMenuItem(WindowDataType.Tint)}

          {renderMullionSubMenu()}

          <WindowShutterSubMenu windowId={window.id} />

          {renderDialogs()}
        </>
      )}
    </Menu.ItemGroup>
  );
};
