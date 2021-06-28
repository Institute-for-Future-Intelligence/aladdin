/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef, useState} from 'react';
import {useStore} from "./stores/common";
import {Avatar, Button, Dropdown, Input, Menu, Modal, Space, Switch, Table} from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUndoAlt, faRedoAlt, faSave, faHome} from '@fortawesome/free-solid-svg-icons';
import {saveAs} from 'file-saver';
import firebase from 'firebase';
import About from "./about";
import {showInfo, visitHomepage} from "./helpers";
import {CloudFileInfo, User} from "./types";
import queryString from "querystring";
import {HOME_URL} from "./constants";
import {Util} from "./Util";

const {Column} = Table;

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

const CloudFileContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 600px;
  height: 500px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface MainToolBarProps {
    orbitControls?: OrbitControls;
    canvas?: HTMLCanvasElement;
    requestUpdate: () => void;
}

const MainToolBar = ({orbitControls, canvas, requestUpdate}: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const user = useStore(state => state.user);
    const exportContent = useStore(state => state.exportContent);

    const [aboutUs, setAboutUs] = useState(false);
    const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('aladdin.json');
    const [title, setTitle] = useState<string>('My Aladdin File');
    const [titleDialogVisible, setTitleDialogVisible] = useState(false);
    const [cloudFolderVisible, setCloudFolderVisible] = useState(false);
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
            init(); // load the initial state after we recognize the user
        });
    }, []);

    const init = () => {
        if (query.userid && query.title) {
            openCloudFile(query.userid.toString(), query.title.toString());
        }
    }

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
        setConfirmLoading(true);
        if (user.email) {
            let doc = firebase.firestore().collection("users").doc(user.email);
            if (doc) {
                doc.collection("files").doc(title).set(exportContent());
            }
        }
        setConfirmLoading(false);
        setTitleDialogVisible(false);
    };

    const openCloudFile = (userid: string, title: string) => {
        if (userid && title) {
            firebase.firestore()
                .collection("users")
                .doc(userid)
                .collection("files")
                .doc(title)
                .get()
                .then(doc => {
                    const data = doc.data();
                    if (data) {
                        setCommonStore((state) => {
                            state.world = data.world;
                            state.viewState = data.view;
                            state.elements = data.elements;
                        });
                        requestUpdate();
                    } else {
                        showInfo('Sorry, ' + title + ' was not found. It may have been deleted by its owner.');
                    }
                });
        }
    };

    const gotoMyCloudFiles = async () => {
        if (user.email) {

            // fetch owner's file information from the cloud
            cloudFiles.current = await firebase.firestore()
                .collection("users")
                .doc(user.email)
                .collection("files")
                .get()
                .then(querySnapshot => {
                    const a: CloudFileInfo[] = [];
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        a.push({
                            timestamp: data.timestamp,
                            fileName: doc.id,
                            email: data.email,
                            owner: data.owner,
                            uuid: data.docid,
                        } as CloudFileInfo);
                    });
                    return a;
                }).catch(error => {
                    console.log("Error getting files:", error);
                });

            setCloudFolderVisible(true);
        }
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
        if (canvas) { // TODO
            Util.saveImage("screenshot.png", canvas.toDataURL("image/png"));
        }
    };

    const showDownloadDialog = () => {
        setDownloadDialogVisible(true);
    };

    const showTitleDialog = () => {
        setTitleDialogVisible(true);
    };

    const writeLocalFile = () => {
        setConfirmLoading(true);
        const blob = new Blob([JSON.stringify(exportContent())], {type: "application/json"});
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

    const cloudFileArray: any[] = [];
    if (cloudFiles.current) {
        cloudFiles.current.forEach((f, i) => {
            cloudFileArray.push({
                key: i.toString(),
                title: f.fileName,
                time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm a'),
                action: '',
                email: f.email,
                owner: f.owner
            });
        });
    }

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
            <Modal
                title="Save to the Cloud"
                visible={titleDialogVisible}
                onOk={saveToCloud}
                confirmLoading={confirmLoading}
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
                                         onClick={showTitleDialog}/>
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
            {cloudFolderVisible && cloudFiles.current &&
            <CloudFileContainer>
                <ColumnWrapper>
                    <Header className='handle'>
                        <span>My Cloud Files</span>
                        <span style={{cursor: 'pointer'}}
                              onMouseDown={() => {
                                  setCloudFolderVisible(false);
                              }}>
                            Close
                        </span>
                    </Header>
                    <Table style={{width: '100%'}}
                           dataSource={cloudFileArray}
                           pagination={{
                               defaultPageSize: 10,
                               showSizeChanger: true,
                               pageSizeOptions: ['10', '50', '100']
                           }}>
                        <Column title="Title" dataIndex="title" key="title"/>
                        <Column title="Owner" dataIndex="owner" key="owner"/>
                        <Column title="Time" dataIndex="time" key="time"/>
                        <Column
                            title="Action"
                            key="action"
                            render={(text, record: any) => (
                                <Space size="middle">
                                    <a target="_blank" rel="noopener noreferrer"
                                       href={HOME_URL + '?tmp=yes&userid=' + record.email + '&title=' + record.title}>Open</a>
                                    <a>Delete</a>
                                </Space>
                            )}
                        />
                    </Table>
                </ColumnWrapper>
            </CloudFileContainer>
            }
        </>
    );
};

export default MainToolBar;
