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
import { CloudFileInfo } from './types';

export const doesDocExist = async (uid: string, fileName: string, callbackOnError: (error: string) => void) => {
  try {
    const doc = await firebase.firestore().collection('users').doc(uid).collection('files').doc(fileName).get();
    return doc.exists;
  } catch (error) {
    callbackOnError(error as string);
  }
};

export const fetchFileList = async (uid: string, array: CloudFileInfo[]) => {
  await firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .get()
    .then((doc) => {
      const docData = doc.data();
      if (docData) {
        if (docData.fileList) array.push(...docData.fileList);
        return true;
      }
      return false;
    });
};

export const addFileToList = async (uid: string, file: CloudFileInfo) => {
  await firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .update({ fileList: firebase.firestore.FieldValue.arrayUnion(file) })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      console.log(error);
    });
};

export const removeFileFromList = async (uid: string, file: CloudFileInfo) => {
  await firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .update({ fileList: firebase.firestore.FieldValue.arrayRemove(file) })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      console.log(error);
    });
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
      useStore.getState().set((state) => {
        state.cloudFile = undefined;
      });
      usePrimitiveStore.getState().set((state) => {
        state.waiting = false;
      });
    }
    if (!popState && !viewOnly) {
      const newUrl = HOME_URL + '?client=web&userid=' + userid + '&title=' + encodeURIComponent(title);
      window.history.pushState({}, document.title, newUrl);
    }
  } catch (error) {
    showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    usePrimitiveStore.getState().set((state) => {
      state.waiting = false;
    });
  }
};
