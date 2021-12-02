/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Avatar, Button, Dropdown, Input, Menu, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from 'styled-components';
import firebase from 'firebase';
import { showError, showInfo } from './helpers';
import { CloudFileInfo, ObjectType, User } from './types';
import queryString from 'querystring';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import i18n from './i18n/i18n';
import { Util } from './Util';
import MainToolBarButtons from './mainToolBarButtons';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const ButtonsContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 10px;
  padding: 16px;
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
  const exportContent = useStore(Selector.exportContent);
  const showCloudFilePanel = useStore(Selector.showCloudFilePanel);
  const showAccountSettingsPanel = useStore(Selector.showAccountSettingsPanel);
  const cloudFile = useStore(Selector.cloudFile);
  const updateCloudFileFlag = useStore(Selector.updateCloudFileFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const importContent = useStore(Selector.importContent);
  const changed = useStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);

  const [loading, setLoading] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const cloudFiles = useRef<CloudFileInfo[] | void>();
  const firstCall = useRef<boolean>(true);

  const isMac = Util.getOS()?.startsWith('Mac');
  const query = queryString.parse(window.location.search);
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
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    } else {
      firebase.app(); // if already initialized, use that one
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
  }, []);

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
        });
      });
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setCloudFileArray(arr);
    }
  }, [cloudFiles.current]);

  useEffect(() => {
    if (firstCall.current) {
      firstCall.current = false;
    } else {
      updateCloudFile();
    }
  }, [updateCloudFileFlag]);

  useEffect(() => {
    setTitleDialogVisible(showCloudFileTitleDialog);
  }, [showCloudFileTitleDialog]);

  const init = () => {
    if (query.userid && query.title) {
      openCloudFile(query.userid.toString(), query.title.toString());
    }
  };

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
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
            registerUser({ ...state.user });
          }
        });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
    resetToSelectMode();
  };

  const registerUser = async (user: User): Promise<any> => {
    const firestore = firebase.firestore();
    const found = await firestore
      .collection('users')
      .get()
      .then((querySnapshot) => {
        for (let doc of querySnapshot.docs) {
          if (doc.id === user.email) {
            return true;
          }
        }
        return false;
      });
    if (!found && user.email) {
      firestore
        .collection('users')
        .doc(user.email)
        .set({
          email: user.email,
          uid: user.uid,
          photoURL: user.photoURL,
          displayName: user.displayName,
        })
        .then((docRef) => {
          console.log('Document written with ID: ', docRef);
        })
        .catch((error) => {
          console.error('Error adding document: ', error);
        });
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
        });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  };

  const saveToCloud = (tlt: string) => {
    const t = tlt.trim();
    if (t.length > 0) {
      setLoading(true);
      if (user.email) {
        try {
          const doc = firebase.firestore().collection('users').doc(user.email);
          if (doc) {
            doc
              .collection('files')
              .doc(t)
              .set(exportContent())
              .then(() => {
                setLoading(false);
                setCommonStore((state) => {
                  state.cloudFile = t;
                  state.changed = false;
                });
                if (localContentToImportAfterCloudFileUpdate) {
                  importContent(localContentToImportAfterCloudFileUpdate);
                }
              })
              .catch((error) => {
                console.log('Error saving file:', error);
              });
          }
        } catch (e) {
          console.log(e);
        }
      }
      setTitleDialogVisible(false);
    } else {
      showError(i18n.t('avatarMenu.SavingAbortedMustHaveValidTitle', lang) + '.');
    }
  };

  const openCloudFileWithSaveReminder = (userid: string, title: string) => {
    if (changed) {
      Modal.confirm({
        title: i18n.t('shared.DoYouWantToSaveChanges', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (cloudFile) {
            saveToCloud(cloudFile);
          }
          openCloudFile(userid, title);
        },
        onCancel: () => openCloudFile(userid, title),
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    } else {
      openCloudFile(userid, title);
    }
  };

  const openCloudFile = (userid: string, title: string) => {
    if (userid && title) {
      setLoading(true);
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
            setLoading(false);
          } else {
            showInfo('Sorry, ' + title + ' was not found. It may have been deleted by its owner.');
          }
        })
        .catch((error) => {
          console.log('Error opening file:', error);
        });
    }
  };

  const gotoMyCloudFiles = async () => {
    if (user.email) {
      setLoading(true);
      // fetch owner's file information from the cloud
      cloudFiles.current = await firebase
        .firestore()
        .collection('users')
        .doc(user.email)
        .collection('files')
        .get()
        .then((querySnapshot) => {
          const a: CloudFileInfo[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            a.push({
              timestamp: data.timestamp,
              fileName: doc.id,
              email: data.email,
              owner: data.owner,
              uuid: data.docid,
            } as CloudFileInfo);
          });
          setLoading(false);
          return a;
        })
        .catch((error) => {
          console.log('Error getting files:', error);
        });
      setCommonStore((state) => {
        state.showCloudFilePanel = true;
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
            return e.email !== userid || e.title !== title;
          }),
        );
      })
      .catch((error) => {
        console.log('Error deleting file:', error);
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
              .then(() => files.doc(oldTitle).delete());
          }
        }
      })
      .catch((error) => {
        console.log('Error renaming file:', error);
      });
    for (const f of cloudFileArray) {
      if (f.email === userid && f.title === oldTitle) {
        f.title = newTitle;
        break;
      }
    }
    setCloudFileArray([...cloudFileArray]);
  };

  const gotoAccountSettings = () => {
    setCommonStore((state) => {
      state.showAccountSettingsPanel = true;
    });
  };

  const showTitleDialog = () => {
    setTitleDialogVisible(true);
    resetToSelectMode();
  };

  const updateCloudFile = () => {
    if (cloudFile) {
      saveToCloud(cloudFile);
      setTitle(cloudFile);
    }
  };

  const avatarMenu = (
    <Menu>
      {cloudFile && (
        <Menu.Item key="update-cloud-file" onClick={updateCloudFile}>
          {i18n.t('avatarMenu.UpdateCloudFile', lang)}
          <label style={{ paddingLeft: '2px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+Shift+S)</label>
        </Menu.Item>
      )}
      <Menu.Item key="save-file-to-cloud" onClick={showTitleDialog}>
        {i18n.t('avatarMenu.SaveFileToCloud', lang)}
      </Menu.Item>
      <Menu.Item key="my-cloud-files" onClick={gotoMyCloudFiles}>
        {i18n.t('avatarMenu.MyCloudFiles', lang)}
      </Menu.Item>
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
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('avatarMenu.SaveFileToCloud', lang)}
          </div>
        }
        visible={titleDialogVisible}
        onOk={() => {
          saveToCloud(title);
          setCommonStore((state) => {
            state.showCloudFileTitleDialog = false;
          });
        }}
        confirmLoading={loading}
        onCancel={() => {
          setTitleDialogVisible(false);
          setCommonStore((state) => {
            state.showCloudFileTitleDialog = false;
          });
        }}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Input
          placeholder="Title"
          value={cloudFile ?? title}
          onPressEnter={() => saveToCloud(title)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            let t = e.target.value;
            if (t) t = t.trim();
            setTitle(t);
            setCommonStore((state) => {
              state.cloudFile = t;
            });
          }}
        />
      </Modal>
      {loading && <Spinner />}
      <ButtonsContainer>
        <Space direction="horizontal">
          <MainToolBarButtons />
          <div style={{ verticalAlign: 'middle', paddingBottom: '20px' }}>
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
              <Button type="primary" title={i18n.t('avatarMenu.SignIn', lang)} onClick={signIn}>
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
    </>
  );
};

export default React.memo(MainToolBar);
