/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import styled from 'styled-components';
import { Avatar, Button, Dropdown, MenuProps, Popover, Space } from 'antd';
import MainToolBarButtons from './mainToolBarButtons';
import i18n from './i18n/i18n';
import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { MenuItem } from './components/contextMenu/menuItems';
import { useLanguage } from './hooks';

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
  signOut: () => void;
}

const MainToolBar = React.memo(({ signIn, signOut }: MainToolBarProps) => {
  const user = useStore(Selector.user);
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);

  const lang = useLanguage();

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
        <MenuItem noPadding onClick={signOut}>
          {i18n.t('avatarMenu.SignOut', lang)}
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
            <Popover
              title={<div onClick={(e) => e.stopPropagation()}>{i18n.t('avatarMenu.PrivacyStatementTitle', lang)}</div>}
              content={
                <div style={{ width: '280px', fontSize: '12px' }}>
                  {i18n.t('avatarMenu.PrivacyStatement', lang)}
                  <a target="_blank" rel="noopener noreferrer" href={'https://intofuture.org/aladdin-privacy.html'}>
                    {i18n.t('aboutUs.PrivacyPolicy', lang)}
                  </a>
                  .
                </div>
              }
            >
              <Button type="primary" onClick={signIn}>
                {i18n.t('avatarMenu.SignIn', lang)}
              </Button>
            </Popover>
          )}
        </div>
      </Space>
    </ButtonsContainer>
  );
});

export default MainToolBar;
