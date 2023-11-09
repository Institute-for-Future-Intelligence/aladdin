/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { PropsWithChildren, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { useRef, useState } from 'react';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/views/hooks';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { useTranslation } from 'react-i18next';

interface DialogProps {
  width: number;
  title: string;
  rejectedMessage?: string | null;
  onApply: () => void;
  onClose: () => void; // this must be specified for the x button in the upper-right corner to work
  onClickOk?: () => void;
  onClickCancel?: () => void;
}

const Dialog: React.FunctionComponent<PropsWithChildren<DialogProps>> = ({
  width,
  title,
  rejectedMessage,
  onApply,
  onClose,
  onClickOk,
  onClickCancel,
  children,
}) => {
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const { t } = useTranslation();
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

  const handleClickOk = () => {
    if (onClickOk) {
      onClickOk();
    } else {
      onApply();
      onClose();
      setApplyCount(0);
    }
  };

  const handleClickCancel = () => {
    if (onClickCancel) {
      onClickCancel();
    } else {
      onClose();
      revertApply();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleClickOk();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClickOk]);

  const showRejectMessage = !!rejectedMessage && rejectedMessage.length > 0;

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
          {showRejectMessage && <span style={{ color: 'red', fontWeight: 'bold' }}>{rejectedMessage}</span>}
        </div>
      }
      footer={[
        <Button key="Apply" onClick={onApply}>
          {t('word.Apply', lang)}
        </Button>,
        <Button key="Cancel" onClick={handleClickCancel}>
          {t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" onClick={handleClickOk}>
          {t('word.OK', lang)}
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
