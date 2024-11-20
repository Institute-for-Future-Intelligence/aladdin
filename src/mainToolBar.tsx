/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import styled from 'styled-components';
import { Avatar, Button, Dropdown, MenuProps, Modal, Space } from 'antd';
import MainToolBarButtons from './mainToolBarButtons';
import i18n from './i18n/i18n';
import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { MenuItem } from './components/contextMenu/menuItems';
import { useLanguage } from './hooks';
import { WarningOutlined } from '@ant-design/icons';

const ButtonsContainer = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  margin: 0;
  padding-bottom: 0;
  padding-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  z-index: 9;
`;

export interface MainToolBarProps {
  signIn: () => void;
  signInAnonymously: () => void;
  signOut: () => void;
}

const MainToolBar = React.memo(({ signIn, signInAnonymously, signOut }: MainToolBarProps) => {
  const user = useStore(Selector.user);
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);

  const lang = useLanguage();

  const signOutCheck = () => {
    if (user.anonymous) {
      Modal.confirm({
        title: `${i18n.t('message.SigningOutAnonymousAccount', lang)}`,
        icon: <WarningOutlined />,
        type: 'warning',
        keyboard: false, // disable Escape key so that onCancel is not called when Escape is pressed
        onOk: () => {
          // swap OK and Cancel so that ENTER maps to cancel
        },
        onCancel: () => {
          signOut();
        },
        okText: `${i18n.t('word.No', lang)}`,
        cancelText: `${i18n.t('word.Yes', lang)}`,
      });
    } else {
      signOut();
    }
  };

  const avatarMenu: MenuProps['items'] = [
    {
      key: 'account',
      label: (
        <MenuItem
          noPadding
          onClick={() => {
            usePrimitiveStore.getState().set((state) => {
              state.showAccountSettingsPanel = true;
            });
          }}
        >
          {i18n.t('avatarMenu.AccountSettings', lang)}
        </MenuItem>
      ),
    },
    {
      key: 'signOut',
      label: (
        <MenuItem noPadding onClick={signOutCheck}>
          {i18n.t('avatarMenu.SignOut', lang)}
        </MenuItem>
      ),
    },
  ];

  const signInMenu: MenuProps['items'] = [
    {
      key: 'signin-default',
      label: (
        <MenuItem noPadding onClick={signIn}>
          {i18n.t('avatarMenu.SignInAsMe', lang)}
        </MenuItem>
      ),
    },
    {
      key: 'signin-anonymously',
      label: (
        <MenuItem noPadding onClick={signInAnonymously}>
          {i18n.t('avatarMenu.SignInAnonymously', lang)}
        </MenuItem>
      ),
    },
  ];

  return (
    <ButtonsContainer>
      <Space direction="horizontal">
        {!openModelsMap && <MainToolBarButtons />}
        <div style={{ verticalAlign: 'top' }}>
          {user.displayName ? (
            <Dropdown menu={{ items: avatarMenu }} trigger={['click']}>
              <a
                className="ant-dropdown-link"
                onClick={(e) => e.preventDefault()}
                title={i18n.t('tooltip.clickToAccessAccountSettings', lang)}
              >
                <Avatar size={32} src={user.photoURL} alt={user.displayName} />
              </a>
            </Dropdown>
          ) : (
            <Dropdown menu={{ items: signInMenu }} trigger={['click']}>
              <Button type="primary">{i18n.t('avatarMenu.SignIn', lang)}</Button>
            </Dropdown>
          )}
        </div>
      </Space>
    </ButtonsContainer>
  );
});

export default MainToolBar;
