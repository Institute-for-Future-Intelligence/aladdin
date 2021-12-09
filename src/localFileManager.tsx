/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { saveAs } from 'file-saver';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { Input, Modal } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export interface LocalFileManagerProps {
  viewOnly: boolean;
}

const LocalFileManager = ({ viewOnly = false }: LocalFileManagerProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const localFileName = useStore(Selector.localFileName);
  const createNewFileFlag = useStore(Selector.createNewFileFlag);
  const openLocalFileFlag = useStore(Selector.openLocalFileFlag);
  const saveLocalFileFlag = useStore(Selector.saveLocalFileFlag);
  const saveLocalFileDialogVisible = useStore(Selector.saveLocalFileDialogVisible);
  const exportContent = useStore(Selector.exportContent);
  const importContent = useStore(Selector.importContent);
  const changed = useStore(Selector.changed);
  const cloudFile = useStore(Selector.cloudFile);
  const user = useStore(Selector.user);
  const createEmptyFile = useStore(Selector.createEmptyFile);

  const lang = { lng: language };
  const firstNewCall = useRef<boolean>(true);
  const firstSaveCall = useRef<boolean>(true);
  const firstOpenCall = useRef<boolean>(true);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (firstNewCall.current) {
      firstNewCall.current = false;
    } else {
      createNewFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createNewFileFlag]);

  useEffect(() => {
    if (firstOpenCall.current) {
      firstOpenCall.current = false;
    } else {
      readLocalFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLocalFileFlag]);

  useEffect(() => {
    if (firstSaveCall.current) {
      firstSaveCall.current = false;
    } else {
      writeLocalFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveLocalFileFlag]);

  const createNewFile = () => {
    Modal.confirm({
      title: i18n.t('shared.DoYouWantToSaveChanges', lang),
      icon: <ExclamationCircleOutlined />,
      okText: i18n.t('word.Yes', lang),
      cancelText: i18n.t('word.No', lang),
      onOk: () => {
        if (user.uid) {
          if (cloudFile) {
            setCommonStore((state) => {
              state.localContentToImportAfterCloudFileUpdate = 'CREATE_NEW_FILE';
              state.updateCloudFileFlag = !state.updateCloudFileFlag;
            });
          } else {
            // no cloud file has been created
            setCommonStore((state) => {
              state.showCloudFileTitleDialog = true;
            });
          }
        } else {
          showInfo(i18n.t('avatarMenu.ToSaveYourWorkPleaseSignIn', lang));
        }
      },
      onCancel: () => {
        createEmptyFile();
      },
    });
  };

  const readLocalFile = () => {
    if (!viewOnly && changed) {
      Modal.confirm({
        title: i18n.t('shared.DoYouWantToSaveChanges', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (user.uid) {
            if (cloudFile) {
              loadLocalFile(true);
            } else {
              // no cloud file has been created
              setCommonStore((state) => {
                state.showCloudFileTitleDialog = true;
              });
            }
          } else {
            showInfo(i18n.t('avatarMenu.ToSaveYourWorkPleaseSignIn', lang));
          }
        },
        onCancel: () => loadLocalFile(false),
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    } else {
      loadLocalFile(false);
    }
  };

  const loadLocalFile = (saveFirst: boolean) => {
    document.body.onfocus = () => {
      setCommonStore((state) => {
        state.localFileDialogRequested = false;
      });
    };
    const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
    fileDialog.onchange = () => {
      if (fileDialog.files && fileDialog.files.length > 0) {
        const reader = new FileReader();
        reader.readAsText(fileDialog.files[0]);
        const fn = fileDialog.files[0].name;
        setCommonStore((state) => {
          state.localFileName = fn;
        });
        reader.onload = () => {
          if (reader.result) {
            const input = JSON.parse(reader.result.toString());
            if (saveFirst) {
              if (cloudFile) {
                setCommonStore((state) => {
                  state.localContentToImportAfterCloudFileUpdate = input;
                  state.updateCloudFileFlag = !state.updateCloudFileFlag;
                });
              }
            } else {
              importContent(input);
            }
          }
          fileDialog.value = '';
        };
      }
    };
    fileDialog.click();
  };

  const writeLocalFile = () => {
    const fn = localFileName.trim();
    if (fn.length > 0) {
      const blob = new Blob([JSON.stringify(exportContent())], { type: 'application/json' });
      saveAs(blob, fn);
      setCommonStore((state) => {
        state.cloudFile = undefined;
      });
      return true;
    } else {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidFileName', lang) + '.');
      return false;
    }
  };

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

  const performOKAction = () => {
    setConfirmLoading(true);
    if (writeLocalFile()) {
      setCommonStore((state) => {
        state.saveLocalFileDialogVisible = false;
      });
    }
    setConfirmLoading(false);
  };

  return (
    <>
      <Modal
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('menu.file.DownloadAs', lang)}
          </div>
        }
        visible={saveLocalFileDialogVisible}
        onOk={performOKAction}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setCommonStore((state) => {
            state.saveLocalFileDialogVisible = false;
          });
        }}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Input
          placeholder="File name"
          value={localFileName}
          onPressEnter={performOKAction}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCommonStore((state) => {
              state.localFileName = e.target.value;
            });
          }}
        />
      </Modal>
    </>
  );
};

export default React.memo(LocalFileManager);
