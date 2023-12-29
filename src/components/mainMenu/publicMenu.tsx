/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';

export const createPublicMenu = (uid: string | null, viewOnly: boolean, openModelsMap: boolean) => {
  const lang = { lng: useStore.getState().language };

  const handleClickMyModels = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showModelsGallery = true;
      state.leaderboardFlag = true;
      state.openModelsMap = false;
    });
  };

  const handleClickModelsMap = () => {
    usePrimitiveStore.getState().set((state) => {
      state.modelsMapFlag = true;
      state.modelsMapWeatherStations = false;
      state.openModelsMap = true;
      state.showModelsGallery = false;
    });
    if (useStore.getState().loggable) {
      useStore.getState().set((state) => {
        state.actionInfo = {
          name: 'Open Models Map',
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const items: MenuProps['items'] = [];

  // my-models
  if (uid && !viewOnly) {
    items.push({
      key: 'my-models',
      label: (
        <MenuItem noPadding onClick={handleClickMyModels}>
          {i18n.t('menu.ModelsGallery', lang)}...
        </MenuItem>
      ),
    });
  }

  // models-map
  if (!openModelsMap) {
    items.push({
      key: 'models-map',
      label: (
        <MenuItem noPadding onClick={handleClickModelsMap}>
          {i18n.t('menu.ModelsMap', lang)}...
        </MenuItem>
      ),
    });
  }

  return items;
};
