/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CommonStoreState, useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import { Checkbox, Space, Switch } from 'antd';

interface LabelMarkProps {
  children?: React.ReactNode;
}

interface MainMenuCheckboxProps {
  selector: (state: CommonStoreState) => CommonStoreState[keyof CommonStoreState];
  onChange: (e: CheckboxChangeEvent) => void;
  children?: React.ReactNode;
}

interface MainMenuSwitchProps {
  selector: (state: CommonStoreState) => CommonStoreState[keyof CommonStoreState];
  onChange: (e: boolean) => void;
  children?: React.ReactNode;
}

export const LabelMark = ({ children }: LabelMarkProps) => {
  return <span style={{ paddingLeft: '2px', fontSize: 9 }}>{children}</span>;
};

export const MainMenuCheckbox = ({ selector, onChange, children }: MainMenuCheckboxProps) => {
  const checked = useStore(selector);
  return (
    <MenuItem noPadding stayAfterClick>
      <Checkbox style={{ width: '100%' }} checked={checked} onChange={onChange}>
        {children}
      </Checkbox>
    </MenuItem>
  );
};

export const MainMenuSwitch = ({ selector, onChange, children }: MainMenuSwitchProps) => {
  const checked = useStore(selector);
  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '280px' }}>{children}</Space>
      <Switch checked={checked} onChange={onChange} />
    </MenuItem>
  );
};
