/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { showInfo } from 'src/helpers';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useState } from 'react';
import CreateNewProjectDialog from '../contextMenu/elementMenu/createNewProjectDialog';
import { useLanguage } from 'src/hooks';

export const CreateNewProjectItem = () => {
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
