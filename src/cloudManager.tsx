/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './stores/common';
import { usePrimitiveStore } from './stores/commonPrimitive';
import * as Selector from './stores/selector';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo, showSuccess } from './helpers';
import {
  ClassID,
  CloudFileInfo,
  Design,
  DesignProblem,
  FirebaseName,
  ModelSite,
  ObjectType,
  ProjectInfo,
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
import FieldValue = firebase.firestore.FieldValue;
import { loadDataFromFirebase } from './cloudUtil';

export interface CloudManagerProps {
  viewOnly: boolean;
  canvas?: HTMLCanvasElement | null;
}

const CloudManager = ({ viewOnly = false, canvas }: CloudManagerProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const language = useStore(Selector.language);
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
  const saveCloudFileFlag = usePrimitiveStore(Selector.saveCloudFileFlag);
  const modelsMapFlag = usePrimitiveStore(Selector.modelsMapFlag);
  const leaderboardFlag = usePrimitiveStore(Selector.leaderboardFlag);
  const publishOnMapFlag = usePrimitiveStore(Selector.publishOnModelsMapFlag);
  const listCloudFilesFlag = usePrimitiveStore(Selector.listCloudFilesFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const showCloudFileTitleDialogFlag = useStore(Selector.showCloudFileTitleDialogFlag);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const changed = useStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);
  const peopleModels = useStore(Selector.peopleModels);
  const createProjectFlag = usePrimitiveStore(Selector.createProjectFlag);
  const saveProjectFlag = usePrimitiveStore(Selector.saveProjectFlag);
  const curateDesignToProjectFlag = usePrimitiveStore(Selector.curateDesignToProjectFlag);
  const showProjectsFlag = usePrimitiveStore(Selector.showProjectsFlag);

  const [loading, setLoading] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [projectArray, setProjectArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const cloudFiles = useRef<CloudFileInfo[] | void>();
  const myProjects = useRef<ProjectInfo[] | void>();
  const authorModelsRef = useRef<Map<string, ModelSite>>();
  const firstCallUpdateCloudFile = useRef<boolean>(true);
  const firstCallFetchModels = useRef<boolean>(true);
  const firstCallFetchLeaderboard = useRef<boolean>(true);
  const firstCallPublishOnMap = useRef<boolean>(true);
  const firstCallCreateProject = useRef<boolean>(true);
  const firstCallSaveProject = useRef<boolean>(true);
  const firstCallCurateDesign = useRef<boolean>(true);
  const firstCallListProjects = useRef<boolean>(true);
  const firstCallListCloudFiles = useRef<boolean>(true);
  const firstAccountSettings = useRef<boolean>(true);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
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
    // do not use firebase.auth().currentUser - currentUser might be null because the auth object has not finished initializing.
    // If you use an observer to keep track of the user's sign-in status, you don't need to handle this case.
    firebase.auth().onAuthStateChanged((u) => {
      if (u) {
        setCommonStore((state) => {
          if (state.user) {
            state.user.uid = u.uid;
            state.user.displayName = u.displayName;
            state.user.email = u.email;
            state.user.photoURL = u.photoURL;
          }
        });
      }
      init(); // load the initial state after we recognize the user
    });
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
    if (cloudFiles.current) {
      const arr: any[] = [];
      cloudFiles.current.forEach((f, i) => {
        arr.push({
          key: i.toString(),
          title: f.fileName,
          time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm a'),
          timestamp: f.timestamp,
          userid: f.userid,
          action: '',
        });
      });
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setCloudFileArray(arr);
    }
    // FIXME: React says that the dependency of the mutable cloudFiles.current is unnecessary,
    //  but we need this for the code to work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudFiles.current]);

  useEffect(() => {
    if (myProjects.current) {
      const arr: any[] = [];
      myProjects.current.forEach((f, i) => {
        arr.push({
          key: i.toString(),
          owner: f.owner,
          title: f.title,
          time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm a'),
          timestamp: f.timestamp,
          description: f.description,
          type: f.type,
          designs: f.designs,
          hiddenParameters: f.hiddenParameters ?? [],
          counter: f.counter,
          action: '',
        });
      });
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setProjectArray(arr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProjects.current]);

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
    if (firstCallUpdateCloudFile.current) {
      firstCallUpdateCloudFile.current = false;
    } else {
      updateCloudFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCloudFileFlag]);

  useEffect(() => {
    if (firstCallFetchModels.current) {
      firstCallFetchModels.current = false;
    } else {
      fetchModelSites().then(() => {
        fetchLatest().then(() => {
          // ignore for now
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsMapFlag]);

  useEffect(() => {
    if (firstCallFetchLeaderboard.current) {
      firstCallFetchLeaderboard.current = false;
    } else {
      fetchPeopleModels().then(() => {
        fetchLatest().then(() => {
          // ignore for now
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardFlag]);

  useEffect(() => {
    if (firstCallPublishOnMap.current) {
      firstCallPublishOnMap.current = false;
    } else {
      publishOnModelsMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishOnMapFlag]);

  useEffect(() => {
    if (firstCallCreateProject.current) {
      firstCallCreateProject.current = false;
    } else {
      createNewProject(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createProjectFlag]);

  useEffect(() => {
    if (firstCallSaveProject.current) {
      firstCallSaveProject.current = false;
    } else {
      createNewProject(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveProjectFlag]);

  useEffect(() => {
    if (firstCallCurateDesign.current) {
      firstCallCurateDesign.current = false;
    } else {
      curateDesignToProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curateDesignToProjectFlag]);

  useEffect(() => {
    if (firstCallListProjects.current) {
      firstCallListProjects.current = false;
    } else {
      listMyProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProjectsFlag]);

  useEffect(() => {
    if (firstCallListCloudFiles.current) {
      firstCallListCloudFiles.current = false;
    } else {
      listMyCloudFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listCloudFilesFlag]);

  useEffect(() => {
    setTitleDialogVisible(showCloudFileTitleDialog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCloudFileTitleDialogFlag]);

  useEffect(() => {
    setTitle(cloudFile ?? 'My Aladdin File');
  }, [cloudFile]);

  useEffect(() => {
    if (firstAccountSettings.current) {
      firstAccountSettings.current = false;
    } else {
      saveAccountSettings(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.signFile, user.schoolID, user.classID]);

  const init = () => {
    const params = new URLSearchParams(window.location.search);
    const userid = params.get('userid');
    const title = params.get('title');
    const project = params.get('project');
    if (userid) {
      if (project) {
        setLoading(true);
        fetchProject(userid, project).finally(() => {
          setLoading(false);
        });
        if (title) {
          openCloudFile(userid, title, true);
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
      state.groupMasterId = null;
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
    let userCount = 0;
    let schoolID = SchoolID.UNKNOWN;
    let classID = ClassID.UNKNOWN;
    let likes: string[] = [];
    let published: string[] = [];
    let aliases: string[] = [];
    const found = await firestore
      .collection('users')
      .get()
      .then((querySnapshot) => {
        userCount = querySnapshot.size;
        for (const doc of querySnapshot.docs) {
          if (doc.id === user.uid) {
            const docData = doc.data();
            signFile = !!docData.signFile;
            noLogging = !!docData.noLogging;
            schoolID = docData.schoolID ? (docData.schoolID as SchoolID) : SchoolID.UNKNOWN;
            classID = docData.classID ? (docData.classID as ClassID) : ClassID.UNKNOWN;
            if (docData.likes) likes = docData.likes;
            if (docData.published) published = docData.published;
            if (docData.aliases) aliases = docData.aliases;
            return true;
          }
        }
        return false;
      });
    if (found) {
      setCommonStore((state) => {
        state.user.signFile = signFile;
        state.user.noLogging = noLogging;
        state.user.schoolID = schoolID;
        state.user.classID = classID;
        state.user.likes = likes;
        state.user.published = published;
        state.user.aliases = aliases;
      });
      usePrimitiveStore.setState((state) => {
        state.userCount = userCount;
      });
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
            signFile: !!user.signFile, // don't listen to WebStorm's suggestion to simplify it
            noLogging: !!user.noLogging,
            schoolID: user.schoolID ?? SchoolID.UNKNOWN,
            classID: user.classID ?? ClassID.UNKNOWN,
            since: dayjs(new Date()).format('MM/DD/YYYY hh:mm a'),
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
        usePrimitiveStore.setState((state) => {
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

  const saveAccountSettings = (user: User) => {
    if (user.uid) {
      const firestore = firebase.firestore();
      firestore
        .collection('users')
        .doc(user.uid)
        .update({
          signFile: !!user.signFile,
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
  };

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
              let existing = false;
              const m = data.latestModel as ModelSite;
              if (m.author) {
                existing = !!state.peopleModels.get(m.author)?.get(Util.getModelKey(m));
              }
              state.latestModelSite = existing ? m : undefined;
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

  const publishOnModelsMap = () => {
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
  };

  const deleteFromModelsMap = (model: ModelSite, successCallback?: Function) => {
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
              usePrimitiveStore.setState((state) => {
                state.leaderboardFlag = !state.leaderboardFlag;
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

  const likeModelsMap = (model: ModelSite, like: boolean, successCallback?: Function) => {
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

  const pinModelsMap = (model: ModelSite, pinned: boolean, successCallback?: Function) => {
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
        .catch((error) => {
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
        .catch((error) => {
          // ignore
        });
    }
  };

  const createNewProject = (saveAs: boolean) => {
    if (user && user.uid) {
      const title = useStore.getState().projectTitle;
      if (title) {
        const t = title.trim();
        if (t.length > 0) {
          const type = useStore.getState().projectType;
          const description = useStore.getState().projectDescription;
          const timestamp = new Date().getTime();
          const counter = saveAs ? useStore.getState().projectDesignCounter : 0;
          fetchMyProjects().then(() => {
            let exist = false;
            if (myProjects.current) {
              for (const p of myProjects.current) {
                if (p.title === t) {
                  exist = true;
                  break;
                }
              }
            }
            if (exist) {
              showInfo(i18n.t('message.TitleUsedChooseDifferentOne', lang) + ': ' + t);
            } else {
              if (user && user.uid) {
                try {
                  const doc = firebase.firestore().collection('users').doc(user.uid);
                  if (doc) {
                    doc
                      .collection('projects')
                      .doc(t)
                      .set({
                        owner: user.uid,
                        timestamp,
                        type,
                        description,
                        counter,
                        designs: saveAs ? useStore.getState().projectDesigns : [],
                        hiddenParameters: saveAs ? useStore.getState().projectHiddenParameters : [],
                      })
                      .then(() => {
                        setCommonStore((state) => {
                          state.projectView = true;
                          state.projectOwner = user.uid;
                          if (!saveAs) {
                            state.projectDesignCounter = 0;
                            state.projectDesigns = [];
                            state.projectHiddenParameters = [];
                          }
                        });
                      })
                      .catch((error) => {
                        showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
                      })
                      .finally(() => {
                        setLoading(false);
                        if (showProjectListPanel) {
                          fetchMyProjects().then(() => {
                            setUpdateFlag(!updateFlag);
                          });
                        }
                      });
                  }
                } catch (error) {
                  showError(i18n.t('message.CannotCreateNewProject', lang) + ': ' + error);
                  setLoading(false);
                }
              }
            }
          });
        } else {
          showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
        }
      } else {
        showError(i18n.t('message.CannotCreateNewProjectWithoutTitle', lang) + '.');
      }
    }
  };

  const fetchMyProjects = async () => {
    if (!user.uid) return;
    setLoading(true);
    // fetch owner's projects from the cloud
    myProjects.current = await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('projects')
      .get()
      .then((querySnapshot) => {
        const a: ProjectInfo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          a.push({
            owner: user.uid,
            title: doc.id,
            timestamp: data.timestamp,
            description: data.description,
            type: data.type,
            designs: data.designs ?? [],
            hiddenParameters: data.hiddenParameters ?? [],
            counter: data.counter ?? 0,
          } as ProjectInfo);
        });
        return a;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenYourProjects', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchProject = async (userid: string, project: string) => {
    await firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('projects')
      .doc(project)
      .get()
      .then((doc) => {
        const data = doc.data();
        if (data) {
          const pi = {
            owner: userid,
            title: doc.id,
            timestamp: data.timestamp,
            description: data.description,
            type: data.type,
            designs: data.designs,
            hiddenParameters: data.hiddenParameters,
            counter: data.counter ?? 0,
          } as ProjectInfo;
          openProject(pi.owner, pi.title, pi.type, pi.description, pi.designs, pi.hiddenParameters, pi.counter);
        } else {
          showError(i18n.t('message.CannotOpenProject', lang) + ': ' + project);
        }
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenProject', lang) + ': ' + error);
      });
  };

  const listMyProjects = () => {
    if (user.uid) {
      fetchMyProjects().then(() => {
        usePrimitiveStore.setState((state) => {
          state.showProjectListPanel = true;
        });
      });
    }
  };

  const openProject = (
    owner: string,
    title: string,
    type: DesignProblem,
    description: string,
    designs: Design[] | null,
    hiddenParameters: string[] | null,
    designCounter: number,
  ) => {
    setCommonStore((state) => {
      state.projectOwner = owner;
      state.projectTitle = title;
      state.projectType = type;
      state.projectDescription = description;
      state.projectDesigns = designs;
      state.projectHiddenParameters = hiddenParameters ?? [];
      state.projectDesignCounter = designCounter;
      state.projectView = true;
    });
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
        setProjectArray(
          projectArray.filter((e) => {
            return e.title !== title;
          }),
        );
        setCommonStore((state) => {
          if (title === state.projectTitle) {
            state.projectTitle = null;
            state.projectDescription = null;
            state.projectView = false;
          }
        });
      })
      .catch((error) => {
        showError(i18n.t('message.CannotDeleteProject', lang) + ': ' + error);
      });
  };

  const renameProject = (oldTitle: string, newTitle: string) => {
    if (!user.uid) return;
    const files = firebase.firestore().collection('users').doc(user.uid).collection('projects');
    files
      .doc(oldTitle)
      .get()
      .then((doc) => {
        if (doc && doc.exists) {
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
                    // TODO
                  });
                for (const f of projectArray) {
                  if (f.title === oldTitle) {
                    f.title = newTitle;
                    break;
                  }
                }
                setProjectArray([...projectArray]);
                setCommonStore((state) => {
                  if (state.projectTitle === oldTitle) {
                    state.projectTitle = newTitle;
                  }
                });
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
  };

  const curateDesignToProject = () => {
    const projectTitle = useStore.getState().projectTitle;
    const projectOwner = useStore.getState().projectOwner;
    if (user.uid !== projectOwner) {
      showInfo(i18n.t('message.CannotAddDesignToProjectOwnedByOthers', lang));
    } else {
      if (projectTitle) {
        const counter = useStore.getState().projectDesignCounter ?? 0;
        const ft = projectTitle + ' ' + counter;
        setLoading(true);
        fetchMyCloudFiles().then(() => {
          let exist = false;
          if (cloudFiles.current) {
            for (const p of cloudFiles.current) {
              if (p.fileName === ft) {
                exist = true;
                break;
              }
            }
          }
          if (exist) {
            Modal.confirm({
              title: i18n.t('message.CloudFileWithTitleExistsDoYouWantToOverwrite', lang),
              icon: <QuestionCircleOutlined />,
              onOk: () => {
                saveToCloudWithoutCheckingExistence(ft, true);
                addDesignToProject(projectTitle, ft);
              },
              onCancel: () => {
                setCommonStore((state) => {
                  state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                  state.showCloudFileTitleDialog = true;
                });
              },
              okText: i18n.t('word.Yes', lang),
              cancelText: i18n.t('word.No', lang),
            });
          } else {
            saveToCloudWithoutCheckingExistence(ft, true);
            addDesignToProject(projectTitle, ft);
          }
        });
        setTitleDialogVisible(false);
      }
    }
  };

  const addDesignToProject = (projectTitle: string, fileTitle: string) => {
    // first we upload a thumbnail of the design to Firestore Cloud Storage
    const storageRef = firebase.storage().ref();
    if (canvas) {
      const thumbnail = Util.resizeCanvas(canvas, 200);
      thumbnail.toBlob((blob) => {
        if (blob) {
          const metadata = { contentType: 'image/png' };
          const uploadTask = storageRef.child('images/' + fileTitle + '.png').put(blob, metadata);
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
                if (!user.uid) return;
                // after we get a download URL for the thumbnail image, we then go on to upload other data
                const designProjectType = useStore.getState().designProjectType;
                let design = { title: fileTitle, thumbnailUrl: downloadURL } as Design;
                switch (designProjectType) {
                  case DesignProblem.SOLAR_PANEL_ARRAY:
                    const panelCount = Util.countAllSolarPanels();
                    const dailyYield = Util.countAllSolarPanelDailyYields();
                    const yearlyYield = Util.countAllSolarPanelYearlyYields();
                    const economicParams = useStore.getState().economicsParams;
                    const unitCost = economicParams.operationalCostPerUnit;
                    const sellingPrice = economicParams.electricitySellingPrice;
                    design = {
                      unitCost,
                      sellingPrice,
                      panelCount,
                      dailyYield,
                      yearlyYield,
                      ...design,
                      ...useStore.getState().solarPanelArrayLayoutParams,
                    };
                    break;
                  case DesignProblem.SOLAR_PANEL_TILT_ANGLE:
                    // TODO: Each row has a different tilt angle
                    break;
                }
                try {
                  const doc = firebase.firestore().collection('users').doc(user.uid);
                  if (doc) {
                    doc
                      .collection('projects')
                      .doc(projectTitle)
                      .update({
                        designs: firebase.firestore.FieldValue.arrayUnion(design),
                        counter: FieldValue.increment(1),
                      })
                      .then(() => {})
                      .catch((error) => {
                        showError(i18n.t('message.CannotAddDesignToProject', lang) + ': ' + error);
                      })
                      .finally(() => {
                        setLoading(false);
                        setCommonStore((state) => {
                          state.projectDesigns?.push(design);
                          state.projectDesignCounter++;
                          state.designProjectType = state.projectType;
                        });
                      });
                  }
                } catch (error) {
                  showError(i18n.t('message.CannotAddDesignToProject', lang) + ': ' + error);
                  setLoading(false);
                }
              });
            },
          );
        }
      });
    }
  };

  const saveToCloud = (title: string, silent: boolean, checkExistence: boolean) => {
    const t = title.trim();
    if (t.length > 0) {
      if (user.uid) {
        setLoading(true);
        if (checkExistence) {
          fetchMyCloudFiles().then(() => {
            let exist = false;
            if (cloudFiles.current) {
              for (const p of cloudFiles.current) {
                if (p.fileName === t) {
                  exist = true;
                  break;
                }
              }
            }
            if (exist) {
              Modal.confirm({
                title: i18n.t('message.CloudFileWithTitleExistsDoYouWantToOverwrite', lang),
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
                okText: i18n.t('word.Yes', lang),
                cancelText: i18n.t('word.No', lang),
              });
            } else {
              saveToCloudWithoutCheckingExistence(t, silent);
            }
          });
        } else {
          saveToCloudWithoutCheckingExistence(t, silent);
        }
      }
      setTitleDialogVisible(false);
    } else {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidTitle', lang) + '.');
    }
  };

  const saveToCloudWithoutCheckingExistence = (title: string, silent: boolean) => {
    if (user.uid) {
      try {
        const doc = firebase.firestore().collection('users').doc(user.uid);
        if (doc) {
          if (localContentToImportAfterCloudFileUpdate) {
            setCommonStore((state) => {
              state.loadingFile = true;
            });
          }
          doc
            .collection('files')
            .doc(title)
            .set(exportContent())
            .then(() => {
              if (!silent) {
                setCommonStore((state) => {
                  state.cloudFile = title;
                  state.changed = false;
                });
              }
              if (localContentToImportAfterCloudFileUpdate) {
                if (localContentToImportAfterCloudFileUpdate === 'CREATE_NEW_FILE') {
                  createEmptyFile();
                } else {
                  importContent(localContentToImportAfterCloudFileUpdate);
                }
              } else {
                const newUrl = HOME_URL + '?client=web&userid=' + user.uid + '&title=' + encodeURIComponent(title);
                window.history.pushState({}, document.title, newUrl);
              }
              if (showCloudFilePanel) {
                fetchMyCloudFiles().then(() => {
                  setUpdateFlag(!updateFlag);
                });
              }
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
    }
  };

  const openCloudFileWithSaveReminder = (userid: string, title: string) => {
    if (changed) {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToSaveChanges', lang),
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
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    } else {
      openCloudFile(userid, title);
    }
  };

  const openCloudFileWithSaveReminderFromMap = (model: ModelSite) => {
    if (changed) {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToSaveChanges', lang),
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
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    } else {
      openCloudFile(model.userid, model.title);
      countClicksModelsMap(model);
    }
  };

  const openCloudFile = (userid: string, title: string, popState?: boolean) => {
    if (userid && title) {
      setLoading(true);
      loadDataFromFirebase(userid, title, popState, viewOnly).finally(() => {
        setLoading(false);
      });
    }
  };

  const fetchMyCloudFiles = async () => {
    if (!user.uid) return;
    setLoading(true);
    // fetch owner's file information from the cloud
    cloudFiles.current = await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('files')
      .get()
      .then((querySnapshot) => {
        const a: CloudFileInfo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          a.push({
            timestamp: data.timestamp,
            fileName: doc.id,
            userid: user.uid,
            uuid: data.docid,
          } as CloudFileInfo);
        });
        return a;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenCloudFolder', lang) + ': ' + error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const listMyCloudFiles = () => {
    if (user.uid) {
      fetchMyCloudFiles().then(() => {
        usePrimitiveStore.setState((state) => {
          state.showCloudFilePanel = true;
        });
      });
    }
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
    const files = firebase.firestore().collection('users').doc(userid).collection('files');
    files
      .doc(oldTitle)
      .get()
      .then((doc) => {
        if (doc && doc.exists) {
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
                    // TODO
                  });
                for (const f of cloudFileArray) {
                  if (f.userid === userid && f.title === oldTitle) {
                    f.title = newTitle;
                    break;
                  }
                }
                setCloudFileArray([...cloudFileArray]);
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
              });
          }
        }
      })
      .catch((error) => {
        showError(i18n.t('message.CannotRenameCloudFile', lang) + ': ' + error);
      });
  };

  const updateCloudFile = () => {
    if (cloudFile) {
      saveToCloud(cloudFile, false, false);
      setTitle(cloudFile);
    }
  };

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
      {showCloudFilePanel && cloudFiles.current && (
        <CloudFilePanel
          cloudFileArray={cloudFileArray}
          openCloudFile={openCloudFileWithSaveReminder}
          deleteCloudFile={deleteCloudFile}
          renameCloudFile={renameCloudFile}
        />
      )}
      {showProjectListPanel && myProjects.current && (
        <ProjectListPanel
          projects={projectArray}
          openProject={openProject}
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
};

export default React.memo(CloudManager);
