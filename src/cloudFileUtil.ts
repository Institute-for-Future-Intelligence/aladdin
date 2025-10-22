/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { HOME_URL } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { CloudFileInfo } from './types';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export const doesDocExist = async (uid: string, fileName: string, callbackOnError: (error: string) => void) => {
  try {
    const docRef = doc(firestore, 'users', uid, 'files', fileName);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    callbackOnError(error as string);
  }
};

export const fetchFileList = async (uid: string, array: CloudFileInfo[]) => {
  const docRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(docRef);
  const docData = docSnap.data();
  if (docData) {
    if (docData.fileList) array.push(...docData.fileList);
    return true;
  }
  return false;
};

export const addFileToList = async (uid: string, file: CloudFileInfo) => {
  try {
    await updateDoc(doc(firestore, 'users', uid), { fileList: arrayUnion(file) });
  } catch (error) {
    console.log(error);
  }
};

export const removeFileFromList = async (uid: string, file: CloudFileInfo) => {
  try {
    await updateDoc(doc(firestore, 'users', uid), { fileList: arrayRemove(file) });
  } catch (error) {
    console.log(error);
  }
};

export const loadCloudFile = async (
  userid: string,
  title: string,
  ofProject: boolean,
  popState?: boolean,
  viewOnly?: boolean,
  projectTitle?: string | null,
) => {
  const lang = { lng: useStore.getState().language };

  useStore.getState().undoManager.clear();
  usePrimitiveStore.getState().set((state) => {
    state.waiting = true;
  });

  try {
    if (projectTitle) {
      const projectDocRef = doc(firestore, 'users', userid, 'projects', projectTitle);
      const documentSnapshot = await getDoc(projectDocRef);
      if (documentSnapshot.exists()) {
        const data_1 = documentSnapshot.data();
        if (data_1) {
          useStore.getState().set((state_1) => {
            state_1.projectState.designs = [...data_1.designs];
          });
        }
      }
    }

    const docRef = doc(firestore, 'users', userid, ofProject ? 'designs' : 'files', title);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
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
