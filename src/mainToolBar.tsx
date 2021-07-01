/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef, useState} from 'react';
import {useStore} from "./stores/common";
import {Avatar, Button, Dropdown, Input, Menu, Modal, Space} from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faArrowAltCircleUp,
    faCube,
    faEraser,
    faMousePointer,
    faSquare,
    faSun,
    faTachometerAlt,
    faTree,
    faUmbrellaBeach,
    faWalking,
} from '@fortawesome/free-solid-svg-icons';
import {faAsymmetrik} from "@fortawesome/free-brands-svg-icons";
import firebase from 'firebase';
import {showInfo, visitHomepage} from "./helpers";
import {CloudFileInfo, ObjectType, User} from "./types";
import queryString from "querystring";
import CloudFilePanel from "./panels/cloudFilePanel";
import Spinner from "./components/spinner";
import AccountSettingsPanel from "./panels/accountSettingsPanel";
import {ExclamationCircleOutlined} from "@ant-design/icons";

const ButtonsContainer = styled.div`
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
    objectTypeToAdd: ObjectType;
    setObjectTypeToAdd: (objectTypeToAdd: ObjectType) => void;
    requestUpdate: () => void;
}

const MainToolBar = ({
                         orbitControls,
                         objectTypeToAdd,
                         setObjectTypeToAdd,
                         requestUpdate
                     }: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const user = useStore(state => state.user);
    const exportContent = useStore(state => state.exportContent);
    const clearContent = useStore(state => state.clearContent);
    const showCloudFilePanel = useStore(state => state.showCloudFilePanel);
    const showAccountSettingsPanel = useStore(state => state.showAccountSettingsPanel);

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
                    owner: f.owner
                });
            });
            arr.sort((a, b) => b.timestamp - a.timestamp);
            setCloudFileArray(arr);
        }
    }, [cloudFiles.current]);

    const init = () => {
        if (query.userid && query.title) {
            openCloudFile(query.userid.toString(), query.title.toString());
        }
    }

    const resetToSelectMode = () => {
        setObjectTypeToAdd(ObjectType.None);
    };

    const removeAllContent = () => {
        Modal.confirm({
            title: 'Do you really want to clear the content?',
            icon: <ExclamationCircleOutlined/>,
            okText: 'OK',
            cancelText: 'Cancel',
            onOk: () => {
                clearContent();
            }
        });
        resetToSelectMode();
    };

    const resetView = () => {
        if (orbitControls) {
            orbitControls.reset();
        }
        resetToSelectMode();
    };

    const toggleAutoRotate = () => {
        setCommonStore((state) => {
            state.viewState.autoRotate = !state.viewState.autoRotate;
        });
        requestUpdate();
        resetToSelectMode();
    };

    const toggleShadow = () => {
        setCommonStore((state) => {
            state.viewState.shadowEnabled = !state.viewState.shadowEnabled;
        });
        requestUpdate();
        resetToSelectMode();
    };

    const toggleHelidonPanel = () => {
        setCommonStore((state) => {
            state.viewState.showHeliodonPanel = !state.viewState.showHeliodonPanel;
        });
        requestUpdate();
        resetToSelectMode();
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
        resetToSelectMode();
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
        setLoading(true);
        if (user.email) {
            let doc = firebase.firestore().collection("users").doc(user.email);
            if (doc) {
                doc.collection("files")
                    .doc(title)
                    .set(exportContent())
                    .then(() => {
                        setLoading(false)
                    }).catch(error => {
                    console.log("Error saving file:", error);
                });
            }
        }
        setTitleDialogVisible(false);
    };

    const openCloudFile = (userid: string, title: string) => {
        if (userid && title) {
            setLoading(true);
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
                        setLoading(false);
                    } else {
                        showInfo('Sorry, ' + title + ' was not found. It may have been deleted by its owner.');
                    }
                }).catch(error => {
                console.log("Error opening file:", error);
            });
        }
    };

    const gotoMyCloudFiles = async () => {
        if (user.email) {
            setLoading(true);
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
                    setLoading(false);
                    return a;
                }).catch(error => {
                    console.log("Error getting files:", error);
                });
            setCommonStore((state) => {
                state.showCloudFilePanel = true;
            });
        }
    };

    const deleteCloudFile = (userid: string, title: string) => {
        firebase.firestore()
            .collection("users")
            .doc(userid)
            .collection("files")
            .doc(title)
            .delete().then(() => {
            setCloudFileArray(cloudFileArray.filter((e) => {
                return e.email !== userid || e.title !== title;
            }));
        }).catch(error => {
            console.log("Error deleting file:", error);
        });
    };

    const renameCloudFile = (userid: string, oldTitle: string, newTitle: string) => {
        const files = firebase.firestore()
            .collection("users")
            .doc(userid)
            .collection("files");
        files.doc(oldTitle).get().then(doc => {
            if (doc && doc.exists) {
                const data = doc.data();
                if (data) {
                    files.doc(newTitle).set(data).then(() => files.doc(oldTitle).delete());
                }
            }
        }).catch(error => {
            console.log("Error renaming file:", error);
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
                Save File to Cloud
            </Menu.Item>
            <Menu.Item key="my-cloud-files" onClick={gotoMyCloudFiles}>
                My Cloud Files
            </Menu.Item>
            <Menu.Item key="account" onClick={gotoAccountSettings}>
                Account Settings
            </Menu.Item>
            <Menu.Item key="signOut" onClick={signOut}>
                Sign Out
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
                    }}/>
            </Modal>
            {loading && <Spinner/>}
            <ButtonsContainer>
                <Space direction='horizontal'>
                    <div>
                        <FontAwesomeIcon title={'Select'}
                                         icon={faMousePointer}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.None ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={resetToSelectMode}/>
                        <FontAwesomeIcon title={'Add foundation'}
                                         icon={faSquare}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.Foundation ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setObjectTypeToAdd(ObjectType.Foundation);
                                         }}/>
                        <FontAwesomeIcon title={'Add cuboid'}
                                         icon={faCube}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.Cuboid ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setObjectTypeToAdd(ObjectType.Cuboid);
                                         }}/>
                        <FontAwesomeIcon title={'Add sensor'}
                                         icon={faTachometerAlt}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.Sensor ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setObjectTypeToAdd(ObjectType.Sensor);
                                         }}/>
                        <FontAwesomeIcon title={'Add tree'}
                                         icon={faTree}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.Tree ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setObjectTypeToAdd(ObjectType.Tree);
                                         }}/>
                        <FontAwesomeIcon title={'Add people'}
                                         icon={faWalking}
                                         size={'3x'}
                                         color={objectTypeToAdd === ObjectType.Human ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setObjectTypeToAdd(ObjectType.Human);
                                         }}/>
                        <FontAwesomeIcon title={'Clear'}
                                         icon={faEraser}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={removeAllContent}/>
                        <FontAwesomeIcon title={'Reset view'}
                                         icon={faArrowAltCircleUp}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={resetView}/>
                        <FontAwesomeIcon title={'Auto rotate'}
                                         icon={faAsymmetrik}
                                         size={'3x'}
                                         color={viewState.autoRotate ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={toggleAutoRotate}/>
                        <FontAwesomeIcon title={'Show helidon panel'}
                                         icon={faSun}
                                         size={'3x'}
                                         color={viewState.showHeliodonPanel ? 'antiquewhite' : '#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={toggleHelidonPanel}/>
                        <FontAwesomeIcon title={'Toggle shadow effect'}
                                         icon={faUmbrellaBeach}
                                         size={'3x'}
                                         color={viewState.shadowEnabled ? '#666666' : '#999999'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={toggleShadow}/>
                    </div>
                    <div>
                        {user.displayName ?
                            <Dropdown overlay={avatarMenu} trigger={['click']}>
                                <a className="ant-dropdown-link" onClick={e => e.preventDefault()}
                                   title={'Click to access cloud tools'}>
                                    <Avatar size={32} src={user.photoURL} alt={user.displayName}/>
                                </a>
                            </Dropdown>
                            :
                            <Button type="primary" title={'Sign In'} onClick={signIn}>Sign in</Button>
                        }
                    </div>
                </Space>
            </ButtonsContainer>
            {showCloudFilePanel && cloudFiles.current &&
            <CloudFilePanel
                cloudFileArray={cloudFileArray}
                openCloudFile={openCloudFile}
                deleteCloudFile={deleteCloudFile}
                renameCloudFile={renameCloudFile}
                requestUpdate={requestUpdate}/>
            }
            {showAccountSettingsPanel &&
            <AccountSettingsPanel
                requestUpdate={requestUpdate}/>
            }
        </>
    );
};

export default MainToolBar;
