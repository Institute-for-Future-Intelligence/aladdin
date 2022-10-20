/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel } from '../../../models/WindowModel';
import MullionWidthInput from './windowMullionWidthInput';
import MullionSpacingInput from './windowMullionSpacingInput';
import { Checkbox, Menu } from 'antd';
import i18n from 'src/i18n/i18n';
import WindowTintSelection from './windowTintSelection';
import WindowOpacityInput from './windowOpacityInput';
import WindowShutterSubMenu from './windowShutterSubMenu';
import SubMenu from 'antd/lib/menu/SubMenu';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const WindowMenu = () => {
  const window = useStore(Selector.selectedElement) as WindowModel;

  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const updateWindowMullionById = useStore(Selector.updateWindowMullionById);

  const [mullionWidthDialogVisible, setMullionWidthDialogVisible] = useState(false);
  const [mullionSpacingDialogVisible, setMullionSpacingDialogVisible] = useState(false);
  const [tintDialogVisible, setTintDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    window && (
      <Menu.ItemGroup>
        <Copy keyName={'window-copy'} />
        <Cut keyName={'window-cut'} />
        <Lock keyName={'window-lock'} />

        {tintDialogVisible && <WindowTintSelection setDialogVisible={setTintDialogVisible} />}
        <Menu.Item
          key={'window-tint'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setTintDialogVisible(true);
          }}
        >
          {i18n.t('windowMenu.Tint', lang)} ...
        </Menu.Item>

        {opacityDialogVisible && <WindowOpacityInput setDialogVisible={setOpacityDialogVisible} />}
        <Menu.Item
          key={'window-opacity'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setOpacityDialogVisible(true);
          }}
        >
          {i18n.t('windowMenu.Opacity', lang)} ...
        </Menu.Item>

        <Menu.Item key={'mullion'}>
          <Checkbox
            checked={window.mullion === undefined ? true : window.mullion}
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
            }}
          >
            {i18n.t('windowMenu.Mullion', { lng: language })}
          </Checkbox>
        </Menu.Item>

        {window.mullion && (
          <SubMenu key={'window-mullion'} title={i18n.t('windowMenu.Mullion', lang)} style={{ paddingLeft: '24px' }}>
            {mullionWidthDialogVisible && <MullionWidthInput setDialogVisible={setMullionWidthDialogVisible} />}
            <Menu.Item
              key={'window-mullion-width'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setMullionWidthDialogVisible(true);
              }}
            >
              {i18n.t('windowMenu.MullionWidth', lang)} ...
            </Menu.Item>

            {mullionSpacingDialogVisible && <MullionSpacingInput setDialogVisible={setMullionSpacingDialogVisible} />}
            <Menu.Item
              key={'window-mullion-spacing'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setMullionSpacingDialogVisible(true);
              }}
            >
              {i18n.t('windowMenu.MullionSpacing', lang)} ...
            </Menu.Item>
          </SubMenu>
        )}

        <WindowShutterSubMenu windowId={window.id} />
      </Menu.ItemGroup>
    )
  );
};
