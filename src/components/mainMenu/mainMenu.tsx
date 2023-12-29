/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useState } from 'react';
import { useStore } from '../../stores/common';
import styled from 'styled-components';
import { Dropdown, Modal } from 'antd';
import logo from 'src/assets/magic-lamp.png';
import 'antd/dist/reset.css';
import About from '../../about';
import { showInfo } from '../../helpers';
import * as Selector from '../../stores/selector';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { HOME_URL } from '../../constants';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { getExample } from '../../examples';
import { ElementCounter } from '../../stores/ElementCounter';
import { useTranslation } from 'react-i18next';
import { MenuProps } from 'antd/lib';
import { MenuItem } from '../contextMenu/menuItems';
import { createFileMenu } from './fileMenu';
import { createProjectMenu } from './projectMenu';
import { createEditMenu } from './editMenu';
import { LanguageRadioGroup } from './languageMenu';
import { createPublicMenu } from './publicMenu';
import { createViewMenu } from './viewMenu';
import { createSettingsMenu } from './settingsMenu';
import { createAccessoriesMenu } from './accessoriesMenu';
import { createAnalysisMenu } from './analysisMenu';
import { createTutorialsMenu } from './tutorialsMenu';
import { createExamplesMenu } from './exampleMenu';

const MainMenuContainer = styled.div`
  width: 100px;
`;

const StyledImage = styled.img`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  transition: 0.5s;
  opacity: 1;
  cursor: pointer;
  user-select: none;

  &:hover {
    opacity: 0.5;
  }
`;

const LabelContainer = styled.div`
  position: absolute;
  top: 54px;
  left: 0;
  width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  z-index: 9;
`;

export interface MainMenuProps {
  viewOnly: boolean;
  resetView: () => void;
  zoomView: (scale: number) => void;
  canvas?: HTMLCanvasElement | null;
}

const TUTORIALSMENUKEY = 'tutorials-submenu';
const EXAMPLESMENUKEY = 'examples-submenu';

const MainMenu = ({ viewOnly, resetView, zoomView, canvas }: MainMenuProps) => {
  const setCommonStore = useStore(Selector.set);
  const importContent = useStore(Selector.importContent);
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);

  const loggable = useStore.getState().loggable;
  const language = useStore.getState().language;
  const undoManager = useStore.getState().undoManager;
  const changed = usePrimitiveStore.getState().changed;
  const cloudFile = useStore.getState().cloudFile;
  const user = useStore.getState().user;
  const elementsToPaste = useStore.getState().elementsToPaste;
  const selectedElement = useStore.getState().selectedElement;

  usePrimitiveStore((state) => state.contextMenuFlag);

  const [aboutUs, setAboutUs] = useState(false);

  // Manually update menu when visible to avoid listen to common store change.
  const [updateMenuFlag, setUpdateMenuFlag] = useState(false);

  const handleVisibleChange = (visible: boolean) => {
    if (visible) {
      setUpdateMenuFlag(!updateMenuFlag);
    }
  };

  const { t } = useTranslation();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const isMac = useMemo(() => Util.isMac(), []);

  const keyHome = useMemo(() => {
    const os = Util.getOS();
    if (os) {
      if (os.includes('OS X')) {
        return 'Ctrl+Alt+H';
      }
      if (os.includes('Chrome')) {
        return 'Ctrl+Alt+H';
      }
    }
    return 'Ctrl+Home';
  }, []);

  const onClick: MenuProps['onClick'] = (e) => {
    if (e.keyPath.find((s) => s === TUTORIALSMENUKEY || s === EXAMPLESMENUKEY)) {
      loadFile(e.key);
    }
  };

  const loadFile = (exampleName: string) => {
    const input = getExample(exampleName);
    if (input) {
      usePrimitiveStore.getState().set((state) => {
        state.openModelsMap = false;
      });
      if (!viewOnly && changed) {
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
              importContent(input);
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
          importContent(input);
        }, 10);
      }
      if (loggable) {
        setCommonStore((state) => {
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
    if (cloudFile) {
      setCommonStore((state) => {
        state.localContentToImportAfterCloudFileUpdate = input;
      });
      usePrimitiveStore.getState().setSaveCloudFileFlag(true);
    } else {
      if (user.uid) {
        // no cloud file has been created
        setCommonStore((state) => {
          state.localContentToImportAfterCloudFileUpdate = input;
          state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
          state.showCloudFileTitleDialog = true;
        });
      } else {
        showInfo(t('menu.file.ToSaveYourWorkPleaseSignIn', lang));
      }
    }
  };

  const openAboutUs = () => {
    setAboutUs(true);
  };

  const closeAboutUs = () => {
    setAboutUs(false);
  };

  const readyToPaste = elementsToPaste && elementsToPaste.length > 0;

  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType();

  const menuItems: MenuProps['items'] = [];

  // file menu
  if (!openModelsMap) {
    menuItems.push({
      key: 'file-sub-menu',
      label: <MenuItem noPadding>{t('menu.fileSubMenu', lang)}</MenuItem>,
      children: createFileMenu(viewOnly, isMac, canvas),
    });
  }

  // project menu
  if (!openModelsMap && !viewOnly && user.uid) {
    menuItems.push({
      key: 'project-sub-menu',
      label: <MenuItem noPadding>{t('menu.projectSubMenu', lang)}</MenuItem>,
      children: createProjectMenu(),
    });
  }

  // edit menu
  if ((selectedElement || readyToPaste || undoManager.hasUndo() || undoManager.hasRedo()) && !openModelsMap) {
    menuItems.push({
      key: 'edit-sub-menu',
      label: <MenuItem noPadding>{t('menu.editSubMenu', lang)}</MenuItem>,
      children: createEditMenu(selectedElement, readyToPaste, undoManager, isMac),
    });
  }

  // view menu
  if (!openModelsMap) {
    menuItems.push({
      key: 'view-sub-menu',
      label: <MenuItem noPadding>{i18n.t('menu.viewSubMenu', lang)}</MenuItem>,
      children: createViewMenu(keyHome, isMac, zoomView, resetView),
    });
  }

  // settings menu
  if (!openModelsMap) {
    menuItems.push({
      key: 'settings-sub-menu',
      label: <MenuItem noPadding>{i18n.t('menu.settingsSubMenu', lang)}</MenuItem>,
      children: createSettingsMenu(),
    });
  }

  // accessories menu
  if (!openModelsMap) {
    menuItems.push({
      key: 'accessories-sub-menu',
      label: <MenuItem noPadding>{i18n.t('menu.view.accessoriesSubMenu', lang)}</MenuItem>,
      children: createAccessoriesMenu(),
    });
  }

  // analysis menu
  if (!openModelsMap && elementCounter.gotSome()) {
    menuItems.push({
      key: 'analysis-sub-menu',
      label: <MenuItem noPadding>{i18n.t('menu.analysisSubMenu', lang)}</MenuItem>,
      children: createAnalysisMenu(elementCounter),
    });
  }

  // tutorials menu
  menuItems.push({
    key: TUTORIALSMENUKEY,
    label: <MenuItem noPadding>{i18n.t('menu.tutorialsSubMenu', lang)}</MenuItem>,
    children: createTutorialsMenu(viewOnly),
  });

  // example menu
  menuItems.push({
    key: EXAMPLESMENUKEY,
    label: <MenuItem noPadding>{i18n.t('menu.examplesSubMenu', lang)}</MenuItem>,
    children: createExamplesMenu(),
  });

  // public menu
  menuItems.push({
    key: 'public-sub-menu',
    label: <MenuItem noPadding>{i18n.t('menu.publicSubMenu', lang)}</MenuItem>,
    children: createPublicMenu(user.uid, viewOnly, openModelsMap),
  });

  // language menu
  menuItems.push({
    key: 'language-sub-menu',
    label: <MenuItem noPadding>{i18n.t('menu.languageSubMenu', lang)}</MenuItem>,
    children: [
      {
        key: 'language-radio-group',
        label: <LanguageRadioGroup />,
        style: { backgroundColor: 'white' },
      },
    ],
  });

  // about window
  menuItems.push({
    key: 'about-us-window',
    label: (
      <MenuItem noPadding onClick={openAboutUs}>
        {i18n.t('menu.AboutUs', lang)}...
      </MenuItem>
    ),
  });

  return (
    <>
      <Dropdown menu={{ items: menuItems, onClick }} trigger={['click']} onOpenChange={handleVisibleChange}>
        <MainMenuContainer>
          <StyledImage src={logo} title={t('tooltip.clickToOpenMenu', lang)} />
          <LabelContainer>
            <span style={{ fontSize: '10px', alignContent: 'center', cursor: 'pointer' }}>
              {t('menu.mainMenu', lang)}
            </span>
          </LabelContainer>
        </MainMenuContainer>
      </Dropdown>
      {aboutUs && <About close={closeAboutUs} />}
    </>
  );
};

export default React.memo(MainMenu);
