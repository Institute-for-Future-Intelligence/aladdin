/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import styled from 'styled-components';
import { Avatar, Button, Dropdown, Menu, Space } from 'antd';
import MainToolBarButtons from './mainToolBarButtons';
import i18n from './i18n/i18n';
import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { usePrimitiveStore } from './stores/commonPrimitive';

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

const MainToolBar = ({ signIn, signOut }: MainToolBarProps) => {
  const language = useStore(Selector.language);
  const user = useStore(Selector.user);
  const openModelsMap = useStore(Selector.openModelsMap);

  const lang = { lng: language };

  const avatarMenu = (
    <Menu triggerSubMenuAction={'click'}>
      <Menu.Item
        key="account"
        onClick={() => {
          usePrimitiveStore.setState((state) => {
            state.showAccountSettingsPanel = true;
          });
        }}
      >
        {i18n.t('avatarMenu.AccountSettings', lang)}
      </Menu.Item>
      <Menu.Item key="signOut" onClick={signOut}>
        {i18n.t('avatarMenu.SignOut', lang)}
      </Menu.Item>
    </Menu>
  );

  return (
    <ButtonsContainer>
      <Space direction="horizontal">
        {!openModelsMap && <MainToolBarButtons />}
        <div style={{ verticalAlign: 'top' }}>
          {user.displayName ? (
            <Dropdown overlay={avatarMenu} trigger={['click']}>
              <a
                className="ant-dropdown-link"
                onClick={(e) => e.preventDefault()}
                title={i18n.t('tooltip.clickToAccessCloudTools', lang)}
              >
                <Avatar size={32} src={user.photoURL} alt={user.displayName} />
              </a>
            </Dropdown>
          ) : (
            <Button type="primary" title={i18n.t('avatarMenu.PrivacyInfo', lang)} onClick={signIn}>
              {i18n.t('avatarMenu.SignIn', lang)}
            </Button>
          )}
        </div>
      </Space>
    </ButtonsContainer>
  );
};

export default React.memo(MainToolBar);
