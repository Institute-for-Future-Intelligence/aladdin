/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useState } from 'react';
import CreateNewProjectDialog from '../contextMenu/elementMenu/createNewProjectDialog';
import { useLanguage } from 'src/hooks';
import { MainMenuItem } from './mainMenuItems';

export const SaveProjectAsItem = () => {
  const [saveProjectAsDialogVisible, setSaveProjectAsDialogVisible] = useState(false);

  const lang = useLanguage();

  const handleClick = () => {
    setSaveProjectAsDialogVisible(true);
    usePrimitiveStore.getState().set((state) => {
      state.openModelsMap = false;
    });
  };

  return (
    <>
      <MainMenuItem onClick={handleClick}>{i18n.t('menu.project.SaveProjectAs', lang)}...</MainMenuItem>
      {saveProjectAsDialogVisible && (
        <CreateNewProjectDialog saveAs={true} setDialogVisible={setSaveProjectAsDialogVisible} />
      )}
    </>
  );
};
