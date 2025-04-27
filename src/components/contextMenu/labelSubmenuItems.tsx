/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Input, InputNumber, Space, Switch } from 'antd';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
} from './elementMenu/menuHooks';
import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useLanguage } from 'src/hooks';
import { MenuItem } from './menuItems';
import i18n from 'src/i18n/i18n';
import React from 'react';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { showError } from '../../helpers';

interface LabelSubmenuItemProps {
  element: ElementModel;
  forModelTree?: boolean;
}

interface LabelAddonBeforeProps {
  children?: React.ReactNode;
  width?: string;
}

export const LabelAddonBefore = ({ children, width = '90px' }: LabelAddonBeforeProps) => {
  return <div style={{ width: width }}>{children}</div>;
};

export const ShowLabelCheckbox = ({ element, forModelTree }: LabelSubmenuItemProps) => {
  const showLabel = useLabelShow(element);
  const lang = useLanguage();

  return forModelTree ? (
    <Space>
      <span>{i18n.t('labelSubMenu.KeepShowingLabel', lang)}</span>:
      <Switch size={'small'} checked={!!element?.showLabel} onChange={showLabel} />
    </Space>
  ) : (
    // Menu item does not update when clicked. I have to set stayAfterClick to false to fix this
    <MenuItem stayAfterClick={false} noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!element?.showLabel} onChange={showLabel}>
        {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const LabelTextInput = ({ element }: LabelSubmenuItemProps) => {
  const elements = useStore(Selector.elements);
  const { labelText, setLabelText } = useLabel(element);
  const updateLabelText = useLabelText(element, labelText);

  const lang = useLanguage();

  const update = () => {
    let used = false;
    for (const e of elements) {
      if (e.id !== element.id && e.label === labelText && labelText.trim() !== '') {
        used = true;
        break;
      }
    }
    if (used) {
      showError(i18n.t('message.LabelIsAlreadyTaken', lang));
      setLabelText('');
    } else {
      updateLabelText();
    }
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelText', lang) + ':'}</LabelAddonBefore>}
        value={labelText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
        onPressEnter={update}
        onBlur={update}
      />
    </MenuItem>
  );
};

export const LabelHeightInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelHeight = useLabelHeight(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelHeight', lang) + ':'}</LabelAddonBefore>}
        min={0.2}
        max={100}
        step={1}
        precision={1}
        value={element.labelHeight ?? 0.2}
        onChange={(value) => setLabelHeight(value!)}
      />
    </MenuItem>
  );
};

export const LabelFontSizeInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelFontSize = useLabelFontSize(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}</LabelAddonBefore>}
        min={10}
        max={100}
        step={1}
        precision={0}
        value={element.labelFontSize ?? 20}
        onChange={(value) => setLabelFontSize(value!)}
      />
    </MenuItem>
  );
};

export const LabelSizeInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelSize = useLabelSize(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelSize', lang) + ':'}</LabelAddonBefore>}
        min={0.2}
        max={5}
        step={0.1}
        precision={1}
        value={element.labelSize ?? 0.2}
        onChange={(value) => setLabelSize(value!)}
      />
    </MenuItem>
  );
};

export const LabelColorInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelColor = useLabelColor(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelColor', lang) + ':'}</LabelAddonBefore>}
        value={element.labelColor ?? '#ffffff'}
        onChange={(e) => setLabelColor(e.target.value)}
      />
    </MenuItem>
  );
};

export const createLabelSubmenu = (element: ElementModel) => {
  const items: MenuProps['items'] = [
    {
      key: `${element.type}-show-label`,
      label: <ShowLabelCheckbox element={element} />,
    },
    {
      key: `${element.type}-label-text`,
      label: <LabelTextInput element={element} />,
    },
    {
      key: `${element.type}-label-height`,
      label: <LabelHeightInput element={element} />,
    },
    {
      key: `${element.type}-label-font-size`,
      label: <LabelFontSizeInput element={element} />,
    },
    {
      key: `${element.type}-label-size`,
      label: <LabelSizeInput element={element} />,
    },
    {
      key: `${element.type}-label-color`,
      label: <LabelColorInput element={element} />,
    },
  ];

  return items;
};
