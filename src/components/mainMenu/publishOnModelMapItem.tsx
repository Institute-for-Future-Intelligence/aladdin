/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { showInfo } from 'src/helpers';
import ModelSiteDialog from '../contextMenu/elementMenu/modelSiteDialog';
import { useLanguage } from 'src/hooks';
import React, { useState } from 'react';
import * as Selector from '../../stores/selector';
import { MainMenuItem } from './mainMenuItems';

export const PublishOnModelMapItem = React.memo(() => {
  const lang = useLanguage();
  const user = useStore(Selector.user);
  const cloudFile = useStore(Selector.cloudFile);

  const [modelSiteDialogVisible, setModelSiteDialogVisible] = useState(false);

  const handleClick = () => {
    const urlId = new URLSearchParams(window.location.search).get('userid');
    const matched = urlId === user.uid;
    const allowed = user.uid && cloudFile && matched;
    if (allowed) {
      setModelSiteDialogVisible(true);
    } else {
      if (!user.uid) {
        showInfo(i18n.t('menu.file.YouMustLogInToPublishYourModel', lang) + '.');
      } else if (urlId && !matched) {
        showInfo(i18n.t('menu.file.YouCannotPublishAModelThatYouDoNotOwn', lang) + '.');
      } else {
        showInfo(i18n.t('menu.file.YouMustSaveModelOnCloudBeforePublishingIt', lang) + '.');
      }
    }
  };

  return (
    <>
      <MainMenuItem onClick={handleClick}>{i18n.t('menu.file.PublishOnModelsMap', lang)}...</MainMenuItem>
      {modelSiteDialogVisible && <ModelSiteDialog setDialogVisible={setModelSiteDialogVisible} />}
    </>
  );
});
