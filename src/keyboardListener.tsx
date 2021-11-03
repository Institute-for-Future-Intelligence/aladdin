/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { ObjectType } from './types';
import { WallModel } from './models/WallModel';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Input, Modal } from 'antd';
import i18n from './i18n/i18n';

export interface KeyboardListenerProps {
  keyFlag: boolean; // flip this every time to ensure that handleKey is called in useEffect
  keyName: string | undefined;
  keyDown: boolean;
  keyUp: boolean;
  canvas?: HTMLCanvasElement;
  readLocalFile: () => void;
  writeLocalFile: () => boolean;
}

const KeyboardListener = ({
  keyFlag,
  keyName,
  keyDown,
  keyUp,
  canvas,
  readLocalFile,
  writeLocalFile,
}: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore((state) => state.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deleteElementById = useStore(Selector.deleteElementById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementById = useStore(Selector.updateElementById);
  const localFileName = useStore((state) => state.localFileName);

  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const lang = { lng: language };

  useEffect(() => {
    handleKey();
  }, [keyFlag, keyName, keyDown, keyUp]);

  const handleKey = () => {
    switch (keyName) {
      case 'control+o':
        readLocalFile();
        break;
      case 'control+s':
        setDownloadDialogVisible(true);
        break;
      case 'delete':
        const selectedElement = getSelectedElement();
        if (selectedElement) {
          if (selectedElement.type === ObjectType.Wall) {
            const currentWall = selectedElement as WallModel;
            if (currentWall.leftJoints.length > 0) {
              const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { rightOffset: 0, rightJoints: [] });
              }
            }
            if (currentWall.rightJoints.length > 0) {
              const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { leftOffset: 0, leftJoints: [] });
              }
            }
            setCommonStore((state) => {
              state.deletedWallID = selectedElement.id;
            });
          }
          deleteElementById(selectedElement.id);
          if (canvas) {
            canvas.style.cursor = 'default'; // if an element is deleted but the cursor is not default
          }
          break;
        }
    }
  };

  return (
    <>
      <Modal
        title={i18n.t('menu.file.DownloadAs', lang)}
        visible={downloadDialogVisible}
        onOk={() => {
          setConfirmLoading(true);
          if (writeLocalFile()) {
            setDownloadDialogVisible(false);
          }
          setConfirmLoading(false);
        }}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setDownloadDialogVisible(false);
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

export default React.memo(KeyboardListener);
