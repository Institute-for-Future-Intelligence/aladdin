/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Table } from 'antd';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../views/hooks';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 1001;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 450px;
  height: 400px;
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: hidden;
  resize: both;
  direction: rtl;
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
`;

export interface LikesPanelProps {
  likesArray: any[];
  openCloudFile: (userid: string, title: string) => void;
}

const LikesPanel = React.memo(({ likesArray, openCloudFile }: LikesPanelProps) => {
  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({ x: 0, y: 0 });
  const lang = useLanguage();
  const { t } = useTranslation();

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(0, wOffset - window.innerWidth),
        y: Math.min(0, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    // TODO: Should we save the position?
  };

  const closePanel = () => {
    usePrimitiveStore.getState().set((state) => {
      state.showLikesPanel = false;
    });
  };

  return (
    <>
      <ReactDraggable
        nodeRef={nodeRef}
        handle={'.handle'}
        bounds={'parent'}
        axis="both"
        position={curPosition}
        onDrag={onDrag}
        onStop={onDragEnd}
      >
        <Container ref={nodeRef}>
          <ColumnWrapper ref={wrapperRef}>
            <Header className="handle" style={{ direction: 'ltr' }}>
              <span>{t('cloudFilePanel.MyLikes', lang)}</span>
              <span
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  closePanel();
                }}
                onTouchStart={() => {
                  closePanel();
                }}
              >
                {t('word.Close', lang)}
              </span>
            </Header>
            <Table
              rowKey={(record) => record}
              size={'small'}
              style={{ width: '100%', direction: 'ltr' }}
              dataSource={likesArray}
              scroll={{ y: 300 }}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                position: ['bottomCenter'],
                pageSizeOptions: ['10', '20', '50'],
              }}
            >
              <Column
                title={`${t('word.Title', lang)}`}
                key="title"
                render={(text, record: any) => (
                  <span
                    key={record}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const s = record as string;
                      const i = s.lastIndexOf(', ');
                      if (i >= 0) {
                        usePrimitiveStore.getState().set((state) => {
                          state.openModelsMap = false;
                        });
                        openCloudFile(s.substring(i + 2), s.substring(0, i));
                      }
                    }}
                  >
                    {(record as string).substring(0, (record as string).lastIndexOf(', '))}
                  </span>
                )}
              />
            </Table>
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
});

export default LikesPanel;
