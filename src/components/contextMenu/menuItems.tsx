/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu } from 'antd';

import { useStore } from '../../stores/common';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ColorResult, CompactPicker } from 'react-color';

export const Paste = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const pasteElement = useStore((state) => state.pasteElement);

  return (
    <Menu.Item key={'ground-paste'} onClick={pasteElement} style={{ paddingLeft: paddingLeft }}>
      Paste
    </Menu.Item>
  );
};

export const Copy = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const copyElementById = useStore((state) => state.copyElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);

  const copyElement = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      copyElementById(selectedElement.id);
    }
  };

  return (
    <Menu.Item key={'foundation-copy'} onClick={copyElement} style={{ paddingLeft: paddingLeft }}>
      Copy
    </Menu.Item>
  );
};

export const Cut = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const cutElementById = useStore((state) => state.cutElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);

  const cutElement = () => {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      cutElementById(selectedElement.id);
    }
  };

  return (
    <Menu.Item key={'foundation-cut'} onClick={cutElement} style={{ paddingLeft: paddingLeft }}>
      Cut
    </Menu.Item>
  );
};

export const Lock = () => {
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
        Lock
      </Checkbox>
    </Menu.Item>
  );
};

export const ColorPicker = () => {
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();

  const changeElementColor = (colorResult: ColorResult) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { color: colorResult.hex });
    }
  };

  return (
    <SubMenu key={'color'} title={'Color'} style={{ paddingLeft: '24px' }}>
      <CompactPicker color={selectedElement?.color} onChangeComplete={changeElementColor} />
    </SubMenu>
  );
};
