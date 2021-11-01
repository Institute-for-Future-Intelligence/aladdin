/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import { Avatar, Button, Dropdown, Input, Menu, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowAltCircleUp,
  faCube,
  faEraser,
  faMousePointer,
  faSun,
  faTachometerAlt,
  faTree,
  faWalking,
} from '@fortawesome/free-solid-svg-icons';
import { faAsymmetrik } from '@fortawesome/free-brands-svg-icons';
import FoundationImage from './resources/foundation.png';
import SolarPanelImage from './resources/solar-panel.png';
import ShadowImage from './resources/shadow.png';
import WallImage from './resources/wall.png';
import WindowImage from './resources/window.png';
import RoofImage from './resources/roof.png';
import firebase from 'firebase';
import { showInfo } from './helpers';
import { CloudFileInfo, ObjectType, User } from './types';
import queryString from 'querystring';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import i18n from './i18n';

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
  resetView: () => void;
}

const MainToolBar = ({ resetView }: MainToolBarProps) => {
  const setCommonStore = useStore((state) => state.set);
  const language = useStore((state) => state.language);
  const selectNone = useStore((state) => state.selectNone);
  const autoRotate = useStore((state) => state.viewState.autoRotate);
  const showHeliodonPanel = useStore((state) => state.viewState.showHeliodonPanel);
  const shadowEnabled = useStore((state) => state.viewState.shadowEnabled);
  const user = useStore((state) => state.user);
  const exportContent = useStore((state) => state.exportContent);
  const clearContent = useStore((state) => state.clearContent);
  const showCloudFilePanel = useStore((state) => state.showCloudFilePanel);
  const showAccountSettingsPanel = useStore((state) => state.showAccountSettingsPanel);
  const objectTypeToAdd = useStore((state) => state.objectTypeToAdd);

  const [loading, setLoading] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>('My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const cloudFiles = useRef<CloudFileInfo[] | void>();

  const query = queryString.parse(window.location.search);

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

  const lang = { lng: language };

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

  const removeAllContent = () => {
    Modal.confirm({
      title: 'Do you really want to clear the content?',
      icon: <ExclamationCircleOutlined />,
      okText: 'OK',
      cancelText: 'Cancel',
      onOk: () => {
        clearContent();
      },
    });
    resetToSelectMode();
  };

  const onResetViewButtonClicked = () => {
    resetView();
    resetToSelectMode();
  };

  const toggleAutoRotate = () => {
    setCommonStore((state) => {
      state.viewState.autoRotate = !state.viewState.autoRotate;
    });
    resetToSelectMode();
  };

  const toggleShadow = () => {
    setCommonStore((state) => {
      state.viewState.shadowEnabled = !state.viewState.shadowEnabled;
    });
    resetToSelectMode();
  };

  const toggleHelidonPanel = () => {
    setCommonStore((state) => {
      state.viewState.showHeliodonPanel = !state.viewState.showHeliodonPanel;
    });
    resetToSelectMode();
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

  const saveToCloud = () => {
    setLoading(true);
    if (user.email) {
      let doc = firebase.firestore().collection('users').doc(user.email);
      if (doc) {
        doc
          .collection('files')
          .doc(title)
          .set(exportContent())
          .then(() => {
            setLoading(false);
          })
          .catch((error) => {
            console.log('Error saving file:', error);
          });
      }
    }
    setTitleDialogVisible(false);
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
            setCommonStore((state) => {
              state.world = data.world;
              state.viewState = data.view;
              state.elements = data.elements;
              state.notes = data.notes ?? [];
            });
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

  const avatarMenu = (
    <Menu>
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

  return (
    <>
      <Modal
        title="Save to the Cloud"
        visible={titleDialogVisible}
        onOk={saveToCloud}
        confirmLoading={loading}
        onCancel={() => {
          setTitleDialogVisible(false);
        }}
      >
        <Input
          placeholder="Title"
          value={title}
          onPressEnter={saveToCloud}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
          }}
        />
      </Modal>
      {loading && <Spinner />}
      <ButtonsContainer>
        <Space direction="horizontal">
          <div>
            <FontAwesomeIcon
              title={i18n.t('toolbar.Select', lang)}
              icon={faMousePointer}
              size={'3x'}
              color={objectTypeToAdd === ObjectType.None ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={resetToSelectMode}
            />
            <img
              title={i18n.t('toolbar.AddFoundation', lang)}
              alt={'Foundation'}
              src={FoundationImage}
              height={56}
              width={48}
              style={{
                paddingRight: '12px',
                paddingBottom: '20px',
                // CSS filter generator of color: https://codepen.io/sosuke/pen/Pjoqqp
                filter:
                  objectTypeToAdd === ObjectType.Foundation
                    ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
                    : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Foundation;
                });
              }}
            />
            <img
              title={i18n.t('toolbar.AddWall', lang)}
              alt={'Wall'}
              src={WallImage}
              height={56}
              width={48}
              style={{
                paddingRight: '12px',
                paddingBottom: '20px',
                // CSS filter generator of color: https://codepen.io/sosuke/pen/Pjoqqp
                filter:
                  objectTypeToAdd === ObjectType.Wall
                    ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
                    : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Wall;
                });
                selectNone();
              }}
            />
            <img
              title={i18n.t('toolbar.AddWindow', lang)}
              alt={'Window'}
              src={WindowImage}
              height={56}
              width={48}
              style={{
                paddingRight: '12px',
                paddingBottom: '20px',
                filter:
                  objectTypeToAdd === ObjectType.Window
                    ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
                    : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Window;
                });
                selectNone();
              }}
            />
            <img
              title={i18n.t('toolbar.AddRoof', lang)}
              alt={'Roof'}
              src={RoofImage}
              height={56}
              width={48}
              style={{
                paddingRight: '12px',
                paddingBottom: '20px',
                filter:
                  objectTypeToAdd === ObjectType.Roof
                    ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
                    : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Roof;
                });
                selectNone();
              }}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.AddCuboid', lang)}
              icon={faCube}
              size={'3x'}
              color={objectTypeToAdd === ObjectType.Cuboid ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Cuboid;
                });
              }}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.AddSensor', lang)}
              icon={faTachometerAlt}
              size={'3x'}
              color={objectTypeToAdd === ObjectType.Sensor ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Sensor;
                });
              }}
            />
            <img
              title={i18n.t('toolbar.AddSolarPanel', lang)}
              alt={'Solar panel'}
              src={SolarPanelImage}
              height={56}
              width={48}
              style={{
                paddingRight: '12px',
                paddingBottom: '20px',
                filter:
                  objectTypeToAdd === ObjectType.SolarPanel
                    ? 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)'
                    : 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.SolarPanel;
                });
              }}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.AddTree', lang)}
              icon={faTree}
              size={'3x'}
              color={objectTypeToAdd === ObjectType.Tree ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Tree;
                });
              }}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.AddPeople', lang)}
              icon={faWalking}
              size={'3x'}
              color={objectTypeToAdd === ObjectType.Human ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={() => {
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.Human;
                });
              }}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.ClearScene', lang)}
              icon={faEraser}
              size={'3x'}
              color={'#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={removeAllContent}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.ResetView', lang)}
              icon={faArrowAltCircleUp}
              size={'3x'}
              color={'#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={onResetViewButtonClicked}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.AutoRotate', lang)}
              icon={faAsymmetrik}
              size={'3x'}
              color={autoRotate ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={toggleAutoRotate}
            />
            <FontAwesomeIcon
              title={i18n.t('toolbar.ShowHeliodonPanel', lang)}
              icon={faSun}
              size={'3x'}
              color={showHeliodonPanel ? 'antiquewhite' : '#666666'}
              style={{ paddingRight: '12px', cursor: 'pointer' }}
              onClick={toggleHelidonPanel}
            />
            <img
              title={i18n.t('toolbar.ShowShadow', lang)}
              alt={'Shadow effect'}
              src={ShadowImage}
              height={48}
              width={36}
              style={{
                paddingRight: '2px',
                paddingBottom: '20px',
                filter: shadowEnabled
                  ? 'invert(41%) sepia(0%) saturate(0%) hue-rotate(224deg) brightness(93%) contrast(81%)'
                  : 'invert(93%) sepia(3%) saturate(1955%) hue-rotate(26deg) brightness(113%) contrast(96%)',
                cursor: 'pointer',
                verticalAlign: 'middle',
              }}
              onClick={toggleShadow}
            />
          </div>
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
          openCloudFile={openCloudFile}
          deleteCloudFile={deleteCloudFile}
          renameCloudFile={renameCloudFile}
        />
      )}
      {showAccountSettingsPanel && <AccountSettingsPanel />}
    </>
  );
};

export default React.memo(MainToolBar);
