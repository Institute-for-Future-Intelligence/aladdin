/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ColorResult, CompactPicker } from 'react-color';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { UndoableDelete } from '../../undo/UndoableDelete';
import { UndoablePaste } from '../../undo/UndoablePaste';

export const Paste = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const pasteElements = useStore(Selector.pasteElementsToPoint);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const removeElementById = useStore(Selector.removeElementById);
  const addUndoable = useStore(Selector.addUndoable);

  const isMac = Util.getOS()?.startsWith('Mac');

  const paste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const pastedElements = pasteElements();
      if (pastedElements.length > 0) {
        const undoablePaste = {
          name: 'Paste to Point',
          timestamp: Date.now(),
          pastedElements: JSON.parse(JSON.stringify(pastedElements)),
          undo: () => {
            for (const elem of undoablePaste.pastedElements) {
              removeElementById(elem.id, false);
            }
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(...undoablePaste.pastedElements);
              state.selectedElement = undoablePaste.pastedElements[0];
            });
          },
        } as UndoablePaste;
        addUndoable(undoablePaste);
      }
    }
  };

  return (
    <Menu.Item key={'ground-paste'} onClick={paste} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Paste', { lng: language })}
      <label style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</label>
    </Menu.Item>
  );
};

export const Copy = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore(Selector.language);
  const copyElementById = useStore(Selector.copyElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
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
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const removeElementById = useStore(Selector.removeElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const isMac = Util.getOS()?.startsWith('Mac');

  const cut = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      removeElementById(selectedElement.id, true);
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
            removeElementById(elem.id, true);
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
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
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
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
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
