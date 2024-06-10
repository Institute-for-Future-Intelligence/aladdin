/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import { usePrimitiveStore } from './stores/commonPrimitive';
import * as Selector from './stores/selector';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo, showSuccess } from './helpers';
import {
  ClassID,
  CloudFileInfo,
  DataColoring,
  Design,
  DesignProblem,
  FirebaseName,
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
import { doesDocExist, loadCloudFile } from './cloudFileUtil';
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

  const [loading, setLoading] = useState<boolean>(false);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState<boolean>(false);
  const authorModelsRef = useRef<Map<string, ModelSite>>();

  // store cloud files as ref first because useState triggers re-rendering every time an element is being pushed into
  // the array. This causes slowdown when the array is being generated from the cloud data (the larger the array, the
  // more calls for rendering). The actual array for rendering is stored in cloudFileArray. The flag updateCloudFileArray
  // is used to instruct when it is time to copy the data from the ref array to the state array.
  const cloudFilesRef = useRef<CloudFileInfo[] | void>();
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

  useFlag(curateDesignToProjectFlag, curateDesignToProject, () =>
    setPrimitiveStore('curateDesignToProjectFlag', false),
  );

  useEffect(() => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    let initialize = firebase.apps.length === 0; // no app, should initialize
    if (firebase.apps.length === 1 && firebase.apps[0].name === FirebaseName.LOG_DATA) {
      initialize = true; // if there is only the logger app, should initialize
    }
    if (initialize) {
      firebase.initializeApp(config);
    } else {
      firebase.app(); // if already initialized, use the default one
    }

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
    firebase.auth().onAuthStateChanged((u) => {
      const params = new URLSearchParams(window.location.search);
      const title = params.get('title');
      if (u) {
        setCommonStore((state) => {
          if (state.user) {
            state.user.uid = u.uid;
            state.user.displayName = u.displayName;
            state.user.email = u.email;
            state.user.photoURL = u.photoURL;
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
    if (updateCloudFileArray) {
      if (cloudFilesRef.current && user.uid) {
        const arr: any[] = [];
        cloudFilesRef.current.forEach((f, i) => {
          arr.push({
            key: i.toString(),
            title: f.fileName,
            time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm A'),
            timestamp: f.timestamp,
            userid: user.uid,
            action: '',
          });
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
  };

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
    });
  };

  const signIn = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
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
      })
      .catch((error) => {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          showError(i18n.t('message.CannotSignIn', lang) + ': ' + error);
        }
      });
    resetToSelectMode();
  };

  const registerUser = async (user: User): Promise<any> => {
    const firestore = firebase.firestore();
    let signFile = false;
    let noLogging = false;
    let schoolID = SchoolID.UNKNOWN;
    let classID = ClassID.UNKNOWN;
    let likes: string[] = [];
    let published: string[] = [];
    let aliases: string[] = [];
    let found = false;
    let userCount = 0;
    if (user.uid !== null) {
      const superuser = user && user.email === 'charles@intofuture.org';
      if (superuser) {
        // This way of counting a collection is expensive. It is reserved for only superusers.
        // It should be replaced by getCountFromServer in the latest version of Firestore;
        await firestore
          .collection('users')
          .get()
          .then((querySnapshot) => {
            userCount = querySnapshot.size;
          });
      }
      found = await firestore
        .collection('users')
        .doc(user.uid)
        .get()
        .then((doc) => {
          const docData = doc.data();
          if (docData) {
            signFile = !!docData.signFile;
            noLogging = !!docData.noLogging;
            schoolID = docData.schoolID ? (docData.schoolID as SchoolID) : SchoolID.UNKNOWN;
            classID = docData.classID ? (docData.classID as ClassID) : ClassID.UNKNOWN;
            if (docData.likes) likes = docData.likes;
            if (docData.published) published = docData.published;
            if (docData.aliases) aliases = docData.aliases;
            return true;
          }
          return false;
        });
    }
    if (found) {
      // update common store state
      setCommonStore((state) => {
        state.user.signFile = signFile;
        state.user.noLogging = noLogging;
        state.user.schoolID = schoolID;
        state.user.classID = classID;
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
      user.schoolID = schoolID;
      user.classID = classID;
      user.likes = likes;
      user.published = published;
      user.aliases = aliases;
    } else {
      if (user.uid) {
        firestore
          .collection('users')
          .doc(user.uid)
          .set({
            uid: user.uid,
            signFile: !!user.signFile, // don't listen to WebStorm's suggestion to simplify it as this may be undefined
            noLogging: !!user.noLogging,
            schoolID: user.schoolID ?? SchoolID.UNKNOWN,
            classID: user.classID ?? ClassID.UNKNOWN,
            since: dayjs(new Date()).format('MM/DD/YYYY hh:mm A'),
            os: Util.getOS(),
          })
          .then(() => {
            showInfo(i18n.t('message.YourAccountWasCreated', lang));
          })
          .catch((error) => {
            showError(i18n.t('message.CannotCreateAccount', lang) + ': ' + error);
          });
      }
    }
  };

  const signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        setCommonStore((state) => {
          state.user.uid = null;
          state.user.email = null;
          state.user.displayName = null;
          state.user.photoURL = null;
          state.user.signFile = false;
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
      })
      .catch((error) => {
        showError(i18n.t('message.CannotSignOut', lang) + ': ' + error);
      });
  };

  function saveAccountSettings() {
    if (user.uid) {
      const firestore = firebase.firestore();
      firestore
        .collection('users')
        .doc(user.uid)
        .update({
          signFile: !!user.signFile, // don't listen to WebStorm's suggestion to simplify it as this may be undefined
          schoolID: user.schoolID ?? SchoolID.UNKNOWN,
          classID: user.classID ?? ClassID.UNKNOWN,
        })
        .then(() => {
          showInfo(i18n.t('message.YourAccountSettingsWereSaved', lang));
        })
        .catch((error) => {
          showError(i18n.t('message.CannotSaveYourAccountSettings', lang) + ': ' + error);
        });
    }
  }

  const fetchModelSites = async () => {
    setLoading(true);
    await firebase
      .firestore()
      .collection('models')
      .get()
      .then((querySnapshot) => {
        const models = new Map<string, Map<string, ModelSite>>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const m = new Map<string, ModelSite>();
            for (const k in data) {
              if (!data[k].countryCode) {
                if (data[k].address?.endsWith('USA')) data[k]['countryCode'] = 'US';
              }
              m.set(k, data[k]);
            }
            models.set(doc.id, m);
          }
        });
        setCommonStore((state) => {
          state.modelSites = models;
        });
        return models;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotLoadModelsOnMap', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // get latest submission
  const fetchLatest = async () => {
    await firebase
      .firestore()
      .collection('board')
      .doc('info')
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data && data.latestModel) {
            setCommonStore((state) => {
              // if it has been deleted, don't show
              let found = false;
              const m = data.latestModel as ModelSite;
              if (m.author) {
                found = !!state.peopleModels.get(m.author)?.get(Util.getModelKey(m));
              }
              state.latestModelSite = found ? m : undefined;
            });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchPeopleModels = async () => {
    setLoading(true);
    await firebase
      .firestore()
      .collection('board')
      .doc('people')
      .get()
      .then((doc) => {
        const data = doc.data();
        if (data) {
          const peopleModels = new Map<string, Map<string, ModelSite>>();
          for (const k in data) {
            peopleModels.set(k, new Map<string, ModelSite>(Object.entries(data[k])));
          }
          setCommonStore((state) => {
            state.peopleModels = peopleModels;
          });
        }
      })
      .catch((error) => {
        showError(i18n.t('message.CannotLoadLeaderboard', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const deleteFromModelsMap = (model: ModelSite, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      firebase
        .firestore()
        .collection('models')
        .doc(Util.getLatLngKey(model.latitude, model.longitude))
        .update({ [Util.getModelKey(model)]: firebase.firestore.FieldValue.delete() })
        .then(() => {
          showSuccess(i18n.t('message.ModelDeletedFromMap', lang));
          if (successCallback) successCallback();
        })
        .catch((error) => {
          showError(i18n.t('message.CannotDeleteModelFromMap', lang) + ': ' + error);
        });
      // remove the record from the leaderboard
      firebase
        .firestore()
        .collection('board')
        .doc('people')
        .update({
          [(model.author ?? 'Anonymous') + '.' + Util.getModelKey(model)]: firebase.firestore.FieldValue.delete(),
        })
        .then(() => {
          // also remove the cached record
          setCommonStore((state) => {
            if (state.peopleModels) {
              state.peopleModels.delete(Util.getModelKey(model));
              usePrimitiveStore.getState().set((state) => {
                state.leaderboardFlag = true;
              });
            }
          });
        });
      // remove the record in the user's account
      firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          published: firebase.firestore.FieldValue.arrayRemove(model.title),
        })
        .then(() => {
          // also remove the cached record
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
        });
    }
  };

  const likeModelsMap = (model: ModelSite, like: boolean, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      const modelKey = Util.getModelKey(model);
      // keep or remove a record of like in the user's account
      firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update(
          like
            ? {
                likes: firebase.firestore.FieldValue.arrayUnion(modelKey),
              }
            : {
                likes: firebase.firestore.FieldValue.arrayRemove(modelKey),
              },
        )
        .then(() => {
          // ignore
        })
        .catch((error) => {
          showError(i18n.t('message.CannotLikeModelFromMap', lang) + ': ' + error);
        });
      // increment or decrement the likes counter
      const likeCountPath = modelKey + '.likeCount';
      firebase
        .firestore()
        .collection('models')
        .doc(Util.getLatLngKey(model.latitude, model.longitude))
        .update(
          like
            ? {
                [likeCountPath]: firebase.firestore.FieldValue.increment(1),
              }
            : {
                [likeCountPath]: firebase.firestore.FieldValue.increment(-1),
              },
        )
        .then(() => {
          if (successCallback) successCallback();
        })
        .catch((error) => {
          showError(i18n.t('message.CannotLikeModelFromMap', lang) + ': ' + error);
        });
    }
  };

  const pinModelsMap = (model: ModelSite, pinned: boolean, successCallback?: () => void) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      firebase
        .firestore()
        .collection('models')
        .doc(Util.getLatLngKey(model.latitude, model.longitude))
        .update({
          [Util.getModelKey(model) + '.pinned']: pinned,
        })
        .then(() => {
          if (successCallback) successCallback();
        })
        .catch(() => {
          // ignore
        });
    }
  };

  // TODO:
  // unfortunately, this throws an error for users who do not log in
  // because of write access is only granted to registered users who log in.
  const countClicksModelsMap = (model: ModelSite) => {
    // pass if there is no user currently logged in
    if (user && user.uid) {
      firebase
        .firestore()
        .collection('models')
        .doc(Util.getLatLngKey(model.latitude, model.longitude))
        .update({
          [Util.getModelKey(model) + '.clickCount']: firebase.firestore.FieldValue.increment(1),
        })
        .then(() => {
          // ignore
        })
        .catch(() => {
          // ignore
        });
    }
  };

  // fetch owner's projects from the cloud
  const fetchMyProjects = async (silent: boolean) => {
    if (!user.uid) return;
    if (!silent) setLoading(true);
    myProjectsRef.current = await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('projects')
      .get()
      .then((querySnapshot) => {
        const a: ProjectState[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          a.push({
            owner: user.uid,
            title: doc.id,
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
          } as ProjectState);
        });
        return a;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenYourProjects', lang) + ': ' + error);
      })
      .finally(() => {
        if (!silent) setLoading(false);
        setUpdateProjectArray(true);
      });
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

  const deleteProject = (title: string) => {
    if (!user.uid) return;
    firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('projects')
      .doc(title)
      .delete()
      .then(() => {
        if (myProjectsRef.current && user.uid) {
          // also delete the designs of the deleted project
          for (const p of myProjectsRef.current) {
            if (p.title === title && p.designs) {
              for (const d of p.designs) {
                setCommonStore((state) => {
                  if (d.title === state.cloudFile) {
                    state.cloudFile = undefined;
                  }
                });
                firebase
                  .firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('designs')
                  .doc(d.title)
                  .delete()
                  .then(() => {
                    // ignore
                  })
                  .catch((error) => {
                    showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
                  });
              }
              setUpdateProjectArray(true);
              break;
            }
          }
          myProjectsRef.current = myProjectsRef.current.filter((e) => {
            return e.title !== title;
          });
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
          }
        });
      })
      .catch((error) => {
        showError(i18n.t('message.CannotDeleteProject', lang) + ': ' + error);
      });
  };

  const renameProject = (oldTitle: string, newTitle: string) => {
    const uid = user.uid;
    if (!uid) return;
    // check if the new project title is already taken
    doesProjectExist(uid, newTitle, (error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    }).then((exist) => {
      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + newTitle);
      } else {
        const files = firebase.firestore().collection('users').doc(uid).collection('projects');
        files
          .doc(oldTitle)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const data = doc.data();
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
                files
                  .doc(newTitle)
                  .set(newData)
                  .then(() => {
                    files
                      .doc(oldTitle)
                      .delete()
                      .then(() => {
                        // ignore
                      });
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
                  });
              }
            }
          })
          .catch((error) => {
            showError(i18n.t('message.CannotRenameProject', lang) + ': ' + error);
          });
      }
    });
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

  const addDesignToProject = (
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
    firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('projects')
      .doc(projectTitle)
      .update({
        designs: firebase.firestore.FieldValue.arrayUnion(design),
        counter: firebase.firestore.FieldValue.increment(1),
      })
      .then(() => {
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
      })
      .catch((error) => {
        showError(i18n.t('message.CannotAddDesignToProject', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
      });
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

  const removeCloudFileRefIfExisting = (title: string) => {
    if (cloudFilesRef.current) {
      let index = -1;
      for (const [i, file] of cloudFilesRef.current.entries()) {
        if (file.fileName === title) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        cloudFilesRef.current.splice(index, 1);
      }
    }
  };

  const renameCloudFileRef = (oldTitle: string, newTitle: string) => {
    if (cloudFilesRef.current) {
      let index = -1;
      let info = null;
      for (const [i, file] of cloudFilesRef.current.entries()) {
        if (file.fileName === oldTitle) {
          index = i;
          info = {
            fileName: newTitle,
            uuid: file.uuid,
            timestamp: file.timestamp,
          } as CloudFileInfo;
          break;
        }
      }
      if (index !== -1 && info) {
        cloudFilesRef.current.splice(index, 1);
        cloudFilesRef.current.push(info);
      }
    }
  };

  const saveToCloudWithoutCheckingExistence = (title: string, silent: boolean, ofProject?: boolean) => {
    if (!user.uid) return;
    try {
      const userDocuments = firebase.firestore().collection('users').doc(user.uid);
      if (userDocuments) {
        if (localContentToImportAfterCloudFileUpdate) {
          usePrimitiveStore.getState().set((state) => {
            state.waiting = true;
          });
        }
        const doc = userDocuments.collection(ofProject ? 'designs' : 'files').doc(title);
        doc
          .set(exportContent())
          .then(() => {
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
                const newUrl = HOME_URL + '?client=web&userid=' + user.uid + '&title=' + encodeURIComponent(title);
                window.history.pushState({}, document.title, newUrl);
              }
            }
            doc.get().then((snapshot) => {
              const data = snapshot.data();
              if (data && cloudFilesRef.current) {
                removeCloudFileRefIfExisting(title);
                cloudFilesRef.current.push({
                  timestamp: data.timestamp,
                  fileName: title,
                  uuid: data.docid,
                } as CloudFileInfo);
                setUpdateCloudFileArray(true);
              }
            });
          })
          .catch((error) => {
            showError(i18n.t('message.CannotSaveYourFileToCloud', lang) + ': ' + error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } catch (error) {
      showError(i18n.t('message.CannotSaveYourFileToCloud', lang) + ': ' + error);
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

  const fetchMyCloudFiles = async () => {
    if (!user.uid) return;
    setLoading(true);
    // fetch owner's file information from the cloud
    cloudFilesRef.current = [];
    await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('files')
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          cloudFilesRef.current?.push({
            timestamp: data.timestamp,
            fileName: doc.id,
            uuid: data.docid,
          } as CloudFileInfo);
        });
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenCloudFolder', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
        setUpdateCloudFileArray(true);
      });
  };

  const deleteCloudFile = (userid: string, title: string) => {
    firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('files')
      .doc(title)
      .delete()
      .then(() => {
        removeCloudFileRefIfExisting(title);
        setCloudFileArray(
          cloudFileArray.filter((e) => {
            return e.userid !== userid || e.title !== title;
          }),
        );
        setCommonStore((state) => {
          if (title === state.cloudFile) {
            state.cloudFile = undefined;
          }
        });
      })
      .catch((error) => {
        showError(i18n.t('message.CannotDeleteCloudFile', lang) + ': ' + error);
      });
  };

  const renameCloudFile = (userid: string, oldTitle: string, newTitle: string) => {
    doesDocExist(userid, newTitle, (error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    }).then((exist) => {
      if (exist) {
        showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + newTitle);
      } else {
        const files = firebase.firestore().collection('users').doc(userid).collection('files');
        files
          .doc(oldTitle)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data) {
                files
                  .doc(newTitle)
                  .set(data)
                  .then(() => {
                    files
                      .doc(oldTitle)
                      .delete()
                      .then(() => {
                        // ignore for now
                      })
                      .catch((error) => {
                        showError(i18n.t('message.CannotDeleteCloudFile', lang) + ' ' + oldTitle + ': ' + error);
                      });
                    for (const f of cloudFileArray) {
                      if (f.userid === userid && f.title === oldTitle) {
                        f.title = newTitle;
                        break;
                      }
                    }
                    setCloudFileArray([...cloudFileArray]);
                    renameCloudFileRef(oldTitle, newTitle);
                    setCommonStore((state) => {
                      if (state.cloudFile === oldTitle) {
                        state.cloudFile = newTitle;
                      }
                    });
                    // change the address field of the browser when the cloud file is currently open
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('title') === oldTitle && params.get('userid') === user.uid) {
                      const newUrl =
                        HOME_URL + '?client=web&userid=' + user.uid + '&title=' + encodeURIComponent(newTitle);
                      window.history.pushState({}, document.title, newUrl);
                    }
                  });
              }
            }
          })
          .catch((error) => {
            showError(i18n.t('message.CannotRenameCloudFile', lang) + ': ' + error);
          });
      }
    });
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

  function publishOnModelsMap() {
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
        const collection = firebase.firestore().collection('models');
        if (collection) {
          // first we upload a thumbnail of the model to Firestore Cloud Storage
          const storageRef = firebase.storage().ref();
          if (canvas) {
            const thumbnail = Util.resizeCanvas(canvas, 200);
            thumbnail.toBlob((blob) => {
              if (blob) {
                const metadata = { contentType: 'image/png' };
                const uploadTask = storageRef.child('images/' + modelKey + '.png').put(blob, metadata);
                // Listen for state changes, errors, and completion of the upload.
                uploadTask.on(
                  firebase.storage.TaskEvent.STATE_CHANGED,
                  (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (progress > 0) {
                      showInfo(i18n.t('word.Upload', lang) + ': ' + progress + '%');
                    }
                  },
                  (error) => {
                    showError('Storage: ' + error);
                  },
                  () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                      const m2 = { ...m, thumbnailUrl: downloadURL } as ModelSite;
                      // after we get a download URL for the thumbnail image, we then go on to upload other data
                      const document = collection.doc(Util.getLatLngKey(latitude, longitude));
                      document
                        .get()
                        .then((doc) => {
                          if (doc.exists) {
                            const data = doc.data();
                            if (data && data[modelKey]) {
                              document.set({ [modelKey]: m2 }, { merge: true }).then(() => {
                                showSuccess(i18n.t('menu.file.UpdatedOnModelsMap', lang) + '.');
                              });
                            } else {
                              document.set({ [modelKey]: m2 }, { merge: true }).then(() => {
                                showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                              });
                            }
                          } else {
                            document.set({ [modelKey]: m2 }, { merge: true }).then(() => {
                              showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                            });
                          }
                        })
                        .catch((error) => {
                          showError(i18n.t('message.CannotPublishModelOnMap', lang) + ': ' + error);
                        });
                      // add to the leaderboard
                      firebase
                        .firestore()
                        .collection('board')
                        .doc('people')
                        .update({
                          [(m2.author ?? 'Anonymous') + '.' + Util.getModelKey(m2)]: m2,
                        })
                        .then(() => {
                          // update the cache
                          setCommonStore((state) => {
                            if (state.peopleModels) {
                              const models = state.peopleModels.get(m2.author ?? 'Anonymous');
                              if (models) {
                                models.set(Util.getModelKey(m2), m2);
                              }
                            }
                          });
                        });
                      // notify info
                      firebase
                        .firestore()
                        .collection('board')
                        .doc('info')
                        .set({ latestModel: m2 }, { merge: true })
                        .then(() => {
                          // TODO
                        });
                    });
                  },
                );
              }
            });
          }
        }
        // keep a record of the published model in the user's account
        firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .update(
            useStore.getState().modelAuthor === user.displayName
              ? {
                  published: firebase.firestore.FieldValue.arrayUnion(title),
                }
              : {
                  published: firebase.firestore.FieldValue.arrayUnion(title),
                  aliases: firebase.firestore.FieldValue.arrayUnion(useStore.getState().modelAuthor),
                },
          )
          .then(() => {
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
          });
      }
    }
  }

  function createNewProject() {
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
    // check if the project title is already used
    doesProjectExist(user.uid, t, (error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    })
      .then((exist) => {
        if (exist) {
          showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + t);
        } else {
          if (user && user.uid) {
            const type = usePrimitiveStore.getState().projectType ?? DesignProblem.SOLAR_PANEL_ARRAY;
            const description = usePrimitiveStore.getState().projectDescription ?? null;
            const timestamp = new Date().getTime();
            const counter = 0;
            firebase
              .firestore()
              .collection('users')
              .doc(user.uid)
              .collection('projects')
              .doc(t)
              .set({
                owner: user.uid,
                timestamp,
                type,
                description,
                counter,
                designs: [],
                hiddenParameters: ProjectUtil.getDefaultHiddenParameters(type),
              })
              .then(() => {
                setCommonStore((state) => {
                  state.projectView = true;
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
                });
              })
              .catch((error) => {
                showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
              })
              .finally(() => {
                // if the project list panel is open, update it
                if (showProjectListPanel) {
                  fetchMyProjects(false).then(() => {
                    setUpdateFlag(!updateFlag);
                  });
                }
                setLoading(false);
              });
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function saveProjectAs() {
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
    // check if the project title is already taken
    doesProjectExist(user.uid, t, (error) => {
      showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
    }).then((exist) => {
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
              firebase
                .firestore()
                .collection('users')
                .doc(user.uid)
                .collection('projects')
                .doc(t)
                .set({
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
                })
                .then(() => {
                  setCommonStore((state) => {
                    state.projectView = true;
                    state.projectState.owner = user.uid;
                    state.projectState.type = type;
                    state.projectState.title = title;
                    state.projectState.description = description;
                    state.projectState.designs = newDesigns;
                  });
                })
                .catch((error) => {
                  showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
                })
                .finally(() => {
                  if (showProjectListPanel) {
                    fetchMyProjects(false).then(() => {
                      setUpdateFlag(!updateFlag);
                    });
                  }
                  setLoading(false);
                });
            }
          }
        }
      }
    });
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
    fetchMyCloudFiles().then(() => {
      usePrimitiveStore.getState().set((state) => {
        state.showCloudFilePanel = true;
      });
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
      <MainToolBar signIn={signIn} signOut={signOut} />
      {showCloudFilePanel && cloudFilesRef.current && (
        <CloudFilePanel
          cloudFileArray={cloudFileArray}
          openCloudFile={openCloudFileWithSaveReminder}
          deleteCloudFile={deleteCloudFile}
          renameCloudFile={renameCloudFile}
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
