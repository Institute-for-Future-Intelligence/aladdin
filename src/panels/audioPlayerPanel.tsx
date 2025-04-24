/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { Undoable } from '../undo/Undoable';
import { useLanguage } from '../hooks';
import ReactAudioPlayer from 'react-audio-player';
import { Col, Input, Popover, Row, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

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

const AudioPlayerPanel = React.memo(() => {
  const addUndoable = useStore(Selector.addUndoable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const audioTitle = useStore(Selector.audioTitle);
  const audioUrl = useStore(Selector.audioUrl);
  const panelRect = useStore(Selector.viewState.audioPlayerPanelRect);
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
  const [title, setTitle] = useState<string>('Instruction');
  const [source, setSource] = useState<string>('https://intofuture.org/podcast/aladdin.mp3');
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
              if (!state.viewState.audioPlayerPanelRect) {
                state.viewState.audioPlayerPanelRect = new Rectangle(0, 0, 360, 120);
              }
              state.viewState.audioPlayerPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.audioPlayerPanelRect.height = wrapperRef.current.offsetHeight;
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
    setTitle(audioTitle ?? 'Instruction');
  }, [audioTitle]);

  useEffect(() => {
    setSource(audioUrl ?? 'https://intofuture.org/podcast/aladdin.mp3');
  }, [audioUrl]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.min(ui.x, window.innerWidth - wOffset),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.audioPlayerPanelRect) {
        state.viewState.audioPlayerPanelRect = new Rectangle(0, 0, 360, 120);
      }
      state.viewState.audioPlayerPanelRect.x = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.audioPlayerPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    const undoable = {
      name: 'Close Audio Player',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showAudioPlayerPanel = true;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showAudioPlayerPanel = false;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showAudioPlayerPanel = false;
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
            state.selectedFloatingWindow = 'audioPlayerPanel';
          });
        }}
      >
        <Container
          ref={nodeRef}
          style={{ zIndex: selectedFloatingWindow === 'audioPlayerPanel' ? Z_INDEX_FRONT_PANEL : 12 }}
        >
          <ColumnWrapper
            ref={wrapperRef}
            style={{
              opacity: opacity,
              width: (panelRect ? panelRect.width : 360) + 'px',
              height: (panelRect ? panelRect.height : 160) + 'px',
            }}
          >
            <Header className="handle">
              <span>{i18n.t('menu.view.accessories.AudioPlayer', lang)}</span>
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
            <Space direction={'vertical'}>
              <Space direction={'horizontal'} style={{ justifyContent: 'center', paddingTop: '8px' }}>
                {audioTitle}
              </Space>
              <Space direction={'horizontal'}>
                <ReactAudioPlayer
                  style={{ paddingTop: '4px' }}
                  src={audioUrl ?? 'https://intofuture.org/podcast/aladdin.mp3'}
                  controls
                />
                <Popover
                  title={i18n.t('word.Settings', lang)}
                  content={
                    <Space direction={'vertical'}>
                      <Row style={{ width: '450px' }}>
                        <Col span={4}>{i18n.t('word.Source', lang)}:</Col>
                        <Col span={18}>
                          <Input
                            style={{ width: '360px' }}
                            value={source}
                            onChange={(e) => {
                              setSource(e.target.value);
                            }}
                            onPressEnter={() => {
                              setCommonStore((state) => {
                                state.audioUrl = source;
                              });
                            }}
                            onBlur={() => {
                              setCommonStore((state) => {
                                state.audioUrl = source;
                              });
                            }}
                          />
                        </Col>
                      </Row>
                      <Row style={{ width: '450px' }}>
                        <Col span={4}>{i18n.t('word.Title', lang)}:</Col>
                        <Col span={18}>
                          <Input
                            style={{ width: '360px' }}
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value);
                            }}
                            onPressEnter={() => {
                              setCommonStore((state) => {
                                state.audioTitle = title;
                              });
                            }}
                            onBlur={() => {
                              setCommonStore((state) => {
                                state.audioTitle = title;
                              });
                            }}
                          />
                        </Col>
                      </Row>
                    </Space>
                  }
                >
                  <SettingOutlined style={{ cursor: 'pointer' }} />
                </Popover>
              </Space>
            </Space>
          </ColumnWrapper>
        </Container>
      </ReactDraggable>
    </>
  );
});

export default AudioPlayerPanel;
