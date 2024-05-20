/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useState } from 'react';
import CreateNewProjectDialog from '../contextMenu/elementMenu/createNewProjectDialog';
import { useLanguage } from 'src/hooks';

export const SaveProjectAsItem = () => {
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
