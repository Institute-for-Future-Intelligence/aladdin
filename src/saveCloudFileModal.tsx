/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Input, Modal, Space } from 'antd';
import i18n from './i18n/i18n';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

export interface CloudFileSaveModalProps {
  saveToCloud: (title: string, silent: boolean) => void;
  isLoading: () => boolean;
  setTitle: (title: string) => void;
  getTitle: () => string;
  setTitleDialogVisible: (visible: boolean) => void;
  isTitleDialogVisible: () => boolean;
}

const SaveCloudFileModal = ({
  saveToCloud,
  isLoading,
  setTitle,
  getTitle,
  setTitleDialogVisible,
  isTitleDialogVisible,
}: CloudFileSaveModalProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);

  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

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

  return (
    <Modal
      width={500}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {i18n.t('menu.file.SaveAsCloudFile', lang)}
        </div>
      }
      visible={isTitleDialogVisible()}
      onOk={() => {
        saveToCloud(getTitle(), false);
        setCommonStore((state) => {
          state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
          state.showCloudFileTitleDialog = false;
        });
      }}
      confirmLoading={isLoading()}
      onCancel={() => {
        setTitleDialogVisible(false);
        setCommonStore((state) => {
          state.showCloudFileTitleDialogFlag = !state.showCloudFileTitleDialogFlag;
          state.showCloudFileTitleDialog = false;
        });
      }}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Space direction={'horizontal'}>
        <span>{i18n.t('word.Title', lang)}:</span>
        <Input
          style={{ width: '400px' }}
          placeholder="Title"
          value={getTitle()}
          onPressEnter={() => {
            saveToCloud(getTitle(), false);
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
          }}
        />
      </Space>
    </Modal>
  );
};

export default React.memo(SaveCloudFileModal);
