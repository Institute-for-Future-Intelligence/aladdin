/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import { ChartType, DiurnalTemperatureModel, GraphDataType } from '../types';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { Util } from '../Util';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import i18n from '../i18n/i18n';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from '../analysis/heatTools';
import { computeSunriseAndSunsetInMinutes } from '../analysis/sunTools';
import dayjs from 'dayjs';
import { Radio, Space } from 'antd';

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
  width: 600px;
  height: 400px;
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

export interface DiurnalTemperaturePanelProps {
  city: string | null;
}

const DiurnalTemperaturePanel = ({ city }: DiurnalTemperaturePanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const latitude = useStore(Selector.world.latitude);
  const diurnalTemperatureModel =
    useStore(Selector.world.diurnalTemperatureModel) ?? DiurnalTemperatureModel.Sinusoidal;
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const getWeather = useStore(Selector.getWeather);
  const diurnalTemperaturePanelX = useStore(Selector.viewState.diurnalTemperaturePanelX);
  const diurnalTemperaturePanelY = useStore(Selector.viewState.diurnalTemperaturePanelY);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(diurnalTemperaturePanelX) ? 0 : Math.min(diurnalTemperaturePanelX, window.innerWidth - wOffset),
    y: isNaN(diurnalTemperaturePanelY) ? 0 : Math.min(diurnalTemperaturePanelY, window.innerHeight - hOffset),
  });
  const [selectedModel, setSelectedModel] = useState<DiurnalTemperatureModel>(diurnalTemperatureModel);
  const lang = { lng: language };

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.min(diurnalTemperaturePanelX, window.innerWidth - wOffset),
        y: Math.min(diurnalTemperaturePanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getData = useMemo(() => {
    const result = [];
    if (city) {
      const weather = getWeather(city);
      if (weather) {
        const sunMinutes = computeSunriseAndSunsetInMinutes(now, latitude);
        for (let i = 0; i < 24; i++) {
          now.setHours(i);
          const t = computeOutsideTemperature(now, weather.lowestTemperatures, weather.highestTemperatures);
          const m = Util.minutesIntoDay(now);
          result.push({
            Hour: i,
            Sinusoidal: getOutsideTemperatureAtMinute(
              t.high,
              t.low,
              DiurnalTemperatureModel.Sinusoidal,
              highestTemperatureTimeInMinutes,
              sunMinutes,
              m,
            ),
            PartonLogan: getOutsideTemperatureAtMinute(
              t.high,
              t.low,
              DiurnalTemperatureModel.PartonLogan,
              highestTemperatureTimeInMinutes,
              sunMinutes,
              m,
            ),
          });
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, highestTemperatureTimeInMinutes, diurnalTemperatureModel, now.getMonth(), now.getDate()]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.min(ui.x, window.innerWidth - wOffset),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.diurnalTemperaturePanelX = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.diurnalTemperaturePanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDiurnalTemperaturePanel = false;
    });
  };

  const onChangeModel = (e: any) => {
    setSelectedModel(e.target.value);
    setCommonStore((state) => {
      state.world.diurnalTemperatureModel = e.target.value;
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
              {i18n.t('menu.tool.DiurnalTemperature', lang) + ':'} {city} | {dayjs(now).format('MM/DD')}
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
          <LineGraph
            chartType={ChartType.Line}
            type={GraphDataType.HourlyTemperatures}
            selectedIndex={selectedModel - DiurnalTemperatureModel.Sinusoidal}
            dataSource={getData}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={i18n.t('word.Hour', lang)}
            labelY={i18n.t('word.Temperature', lang)}
            unitY={'°C'}
            fractionDigits={1}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center' }}>
            <Space>{i18n.t('diurnalTemperaturePanel.SelectModel', lang)}</Space>
            <Radio.Group onChange={onChangeModel} value={selectedModel}>
              <Radio value={DiurnalTemperatureModel.Sinusoidal}>
                {i18n.t('diurnalTemperaturePanel.Sinusoidal', lang)}
              </Radio>
              <Radio value={DiurnalTemperatureModel.PartonLogan}>Parton-Logan</Radio>
            </Radio.Group>
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DiurnalTemperaturePanel);
