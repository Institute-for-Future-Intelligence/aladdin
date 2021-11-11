/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu } from 'antd';
import { useStore } from '../../stores/common';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ColorResult, CompactPicker } from 'react-color';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { UndoableDelete } from '../../undo/UndoableDelete';
import * as Selector from '../../stores/selector';
import { ElementModel } from '../../models/ElementModel';
import { ObjectType } from '../../types';
import { WallModel } from '../../models/WallModel';

export const Paste = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore((state) => state.language);
  const pasteElement = useStore((state) => state.pasteElementToPoint);
  const isMac = Util.getOS()?.startsWith('Mac');

  return (
    <Menu.Item key={'ground-paste'} onClick={pasteElement} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Paste', { lng: language })}
      <label style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</label>
    </Menu.Item>
  );
};

export const Copy = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore((state) => state.language);
  const copyElementById = useStore((state) => state.copyElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const isMac = Util.getOS()?.startsWith('Mac');

  const copyElement = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      copyElementById(selectedElement.id);
    }
  };

  return (
    <Menu.Item key={'foundation-copy'} onClick={copyElement} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Copy', { lng: language })}
      <label style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+C)</label>
    </Menu.Item>
  );
};

export const Cut = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const setCommonStore = useStore((state) => state.set);
  const language = useStore((state) => state.language);
  const cutElementById = useStore((state) => state.cutElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const getElementById = useStore(Selector.getElementById);
  const updateElementById = useStore(Selector.updateElementById);
  const addUndoable = useStore((state) => state.addUndoable);
  const isMac = Util.getOS()?.startsWith('Mac');

  const cutElement = (elem: ElementModel) => {
    if (elem.type === ObjectType.Wall) {
      const currentWall = elem as WallModel;
      if (currentWall.leftJoints.length > 0) {
        const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
        if (targetWall) {
          updateElementById(targetWall.id, { rightOffset: 0, rightJoints: [] });
        }
      }
      if (currentWall.rightJoints.length > 0) {
        const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
        if (targetWall) {
          updateElementById(targetWall.id, { leftOffset: 0, leftJoints: [] });
        }
      }
      setCommonStore((state) => {
        state.deletedWallID = elem.id;
      });
    }
    cutElementById(elem.id);
  };

  const cut = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      cutElement(selectedElement);
      // do not use {...selectedElement} as it does not do deep copy
      const clonedElement = JSON.parse(JSON.stringify(selectedElement));
      clonedElement.selected = false;
      const undoableCut = {
        name: 'Cut',
        timestamp: Date.now(),
        deletedElement: clonedElement,
        undo: () => {
          setCommonStore((state) => {
            state.elements.push(undoableCut.deletedElement);
            state.selectedElement = undoableCut.deletedElement;
          });
          // clonedElement.selected = true; FIXME: Why does this become readonly?
        },
        redo: () => {
          const elem = getElementById(undoableCut.deletedElement.id);
          if (elem) {
            cutElement(elem);
          }
        },
      } as UndoableDelete;
      addUndoable(undoableCut);
    }
  };

  return (
    <Menu.Item key={'foundation-cut'} onClick={cut} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Cut', { lng: language })}
      <label style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+X)</label>
    </Menu.Item>
  );
};

export const Lock = () => {
  const language = useStore((state) => state.language);
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();

  const lockElement = (on: boolean) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { locked: on });
      // setUpdateFlag(!updateFlag);
    }
  };

  return (
    <Menu.Item key={'foundation-lock'}>
      <Checkbox
        checked={selectedElement?.locked}
        onChange={(e) => {
          lockElement(e.target.checked);
        }}
      >
        {i18n.t('word.Lock', { lng: language })}
      </Checkbox>
    </Menu.Item>
  );
};

export const ColorPicker = () => {
  const language = useStore((state) => state.language);
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();

  const changeElementColor = (colorResult: ColorResult) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { color: colorResult.hex });
    }
  };

  return (
    <SubMenu key={'color'} title={i18n.t('word.Color', { lng: language })} style={{ paddingLeft: '24px' }}>
      <CompactPicker color={selectedElement?.color} onChangeComplete={changeElementColor} />
    </SubMenu>
  );
};
