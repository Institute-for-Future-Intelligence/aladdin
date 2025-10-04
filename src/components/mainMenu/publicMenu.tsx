/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage } from 'src/hooks';
import { MainMenuItem, MainSubMenu } from './mainMenuItems';

interface Props {
  uid: string | null;
  viewOnly: boolean;
  openModelsMap: boolean;
}

const PublicMenu = ({ uid, viewOnly, openModelsMap }: Props) => {
  const lang = useLanguage();

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

  return (
    <MainSubMenu label={i18n.t('menu.publicSubMenu', lang)}>
      {/* my models */}
      {uid && !viewOnly && (
        <MainMenuItem onClick={handleClickMyModels}>{i18n.t('menu.ModelsGallery', lang)}...</MainMenuItem>
      )}

      {/* models map */}
      {!openModelsMap && (
        <MainMenuItem onClick={handleClickModelsMap}>{i18n.t('menu.ModelsMap', lang)}...</MainMenuItem>
      )}
    </MainSubMenu>
  );
};

export default PublicMenu;
