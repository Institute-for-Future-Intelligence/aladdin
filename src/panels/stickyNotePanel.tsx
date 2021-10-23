/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Input, Space } from 'antd';

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

export interface StickyNotePanelProps {}

const StickyNotePanel = ({}: StickyNotePanelProps) => {
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const notes = useStore((state) => state.notes);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 440;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 400;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.stickyNotePanelX) ? 0 : Math.min(viewState.stickyNotePanelX, window.innerWidth - wOffset),
    y: isNaN(viewState.stickyNotePanelY) ? 0 : Math.min(viewState.stickyNotePanelY, window.innerHeight - hOffset),
  });
  const [text, setText] = useState<string>(notes.length > 0 ? notes[0] : '');

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(viewState.stickyNotePanelX, window.innerWidth - wOffset),
        y: Math.min(viewState.stickyNotePanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
              <span>Sticky Note</span>
              <span
                style={{ cursor: 'pointer' }}
                onMouseDown={() => {
                  closePanel();
                }}
                onTouchStart={() => {
                  closePanel();
                }}
              >
                Close
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
                Save
              </Button>
            </Space>
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
};

export default React.memo(StickyNotePanel);
