/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Input, Space } from 'antd';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 400px;
  height: 300px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

const { TextArea } = Input;

const StickyNotePanel = () => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const notes = useStore(Selector.notes);
  const stickyNotePanelX = useStore(Selector.viewState.stickyNotePanelX);
  const stickyNotePanelY = useStore(Selector.viewState.stickyNotePanelY);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 440;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 400;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(stickyNotePanelX) ? 0 : Math.min(stickyNotePanelX, window.innerWidth - wOffset),
    y: isNaN(stickyNotePanelY) ? 0 : Math.min(stickyNotePanelY, window.innerHeight - hOffset),
  });
  const [text, setText] = useState<string>(notes.length > 0 ? notes[0] : '');
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(stickyNotePanelX, window.innerWidth - wOffset),
        y: Math.min(stickyNotePanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setText(notes.length > 0 ? notes[0] : '');
  }, [notes]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.min(ui.x, window.innerWidth - wOffset),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.stickyNotePanelX = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.stickyNotePanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showStickyNotePanel = false;
    });
  };

  return (
    <>
      <ReactDraggable
        handle={'.handle'}
        bounds={'parent'}
        axis="both"
        position={curPosition}
        onDrag={onDrag}
        onStop={onDragEnd}
      >
        <Container>
          <ColumnWrapper ref={wrapperRef}>
            <Header className="handle">
              <span>{i18n.t('menu.view.StickyNote', lang)}</span>
              <span
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  closePanel();
                }}
                onTouchStart={() => {
                  closePanel();
                }}
              >
                {i18n.t('word.Close', lang)}
              </span>
            </Header>
            <TextArea
              rows={11}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onPointerOut={() => {
                setCommonStore((state) => {
                  state.notes[0] = text;
                });
              }}
            />
            <Space style={{ alignSelf: 'center', paddingTop: '8px' }}>
              <Button
                type="primary"
                onClick={() => {
                  setCommonStore((state) => {
                    state.notes[0] = text;
                  });
                }}
              >
                {i18n.t('word.Save', lang)}
              </Button>
            </Space>
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
};

export default React.memo(StickyNotePanel);
