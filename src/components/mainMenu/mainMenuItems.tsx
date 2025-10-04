/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CommonStoreState, useStore } from 'src/stores/common';
import { Checkbox, Modal, Space, Switch } from 'antd';
import { ClickEvent, EventHandler, MenuItem, SubMenu, SubMenuProps } from '@szhsin/react-menu';
import { getExample } from 'src/examples';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { t } from 'i18next';
import { useLanguage } from 'src/hooks';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { HOME_URL } from 'src/constants';
import { showInfo } from 'src/helpers';

interface LabelMarkProps {
  children?: React.ReactNode;
}

interface MainMenuCheckboxProps {
  selector: (state: CommonStoreState) => CommonStoreState[keyof CommonStoreState];
  onChange: (e: CheckboxChangeEvent) => void;
  children?: React.ReactNode;
  negate?: boolean;
}

interface MainMenuSwitchProps {
  selector: (state: CommonStoreState) => CommonStoreState[keyof CommonStoreState];
  onChange: (e: boolean) => void;
  children?: React.ReactNode;
}

interface MainMenuItemProps {
  hasPadding?: boolean;
  stayAfterClick?: boolean;
  onClick?: EventHandler<ClickEvent>;
  children?: React.ReactNode;
}

interface ExampleMenuItemProps {
  fileName: string;
  children?: React.ReactNode;
}

export const MainSubMenu = (props: SubMenuProps) => {
  return <SubMenu {...props} menuStyle={{ minWidth: '5rem', padding: '2px', borderRadius: '0.35rem' }} />;
};

export const MainMenuItem = ({ hasPadding, stayAfterClick, onClick, children }: MainMenuItemProps) => {
  return (
    <MenuItem
      style={{ paddingLeft: hasPadding ? '36px' : '12px', paddingRight: '12px' }}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (stayAfterClick) e.keepOpen = true;
      }}
    >
      <span>{children}</span>
    </MenuItem>
  );
};

export const ExampleMenuItem = ({ fileName, children }: ExampleMenuItemProps) => {
  const lang = useLanguage();

  const loadFile = (exampleName: string) => {
    const input = getExample(exampleName);
    if (input) {
      const params = new URLSearchParams(window.location.search);
      const viewOnly = params.get('viewonly') === 'true';

      usePrimitiveStore.getState().set((state) => {
        state.openModelsMap = false;
      });
      if (!viewOnly && usePrimitiveStore.getState().changed) {
        Modal.confirm({
          title: t('message.DoYouWantToSaveChanges', lang),
          icon: <ExclamationCircleOutlined />,
          onOk: () => saveAndImport(input),
          onCancel: () => {
            usePrimitiveStore.getState().set((state) => {
              state.waiting = true;
            });
            // give it a brief moment for this modal to close
            // this may also put the function call to the last in the event queue
            setTimeout(() => {
              useStore.getState().importContent(input);
            }, 10);
          },
          okText: t('word.Yes', lang),
          cancelText: t('word.No', lang),
        });
      } else {
        usePrimitiveStore.getState().set((state) => {
          state.waiting = true;
        });
        // give it a brief moment for the loading spinner to show
        // this may also put the function call to the last in the event queue
        setTimeout(() => {
          useStore.getState().importContent(input);
        }, 10);
      }
      if (useStore.getState().loggable) {
        useStore.getState().set((state) => {
          state.actionInfo = {
            name: 'Open Example: ' + exampleName,
            timestamp: new Date().getTime(),
          };
        });
      }
      if (!viewOnly) {
        window.history.pushState({}, document.title, HOME_URL);
      }
    }
  };

  const saveAndImport = (input: any) => {
    if (useStore.getState().cloudFile) {
      useStore.getState().set((state) => {
        state.localContentToImportAfterCloudFileUpdate = input;
      });
      usePrimitiveStore.getState().setSaveCloudFileFlag(true);
    } else {
      if (useStore.getState().user.uid) {
        // no cloud file has been created
        useStore.getState().set((state) => {
          state.localContentToImportAfterCloudFileUpdate = input;
          state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
          state.showCloudFileTitleDialog = true;
        });
      } else {
        showInfo(t('menu.file.ToSaveYourWorkPleaseSignIn', lang));
      }
    }
  };

  const onClickItem = () => {
    loadFile(fileName);
  };

  return (
    <MenuItem style={{ paddingLeft: '12px', paddingRight: '12px' }} onClick={onClickItem}>
      {children}
    </MenuItem>
  );
};

export const LabelMark = ({ children }: LabelMarkProps) => {
  return <span style={{ paddingLeft: '2px', fontSize: 9 }}>{children}</span>;
};

export const MainMenuCheckbox = ({ selector, onChange, children, negate }: MainMenuCheckboxProps) => {
  const checked = useStore(selector);
  return (
    <MainMenuItem stayAfterClick>
      <Checkbox checked={negate ? !checked : checked} onChange={onChange}>
        {children}
      </Checkbox>
    </MainMenuItem>
  );
};

export const MainMenuSwitch = ({ selector, onChange, children }: MainMenuSwitchProps) => {
  const checked = useStore(selector);
  return (
    <MainMenuItem stayAfterClick>
      <Space style={{ paddingRight: '24px' }}>{children}</Space>
      <Switch checked={checked} onChange={onChange} />
    </MainMenuItem>
  );
};
