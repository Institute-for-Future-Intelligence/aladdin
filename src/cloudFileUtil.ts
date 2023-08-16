/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { HOME_URL } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';

export const loadCloudFile = (
  userid: string,
  title: string,
  ofProject: boolean,
  popState?: boolean,
  viewOnly?: boolean,
) => {
  const lang = { lng: useStore.getState().language };

  useStore.getState().undoManager.clear();
  usePrimitiveStore.setState((state) => {
    state.waiting = true;
  });

  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection(ofProject ? 'designs' : 'files')
    .doc(title)
    .get()
    .then((doc) => {
      const data = doc.data();
      if (data) {
        useStore.getState().importContent(data, title);
      } else {
        showInfo(i18n.t('message.CloudFileNotFound', lang) + ': ' + title);
        useStore.getState().set((state) => {
          state.cloudFile = undefined;
        });
      }
      if (!popState && !viewOnly) {
        const newUrl = HOME_URL + '?client=web&userid=' + userid + '&title=' + encodeURIComponent(title);
        window.history.pushState({}, document.title, newUrl);
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    });
};
