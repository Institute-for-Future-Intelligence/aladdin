/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import styled from 'styled-components';
import { DatePicker, Slider, Space, Switch, TimePicker } from 'antd';
import moment from 'moment';
import 'antd/dist/antd.css';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';
import { UndoableCheck } from '../undo/UndoableCheck';

const Container = styled.div`
  position: absolute;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 640px;
  padding: 0;
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

const HeliodonPanel = () => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const dateString = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const animateSun = useStore(Selector.animateSun);
  const showSunAngles = useStore(Selector.viewState.showSunAngles);
  const heliodon = useStore(Selector.viewState.heliodon);
  const heliodonPanelX = useStore(Selector.viewState.heliodonPanelX);
  const heliodonPanelY = useStore(Selector.viewState.heliodonPanelY);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const requestRef = useRef<number>(0);
  const previousFrameTime = useRef<number>(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 250;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(heliodonPanelX) ? 0 : Math.max(heliodonPanelX, wOffset - window.innerWidth),
    y: isNaN(heliodonPanelY) ? 0 : Math.min(heliodonPanelY, window.innerHeight - hOffset),
  });
  const date = useMemo(() => new Date(dateString), [dateString]);
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(heliodonPanelX, wOffset - window.innerWidth),
        y: Math.min(heliodonPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateSun]);

  const animate = () => {
    if (animateSun) {
      requestRef.current = requestAnimationFrame(animate);
      const currentFrameTime = Date.now();
      if (currentFrameTime - previousFrameTime.current > 100) {
        const day = date.getDate();
        date.setHours(date.getHours(), date.getMinutes() + 15);
        date.setDate(day);
        changeTime(date);
        previousFrameTime.current = currentFrameTime;
      }
    } else {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const changeTime = (time: Date) => {
    const d = new Date(date);
    d.setHours(time.getHours(), time.getMinutes());
    setCommonStore((state) => {
      state.world.date = d.toString();
    });
  };

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.heliodonPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.heliodonPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showHeliodonPanel = false;
    });
  };

  return (
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
          <Header className="handle">
            <span>{i18n.t('heliodonPanel.HeliodonSettings', lang)}</span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <Space style={{ padding: '20px' }} align={'baseline'} size={20}>
            <div>
              {i18n.t('word.Show', lang)}
              <br />
              <Switch
                checked={heliodon}
                onChange={(checked) => {
                  const undoableCheck = {
                    name: 'Show Heliodon',
                    timestamp: Date.now(),
                    checked: !heliodon,
                    undo: () => {
                      setCommonStore((state) => {
                        state.viewState.heliodon = !undoableCheck.checked;
                        if (state.viewState.heliodon) {
                          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                        }
                      });
                    },
                    redo: () => {
                      setCommonStore((state) => {
                        state.viewState.heliodon = undoableCheck.checked;
                        if (state.viewState.heliodon) {
                          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                        }
                      });
                    },
                  } as UndoableCheck;
                  addUndoable(undoableCheck);
                  setCommonStore((state) => {
                    state.viewState.heliodon = checked;
                    if (state.viewState.heliodon) {
                      state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
                    }
                  });
                }}
              />
            </div>
            <div>
              {i18n.t('heliodonPanel.SunAngles', lang)}
              <br />
              <Switch
                checked={showSunAngles}
                onChange={(checked) => {
                  const undoableCheck = {
                    name: 'Show Sun Angles',
                    timestamp: Date.now(),
                    checked: !showSunAngles,
                    undo: () => {
                      setCommonStore((state) => {
                        state.viewState.showSunAngles = !undoableCheck.checked;
                      });
                    },
                    redo: () => {
                      setCommonStore((state) => {
                        state.viewState.showSunAngles = undoableCheck.checked;
                      });
                    },
                  } as UndoableCheck;
                  addUndoable(undoableCheck);
                  setCommonStore((state) => {
                    state.viewState.showSunAngles = checked;
                  });
                }}
              />
            </div>
            <div>
              {i18n.t('word.Animate', lang)}
              <br />
              <Switch
                checked={animateSun}
                onChange={(checked) => {
                  const undoableCheck = {
                    name: 'Animate Heliodon',
                    timestamp: Date.now(),
                    checked: !animateSun,
                    undo: () => {
                      setCommonStore((state) => {
                        state.animateSun = !undoableCheck.checked;
                      });
                    },
                    redo: () => {
                      setCommonStore((state) => {
                        state.animateSun = undoableCheck.checked;
                      });
                    },
                  } as UndoableCheck;
                  addUndoable(undoableCheck);
                  setCommonStore((state) => {
                    state.animateSun = checked;
                  });
                }}
              />
            </div>
            <div>
              {i18n.t('word.Date', lang)}
              <br />
              <DatePicker
                value={moment(date)}
                onChange={(d) => {
                  if (d) {
                    const day = new Date(date);
                    const m = d.toDate();
                    day.setFullYear(m.getFullYear());
                    day.setMonth(m.getMonth());
                    day.setDate(m.getDate());
                    setCommonStore((state) => {
                      state.world.date = day.toString();
                    });
                  }
                }}
              />
            </div>
            <div>
              {i18n.t('word.Time', lang)}
              <br />
              <TimePicker
                value={moment(date, 'HH:mm')}
                format={'HH:mm'}
                onChange={(t) => {
                  if (t) changeTime?.(t.toDate());
                }}
              />
            </div>
            <div>
              {i18n.t('word.Latitude', lang)}: {latitude.toFixed(2)}°
              <Slider
                style={{ width: '120px' }}
                marks={{ '-90': '-90°', 0: '0°', 90: '90°' }}
                min={-90}
                max={90}
                tooltipVisible={false}
                defaultValue={latitude}
                onChange={(value: number) => {
                  setCommonStore((state) => {
                    state.world.latitude = value;
                    state.world.address = '';
                  });
                }}
              />
            </div>
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(HeliodonPanel);
