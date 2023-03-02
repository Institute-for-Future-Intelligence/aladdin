/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Avatar, Button, Dropdown, Input, Menu, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from 'styled-components';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { showError, showInfo, showSuccess } from './helpers';
import { ClassID, CloudFileInfo, FirebaseName, ModelSite, ObjectType, SchoolID, User } from './types';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import i18n from './i18n/i18n';
import MainToolBarButtons from './mainToolBarButtons';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Util } from './Util';
import { HOME_URL } from './constants';
import Explorer from './explorer';
import { usePrimitiveStore } from './stores/commonPrimitive';

const ButtonsContainer = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  margin: 0;
  padding-bottom: 0;
  padding-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  z-index: 9;
`;

export interface MainToolBarProps {
  viewOnly: boolean;
}

const MainToolBar = ({ viewOnly = false }: MainToolBarProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const user = useStore(Selector.user);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const address = useStore(Selector.world.address);
  const exportContent = useStore(Selector.exportContent);
  const showCloudFilePanel = usePrimitiveStore(Selector.showCloudFilePanel);
  const showAccountSettingsPanel = usePrimitiveStore(Selector.showAccountSettingsPanel);
  const openModelsMap = useStore(Selector.openModelsMap);
  const cloudFile = useStore(Selector.cloudFile);
  const saveCloudFileFlag = useStore(Selector.saveCloudFileFlag);
  const exploreMapFlag = usePrimitiveStore(Selector.exploreMapFlag);
  const publishOnMapFlag = usePrimitiveStore(Selector.publishOnModelsMapFlag);
  const listCloudFilesFlag = useStore(Selector.listCloudFilesFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const showCloudFileTitleDialogFlag = useStore(Selector.showCloudFileTitleDialogFlag);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const changed = useStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);
  const undoManager = useStore(Selector.undoManager);

  const [loading, setLoading] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const cloudFiles = useRef<CloudFileInfo[] | void>();
  const firstCallUpdateCloudFile = useRef<boolean>(true);
  const firstExploreMap = useRef<boolean>(true);
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

  useEffect(() => {
    if (firstCallUpdateCloudFile.current) {
      firstCallUpdateCloudFile.current = false;
    } else {
      updateCloudFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCloudFileFlag]);

  useEffect(() => {
    if (firstExploreMap.current) {
      firstExploreMap.current = false;
    } else {
      fetchModelSites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploreMapFlag]);

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
          console.log(error);
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
    } else {
      if (user.uid) {
        firestore
          .collection('users')
          .doc(user.uid)
          .set({
            uid: user.uid,
            signFile: !!user.signFile, // don't listen to WS's suggestion to simplify it
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
          state.cloudFile = undefined; // if there is a current cloud file
        });
        usePrimitiveStore.setState((state) => {
          state.showCloudFilePanel = false;
          state.showAccountSettingsPanel = false;
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
    return await firebase
      .firestore()
      .collection('models')
      .get()
      .then((querySnapshot) => {
        const map = new Map<string, Map<string, ModelSite>>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const a = new Map<string, ModelSite>();
            for (const k in data) {
              a.set(k, data[k]);
            }
            map.set(doc.id, a);
          }
        });
        setLoading(false);
        setCommonStore((state) => {
          state.modelSites = map;
        });
        return map;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenModelOnMap', lang) + ': ' + error);
      });
  };

  const publishOnModelsMap = () => {
    if (user && user.uid && title) {
      const p = new URLSearchParams(window.location.search);
      const useridFromURL = p.get('userid');
      const titleFromURL = p.get('title');
      if (useridFromURL === user.uid && titleFromURL === title) {
        const collection = firebase.firestore().collection('models');
        if (collection) {
          const m = {
            latitude: latitude,
            longitude: longitude,
            address: address,
            type: usePrimitiveStore.getState().modelType,
            author: user.displayName,
            userid: user.uid,
            title: title,
            label: usePrimitiveStore.getState().modelLabel,
            likeCount: 0,
            clickCount: 0,
            timeCreated: Date.now(),
          } as ModelSite;
          const latlng = latitude.toFixed(4) + ', ' + longitude.toFixed(4);
          const document = collection.doc(latlng);
          const uid = m.title + ', ' + m.userid;
          document
            .get()
            .then((doc) => {
              if (doc.exists) {
                const data = doc.data();
                if (data && data[uid]) {
                  showInfo(i18n.t('menu.file.ModelAlreadyPublishedOnMap', lang) + '.');
                } else {
                  document.set({ [uid]: m }, { merge: true }).then(() => {
                    showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                  });
                }
              } else {
                document.set({ [uid]: m }, { merge: true }).then(() => {
                  showSuccess(i18n.t('menu.file.PublishedOnModelsMap', lang) + '.');
                });
              }
            })
            .catch((error) => {
              showError(i18n.t('message.CannotPublishModelOnMap', lang) + ': ' + error);
            });
        }
        firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .update({
            published: firebase.firestore.FieldValue.arrayUnion(title),
          })
          .then(() => {
            setCommonStore((state) => {
              if (state.user) {
                if (!state.user.published) state.user.published = [];
                if (!state.user.published.includes(title)) {
                  state.user.published.push(title);
                }
              }
            });
          });
      }
    }
  };

  const deleteFromModelsMap = (model: ModelSite, successCallback?: Function) => {
    if (user && user.uid && model.title) {
      const latlng = model.latitude.toFixed(4) + ', ' + model.longitude.toFixed(4);
      firebase
        .firestore()
        .collection('models')
        .doc(latlng)
        .update({
          [model.title + ', ' + model.userid]: firebase.firestore.FieldValue.delete(),
        })
        .then(() => {
          showSuccess(i18n.t('message.ModelDeletedFromMap', lang));
          if (successCallback) successCallback();
        })
        .catch((error) => {
          showError(i18n.t('message.CannotDeleteModelFromMap', lang) + ': ' + error);
        });
      firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          published: firebase.firestore.FieldValue.arrayRemove(model.title),
        })
        .then(() => {
          setCommonStore((state) => {
            if (state.user && state.user.published) {
              if (state.user.published.includes(title)) {
                const index = state.user.published.indexOf(title);
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
    if (user && user.uid) {
      const uid = model.title + ', ' + model.userid;
      firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update(
          like
            ? {
                likes: firebase.firestore.FieldValue.arrayUnion(uid),
              }
            : {
                likes: firebase.firestore.FieldValue.arrayRemove(uid),
              },
        )
        .then(() => {
          // ignore
        })
        .catch((error) => {
          showError(i18n.t('message.CannotLikeModelFromMap', lang) + ': ' + error);
        });
      const latlng = model.latitude.toFixed(4) + ', ' + model.longitude.toFixed(4);
      const likeCountPath = uid + '.likeCount';
      firebase
        .firestore()
        .collection('models')
        .doc(latlng)
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

  const countClicksModelsMap = (model: ModelSite) => {
    if (user && user.uid) {
      const latlng = model.latitude.toFixed(4) + ', ' + model.longitude.toFixed(4);
      const uid = model.title + ', ' + model.userid;
      const clickCountPath = uid + '.clickCount';
      firebase
        .firestore()
        .collection('models')
        .doc(latlng)
        .update({
          [clickCountPath]: firebase.firestore.FieldValue.increment(1),
        })
        .then(() => {
          // ignore
        })
        .catch((error) => {
          // ignore
        });
    }
  };

  const saveToCloud = (tlt: string, silent: boolean) => {
    const t = tlt.trim();
    if (t.length > 0) {
      setLoading(true);
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
              .doc(t)
              .set(exportContent())
              .then(() => {
                setLoading(false);
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
                console.log(error);
              });
          }
        } catch (e) {
          showError(i18n.t('message.CannotSaveYourFileToCloud', lang) + ': ' + e);
          console.log(e);
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
          setLoading(false);
          if (!popState && !viewOnly) {
            const newUrl = HOME_URL + '?client=web&userid=' + userid + '&title=' + encodeURIComponent(title);
            window.history.pushState({}, document.title, newUrl);
          }
        })
        .catch((error) => {
          showError(i18n.t('message.CannotOpenCloudFile', lang) + ': ' + error);
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
        setLoading(false);
        return a;
      })
      .catch((error) => {
        showError(i18n.t('message.CannotOpenCloudFolder', lang) + ': ' + error);
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
              });
          }
        }
      })
      .catch((error) => {
        showError(i18n.t('message.CannotRenameCloudFile', lang) + ': ' + error);
      });
  };

  const gotoAccountSettings = () => {
    usePrimitiveStore.setState((state) => {
      state.showAccountSettingsPanel = true;
    });
  };

  const updateCloudFile = () => {
    if (cloudFile) {
      saveToCloud(cloudFile, false);
      setTitle(cloudFile);
    }
  };

  const avatarMenu = (
    <Menu triggerSubMenuAction={'click'}>
      <Menu.Item key="account" onClick={gotoAccountSettings}>
        {i18n.t('avatarMenu.AccountSettings', lang)}
      </Menu.Item>
      <Menu.Item key="signOut" onClick={signOut}>
        {i18n.t('avatarMenu.SignOut', lang)}
      </Menu.Item>
    </Menu>
  );

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  return viewOnly ? (
    <></>
  ) : (
    <>
      <Modal
        width={500}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('menu.file.SaveAsCloudFile', lang)}
          </div>
        }
        visible={titleDialogVisible}
        onOk={() => {
          saveToCloud(title, false);
          setCommonStore((state) => {
            state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
            state.showCloudFileTitleDialog = false;
          });
        }}
        confirmLoading={loading}
        onCancel={() => {
          setTitleDialogVisible(false);
          setCommonStore((state) => {
            state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
            state.showCloudFileTitleDialog = false;
          });
        }}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Space direction={'horizontal'}>
          <label>{i18n.t('word.Title', lang)}:</label>
          <Input
            style={{ width: '400px' }}
            placeholder="Title"
            value={title}
            onPressEnter={() => {
              saveToCloud(title, false);
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value);
            }}
          />
        </Space>
      </Modal>
      {loading && <Spinner />}
      <ButtonsContainer>
        <Space direction="horizontal">
          {!openModelsMap && <MainToolBarButtons />}
          <div style={{ verticalAlign: 'top' }}>
            {user.displayName ? (
              <Dropdown overlay={avatarMenu} trigger={['click']}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => e.preventDefault()}
                  title={i18n.t('tooltip.clickToAccessCloudTools', lang)}
                >
                  <Avatar size={32} src={user.photoURL} alt={user.displayName} />
                </a>
              </Dropdown>
            ) : (
              <Button type="primary" title={i18n.t('avatarMenu.PrivacyInfo', lang)} onClick={signIn}>
                {i18n.t('avatarMenu.SignIn', lang)}
              </Button>
            )}
          </div>
        </Space>
      </ButtonsContainer>
      {showCloudFilePanel && cloudFiles.current && (
        <CloudFilePanel
          cloudFileArray={cloudFileArray}
          openCloudFile={openCloudFileWithSaveReminder}
          deleteCloudFile={deleteCloudFile}
          renameCloudFile={renameCloudFile}
        />
      )}
      {showAccountSettingsPanel && <AccountSettingsPanel />}
      {openModelsMap && (
        <Explorer
          openCloudFile={openCloudFileWithSaveReminderFromMap}
          deleteModelFromMap={deleteFromModelsMap}
          likeModelFromMap={likeModelsMap}
        />
      )}
    </>
  );
};

export default React.memo(MainToolBar);
