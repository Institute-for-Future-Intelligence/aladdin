/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import BarGraph from '../components/barGraph';
import LineGraph from '../components/lineGraph';
import { ChartType, GraphDataType } from '../types';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { FLOATING_WINDOW_OPACITY, MONTHS } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { Undoable } from '../undo/Undoable';

const Container = styled.div`
  position: fixed;
  top: 80px;
  left: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 10;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  min-width: 400px;
  max-width: 800px;
  min-height: 300px;
  max-height: 600px;
  padding-bottom: 10px;
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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface WeatherPanelProps {
  city: string | null;
  graphs: GraphDataType[];
}

const WeatherPanel = ({ city, graphs }: WeatherPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const now = new Date(useStore(Selector.world.date));
  const getWeather = useStore(Selector.getWeather);
  const panelRect = useStore(Selector.viewState.weatherPanelRect);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.min(panelRect.x, window.innerWidth - wOffset) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const lang = { lng: language };

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
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.weatherPanelRect) {
                state.viewState.weatherPanelRect = new Rectangle(0, 0, 500, 500);
              }
              state.viewState.weatherPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.weatherPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  const responsiveHeight = useMemo(() => {
    return graphs ? Math.floor(100 / graphs.length) : 100;
  }, [graphs]);

  const getData = useMemo(() => {
    if (!graphs) {
      return;
    }
    const result: any = {};
    if (city) {
      const weather = getWeather(city);
      if (weather) {
        graphs.forEach((g) => {
          result[g] = [];
          switch (g) {
            case GraphDataType.MonthlyTemperatures:
              for (let i = 0; i < 12; i++) {
                result[g].push({
                  Month: MONTHS[i],
                  Low: weather.lowestTemperatures[i],
                  High: weather.highestTemperatures[i],
                });
              }
              break;
            case GraphDataType.SunshineHours:
              for (let i = 0; i < 12; i++) {
                result[g].push({
                  Month: MONTHS[i],
                  Sunshine: weather.sunshineHours[i],
                });
              }
              break;
          }
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphs, city]);

  const yNames = [
    'NA',
    i18n.t('word.Temperature', lang),
    i18n.t('word.Temperature', lang),
    i18n.t('weatherPanel.SunshineHours', lang),
  ];
  const yUnits = ['NA', '°C', '°C', i18n.t('word.Hour', lang)];
  const referenceX = MONTHS[now.getMonth()];

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.min(ui.x, window.innerWidth - wOffset),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.weatherPanelRect) {
        state.viewState.weatherPanelRect = new Rectangle(0, 0, 500, 500);
      }
      state.viewState.weatherPanelRect.x = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.weatherPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    const undoable = {
      name: 'Close Weather Panel',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = true;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showWeatherPanel = false;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showWeatherPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Weather Graph',
          timestamp: new Date().getTime(),
        };
      }
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
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 500) + 'px',
            height: (panelRect ? panelRect.height : 500) + 'px',
          }}
        >
          <Header className="handle">
            <span>
              {i18n.t('word.Weather', lang) +
                ': ' +
                (city?.trim().endsWith(',') ? city?.trim().substring(0, city?.length - 2) : city)}
            </span>
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
          <>
            {graphs.map((g) => {
              if (g === GraphDataType.SunshineHours) {
                return (
                  <BarGraph
                    key={g}
                    type={g}
                    dataSource={getData[g]}
                    height={responsiveHeight}
                    dataKeyAxisX={'Month'}
                    labelX={i18n.t('word.Month', lang)}
                    labelY={yNames[g]}
                    unitY={yUnits[g]}
                    yMin={0}
                    fractionDigits={1}
                    referenceX={referenceX}
                    color={'#FFD700'}
                  />
                );
              }
              return (
                <LineGraph
                  chartType={ChartType.Line}
                  key={g}
                  type={g}
                  dataSource={getData[g]}
                  height={responsiveHeight}
                  dataKeyAxisX={'Month'}
                  labelX={i18n.t('word.Month', lang)}
                  labelY={yNames[g]}
                  unitY={yUnits[g]}
                  fractionDigits={1}
                  referenceX={referenceX}
                />
              );
            })}
          </>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(WeatherPanel);
