/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { ClassID, CloudFileInfo, FirebaseName, ModelSite, ObjectType, SchoolID, User } from './types';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import i18n from './i18n/i18n';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Util } from './Util';
import { HOME_URL } from './constants';
import ModelsMapWrapper from './modelsMapWrapper';
import MainToolBar from './mainToolBar';
import SaveCloudFileModal from './saveCloudFileModal';
import ModelsGallery from './modelsGallery';

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
  const showModelsGallery = usePrimitiveStore(Selector.showModelsGallery);
  const showAccountSettingsPanel = usePrimitiveStore(Selector.showAccountSettingsPanel);
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);
  const cloudFile = useStore(Selector.cloudFile);
  const saveCloudFileFlag = useStore(Selector.saveCloudFileFlag);
  const modelsMapFlag = usePrimitiveStore(Selector.modelsMapFlag);
  const scoreboardFlag = usePrimitiveStore(Selector.scoreboardFlag);
  const publishOnMapFlag = usePrimitiveStore(Selector.publishOnModelsMapFlag);
  const listCloudFilesFlag = useStore(Selector.listCloudFilesFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const showCloudFileTitleDialogFlag = useStore(Selector.showCloudFileTitleDialogFlag);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const changed = useStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);
  const undoManager = useStore(Selector.undoManager);
  const peopleModels = useStore(Selector.peopleModels);

  const [loading, setLoading] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const cloudFiles = useRef<CloudFileInfo[] | void>();
  const authorModelsRef = useRef<Map<string, ModelSite>>();
  const firstCallUpdateCloudFile = useRef<boolean>(true);
  const firstCallFetchModels = useRef<boolean>(true);
  const firstCallFetchScoreboard = useRef<boolean>(true);
  const firstCallPublishOnMap = useRef<boolean>(true);
  const firstCallListCloudFiles = useRef<boolean>(true);
  const firstAccountSettings = useRef<boolean>(true);

  const lang = { lng: language };

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
          action: '',
          email: f.email,
          owner: f.owner,
          userid: f.userid,
        });
      });
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setCloudFileArray(arr);
    }
    // FIXME: React says that the dependency of the mutable cloudFiles.current is unnecessary,
    //  but we need this for the code to work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudFiles.current]);

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
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsMapFlag]);

  useEffect(() => {
    if (firstCallFetchScoreboard.current) {
      firstCallFetchScoreboard.current = false;
    } else {
      fetchPeopleModels().then(() => {
        // what to do?
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreboardFlag]);

  useEffect(() => {
    if (firstCallPublishOnMap.current) {
      firstCallPublishOnMap.current = false;
    } else {
      publishOnModelsMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishOnMapFlag]);

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
    if (userid && title) {
      openCloudFile(userid, title);
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
    // get latest submission
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
              state.latestModelSite = data.latestModel as ModelSite;
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
        showError(i18n.t('message.CannotLoadScoreboard', lang) + ': ' + error);
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
                      // add to the scoreboard
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
      // remove the record from the scoreboard
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

  // TODO: unfortunately, this throws an error for users who do not log in
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

  const saveToCloud = (title: string, silent: boolean) => {
    const t = title.trim();
    if (t.length > 0) {
      if (user.uid) {
        setLoading(true);
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
              .doc(t)
              .set(exportContent())
              .then(() => {
                if (!silent) {
                  setCommonStore((state) => {
                    state.cloudFile = t;
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
      setTitleDialogVisible(false);
    } else {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidTitle', lang) + '.');
    }
  };

  const openCloudFileWithSaveReminder = (userid: string, title: string) => {
    if (changed) {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToSaveChanges', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (cloudFile) {
            saveToCloud(cloudFile, true);
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
            saveToCloud(cloudFile, true);
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
      undoManager.clear();
      setLoading(true);
      setCommonStore((state) => {
        state.loadingFile = true;
      });
      firebase
        .firestore()
        .collection('users')
        .doc(userid)
        .collection('files')
        .doc(title)
        .get()
        .then((doc) => {
          const data = doc.data();
          if (data) {
            importContent(data, title);
          } else {
            showInfo(i18n.t('message.CloudFileNotFound', lang) + ': ' + title);
            setCommonStore((state) => {
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
        })
        .finally(() => {
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
            email: user.email,
            owner: user.displayName,
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
      saveToCloud(cloudFile, false);
      setTitle(cloudFile);
    }
  };

  return viewOnly ? (
    <></>
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
      {showModelsGallery && (
        <ModelsGallery
          author={undefined}
          models={authorModelsRef.current}
          openCloudFile={openCloudFile}
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
