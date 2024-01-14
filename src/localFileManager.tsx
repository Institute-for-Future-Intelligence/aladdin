/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { saveAs } from 'file-saver';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { Button, Input, Modal } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { usePrimitiveStore } from './stores/commonPrimitive';

export interface LocalFileManagerProps {
  viewOnly: boolean;
}

const LocalFileManager = ({ viewOnly = false }: LocalFileManagerProps) => {
  const setCommonStore = useStore(Selector.set);
  const exportContent = useStore(Selector.exportContent);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const saveLocalFileDialogVisible = usePrimitiveStore(Selector.saveLocalFileDialogVisible);
  const createNewFileFlag = usePrimitiveStore(Selector.createNewFileFlag);
  const openLocalFileFlag = usePrimitiveStore(Selector.openLocalFileFlag);
  const cloudFile = useStore(Selector.cloudFile);
  const localFileName = usePrimitiveStore(Selector.localFileName);
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  useEffect(() => {
    if (createNewFileFlag) {
      createNewFile();
      usePrimitiveStore.getState().setCreateNewFileFlag(false);
    }
  }, [createNewFileFlag]);

  useEffect(() => {
    if (openLocalFileFlag) {
      readLocalFile();
      usePrimitiveStore.getState().setOpenLocalFileFlag(false);
    }
  }, [openLocalFileFlag]);

  const createNewFile = () => {
    Modal.confirm({
      title: `${i18n.t('message.DoYouWantToSaveChanges', lang)}`,
      icon: <ExclamationCircleOutlined />,
      okText: `${i18n.t('word.Yes', lang)}`,
      cancelText: `${i18n.t('word.No', lang)}`,
      onOk: () => {
        if (user.uid) {
          if (cloudFile) {
            setCommonStore((state) => {
              state.localContentToImportAfterCloudFileUpdate = 'CREATE_NEW_FILE';
            });
            usePrimitiveStore.getState().setSaveCloudFileFlag(true);
          } else {
            // no cloud file has been created
            setCommonStore((state) => {
              state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
              state.showCloudFileTitleDialog = true;
            });
          }
        } else {
          showInfo(i18n.t('menu.file.ToSaveYourWorkPleaseSignIn', lang));
        }
      },
      onCancel: () => {
        createEmptyFile();
      },
    });
  };

  const readLocalFile = () => {
    if (!viewOnly && usePrimitiveStore.getState().changed) {
      Modal.confirm({
        title: i18n.t('message.DoYouWantToSaveChanges', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (user.uid) {
            if (cloudFile) {
              loadLocalFile(true);
            } else {
              // no cloud file has been created
              setCommonStore((state) => {
                state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
                state.showCloudFileTitleDialog = true;
              });
            }
          } else {
            showInfo(i18n.t('menu.file.ToSaveYourWorkPleaseSignIn', lang));
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
        usePrimitiveStore.getState().set((state) => {
          state.waiting = true;
        });
        const reader = new FileReader();
        reader.readAsText(fileDialog.files[0]);
        const fn = fileDialog.files[0].name;
        usePrimitiveStore.getState().set((state) => {
          state.localFileName = fn;
        });
        reader.onload = () => {
          if (reader.result) {
            const input = JSON.parse(reader.result.toString());
            if (saveFirst) {
              if (cloudFile) {
                setCommonStore((state) => {
                  state.localContentToImportAfterCloudFileUpdate = input;
                });
                usePrimitiveStore.getState().setSaveCloudFileFlag(true);
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
    let fn = localFileName.trim();
    if (fn.length > 0) {
      if (!fn.endsWith('.ala')) {
        fn += '.ala';
      }
      const blob = new Blob([JSON.stringify(exportContent())], { type: 'application/json' });
      saveAs(blob, fn);
      usePrimitiveStore.getState().set((state) => {
        state.localFileName = fn;
      });
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

  const performOkAction = () => {
    setConfirmLoading(true);
    if (writeLocalFile()) {
      usePrimitiveStore.getState().set((state) => {
        state.saveLocalFileDialogVisible = false;
      });
    }
    setConfirmLoading(false);
  };

  const performCancelAction = () => {
    usePrimitiveStore.getState().set((state) => {
      state.saveLocalFileDialogVisible = false;
    });
  };

  const useCloudFileName = () => {
    if (cloudFile) {
      usePrimitiveStore.getState().set((state) => {
        state.localFileName = cloudFile;
        if (!state.localFileName.endsWith('.ala')) state.localFileName += '.ala';
      });
    }
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
            {i18n.t('menu.file.SaveAsLocalFile', lang)}
          </div>
        }
        footer={
          cloudFile
            ? [
                <Button key="Apply" onClick={useCloudFileName}>
                  {i18n.t('menu.file.UseCloudFileName', lang)}
                </Button>,
                <Button key="Cancel" onClick={performCancelAction}>
                  {i18n.t('word.Cancel', lang)}
                </Button>,
                <Button key="OK" type="primary" onClick={performOkAction} disabled={!localFileName}>
                  {i18n.t('word.OK', lang)}
                </Button>,
              ]
            : [
                <Button key="Cancel" onClick={performCancelAction}>
                  {i18n.t('word.Cancel', lang)}
                </Button>,
                <Button key="OK" type="primary" onClick={performOkAction} disabled={!localFileName}>
                  {i18n.t('word.OK', lang)}
                </Button>,
              ]
        }
        open={saveLocalFileDialogVisible}
        confirmLoading={confirmLoading}
        onCancel={performCancelAction}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Input
          placeholder="File name"
          value={localFileName}
          onPressEnter={performOkAction}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            usePrimitiveStore.getState().set((state) => {
              state.localFileName = e.target.value;
            });
          }}
        />
      </Modal>
    </>
  );
};

export default React.memo(LocalFileManager);
