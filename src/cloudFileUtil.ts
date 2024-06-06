/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { HOME_URL } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';

export const doesDocExist = async (uid: string, fileName: string, errorCallback: (error: string) => void) => {
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).collection('files').doc(fileName).get();
    return doc.exists;
  } catch (error) {
    errorCallback(error as string);
  }
};

export const loadCloudFile = async (
  userid: string,
  title: string,
  ofProject: boolean,
  popState?: boolean,
  viewOnly?: boolean,
) => {
  const lang = { lng: useStore.getState().language };

  useStore.getState().undoManager.clear();
  usePrimitiveStore.getState().set((state) => {
    state.waiting = true;
  });

  try {
    const doc = await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection(ofProject ? 'designs' : 'files')
      .doc(title)
      .get();
    const data = doc.data();
    if (data) {
      useStore.getState().importContent(data, title);
    } else {
      showInfo(i18n.t('message.CloudFileNotFound', lang) + ': ' + title);
      useStore.getState().set((state_1) => {
        state_1.cloudFile = undefined;
      });
      usePrimitiveStore.getState().set((state_2) => {
        state_2.waiting = false;
      });
    }
    if (!popState && !viewOnly) {
      const newUrl = HOME_URL + '?client=web&userid=' + userid + '&title=' + encodeURIComponent(title);
      window.history.pushState({}, document.title, newUrl);
    }
  } catch (error) {
    showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    usePrimitiveStore.getState().set((state_3) => {
      state_3.waiting = false;
    });
  }
};
