/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu } from 'antd';
import { useStore } from '../../stores/common';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ColorResult, CompactPicker } from 'react-color';
import i18n from '../../i18n/i18n';

export const Paste = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore((state) => state.language);
  const pasteElement = useStore((state) => state.pasteElement);

  return (
    <Menu.Item key={'ground-paste'} onClick={pasteElement} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Paste', { lng: language })}
    </Menu.Item>
  );
};

export const Copy = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore((state) => state.language);
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
      {i18n.t('word.Copy', { lng: language })}
    </Menu.Item>
  );
};

export const Cut = ({ paddingLeft = '36px' }: { paddingLeft?: string }) => {
  const language = useStore((state) => state.language);
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
      {i18n.t('word.Cut', { lng: language })}
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
