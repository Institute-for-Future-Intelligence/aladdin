/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { showInfo } from 'src/helpers';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useState } from 'react';
import CreateNewProjectDialog from '../contextMenu/elementMenu/createNewProjectDialog';
import { useLanguage } from 'src/views/hooks';

const CreateNewProjectItem = () => {
  const [createNewProjectDialogVisible, setCreateNewProjectDialogVisible] = useState(false);

  const lang = useLanguage();

  const handleClick = () => {
    if (!useStore.getState().user.uid) {
      showInfo(i18n.t('menu.project.YouMustLogInToCreateProject', lang) + '.');
      return;
    }
    setCreateNewProjectDialogVisible(true);
    usePrimitiveStore.getState().set((state) => {
      state.openModelsMap = false;
    });
    if (useStore.getState().loggable) {
      useStore.getState().set((state) => {
        state.actionInfo = {
          name: 'Create New Project',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  return (
    <>
      <MenuItem noPadding onClick={handleClick}>
        {i18n.t('menu.project.CreateNewProject', lang)}...
      </MenuItem>
      {createNewProjectDialogVisible && (
        <CreateNewProjectDialog saveAs={false} setDialogVisible={setCreateNewProjectDialogVisible} />
      )}
    </>
  );
};

const SaveProjectAsItem = () => {
  const [saveProjectAsDialogVisible, setSaveProjectAsDialogVisible] = useState(false);

  const lang = useLanguage();

  const handleClick = () => {
    setSaveProjectAsDialogVisible(true);
    usePrimitiveStore.getState().set((state) => {
      state.openModelsMap = false;
    });
    if (useStore.getState().loggable) {
      useStore.getState().set((state) => {
        state.actionInfo = {
          name: 'Save Project As',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  return (
    <>
      <MenuItem noPadding onClick={handleClick}>
        {i18n.t('menu.project.SaveProjectAs', lang)}...
      </MenuItem>
      {saveProjectAsDialogVisible && (
        <CreateNewProjectDialog saveAs={true} setDialogVisible={setSaveProjectAsDialogVisible} />
      )}
    </>
  );
};

export const createProjectMenu = () => {
  const lang = { lng: useStore.getState().language };
  const user = useStore.getState().user;
  const loggable = useStore.getState().loggable;
  const projectInfo = useStore.getState().projectInfo;
  const projectView = useStore.getState().projectView;

  const setCommonStore = useStore.getState().set;

  const handleListProject = () => {
    if (!user.uid) {
      showInfo(i18n.t('menu.project.YouMustLogInToOpenProject', lang) + '.');
      return;
    }
    usePrimitiveStore.getState().set((state) => {
      state.showProjectsFlag = true;
      state.openModelsMap = false;
    });
    setCommonStore((state) => {
      state.selectedFloatingWindow = 'projectListPanel';
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Open Project',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const items: MenuProps['items'] = [];

  // create-new-project
  items.push({
    key: 'create-new-project',
    label: <CreateNewProjectItem />,
  });

  // list-project
  items.push({
    key: 'list-project',
    label: (
      <MenuItem noPadding onClick={handleListProject}>
        {i18n.t('menu.project.OpenProject', lang)}...
      </MenuItem>
    ),
  });

  // save-project-as
  if (projectView && projectInfo.title && user.uid) {
    items.push({
      key: 'save-project-as',
      label: <SaveProjectAsItem />,
    });
  }

  return items;
};
