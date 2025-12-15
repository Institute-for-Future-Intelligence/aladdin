/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import { usePrimitiveStore } from './stores/commonPrimitive';
import * as Selector from './stores/selector';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import { showError, showInfo, showSuccess } from './helpers';
import {
  ClassID,
  CloudFileInfo,
  DataColoring,
  Design,
  DesignProblem,
  ModelSite,
  ObjectType,
  ProjectState,
  SchoolID,
  User,
} from './types';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import i18n from './i18n/i18n';
import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Util } from './Util';
import { HOME_URL } from './constants';
import ModelsMapWrapper from './modelsMapWrapper';
import MainToolBar from './mainToolBar';
import SaveCloudFileModal from './saveCloudFileModal';
import ModelsGallery from './modelsGallery';
import ProjectListPanel from './panels/projectListPanel';
import { addFileToList, doesDocExist, fetchFileList, loadCloudFile, removeFileFromList } from './cloudFileUtil';
import {
  changeDesignTitles,
  copyDesign,
  createDesign,
  doesProjectExist,
  fetchProject,
  getImageData,
} from './cloudProjectUtil';
import { ProjectUtil } from './panels/ProjectUtil';
import { useLanguage } from './hooks';
import AnonymousImage from './assets/anonymous.png';
import { GoogleAuthProvider, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import { auth, firestore, storage } from './firebase';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

export interface CloudManagerProps {
  viewOnly: boolean;
  canvas?: HTMLCanvasElement | null;
}

const useFlag = (flag: boolean, fn: () => void, setFlag: () => void) => {
  useEffect(() => {
    if (flag) {
      fn();
      setFlag();
    }
  }, [flag]);
};

const CloudManager = React.memo(({ viewOnly = false, canvas }: CloudManagerProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const user = useStore(Selector.user);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const address = useStore(Selector.world.address);
  const countryCode = useStore(Selector.world.countryCode);
  const exportContent = useStore(Selector.exportContent);
  const showCloudFilePanel = usePrimitiveStore(Selector.showCloudFilePanel);
  const showProjectListPanel = usePrimitiveStore(Selector.showProjectListPanel);
  const showModelsGallery = usePrimitiveStore(Selector.showModelsGallery);
  const showAccountSettingsPanel = usePrimitiveStore(Selector.showAccountSettingsPanel);
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);
  const cloudFile = useStore(Selector.cloudFile);
  const saveAccountSettingsFlag = usePrimitiveStore(Selector.saveAccountSettingsFlag);
  const saveCloudFileFlag = usePrimitiveStore(Selector.saveCloudFileFlag);
  const modelsMapFlag = usePrimitiveStore(Selector.modelsMapFlag);
  const leaderboardFlag = usePrimitiveStore(Selector.leaderboardFlag);
  const publishOnMapFlag = usePrimitiveStore(Selector.publishOnModelsMapFlag);
  const listCloudFilesFlag = usePrimitiveStore(Selector.listCloudFilesFlag);
  const refreshCloudFilesFlag = usePrimitiveStore(Selector.refreshCloudFilesFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const showCloudFileTitleDialogFlag = useStore(Selector.showCloudFileTitleDialogFlag);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const changed = usePrimitiveStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);
  const peopleModels = useStore(Selector.peopleModels);
  const createProjectFlag = usePrimitiveStore(Selector.createProjectFlag);
  const saveProjectAsFlag = usePrimitiveStore(Selector.saveProjectAsFlag);
  const curateDesignToProjectFlag = usePrimitiveStore(Selector.curateDesignToProjectFlag);
  const showProjectsFlag = usePrimitiveStore(Selector.showProjectsFlag);
  const updateProjectsFlag = usePrimitiveStore(Selector.updateProjectsFlag);
  const showModelsFromDate = useStore(Selector.showModelsFromDate);
  const showModelsToDate = useStore(Selector.showModelsToDate);
  const showModelsAllTime = useStore(Selector.showModelsAllTime);

  const [loading, setLoading] = useState<boolean>(false);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState<boolean>(false);
  const authorModelsRef = useRef<Map<string, ModelSite>>();

  // store cloud files as ref first because useState triggers re-rendering every time an element is being pushed into
  // the array. This causes slowdown when the array is being generated from the cloud data (the larger the array, the
  // more calls for rendering). The actual array for rendering is stored in cloudFileArray. The flag updateCloudFileArray
  // is used to instruct when it is time to copy the data from the ref array to the state array.
  const cloudFilesRef = useRef<CloudFileInfo[]>([]);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [updateCloudFileArray, setUpdateCloudFileArray] = useState<boolean>(false);
  // same logic for projects
  const myProjectsRef = useRef<ProjectState[] | void>(); // store sorted projects
  const [projectArray, setProjectArray] = useState<any[]>([]);
  const [updateProjectArray, setUpdateProjectArray] = useState<boolean>(false);

  const lang = useLanguage();

  useFlag(saveAccountSettingsFlag, saveAccountSettings, () => setPrimitiveStore('saveAccountSettingsFlag', false));

  useFlag(saveCloudFileFlag, updateCloudFile, () => setPrimitiveStore('saveCloudFileFlag', false));

  useFlag(modelsMapFlag, fetchModelSitesFn, () => setPrimitiveStore('modelsMapFlag', false));

  useFlag(leaderboardFlag, fetchPeopleModelsFn, () => setPrimitiveStore('leaderboardFlag', false));

  useFlag(publishOnMapFlag, publishOnModelsMap, () => setPrimitiveStore('publishOnModelsMapFlag', false));

  useFlag(createProjectFlag, createNewProject, () => setPrimitiveStore('createProjectFlag', false));

  useFlag(saveProjectAsFlag, saveProjectAs, () => setPrimitiveStore('saveProjectAsFlag', false));

  useFlag(showProjectsFlag, showMyProjectsList, () => setPrimitiveStore('showProjectsFlag', false));

  useFlag(updateProjectsFlag, hideMyProjectsList, () => setPrimitiveStore('updateProjectsFlag', false));

  useFlag(listCloudFilesFlag, listMyCloudFiles, () => setPrimitiveStore('listCloudFilesFlag', false));

  useFlag(refreshCloudFilesFlag, refreshMyCloudFiles, () => setPrimitiveStore('refreshCloudFilesFlag', false));

  useFlag(curateDesignToProjectFlag, curateDesignToProject, () =>
    setPrimitiveStore('curateDesignToProjectFlag', false),
  );

  useEffect(() => {
    // don't enable persistence as we often need to open multiple tabs
    // firebase.firestore().enablePersistence()
    //   .catch((err) => {
    //     if (err.code === 'failed-precondition') {
    //       showWarning('Firestore: Multiple tabs open, persistence can only be enabled in one tab at a time.', 10);
    //     } else if (err.code === 'unimplemented') {
    //       showWarning('Firestore: The current browser does not support offline persistence, 10');
    //     }
    //   });

    // do not use firebase.auth().currentUser - currentUser might be null because the auth object has not finished initializing.
    // If you use an observer to keep track of the user's sign-in status, you don't need to handle this case.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const params = new URLSearchParams(window.location.search);
      const title = params.get('title');
      if (u) {
        setCommonStore((state) => {
          if (state.user) {
            state.user.uid = u.uid;
            state.user.displayName = u.displayName ?? 'Anonymous';
            state.user.email = u.email;
            state.user.photoURL = u.photoURL ?? AnonymousImage;
            registerUser({ ...state.user }).then(() => {
              // ignore
            });
          }
          state.cloudFile = title ?? undefined;
        });
      } else {
        setCommonStore((state) => {
          state.cloudFile = title ?? undefined;
        });
      }
    });
    init();
    window.addEventListener('popstate', handlePopStateEvent);
    return () => {
      window.removeEventListener('popstate', handlePopStateEvent);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePopStateEvent = () => {
    if (viewOnly) return;
    const p = new URLSearchParams(window.location.search);
    const userid = p.get('userid');
    const title = p.get('title');
    if (userid && title) {
      openCloudFile(userid, title, true);
    }
  };

  useEffect(() => {
    if (user.uid && cloudFilesRef.current.length === 0) {
      fetchFileList(user.uid, cloudFilesRef.current).then(() => {
        // ignore
      });
    }
  }, [user.uid]);

  useEffect(() => {
    if (updateCloudFileArray) {
      if (cloudFilesRef.current.length > 0 && user.uid) {
        const arr: any[] = [];
        cloudFilesRef.current.forEach((f, i) => {
          arr.push({ title: f.title, timestamp: f.timestamp });
        });
        arr.sort((a, b) => b.timestamp - a.timestamp);
        setCloudFileArray(arr);
      }
      setUpdateCloudFileArray(false);
    }
  }, [updateCloudFileArray]);

  useEffect(() => {
    if (updateProjectArray) {
      if (myProjectsRef.current) {
        const arr: any[] = [];
        myProjectsRef.current.forEach((f, i) => {
          arr.push({
            key: i.toString(),
            owner: f.owner,
            title: f.title,
            time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm A'),
            timestamp: f.timestamp,
            description: f.description,
            dataColoring: f.dataColoring,
            selectedProperty: f.selectedProperty,
            sortDescending: f.sortDescending,
            xAxisNameScatterPlot: f.xAxisNameScatterPlot,
            yAxisNameScatterPlot: f.yAxisNameScatterPlot,
            dotSizeScatterPlot: f.dotSizeScatterPlot,
            thumbnailWidth: f.thumbnailWidth,
            type: f.type,
            designs: f.designs,
            ranges: f.ranges ?? [],
            filters: f.filters ?? [],
            hiddenParameters: f.hiddenParameters ?? ProjectUtil.getDefaultHiddenParameters(f.type),
            counter: f.counter,
            action: '',
            reasoningEffort: f.reasoningEffort,
            independentPrompt: f.independentPrompt,
            generateBuildingPrompt: f.generateBuildingPrompt,
          });
        });
        arr.sort((a, b) => b.timestamp - a.timestamp);
        setProjectArray(arr);
      }
      setUpdateProjectArray(false);
    }
  }, [updateProjectArray]);

  // fetch all the models that belong to the current user, including those published under all aliases
  useEffect(() => {
    authorModelsRef.current = new Map<string, ModelSite>();
    if (user.aliases && user.aliases.length > 0) {
      for (const a of user.aliases) {
        if (a !== user.displayName) {
          const m = peopleModels.get(a);
          if (m) authorModelsRef.current = new Map([...authorModelsRef.current, ...m]);
        }
      }
    }
    if (user.displayName) {
      const m = peopleModels.get(user.displayName);
      if (m) authorModelsRef.current = new Map([...authorModelsRef.current, ...m]);
    }
  }, [peopleModels, user.displayName, user.aliases]);

  useEffect(() => {
    setTitleDialogVisible(showCloudFileTitleDialog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCloudFileTitleDialogFlag]);

  useEffect(() => {
    setTitle(cloudFile ?? 'My Aladdin File');
  }, [cloudFile]);

  const init = () => {
    const params = new URLSearchParams(window.location.search);
    const userid = params.get('userid');
    if (userid) {
      const title = params.get('title');
      const project = params.get('project');
      if (project) {
        setLoading(true);
        setCommonStore((state) => {
          // if (state.canvasPercentWidth === 100) state.canvasPercentWidth = 50;
          state.projectView = true;
          state.canvasPercentWidth = 50;
          state.viewState.showModelTree = false;
        });
        fetchProject(userid, project, setProjectState).finally(() => {
          setLoading(false);
        });
        if (title) {
          openDesignFile(userid, title);
        }
      } else {
        if (title) {
          openCloudFile(userid, title);
        }
      }
    } else {
      setCommonStore((state) => {
        // make sure that the cloud file state is consistent with the URL
        state.cloudFile = undefined;
      });
    }
    fetchLatestVersion().then(() => {
      // ignore
    });
    ``;
  };

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
    });
  };

  // get latest version
  const fetchLatestVersion = async () => {
    try {
      const infoRef = doc(firestore, 'app', 'info');
      const infoSnap = await getDoc(infoRef);

      if (infoSnap.exists()) {
        const data = infoSnap.data();
        if (data?.latestVersion) {
          usePrimitiveStore.getState().set((state) => {
            state.latestVersion = data.latestVersion;
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignInAnonymously = async () => {
    try {
      const result = await signInAnonymously(auth);
      setCommonStore((state) => {
        if (result.user) {
          state.user.uid = result.user.uid;
          state.user.anonymous = true;
          state.user.displayName = 'Anonymous';
          registerUser({ ...state.user }).then(() => {
            // ignore
          });
        }
      });
    } catch (e) {
      const error = e as FirebaseError;
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        showError(i18n.t('message.CannotSignIn', lang) + ': ' + error);
      }
    }
    resetToSelectMode();
  };

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setCommonStore((state) => {
        if (result.user) {
          state.user.uid = result.user.uid;
          state.user.email = result.user.email;
          state.user.displayName = result.user.displayName;
          state.user.photoURL = result.user.photoURL;
          registerUser({ ...state.user }).then(() => {
            // ignore
          });
        }
      });
    } catch (e) {
      const error = e as FirebaseError;
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        showError(i18n.t('message.CannotSignIn', lang) + ': ' + error);
      }
    }
    resetToSelectMode();
  };

  const registerUser = async (user: User): Promise<any> => {
    let signFile = false;
    let noLogging = false;
    let anonymous = false;
    let schoolID = SchoolID.UNKNOWN;
    let classID = ClassID.UNKNOWN;
    let fileList: CloudFileInfo[] = [];
    let likes: string[] = [];
    let published: string[] = [];
    let aliases: string[] = [];
    let found = false;
    let userCount = 0;
    if (user.uid !== null) {
      const superuser = user && user.email === 'charles@intofuture.org';
      if (superuser) {
        try {
          const snapshot = await getCountFromServer(collection(firestore, 'users'));
          userCount = snapshot.data().count;
        } catch (e) {
          console.warn('Failed to count users:', e);
        }
      }
      const docSnap = await getDoc(doc(firestore, 'users', user.uid));
      const docData = docSnap.data();
      if (docData) {
        signFile = !!docData.signFile;
        noLogging = !!docData.noLogging;
        anonymous = !!docData.anonymous;
        schoolID = docData.schoolID ? (docData.schoolID as SchoolID) : SchoolID.UNKNOWN;
        classID = docData.classID ? (docData.classID as ClassID) : ClassID.UNKNOWN;
        if (docData.fileList) fileList = docData.fileList;
        if (docData.likes) likes = docData.likes;
        if (docData.published) published = docData.published;
        if (docData.aliases) aliases = docData.aliases;
        found = true;
      }
    }
    if (found) {
      // update common store state
      setCommonStore((state) => {
        state.user.signFile = signFile;
        state.user.noLogging = noLogging;
        state.user.anonymous = anonymous;
        state.user.schoolID = schoolID;
        state.user.classID = classID;
        state.user.fileList = fileList;
        state.user.likes = likes;
        state.user.published = published;
        state.user.aliases = aliases;
      });
      usePrimitiveStore.getState().set((state) => {
        state.userCount = userCount;
      });
      // update current user object
      user.signFile = signFile;
      user.noLogging = noLogging;
      user.anonymous = anonymous;
      user.schoolID = schoolID;
      user.classID = classID;
      user.fileList = fileList;
      user.likes = likes;
      user.published = published;
      user.aliases = aliases;
    } else {
      if (user.uid) {
        try {
          await setDoc(doc(firestore, 'users', user.uid), {
            uid: user.uid,
            anonymous: !!user.anonymous,
            signFile: !!user.signFile, // don't listen to WebStorm's suggestion to simplify it as this may be undefined
            noLogging: !!user.noLogging,
            schoolID: user.schoolID ?? SchoolID.UNKNOWN,
            classID: user.classID ?? ClassID.UNKNOWN,
            since: dayjs(new Date()).format('MM/DD/YYYY hh:mm A'),
            os: Util.getOS(),
          });
          showInfo(i18n.t('message.YourAccountWasCreated', lang));
        } catch (e) {
          showError(i18n.t('message.CannotCreateAccount', lang) + ': ' + e);
        }
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCommonStore((state) => {
        state.user.uid = null;
        state.user.email = null;
        state.user.displayName = null;
        state.user.photoURL = null;
        state.user.signFile = false;
        state.user.fileList = [];
        state.user.likes = [];
        state.user.published = [];
        state.user.aliases = [];
        state.cloudFile = undefined; // if there is a current cloud file
      });
      usePrimitiveStore.getState().set((state) => {
        state.showCloudFilePanel = false;
        state.showAccountSettingsPanel = false;
        state.showModelsGallery = false;
        state.showProjectListPanel = false;
      });
    } catch (e) {
      showError(i18n.t('message.CannotSignOut', lang) + ': ' + e);
    }
  };

  async function saveAccountSettings() {
    if (user.uid) {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          signFile: !!user.signFile, // don't listen to WebStorm's suggestion to simplify it as this may be undefined
          schoolID: user.schoolID ?? SchoolID.UNKNOWN,
          classID: user.classID ?? ClassID.UNKNOWN,
        });

        showInfo(i18n.t('message.YourAccountSettingsWereSaved', lang));
      } catch (error) {
        showError(i18n.t('message.CannotSaveYourAccountSettings', lang) + ': ' + error);
      }
    }
  }

  const fetchModelSites = async () => {
    setLoading(true);
    const start: number = dayjs(showModelsFromDate).toDate().getTime();
    const end: number = dayjs(showModelsToDate).toDate().getTime();

    try {
      const querySnapshot = await getDocs(collection(firestore, 'models'));
      const selectedModels = new Map<string, Map<string, ModelSite>>();
      const allModels = new Map<string, Map<string, ModelSite>>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          const m1 = new Map<string, ModelSite>();
          const m2 = new Map<string, ModelSite>();
          for (const k in data) {
            if (!data[k].countryCode) {
              if (data[k].address?.endsWith('USA')) data[k]['countryCode'] = 'US';
            }
            if (showModelsAllTime) {
              m1.set(k, data[k]);
            } else {
              const timestamp = data[k].timeCreated;
              if (timestamp === undefined || (timestamp >= start && timestamp <= end)) m1.set(k, data[k]);
            }
            m2.set(k, data[k]);
          }
          if (m1.size > 0) selectedModels.set(doc.id, m1);
          if (m2.size > 0) allModels.set(doc.id, m2);
        }
      });
      setCommonStore((state) => {
        state.modelSites = selectedModels;
        state.allModelSites = allModels;
      });
    } catch (error) {
      showError(i18n.t('message.CannotLoadModelsOnMap', lang) + ': ' + error);
    } finally {
      setLoading(false);
    }
  };

  // get latest submission
  const fetchLatest = async () => {
    try {
      const docRef = doc(firestore, 'board', 'info');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.latestModel) {
          setCommonStore((state) => {
            let found = false;
            const m = data.latestModel as ModelSite;

            if (m.author) {
              found = !!state.peopleModels.get(m.author)?.get(Util.getModelKey(m));
            }

            state.latestModelSite = found ? m : undefined;
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPeopleModels = async () => {
    setLoading(true);
    const start: number = dayjs(showModelsFromDate).toDate().getTime();
    const end: number = dayjs(showModelsToDate).toDate().getTime();
    try {
      const docRef = doc(firestore, 'board', 'people');
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      if (data) {
        const selectedPeopleModels = new Map<string, Map<string, ModelSite>>();
        const allPeopleModels = new Map<string, Map<string, ModelSite>>();
        for (const k in data) {
          if (showModelsAllTime) {
            selectedPeopleModels.set(k, new Map<string, ModelSite>(Object.entries(data[k])));
          } else {
            const newModelSites = new Map<string, ModelSite>();
            for (const model of Object.entries(data[k])) {
              const timestamp = (model[1] as any)['timeCreated'];
              if (timestamp === undefined || (timestamp >= start && timestamp <= end)) {
                newModelSites.set(model[0], model[1] as ModelSite);
              }
            }
            if (newModelSites.size > 0) selectedPeopleModels.set(k, newModelSites);
          }
          allPeopleModels.set(k, new Map<string, ModelSite>(Object.entries(data[k])));
        }
        setCommonStore((state) => {
          state.peopleModels = selectedPeopleModels;
          state.allPeopleModels = allPeopleModels;
        });
      }
    } catch (error) {
      showError(i18n.t('message.CannotLoadLeaderboard', lang) + ': ' + error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFromModelsMap = async (model: ModelSite, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      try {
        const modelDocRef = doc(firestore, 'models', Util.getLatLngKey(model.latitude, model.longitude));
        await updateDoc(modelDocRef, {
          [Util.getModelKey(model)]: deleteField(),
        });
        showSuccess(i18n.t('message.ModelDeletedFromMap', lang));
        if (successCallback) successCallback();
      } catch (error) {
        showError(i18n.t('message.CannotDeleteModelFromMap', lang) + ': ' + error);
      }

      try {
        const leaderboardDocRef = doc(firestore, 'board', 'people');
        await updateDoc(leaderboardDocRef, {
          [`${model.author ?? 'Anonymous'}.${Util.getModelKey(model)}`]: deleteField(),
        });
        setCommonStore((state) => {
          if (state.peopleModels) {
            state.peopleModels.delete(Util.getModelKey(model));
            usePrimitiveStore.getState().set((state) => {
              state.leaderboardFlag = true;
            });
          }
        });
      } catch (error) {
        console.warn('Failed to update leaderboard:', error);
      }
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          published: arrayRemove(model.title),
        });
        setCommonStore((state) => {
          if (state.user && state.user.published) {
            if (state.user.published.includes(model.title)) {
              const index = state.user.published.indexOf(model.title);
              if (index >= 0) {
                state.user.published.splice(index, 1);
              }
            }
          }
        });
      } catch (error) {
        console.warn('Failed to update user record:', error);
      }
    }
  };

  const likeModelsMap = async (model: ModelSite, like: boolean, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      const modelKey = Util.getModelKey(model);
      const userDocRef = doc(firestore, 'users', user.uid);
      const modelDocRef = doc(firestore, 'models', Util.getLatLngKey(model.latitude, model.longitude));
      const likeCountPath = `${modelKey}.likeCount`;

      // keep or remove a record of like in the user's account
      try {
        await updateDoc(userDocRef, {
          likes: like ? arrayUnion(modelKey) : arrayRemove(modelKey),
        });
      } catch (error) {
        showError(i18n.t('message.CannotLikeModelFromMap', lang) + ': ' + error);
      }

      // increment or decrement the likes counter
      try {
        await updateDoc(modelDocRef, {
          [likeCountPath]: increment(like ? 1 : -1),
        });

        if (successCallback) successCallback();
      } catch (error) {
        showError(i18n.t('message.CannotLikeModelFromMap', lang) + ': ' + error);
      }
    }
  };

  const pinModelsMap = async (model: ModelSite, pinned: boolean, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      const modelDocRef = doc(firestore, 'models', Util.getLatLngKey(model.latitude, model.longitude));
      await updateDoc(modelDocRef, {
        [`${Util.getModelKey(model)}.pinned`]: pinned,
      });
      if (successCallback) successCallback();
    }
  };

  // TODO:
  // unfortunately, this throws an error for users who do not log in
  // because of write access is only granted to registered users who log in.
  const countClicksModelsMap = async (model: ModelSite) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      try {
        const modelDocRef = doc(firestore, 'models', Util.getLatLngKey(model.latitude, model.longitude));
        await updateDoc(modelDocRef, {
          [`${Util.getModelKey(model)}.clickCount`]: increment(1),
        });
      } catch (error) {
        // console.log(error);
      }
    }
  };

  // fetch owner's projects from the cloud
  const fetchMyProjects = async (silent: boolean) => {
    if (!user.uid) return;
    if (!silent) setLoading(true);

    try {
      const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
      const querySnapshot = await getDocs(projectsColRef);
      const projects: ProjectState[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        projects.push({
          owner: user.uid,
          title: docSnap.id,
          timestamp: data.timestamp,
          description: data.description,
          dataColoring: data.dataColoring,
          selectedProperty: data.selectedProperty,
          sortDescending: data.sortDescending,
          xAxisNameScatterPlot: data.xAxisNameScatterPlot,
          yAxisNameScatterPlot: data.yAxisNameScatterPlot,
          dotSizeScatterPlot: data.dotSizeScatterPlot,
          thumbnailWidth: data.thumbnailWidth,
          type: data.type,
          designs: data.designs ?? [],
          ranges: data.ranges ?? [],
          filters: data.filters ?? [],
          hiddenParameters: data.hiddenParameters ?? ProjectUtil.getDefaultHiddenParameters(data.type),
          counter: data.counter ?? 0,
          independentPrompt: !!data.independentPrompt,
          reasoningEffort: data.reasoningEffrot ?? 'medium',
          generateBuildingPrompt: data.generateBuildingPrompt ?? 'Generate a colonial style house.',
          generateCSPPrompt: data.generateCSPPrompt ?? 'Generate CSP with Fermat spiral.',
        } as ProjectState);
      });

      myProjectsRef.current = projects;
    } catch (error) {
      showError(i18n.t('message.CannotOpenYourProjects', lang) + ': ' + error);
    } finally {
      if (!silent) setLoading(false);
      setUpdateProjectArray(true);
    }
  };

  const listMyProjects = (show: boolean) => {
    if (user.uid) {
      fetchMyProjects(!show).then(() => {
        if (show) {
          usePrimitiveStore.getState().set((state) => {
            state.showProjectListPanel = true;
          });
        }
      });
    }
  };

  const deleteProject = async (title: string) => {
    if (!user.uid) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'projects', title));

      if (myProjectsRef.current && user.uid) {
        for (const p of myProjectsRef.current) {
          if (p.title === title && p.designs) {
            for (const d of p.designs) {
              setCommonStore((state) => {
                if (d.title === state.cloudFile) {
                  state.cloudFile = undefined;
                }
              });

              try {
                await deleteDoc(doc(firestore, 'users', user.uid, 'designs', d.title));
              } catch (error) {
                showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
              }
            }

            setUpdateProjectArray(true);
            break;
          }
        }

        myProjectsRef.current = myProjectsRef.current.filter((e) => e.title !== title);
        setUpdateFlag(!updateFlag);
      }

      setCommonStore((state) => {
        if (title === state.projectState.title) {
          state.projectState.title = null;
          state.projectState.description = null;
          state.projectState.dataColoring = DataColoring.ALL;
          state.projectState.selectedProperty = null;
          state.projectState.sortDescending = false;
          state.projectState.xAxisNameScatterPlot = null;
          state.projectState.yAxisNameScatterPlot = null;
          state.projectState.dotSizeScatterPlot = 5;
          state.projectState.thumbnailWidth = 200;
          state.projectState.counter = 0;
          state.projectState.designs = [];
          state.projectState.ranges = [];
          state.projectState.filters = [];
          state.projectState.hiddenParameters = ProjectUtil.getDefaultHiddenParameters(state.projectState.type);
          state.designProjectType = null;
          state.projectView = false;
          state.projectState.independentPrompt = false;
          state.projectState.reasoningEffort = 'medium';
          state.projectState.generateBuildingPrompt = 'Generate a colonial style house.';
          state.projectState.generateCSPPrompt = 'Generate CSP with Fermat spiral.';
        }
      });
    } catch (error) {
      showError(i18n.t('message.CannotDeleteProject', lang) + ': ' + error);
    }
  };

  const renameProject = async (oldTitle: string, newTitle: string) => {
    const uid = user.uid;
    if (!uid) return;
    // check if the new project title is already taken
    try {
      const exist = await doesProjectExist(uid, newTitle, (error) => {
        showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
      });
      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + newTitle);
      } else {
        const files = collection(firestore, 'users', uid, 'projects');
        try {
          const oldDocRef = doc(files, oldTitle);
          const docSnap = await getDoc(oldDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              const newData = { ...data };

              if (data.designs && data.designs.length > 0) {
                const newDesigns: Design[] = changeDesignTitles(newTitle, data.designs) ?? [];
                for (const [i, d] of data.designs.entries()) {
                  copyDesign(d.title, newDesigns[i].title, data.owner, uid);
                }
                newData.designs = newDesigns;
                setCommonStore((state) => {
                  state.projectState.designs = newDesigns;
                });
              }

              const newDocRef = doc(files, newTitle);
              await setDoc(newDocRef, newData);
              await deleteDoc(oldDocRef);

              if (myProjectsRef.current) {
                const newArray: ProjectState[] = [];
                for (const p of myProjectsRef.current) {
                  if (p.title === oldTitle) {
                    newArray.push({
                      owner: p.owner,
                      timestamp: p.timestamp,
                      title: newTitle,
                      description: p.description,
                      type: p.type,
                      designs: p.designs,
                      ranges: p.ranges ?? null,
                      filters: p.filters ?? null,
                      hiddenParameters: p.hiddenParameters,
                      counter: p.counter,
                    } as ProjectState);
                  } else {
                    newArray.push(p);
                  }
                }
                myProjectsRef.current = newArray;
                setUpdateFlag(!updateFlag);
                setUpdateProjectArray(true);
              }

              setCommonStore((state) => {
                if (state.projectState.title === oldTitle) {
                  state.projectState.title = newTitle;
                }
              });

              // TODO
              // change the address field of the browser when the project is currently open
              // const params = new URLSearchParams(window.location.search);
              // if (params.get('title') === oldTitle && params.get('userid') === user.uid) {
              //   const newUrl = HOME_URL + '?client=web&userid=' + user.uid + '&title=' + encodeURIComponent(newTitle);
              //   window.history.pushState({}, document.title, newUrl);
              // }
            }
          }
        } catch (error) {
          showError(i18n.t('message.CannotRenameProject', lang) + ': ' + error);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setProjectState = (projectState: ProjectState) => {
    setCommonStore((state) => {
      state.projectState = { ...projectState };
      state.projectImages.clear();
      state.projectView = true;
    });
    usePrimitiveStore.getState().set((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
      state.updateProjectsFlag = true;
    });
  };

  const openDesignFile = (userid: string, title: string) => {
    if (userid && title) {
      setLoading(true);
      loadCloudFile(userid, title, true, true, viewOnly).finally(() => {
        setLoading(false);
      });
    }
  };

  const addDesignToProject = async (
    projectType: string,
    projectTitle: string,
    designTitle: string,
    thumbnailWidth: number,
  ) => {
    if (!user.uid || !canvas) return;
    // create a thumbnail image of the design in Base64 format
    // (don't create a PNG and then store in Firebase storage as I can't get the blob data correctly)
    const thumbnail = Util.resizeCanvas(canvas, thumbnailWidth).toDataURL();
    const design = createDesign(projectType, designTitle, thumbnail);
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'projects', projectTitle), {
        designs: arrayUnion(design),
        counter: increment(1),
      });
      setCommonStore((state) => {
        state.projectState.designs?.push(design);
        // increment the local counter to be consistent with the database counter
        state.projectState.counter++;
        // store the project type in the design for linking it with the right type of project later
        state.designProjectType = state.projectState.type;
        state.cloudFile = design.title;
      });
      // regardless of where the design is, make a copy on the cloud
      saveToCloudWithoutCheckingExistence(designTitle, true, true);
    } catch (error) {
      showError(i18n.t('message.CannotAddDesignToProject', lang) + ': ' + error);
    } finally {
      setLoading(false);
    }
  };

  const saveToCloud = (title: string, silent: boolean, checkExistence: boolean) => {
    if (!user.uid) return;
    const t = title.trim();
    if (t.length === 0) {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidTitle', lang) + '.');
      return;
    }
    setLoading(true);
    if (checkExistence) {
      doesDocExist(user.uid, title, (error) => {
        showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
      }).then((exist) => {
        if (exist) {
          setLoading(false);
          Modal.confirm({
            title: `${i18n.t('message.CloudFileWithTitleExistsDoYouWantToOverwrite', lang)}`,
            icon: <QuestionCircleOutlined />,
            onOk: () => {
              saveToCloudWithoutCheckingExistence(t, silent);
            },
            onCancel: () => {
              setCommonStore((state) => {
                state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                state.showCloudFileTitleDialog = true;
              });
            },
            okText: `${i18n.t('word.Yes', lang)}`,
            cancelText: `${i18n.t('word.No', lang)}`,
          });
        } else {
          saveToCloudWithoutCheckingExistence(t, silent);
        }
      });
    } else {
      saveToCloudWithoutCheckingExistence(t, silent);
    }
    setTitleDialogVisible(false);
  };

  const removeCloudFileIfExisting = (uid: string, title: string) => {
    if (cloudFilesRef.current.length > 0) {
      let index = -1;
      for (const [i, file] of cloudFilesRef.current.entries()) {
        if (file.title === title) {
          index = i;
          removeFileFromList(uid, file).then(() => {
            // ignore
          });
          break;
        }
      }
      if (index !== -1) {
        cloudFilesRef.current.splice(index, 1);
      }
    }
  };

  const renameCloudFileAndUpdateList = (uid: string, oldTitle: string, newTitle: string) => {
    if (cloudFilesRef.current.length > 0) {
      let index = -1;
      let oldFile = null;
      let newFile = null;
      for (const [i, file] of cloudFilesRef.current.entries()) {
        if (file.title === oldTitle) {
          index = i;
          oldFile = { title: oldTitle, timestamp: file.timestamp } as CloudFileInfo;
          newFile = { title: newTitle, timestamp: file.timestamp } as CloudFileInfo;
          break;
        }
      }
      if (index !== -1 && newFile && oldFile) {
        cloudFilesRef.current.splice(index, 1);
        cloudFilesRef.current.push(newFile);
        const newFile2 = newFile;
        removeFileFromList(uid, oldFile).then(() => {
          addFileToList(uid, newFile2).then(() => {
            // ignore
          });
        });
      }
    }
  };

  const saveToCloudWithoutCheckingExistence = async (title: string, silent: boolean, ofProject?: boolean) => {
    const uid = user.uid;
    if (!uid) return;
    try {
      if (localContentToImportAfterCloudFileUpdate) {
        usePrimitiveStore.getState().set((state) => {
          state.waiting = true;
        });
      }
      const userDocuments = doc(firestore, 'users', uid);
      const docRef = doc(userDocuments, ofProject ? 'designs' : 'files', title);
      await setDoc(docRef, exportContent());

      if (!silent) {
        setCommonStore((state) => {
          state.cloudFile = title;
        });
        usePrimitiveStore.getState().setChanged(false);
      }
      if (localContentToImportAfterCloudFileUpdate) {
        if (localContentToImportAfterCloudFileUpdate === 'CREATE_NEW_FILE') {
          createEmptyFile();
        } else {
          importContent(localContentToImportAfterCloudFileUpdate);
        }
      } else {
        if (!ofProject) {
          const newUrl = HOME_URL + '?client=web&userid=' + uid + '&title=' + encodeURIComponent(title);
          window.history.pushState({}, document.title, newUrl);
        }
      }
      // a project file should not be added to the local cache
      if (!ofProject) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && cloudFilesRef.current.length > 0) {
            removeCloudFileIfExisting(uid, title);
            const file = { timestamp: data.timestamp, title } as CloudFileInfo;
            cloudFilesRef.current.push(file);
            await addFileToList(uid, file);
            setUpdateCloudFileArray(true);
          }
        }
      }
    } catch (error) {
      showError(i18n.t('message.CannotSaveYourFileToCloud', lang) + ': ' + error);
    } finally {
      setLoading(false);
    }
  };

  const openCloudFileWithSaveReminder = (userid: string, title: string) => {
    if (changed) {
      Modal.confirm({
        title: `${i18n.t('message.DoYouWantToSaveChanges', lang)}`,
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (cloudFile) {
            saveToCloud(cloudFile, true, false);
            openCloudFile(userid, title);
          } else {
            setCommonStore((state) => {
              state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
              state.showCloudFileTitleDialog = true;
            });
          }
        },
        onCancel: () => {
          openCloudFile(userid, title);
        },
        okText: `${i18n.t('word.Yes', lang)}`,
        cancelText: `${i18n.t('word.No', lang)}`,
      });
    } else {
      openCloudFile(userid, title);
    }
  };

  const openCloudFileWithSaveReminderFromMap = (model: ModelSite) => {
    if (changed) {
      Modal.confirm({
        title: `${i18n.t('message.DoYouWantToSaveChanges', lang)}`,
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (cloudFile) {
            saveToCloud(cloudFile, true, false);
            openCloudFile(model.userid, model.title);
            countClicksModelsMap(model);
          } else {
            setCommonStore((state) => {
              state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
              state.showCloudFileTitleDialog = true;
            });
          }
        },
        onCancel: () => {
          openCloudFile(model.userid, model.title);
          countClicksModelsMap(model);
        },
        okText: `${i18n.t('word.Yes', lang)}`,
        cancelText: `${i18n.t('word.No', lang)}`,
      });
    } else {
      openCloudFile(model.userid, model.title);
      countClicksModelsMap(model);
    }
  };

  const openCloudFile = (userid: string, title: string, popState?: boolean) => {
    if (userid && title) {
      setLoading(true);
      loadCloudFile(userid, title, false, popState, viewOnly).finally(() => {
        setLoading(false);
      });
    }
  };

  // fetch owner's file information from the cloud
  const fetchMyCloudFiles = async (refresh: boolean) => {
    const uid = user.uid;
    if (!uid) return;
    setLoading(true);
    cloudFilesRef.current = [];
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      const fileList = userDocSnap.data()?.fileList;

      if (!refresh && fileList && fileList.length > 0) {
        // if a file list exists, use it
        cloudFilesRef.current?.push(...fileList);
      } else {
        // if a file list does not exist, create one
        try {
          const filesSnapshot = await getDocs(collection(userDocRef, 'files'));
          filesSnapshot.forEach((fileDoc) => {
            const data = fileDoc.data();
            cloudFilesRef.current?.push({
              timestamp: data.timestamp,
              title: fileDoc.id,
            } as CloudFileInfo);
          });
        } catch (error) {
          showError(i18n.t('message.CannotOpenCloudFolder', lang) + ': ' + error);
        } finally {
          try {
            await updateDoc(userDocRef, { fileList: cloudFilesRef.current });
          } catch (error) {
            console.log(error);
          }
        }
      }
    } finally {
      setLoading(false);
      setUpdateCloudFileArray(true);
    }
  };

  const deleteCloudFile = async (uid: string, title: string) => {
    try {
      await deleteDoc(doc(firestore, 'users', uid, 'files', title));

      removeCloudFileIfExisting(uid, title);
      setCloudFileArray(cloudFileArray.filter((e) => e.title !== title));

      setCommonStore((state) => {
        if (title === state.cloudFile) {
          state.cloudFile = undefined;
        }
      });
    } catch (error) {
      showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
    }
  };

  const renameCloudFile = async (uid: string, oldTitle: string, newTitle: string) => {
    try {
      const exist = await doesDocExist(uid, newTitle, (error: string) => {
        showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
      });

      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + newTitle);
      } else {
        const filesCollection = collection(firestore, 'users', uid, 'files');
        const oldDocRef = doc(filesCollection, oldTitle);
        const newDocRef = doc(filesCollection, newTitle);

        const oldDocSnap = await getDoc(oldDocRef);
        if (oldDocSnap.exists()) {
          const oldData = oldDocSnap.data();
          if (oldData) {
            await setDoc(newDocRef, oldData);

            try {
              await deleteDoc(oldDocRef);
            } catch (error) {
              showError(i18n.t('message.CannotDeleteCloudFile', lang) + ' ' + oldTitle + ': ' + error);
            }

            for (const f of cloudFileArray) {
              if (f.title === oldTitle) {
                f.title = newTitle;
                break;
              }
            }

            setCloudFileArray([...cloudFileArray]);
            renameCloudFileAndUpdateList(uid, oldTitle, newTitle);

            setCommonStore((state) => {
              if (state.cloudFile === oldTitle) {
                state.cloudFile = newTitle;
              }
            });
            // change the address field of the browser when the cloud file is currently open
            const params = new URLSearchParams(window.location.search);
            if (params.get('title') === oldTitle && params.get('userid') === user.uid) {
              const newUrl = HOME_URL + '?client=web&userid=' + user.uid + '&title=' + encodeURIComponent(newTitle);
              window.history.pushState({}, document.title, newUrl);
            }
          }
        }
      }
    } catch (error) {
      showError(i18n.t('message.CannotRenameCloudFile', lang) + ': ' + error);
    }
  };

  function updateCloudFile() {
    if (cloudFile) {
      saveToCloud(cloudFile, false, false);
      setTitle(cloudFile);
    }
  }

  function fetchModelSitesFn() {
    fetchModelSites().then(() => {
      fetchLatest().then(() => {
        // ignore for now
      });
    });
  }

  function fetchPeopleModelsFn() {
    fetchPeopleModels().then(() => {
      fetchLatest().then(() => {
        // ignore for now
      });
    });
  }

  async function publishOnModelsMap() {
    if (user && user.uid && title) {
      // check if the user is the owner of the current model
      const params = new URLSearchParams(window.location.search);
      if (params.get('userid') === user.uid && params.get('title') === title) {
        const m = {
          latitude,
          longitude,
          address: address ?? null,
          countryCode: countryCode ?? null,
          type: useStore.getState().modelType,
          author: useStore.getState().modelAuthor ?? user.displayName,
          userid: user.uid,
          title,
          label: useStore.getState().modelLabel,
          description: useStore.getState().modelDescription,
          timeCreated: Date.now(),
        } as ModelSite;
        const modelKey = Util.getModelKey(m);
        const modelsCollection = collection(firestore, 'models');
        if (canvas) {
          const thumbnail = Util.resizeCanvas(canvas, 200);
          thumbnail.toBlob((blob) => {
            if (blob) {
              const metadata = { contentType: 'image/png' };
              const imageRef = ref(storage, 'images/' + modelKey + '.png');
              const uploadTask = uploadBytesResumable(imageRef, blob, metadata);
              // Listen for state changes, errors, and completion of the upload.
              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  if (progress > 0) {
                    showInfo(i18n.t('word.Upload', lang) + ': ' + progress + '%');
                  }
                },
                (error) => {
                  showError('Storage: ' + error);
                },
                async () => {
                  try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const m2 = { ...m, thumbnailUrl: downloadURL } as ModelSite;
                    // after we get a download URL for the thumbnail image, we then go on to upload other data
                    try {
                      const docKey = Util.getLatLngKey(latitude, longitude);
                      const documentRef = doc(modelsCollection, docKey);
                      const docSnap = await getDoc(documentRef);
                      await setDoc(documentRef, { [modelKey]: m2 }, { merge: true });
                      if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data && data[modelKey]) {
                          showSuccess(i18n.t('menu.file.UpdatedOnModelsMap', lang) + '.');
                        } else {
                          showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                        }
                      } else {
                        showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                      }
                    } catch (error) {
                      showError(i18n.t('message.CannotPublishModelOnMap', lang) + ': ' + error);
                    }

                    // add to the leaderboard
                    const boardPeopleRef = doc(firestore, 'board', 'people');
                    await updateDoc(boardPeopleRef, {
                      [`${m2.author ?? 'Anonymous'}.${Util.getModelKey(m2)}`]: m2,
                    });
                    // update the cache
                    setCommonStore((state) => {
                      if (state.peopleModels) {
                        const models = state.peopleModels.get(m2.author ?? 'Anonymous');
                        if (models) {
                          models.set(Util.getModelKey(m2), m2);
                        }
                      }
                    });

                    // notify info
                    const boardInfoRef = doc(firestore, 'board', 'info');
                    await setDoc(boardInfoRef, { latestModel: m2 }, { merge: true });
                  } catch (error) {
                    console.log(error);
                  }
                },
              );
            }
          });
        }

        try {
          // keep a record of the published model in the user's account
          await updateDoc(
            doc(firestore, 'users', user.uid),
            useStore.getState().modelAuthor === user.displayName
              ? {
                  published: arrayUnion(title),
                }
              : {
                  published: arrayUnion(title),
                  aliases: arrayUnion(useStore.getState().modelAuthor),
                },
          );
          // update the cache
          setCommonStore((state) => {
            if (state.user) {
              if (!state.user.published) state.user.published = [];
              if (!state.user.published.includes(title)) {
                state.user.published.push(title);
              }
              if (!state.user.aliases) state.user.aliases = [];
              if (
                state.modelAuthor &&
                !state.user.aliases.includes(state.modelAuthor) &&
                state.modelAuthor !== user.displayName
              ) {
                state.user.aliases.push(state.modelAuthor);
              }
            }
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  async function createNewProject() {
    if (!user || !user.uid) return;
    const title = usePrimitiveStore.getState().projectTitle;
    if (!title) {
      showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
      return;
    }
    const t = title.trim();
    if (t.length === 0) {
      showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
      return;
    }

    try {
      // check if the project title is already used
      const exist = await doesDocExist(user.uid, t, (error) => {
        showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
      });
      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + t);
      } else {
        if (user && user.uid) {
          const type = usePrimitiveStore.getState().projectType ?? DesignProblem.SOLAR_PANEL_ARRAY;
          const description = usePrimitiveStore.getState().projectDescription ?? null;
          const timestamp = new Date().getTime();
          const counter = 0;

          try {
            await setDoc(doc(firestore, 'users', user.uid, 'projects', t), {
              owner: user.uid,
              timestamp,
              type,
              description,
              counter,
              designs: [],
              hiddenParameters: ProjectUtil.getDefaultHiddenParameters(type),
            });
            setCommonStore((state) => {
              state.projectView = true;
              state.canvasPercentWidth = 50;
              // update the local copy as well
              state.projectState.owner = user.uid;
              state.projectState.type = type;
              state.projectState.title = title;
              state.projectState.description = description;
              state.projectState.counter = 0;
              state.projectState.dataColoring = DataColoring.ALL;
              state.projectState.selectedProperty = null;
              state.projectState.sortDescending = false;
              state.projectState.xAxisNameScatterPlot = null;
              state.projectState.yAxisNameScatterPlot = null;
              state.projectState.dotSizeScatterPlot = 5;
              state.projectState.thumbnailWidth = 200;
              state.projectState.designs = [];
              state.projectState.ranges = [];
              state.projectState.filters = [];
              state.projectState.hiddenParameters = ProjectUtil.getDefaultHiddenParameters(state.projectState.type);
              state.projectState.independentPrompt = false;
              state.projectState.reasoningEffort = 'medium';
              state.projectState.generateBuildingPrompt = 'Generate a colonial style house.';
              state.projectState.generateCSPPrompt = 'Generate CSP with Fermat spiral.';
            });
          } catch (error) {
            showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
          } finally {
            // if the project list panel is open, update it
            if (showProjectListPanel) {
              fetchMyProjects(false).then(() => {
                setUpdateFlag(!updateFlag);
              });
            }
            setLoading(false);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveProjectAs() {
    if (!user || !user.uid) return;
    const title = usePrimitiveStore.getState().projectTitle;
    if (!title) {
      showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
      return;
    }
    const t = title.trim();
    if (t.length === 0) {
      showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
      return;
    }
    try {
      // check if the project title is already taken
      const exist = await doesProjectExist(user.uid, t, (error) => {
        showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
      });
      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + t);
      } else {
        if (user && user.uid) {
          const designs = useStore.getState().projectState.designs;
          if (designs) {
            const type = usePrimitiveStore.getState().projectType;
            const description = usePrimitiveStore.getState().projectDescription;
            const owner = useStore.getState().projectState.owner;
            const timestamp = new Date().getTime();
            const counter = useStore.getState().projectState.counter;
            const dataColoring = useStore.getState().projectState.dataColoring ?? null;
            const selectedProperty = useStore.getState().projectState.selectedProperty ?? null;
            const sortDescending = !!useStore.getState().projectState.sortDescending;
            const xAxisNameScatterPlot = useStore.getState().projectState.xAxisNameScatterPlot ?? 'rowWidth';
            const yAxisNameScatterPlot = useStore.getState().projectState.yAxisNameScatterPlot ?? 'rowWidth';
            const dotSizeScatterPlot = useStore.getState().projectState.dotSizeScatterPlot ?? 5;
            const thumbnailWidth = useStore.getState().projectState.thumbnailWidth ?? 200;
            const newDesigns: Design[] = changeDesignTitles(t, designs) ?? [];
            const reasoningEffort = useStore.getState().projectState.reasoningEffort ?? 'medium';
            const generateBuildingPrompt =
              useStore.getState().projectState.generateBuildingPrompt ?? 'Generate a colonial style house.';
            const generateCSPPrompt =
              useStore.getState().projectState.generateCSPPrompt ?? 'Generate CSP with Fermat spiral.';
            for (const [i, d] of designs.entries()) {
              copyDesign(d.title, newDesigns[i].title, owner, user.uid);
            }
            const projectImages = useStore.getState().projectImages;
            if (projectImages && projectImages.size > 0) {
              for (const [i, d] of designs.entries()) {
                const image = projectImages.get(d.title);
                if (image) {
                  newDesigns[i].thumbnail = getImageData(image);
                }
              }

              try {
                await setDoc(doc(firestore, 'users', user.uid, 'projects', t), {
                  owner: user.uid,
                  timestamp,
                  type,
                  description,
                  counter,
                  dataColoring,
                  selectedProperty,
                  sortDescending,
                  xAxisNameScatterPlot: xAxisNameScatterPlot,
                  yAxisNameScatterPlot: yAxisNameScatterPlot,
                  dotSizeScatterPlot: dotSizeScatterPlot,
                  thumbnailWidth,
                  designs: newDesigns,
                  ranges: useStore.getState().projectState.ranges ?? null,
                  filters: useStore.getState().projectState.filters ?? null,
                  hiddenParameters: useStore.getState().projectState.hiddenParameters,
                  independentPrompt: !!useStore.getState().projectState.independentPrompt,
                  reasoningEffort,
                  generateBuildingPrompt: generateBuildingPrompt,
                  generateCSPPrompt: generateCSPPrompt,
                });
                setCommonStore((state) => {
                  state.projectView = true;
                  state.projectState.owner = user.uid;
                  state.projectState.type = type;
                  state.projectState.title = title;
                  state.projectState.description = description;
                  state.projectState.designs = newDesigns;
                });
              } catch (error) {
                showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
              } finally {
                if (showProjectListPanel) {
                  fetchMyProjects(false).then(() => {
                    setUpdateFlag(!updateFlag);
                  });
                }
                setLoading(false);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  function curateDesignToProject() {
    const projectOwner = useStore.getState().projectState.owner;
    if (user.uid !== projectOwner) {
      showInfo(i18n.t('message.CannotAddDesignToProjectOwnedByOthers', lang));
    } else {
      const projectTitle = useStore.getState().projectState.title;
      if (projectTitle) {
        setLoading(true);
        const projectType = useStore.getState().projectState.type ?? DesignProblem.SOLAR_PANEL_ARRAY;
        const thumbnailWidth = useStore.getState().projectState.thumbnailWidth ?? 200;
        const counter = useStore.getState().projectState.counter ?? 0;
        addDesignToProject(projectType, projectTitle, projectTitle + ' ' + counter, thumbnailWidth);
      }
    }
  }

  function listMyCloudFiles() {
    if (!user.uid) return;
    fetchMyCloudFiles(false).then(() => {
      usePrimitiveStore.getState().set((state) => {
        state.showCloudFilePanel = true;
      });
    });
  }

  function refreshMyCloudFiles() {
    if (!user.uid) return;
    fetchMyCloudFiles(true).then(() => {
      // ignore
    });
  }

  function showMyProjectsList() {
    listMyProjects(true);
  }

  function hideMyProjectsList() {
    listMyProjects(false);
    setUpdateFlag(!updateFlag);
  }

  return viewOnly ? (
    <>
      {openModelsMap && (
        <ModelsMapWrapper
          openCloudFile={openCloudFileWithSaveReminderFromMap}
          deleteModelFromMap={deleteFromModelsMap}
          likeModelFromMap={likeModelsMap}
          pinModelFromMap={pinModelsMap}
        />
      )}
    </>
  ) : (
    <>
      {loading && <Spinner />}
      <SaveCloudFileModal
        saveToCloud={saveToCloud}
        isLoading={() => loading}
        setTitle={setTitle}
        getTitle={() => title}
        setTitleDialogVisible={setTitleDialogVisible}
        isTitleDialogVisible={() => titleDialogVisible}
      />
      <MainToolBar signIn={signIn} signInAnonymously={handleSignInAnonymously} signOut={handleSignOut} />
      {showCloudFilePanel && (
        <CloudFilePanel
          cloudFileArray={cloudFileArray}
          openCloudFile={(title) => {
            if (user.uid) openCloudFileWithSaveReminder(user.uid, title);
          }}
          deleteCloudFile={(title) => {
            if (user.uid) deleteCloudFile(user.uid, title);
          }}
          renameCloudFile={(oldTitle, newTitle) => {
            if (user.uid) renameCloudFile(user.uid, oldTitle, newTitle);
          }}
        />
      )}
      {showProjectListPanel && myProjectsRef.current && (
        <ProjectListPanel
          projects={projectArray}
          setProjectState={setProjectState}
          deleteProject={deleteProject}
          renameProject={renameProject}
        />
      )}
      {showModelsGallery && (
        <ModelsGallery
          author={undefined}
          models={authorModelsRef.current}
          openCloudFile={openCloudFileWithSaveReminder}
          closeCallback={() => {
            setPrimitiveStore('showModelsGallery', false);
            setPrimitiveStore('modelsMapSelectedSite', undefined);
            authorModelsRef.current = undefined;
          }}
        />
      )}
      {showAccountSettingsPanel && <AccountSettingsPanel openCloudFile={openCloudFile} />}
      {openModelsMap && (
        <ModelsMapWrapper
          openCloudFile={openCloudFileWithSaveReminderFromMap}
          deleteModelFromMap={deleteFromModelsMap}
          likeModelFromMap={likeModelsMap}
          pinModelFromMap={pinModelsMap}
        />
      )}
    </>
  );
});

export default CloudManager;
