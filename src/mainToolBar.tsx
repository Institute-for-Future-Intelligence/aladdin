/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useState} from 'react';
import {useStore} from "./stores/common";
import {Avatar, Button, Dropdown, Input, Menu, Modal, Space, Switch} from 'antd';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUndoAlt, faRedoAlt, faSave, faHome} from '@fortawesome/free-solid-svg-icons';
import {saveAs} from 'file-saver';
import firebase from 'firebase';
import About from "./about";
import {visitHomepage} from "./helpers";
import {User} from "./types";

const LeftContainer = styled.div`
  position: fixed;
  top: 4px;
  left: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const RightContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 10px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9;
`;

export interface MainToolBarProps {
    orbitControls?: OrbitControls;
    requestUpdate: () => void;
}

const MainToolBar = ({orbitControls, requestUpdate}: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const world = useStore(state => state.world);
    const elements = useStore(state => state.elements);
    const user = useStore(state => state.user);

    const [aboutUs, setAboutUs] = useState(false);
    const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('aladdin.json');

    useEffect(() => {
        const config = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID
        };
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        } else {
            firebase.app(); // if already initialized, use that one
        }
        // do not use firebase.auth().currentUser - currentUser might be null because the auth object has not finished initializing.
        // If you use an observer to keep track of the user's sign-in status, you don't need to handle this case.
        firebase.auth().onAuthStateChanged(u => {
            if (u) {
                setCommonStore(state => {
                    if (state.user) {
                        state.user.uid = u.uid;
                        state.user.displayName = u.displayName;
                        state.user.email = u.email;
                        state.user.photoURL = u.photoURL;
                    }
                });
            }
            //loadInitialState(); // load the initial state after we recognize the user
        });
    }, []);

    const undo = () => {
    };

    const redo = () => {
    };

    const signIn = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(result => {
            setCommonStore(state => {
                if (result.user) {
                    state.user.uid = result.user.uid;
                    state.user.email = result.user.email;
                    state.user.displayName = result.user.displayName;
                    state.user.photoURL = result.user.photoURL;
                    registerUser({...state.user});
                }
            });
        }).catch(error => {
            console.log("Error: ", error);
        });
    };

    const registerUser = async (user: User): Promise<any> => {
        const firestore = firebase.firestore();
        const found = await firestore.collection("users").get().then(querySnapshot => {
            for (let doc of querySnapshot.docs) {
                if (doc.id === user.email) {
                    return true;
                }
            }
            return false;
        });
        if (!found && user.email) {
            firestore.collection("users").doc(user.email).set({
                email: user.email,
                uid: user.uid,
                photoURL: user.photoURL,
                displayName: user.displayName
            }).then(docRef => {
                console.log("Document written with ID: ", docRef);
            }).catch(error => {
                console.error("Error adding document: ", error);
            });
        }
    };

    const signOut = () => {
        firebase.auth().signOut().then(() => {
            setCommonStore(state => {
                state.user.uid = null;
                state.user.email = null;
                state.user.displayName = null;
                state.user.photoURL = null;
            });
        }).catch(error => {
            console.log("Error: ", error);
        });
    };

    const saveToCloud = () => {
    };

    const gotoMyCloudFiles = () => {
    };

    const openAboutUs = (on: boolean) => {
        setAboutUs(on);
    };

    const gotoAboutPage = () => {
        openAboutUs(true);
    };

    const gotoHomepage = () => {
        visitHomepage();
    };

    const gotoAccountSettings = () => {
    };

    const takeScreenshot = () => {
    };

    const showDownloadDialog = () => {
        setDownloadDialogVisible(true);
    };

    const writeLocalFile = () => {
        setConfirmLoading(true);
        const content = {world: world, elements: elements, view: viewState};
        const blob = new Blob([JSON.stringify(content)], {type: "application/json"});
        saveAs(blob, fileName);
        setConfirmLoading(false);
        setDownloadDialogVisible(false);
    };

    const readLocalFile = () => {
        const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
        fileDialog.onchange = (e) => {
            if (fileDialog.files && fileDialog.files.length > 0) {
                let reader = new FileReader();
                reader.readAsText(fileDialog.files[0]);
                setFileName(fileDialog.files[0].name);
                reader.onload = (e) => {
                    if (reader.result) {
                        const input = JSON.parse(reader.result.toString());
                        setCommonStore((state) => {
                            state.world = input.world;
                            state.viewState = input.view;
                            state.elements = input.elements;
                        });
                        requestUpdate();
                    }
                    fileDialog.value = '';
                };
            }
        }
        fileDialog.click();
    };

    const avatarMenu = (
        <Menu>
            <Menu.Item key="save-local-file">
                <a onClick={showDownloadDialog}>Save to Download Folder</a>
            </Menu.Item>
            <Menu.Item key="open-local-file">
                <a onClick={readLocalFile}>Open Local File</a>
            </Menu.Item>
            <Menu.Item key="my-cloud-files">
                <a onClick={gotoMyCloudFiles}>My Cloud Files</a>
            </Menu.Item>
            <Menu.Item key="screenshot">
                <a onClick={takeScreenshot}>Take Screenshot</a>
            </Menu.Item>
            <Menu.Item key="account">
                <a onClick={gotoAccountSettings}>Account Settings</a>
            </Menu.Item>
            <Menu.Item key="about">
                <a onClick={gotoAboutPage}>About Us</a>
            </Menu.Item>
            <Menu.Item key="signOut">
                <a onClick={signOut}>Sign Out</a>
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <Modal
                title="Download as"
                visible={downloadDialogVisible}
                onOk={writeLocalFile}
                confirmLoading={confirmLoading}
                onCancel={() => {
                    setDownloadDialogVisible(false);
                }}
            >
                <Input
                    placeholder="File name"
                    value={fileName}
                    onPressEnter={writeLocalFile}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFileName(e.target.value);
                    }}/>
            </Modal>
            <LeftContainer>
                <Space direction='horizontal'>
                    <div>
                        <span style={{paddingRight: '10px'}}>Spin</span>
                        <Switch title={'Spin view'}
                                checked={viewState.autoRotate}
                                onChange={(checked) => {
                                    setCommonStore((state) => {
                                        state.viewState.autoRotate = checked;
                                    });
                                    requestUpdate();
                                }}
                        />
                    </div>
                    <div>
                        <span style={{paddingRight: '10px', paddingLeft: '10px'}}>Heliodon</span>
                        <Switch title={'Show heliodon'}
                                checked={viewState.showHeliodonPanel}
                                onChange={(checked) => {
                                    setCommonStore((state) => {
                                        state.viewState.showHeliodonPanel = checked;
                                    });
                                    requestUpdate();
                                }}
                        />
                    </div>
                    <div>
                        <Button type="primary" title={'Reset view'} onClick={() => {
                            if (orbitControls) {
                                orbitControls.reset();
                            }
                        }}> Reset </Button>
                    </div>
                </Space>
            </LeftContainer>
            <RightContainer>
                <Space direction='horizontal'>
                    <div>
                        <FontAwesomeIcon title={'Undo'}
                                         icon={faUndoAlt}
                                         size={'3x'}
                                         color={'#aaaaaa'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={undo}/>
                        <FontAwesomeIcon title={'Redo'}
                                         icon={faRedoAlt}
                                         size={'3x'}
                                         color={'#aaaaaa'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={redo}/>
                        <FontAwesomeIcon title={'Save file to the cloud'}
                                         icon={faSave}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={saveToCloud}/>
                        <FontAwesomeIcon title={'Visit Aladdin homepage'}
                                         icon={faHome}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={gotoHomepage}/>
                    </div>
                    <div>
                        {user.displayName ?
                            <Dropdown overlay={avatarMenu} trigger={['click']}>
                                <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                                    <Avatar size={32} src={user.photoURL} alt={user.displayName}/>
                                </a>
                            </Dropdown>
                            :
                            <Button type="primary" title={'Sign In'} onClick={signIn}>Sign in</Button>
                        }
                    </div>
                </Space>
            </RightContainer>
            {aboutUs && <About openAboutUs={openAboutUs}/>}
        </>
    );
};

export default MainToolBar;
