/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { HOME_URL } from 'src/constants';
import i18n from 'src/i18n/i18n';
import { saveImage } from 'src/helpers';
import { LabelMark } from './mainMenuItems';
import { PublishOnModelMapItem } from './publishOnModelMapItem';

export const createFileMenu = (viewOnly: boolean, isMac: boolean, canvas?: HTMLCanvasElement | null) => {
  const lang = { lng: useStore.getState().language };
  const user = useStore.getState().user;
  const cloudFile = useStore.getState().cloudFile;
  const cloudFileBelongToProject = useStore.getState().cloudFileBelongToProject;

  const undoManager = useStore.getState().undoManager;
  const loggable = useStore.getState().loggable;

  const setCommonStore = useStore.getState().set;

  const handleCreateNewFile = () => {
    undoManager.clear();
    usePrimitiveStore.getState().set((state) => {
      state.createNewFileFlag = true;
      state.openModelsMap = false;
    });
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      window.history.pushState({}, document.title, HOME_URL);
      if (loggable) {
        state.actionInfo = {
          name: 'Create New File',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const handleOpenLocalFile = () => {
    undoManager.clear();
    usePrimitiveStore.getState().set((state) => {
      state.openLocalFileFlag = true;
      state.openModelsMap = false;
    });
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      state.cloudFile = undefined;
      window.history.pushState({}, document.title, HOME_URL);
      if (loggable) {
        state.actionInfo = {
          name: 'Open Local File',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const handleSaveLocalFile = () => {
    usePrimitiveStore.getState().set((state) => {
      state.saveLocalFileDialogVisible = true;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Save as Local File',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const handleOpenCloudFile = () => {
    usePrimitiveStore.getState().set((state) => {
      state.listCloudFilesFlag = true;
      state.openModelsMap = false;
    });
    setCommonStore((state) => {
      state.selectedFloatingWindow = 'cloudFilePanel';
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'List Cloud Files',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const handleSaveCloudFile = () => {
    usePrimitiveStore.getState().setSaveCloudFileFlag(true);
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Save Cloud File',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const handleSaveAsCloudFile = () => {
    setCommonStore((state) => {
      state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
      state.showCloudFileTitleDialog = true;
      if (loggable) {
        state.actionInfo = {
          name: 'Save as Cloud File',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const handleTakeScreenShot = () => {
    if (canvas) {
      saveImage('screenshot.png', canvas.toDataURL('image/png'));
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Take Screenshot',
            timestamp: new Date().getTime(),
          };
        });
      }
      usePrimitiveStore.getState().set((state) => {
        state.openModelsMap = false;
      });
    }
  };

  const items: MenuProps['items'] = [];

  // create-new-file
  if (!viewOnly) {
    items.push({
      key: 'create-new-file',
      label: (
        <MenuItem noPadding onClick={handleCreateNewFile}>
          {i18n.t('menu.file.CreateNewFile', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+F)</LabelMark>
        </MenuItem>
      ),
    });
  }

  // open-local-file
  if (!viewOnly) {
    items.push({
      key: 'open-local-file',
      label: (
        <MenuItem noPadding onClick={handleOpenLocalFile}>
          {i18n.t('menu.file.OpenLocalFile', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+O)</LabelMark>...
        </MenuItem>
      ),
    });
  }

  // save-local-file
  items.push({
    key: 'save-local-file',
    label: (
      <MenuItem noPadding onClick={handleSaveLocalFile}>
        {i18n.t('menu.file.SaveAsLocalFile', lang)}
        <LabelMark>({isMac ? '⌘' : 'Ctrl'}+S)</LabelMark>...
      </MenuItem>
    ),
  });

  // open-cloud-file
  if (user.uid && !viewOnly) {
    items.push({
      key: 'open-cloud-file',
      label: (
        <MenuItem noPadding onClick={handleOpenCloudFile}>
          {i18n.t('menu.file.OpenCloudFile', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+Shift+O)</LabelMark>...
        </MenuItem>
      ),
    });
  }

  // save-cloud-file
  if (user.uid && cloudFile && !viewOnly && !cloudFileBelongToProject()) {
    items.push({
      key: 'save-cloud-file',
      label: (
        <MenuItem noPadding onClick={handleSaveCloudFile}>
          {i18n.t('menu.file.SaveCloudFile', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+Shift+S)</LabelMark>...
        </MenuItem>
      ),
    });
  }

  // save-as-cloud-file
  if (user.uid && !viewOnly) {
    items.push({
      key: 'save-as-cloud-file',
      label: (
        <MenuItem noPadding onClick={handleSaveAsCloudFile}>
          {i18n.t('menu.file.SaveAsCloudFile', lang)}
        </MenuItem>
      ),
    });
  }

  // publish-on-model-map
  if (!viewOnly) {
    items.push({
      key: 'publish-on-model-map',
      label: <PublishOnModelMapItem />,
    });
  }

  // screen-shot
  items.push({
    key: 'take-screen-shot',
    label: (
      <MenuItem noPadding onClick={handleTakeScreenShot}>
        {i18n.t('menu.file.TakeScreenshot', lang)}
      </MenuItem>
    ),
  });

  return items;
};
