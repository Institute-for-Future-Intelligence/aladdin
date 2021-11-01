/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import BarGraph from '../components/barGraph';
import LineGraph from '../components/lineGraph';
import { GraphDataType } from '../types';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import { MONTHS } from '../constants';
import { Util } from '../Util';
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
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 500px;
  height: 500px;
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

export interface WeatherPanelProps {
  city: string | null;
  graphs: GraphDataType[];

  [key: string]: any;
}

const WeatherPanel = ({ city, graphs, ...rest }: WeatherPanelProps) => {
  const language = useStore((state) => state.language);
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const getWeather = useStore((state) => state.getWeather);
  const now = useStore((state) => state.world.date);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.weatherPanelX) ? 0 : Math.min(viewState.weatherPanelX, window.innerWidth - wOffset),
    y: isNaN(viewState.weatherPanelY) ? 0 : Math.min(viewState.weatherPanelY, window.innerHeight - hOffset),
  });
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(viewState.weatherPanelX, window.innerWidth - wOffset),
        y: Math.min(viewState.weatherPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
  }, [graphs, city]);

  const yNames = [
    i18n.t('word.Temperature', lang),
    i18n.t('word.Temperature', lang),
    i18n.t('weatherPanel.SunshineHours', lang),
  ];
  const yUnits = ['°C', '°C', i18n.t('word.Hour', lang)];
  const referenceX = MONTHS[Math.floor((Util.daysIntoYear(now) / 365) * 12)];

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
                    labelX={'Month'}
                    labelY={yNames[g]}
                    unitY={yUnits[g]}
                    yMin={0}
                    fractionDigits={0}
                    referenceX={referenceX}
                    color={'#FFD700'}
                    {...rest}
                  />
                );
              }
              return (
                <LineGraph
                  key={g}
                  type={g}
                  dataSource={getData[g]}
                  height={responsiveHeight}
                  labelX={'Month'}
                  labelY={yNames[g]}
                  unitY={yUnits[g]}
                  fractionDigits={0}
                  referenceX={referenceX}
                  {...rest}
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
