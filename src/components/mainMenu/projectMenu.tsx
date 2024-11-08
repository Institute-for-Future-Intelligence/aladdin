/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { showInfo } from 'src/helpers';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { CreateNewProjectItem } from './createNewProjectItem';
import { SaveProjectAsItem } from './saveProjectAsItem';

export const createProjectMenu = () => {
  const lang = { lng: useStore.getState().language };
  const user = useStore.getState().user;
  const loggable = useStore.getState().loggable;
  const projectState = useStore.getState().projectState;
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
          name: 'Open Project List',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const items: MenuProps['items'] = [];

  items.push({
    key: 'create-new-project',
    label: <CreateNewProjectItem />,
  });

  items.push({
    key: 'list-project',
    label: (
      <MenuItem noPadding onClick={handleListProject}>
        {i18n.t('menu.project.OpenProject', lang)}...
      </MenuItem>
    ),
  });

  if (projectView && projectState.title && user.uid) {
    items.push({
      key: 'save-project-as',
      label: <SaveProjectAsItem />,
    });
  }

  return items;
};
