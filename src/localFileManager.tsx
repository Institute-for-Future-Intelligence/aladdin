/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Vector3 } from 'three';
import { GROUND_ID } from './constants';
import { saveAs } from 'file-saver';
import { showError } from './helpers';
import i18n from './i18n/i18n';
import { Input, Modal } from 'antd';

const LocalFileManager = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const localFileName = useStore(Selector.localFileName);
  const openLocalFileFlag = useStore(Selector.openLocalFileFlag);
  const saveLocalFileFlag = useStore(Selector.saveLocalFileFlag);
  const saveLocalFileDialogVisible = useStore(Selector.saveLocalFileDialogVisible);
  const exportContent = useStore(Selector.exportContent);

  const lang = { lng: language };
  const firstOpenCall = useRef<boolean>(true);
  const firstSaveCall = useRef<boolean>(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
            const input = JSON.parse(reader.result.toString());
            setCommonStore((state) => {
              // remove old properties
              if (input.world.hasOwnProperty('cameraPosition')) delete input.world.cameraPosition;
              if (input.world.hasOwnProperty('panCenter')) delete input.world.panCenter;
              if (!input.view.hasOwnProperty('cameraPosition')) input.view.cameraPosition = new Vector3(0, -5, 0);
              if (!input.view.hasOwnProperty('panCenter')) input.view.panCenter = new Vector3(0, 0, 0);
              state.world = input.world;
              state.viewState = input.view;
              // remove old properties
              for (const elem of input.elements) {
                if (elem.hasOwnProperty('parent')) {
                  if (!elem.hasOwnProperty('parentId')) elem.parentId = elem.parent.id ?? GROUND_ID;
                  delete elem.parent;
                }
                if (elem.hasOwnProperty('pvModel')) {
                  if (!elem.hasOwnProperty('pvModelName')) elem.pvModelName = elem.pvModel.name ?? 'SPR-X21-335-BLK';
                  delete elem.pvModel;
                }
              }
              state.elements = input.elements;
              state.notes = input.notes ?? [];
              state.cloudFile = undefined;
            });
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

  return (
    <>
      <Modal
        title={i18n.t('menu.file.DownloadAs', lang)}
        visible={saveLocalFileDialogVisible}
        onOk={() => {
          setConfirmLoading(true);
          if (writeLocalFile()) {
            setCommonStore((state) => {
              state.saveLocalFileDialogVisible = false;
            });
          }
          setConfirmLoading(false);
        }}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setCommonStore((state) => {
            state.saveLocalFileDialogVisible = false;
          });
        }}
      >
        <Input
          placeholder="File name"
          value={localFileName}
          onPressEnter={writeLocalFile}
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
