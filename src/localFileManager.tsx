/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { saveAs } from 'file-saver';
import { showError } from './helpers';
import i18n from './i18n/i18n';
import { Input, Modal } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';

const LocalFileManager = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const localFileName = useStore(Selector.localFileName);
  const openLocalFileFlag = useStore(Selector.openLocalFileFlag);
  const saveLocalFileFlag = useStore(Selector.saveLocalFileFlag);
  const saveLocalFileDialogVisible = useStore(Selector.saveLocalFileDialogVisible);
  const exportContent = useStore(Selector.exportContent);
  const importContent = useStore(Selector.importContent);

  const lang = { lng: language };
  const firstOpenCall = useRef<boolean>(true);
  const firstSaveCall = useRef<boolean>(true);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (firstOpenCall.current) {
      firstOpenCall.current = false;
    } else {
      readLocalFile();
    }
  }, [openLocalFileFlag]);

  useEffect(() => {
    if (firstSaveCall.current) {
      firstSaveCall.current = false;
    } else {
      writeLocalFile();
    }
  }, [saveLocalFileFlag]);

  const readLocalFile = () => {
    document.body.onfocus = () => {
      setCommonStore((state) => {
        state.localFileDialogRequested = false;
      });
    };
    const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
    fileDialog.onchange = (e) => {
      if (fileDialog.files && fileDialog.files.length > 0) {
        const reader = new FileReader();
        reader.readAsText(fileDialog.files[0]);
        const fn = fileDialog.files[0].name;
        setCommonStore((state) => {
          state.localFileName = fn;
        });
        reader.onload = (e) => {
          if (reader.result) {
            importContent(JSON.parse(reader.result.toString()));
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
