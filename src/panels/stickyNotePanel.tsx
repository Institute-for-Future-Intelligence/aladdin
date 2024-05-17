/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Input } from 'antd';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { Undoable } from '../undo/Undoable';
import { useLanguage } from '../hooks';

const Container = styled.div`
  position: fixed;
  top: 80px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 12;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  min-width: 200px;
  max-width: 800px;
  min-height: 60px;
  max-height: 600px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
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

const { TextArea } = Input;

const StickyNotePanel = React.memo(() => {
  const addUndoable = useStore(Selector.addUndoable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const notes = useStore(Selector.notes);
  const panelRect = useStore(Selector.viewState.stickyNotePanelRect);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 440;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 400;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.min(panelRect.x, window.innerWidth - wOffset) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [text, setText] = useState<string>(notes.length > 0 ? notes[0] : '');
  const lang = useLanguage();

  useEffect(() => {
    setCurPosition({
      x: Math.min(panelRect?.x, window.innerWidth - wOffset),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.min(panelRect?.x, window.innerWidth - wOffset),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.stickyNotePanelRect) {
                state.viewState.stickyNotePanelRect = new Rectangle(0, 0, 400, 300);
              }
              state.viewState.stickyNotePanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.stickyNotePanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      resizeObserverRef.current?.disconnect();
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
      if (!state.viewState.stickyNotePanelRect) {
        state.viewState.stickyNotePanelRect = new Rectangle(0, 0, 400, 300);
      }
      state.viewState.stickyNotePanelRect.x = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.stickyNotePanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    const undoable = {
      name: 'Close Sticky Note',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showStickyNotePanel = true;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showStickyNotePanel = false;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showStickyNotePanel = false;
      state.notes[0] = text;
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
        onMouseDown={() => {
          setCommonStore((state) => {
            state.selectedFloatingWindow = 'stickyNotePanel';
          });
        }}
      >
        <Container
          ref={nodeRef}
          style={{ zIndex: selectedFloatingWindow === 'stickyNotePanel' ? Z_INDEX_FRONT_PANEL : 12 }}
        >
          <ColumnWrapper
            ref={wrapperRef}
            style={{
              opacity: opacity,
              width: (panelRect ? panelRect.width : 400) + 'px',
              height: (panelRect ? panelRect.height : 300) + 'px',
            }}
          >
            <Header className="handle">
              <span>{i18n.t('menu.view.accessories.Note', lang)}</span>
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
              style={{ resize: 'none' }}
              rows={100}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onBlur={() => {
                setCommonStore((state) => {
                  state.notes[0] = text;
                });
              }}
              onPointerOut={() => {
                setCommonStore((state) => {
                  state.notes[0] = text;
                });
              }}
            />
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
});

export default StickyNotePanel;
