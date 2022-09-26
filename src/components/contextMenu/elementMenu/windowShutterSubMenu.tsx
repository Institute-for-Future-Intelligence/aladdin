/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Divider, Menu } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from 'src/i18n/i18n';
import { WindowModel } from 'src/models/WindowModel';
import { ObjectType } from 'src/types';
import { UndoableCheckWindowShutter } from 'src/undo/UndoableCheck';
import { useState } from 'react';
import WindowShutterColorSelection from './windowShutterColorSelection';
import WindowShutterWidthInput from './windowShutterWidthInput';

enum ShutterSide {
  left = 'left',
  right = 'right',
  both = 'both',
}

const WindowShutterSubMenu = ({ windowId }: { windowId: string }) => {
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [shutterWidthDialogVisible, setShutterWidthDialogVisible] = useState(false);

  const lang = { lng: language };

  const window = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === windowId) {
        return e as WindowModel;
      }
    }
    return null;
  });

  const selectShutter = (checked: boolean, side: ShutterSide) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === windowId) {
          const w = e as WindowModel;
          switch (side) {
            case ShutterSide.left:
              w.shutter.showLeft = checked;
              break;
            case ShutterSide.right:
              w.shutter.showRight = checked;
              break;
            case ShutterSide.both:
              w.shutter.showLeft = checked;
              w.shutter.showRight = checked;
              break;
          }
          break;
        }
      }
    });
  };

  const addUndoable = (checked: boolean, side: ShutterSide) => {
    let newLeft = window?.shutter.showLeft;
    let newRight = window?.shutter.showRight;

    if (side === ShutterSide.left) {
      newLeft = checked;
    } else if (side === ShutterSide.right) {
      newRight = checked;
    } else {
      newLeft = checked;
      newRight = checked;
    }

    const setWindowShutter = (id: string, show: boolean[]) => {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === id) {
            const [showLeft, showRight] = show;
            (e as WindowModel).shutter.showLeft = showLeft;
            (e as WindowModel).shutter.showRight = showRight;
            break;
          }
        }
      });
    };

    const undoableCheck = {
      name: `${side} shutter`,
      timestamp: Date.now(),
      selectedElementId: windowId,
      selectedElementType: ObjectType.Window,
      oldShow: [window?.shutter.showLeft, window?.shutter.showRight],
      newShow: [newLeft, newRight],
      undo() {
        setWindowShutter(this.selectedElementId, this.oldShow);
      },
      redo() {
        setWindowShutter(this.selectedElementId, this.newShow);
      },
    } as UndoableCheckWindowShutter;
    useStore.getState().addUndoable(undoableCheck);
  };

  return (
    <>
      {window?.type === ObjectType.Window && (
        <SubMenu key={'window-shutter'} title={i18n.t('windowMenu.Shutter', lang)} style={{ paddingLeft: '24px' }}>
          <Menu.Item key={'left-shutter'}>
            <Checkbox
              checked={window ? window?.shutter.showLeft : false}
              onChange={(e) => {
                const checked = e.target.checked;
                addUndoable(checked, ShutterSide.left);
                selectShutter(checked, ShutterSide.left);
              }}
            >
              {i18n.t('windowMenu.LeftShutter', { lng: language })}
            </Checkbox>
          </Menu.Item>

          <Menu.Item key={'right-shutter'}>
            <Checkbox
              checked={window ? window?.shutter.showRight : false}
              onChange={(e) => {
                const checked = e.target.checked;
                addUndoable(checked, ShutterSide.right);
                selectShutter(checked, ShutterSide.right);
              }}
            >
              {i18n.t('windowMenu.RightShutter', { lng: language })}
            </Checkbox>
          </Menu.Item>

          <Menu.Item key={'both-shutters'}>
            <Checkbox
              checked={window ? window?.shutter.showLeft && window?.shutter.showRight : false}
              onChange={(e) => {
                const checked = e.target.checked;
                addUndoable(checked, ShutterSide.both);
                selectShutter(checked, ShutterSide.both);
              }}
            >
              {i18n.t('windowMenu.BothShutters', { lng: language })}
            </Checkbox>
          </Menu.Item>

          <Divider plain style={{ margin: '6px' }} />

          {colorDialogVisible && <WindowShutterColorSelection setDialogVisible={setColorDialogVisible} />}
          <Menu.Item
            key={'shutter-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setColorDialogVisible(true);
            }}
          >
            {i18n.t('windowMenu.ShutterColor', lang)} ...
          </Menu.Item>

          {shutterWidthDialogVisible && <WindowShutterWidthInput setDialogVisible={setShutterWidthDialogVisible} />}
          <Menu.Item
            key={'shutter-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setShutterWidthDialogVisible(true);
            }}
          >
            {i18n.t('windowMenu.ShutterWidth', lang)} ...
          </Menu.Item>
        </SubMenu>
      )}
    </>
  );
};

export default WindowShutterSubMenu;
