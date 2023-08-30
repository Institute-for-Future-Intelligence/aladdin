/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { Button, Modal } from 'antd';
import { useRef, useState } from 'react';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/views/hooks';

interface DialogProps {
  width: number;
  title: string;
  rejectedMessage?: string | null;
  onClickApply: () => void;
  onClickOk: () => void;
  onClickCancel: () => void;
  onClose: () => void; // this must be specified for the x button in the upper-right corner to work
}

const Dialog: React.FC<DialogProps> = ({
  width,
  title,
  rejectedMessage,
  onClickApply,
  onClickCancel,
  onClickOk,
  onClose,
  children,
}) => {
  const lang = useLanguage();

  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const [dragEnabled, setDragEnabled] = useState(false);

  const dragRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onClickOk();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Modal
      width={width}
      visible={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {title}
          {rejectedMessage && <span style={{ color: 'red', fontWeight: 'bold' }}>{rejectedMessage}</span>}
        </div>
      }
      footer={[
        <Button key="Apply" onClick={onClickApply}>
          {i18n.t('word.Apply', lang)}
        </Button>,
        <Button key="Cancel" onClick={onClickCancel}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" onClick={onClickOk}>
          {i18n.t('word.OK', lang)}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={onClose}
      maskClosable={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      {children}
    </Modal>
  );
};

export default Dialog;
