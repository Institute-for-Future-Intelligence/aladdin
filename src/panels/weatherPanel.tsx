/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import BarGraph from '../components/barGraph';
import LineGraph from '../components/lineGraph';
import { ChartType, GraphDataType } from '../types';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { MONTHS } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  left: 10px;
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
  width: 500px;
  height: 500px;
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
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const getWeather = useStore(Selector.getWeather);
  const weatherPanelX = useStore(Selector.viewState.weatherPanelX);
  const weatherPanelY = useStore(Selector.viewState.weatherPanelY);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(weatherPanelX) ? 0 : Math.min(weatherPanelX, window.innerWidth - wOffset),
    y: isNaN(weatherPanelY) ? 0 : Math.min(weatherPanelY, window.innerHeight - hOffset),
  });
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(weatherPanelX, window.innerWidth - wOffset),
        y: Math.min(weatherPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      state.viewState.weatherPanelX = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.weatherPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showWeatherPanel = false;
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
            <span>
              {i18n.t('word.Weather', lang) + ':'} {city}
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
