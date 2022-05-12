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
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY } from '../constants';
import { UndoableChange } from '../undo/UndoableChange';

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

export interface DiurnalTemperaturePanelProps {
  city: string | null;
}

const DiurnalTemperaturePanel = ({ city }: DiurnalTemperaturePanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const addUndoable = useStore(Selector.addUndoable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const latitude = useStore(Selector.world.latitude);
  const diurnalTemperatureModel =
    useStore(Selector.world.diurnalTemperatureModel) ?? DiurnalTemperatureModel.Sinusoidal;
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const getWeather = useStore(Selector.getWeather);
  const panelRect = useStore(Selector.viewState.diurnalTemperaturePanelRect);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.min(panelRect.x, window.innerWidth - wOffset) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [selectedModel, setSelectedModel] = useState<DiurnalTemperatureModel>(diurnalTemperatureModel);
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
              if (!state.viewState.diurnalTemperaturePanelRect) {
                state.viewState.diurnalTemperaturePanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.diurnalTemperaturePanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.diurnalTemperaturePanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.diurnalTemperaturePanelRect) {
        state.viewState.diurnalTemperaturePanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.diurnalTemperaturePanelRect.x = Math.min(ui.x, window.innerWidth - wOffset);
      state.viewState.diurnalTemperaturePanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDiurnalTemperaturePanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Diurnal Temperature Panel',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const onChangeModel = (e: any) => {
    const oldModel = selectedModel;
    const newModel = e.target.value;
    const undoableChange = {
      name: 'Change Diurnal Temperature Model',
      timestamp: Date.now(),
      oldValue: oldModel,
      newValue: newModel,
      undo: () => {
        setSelectedModel(undoableChange.oldValue as DiurnalTemperatureModel);
        setCommonStore((state) => {
          state.world.diurnalTemperatureModel = undoableChange.oldValue as DiurnalTemperatureModel;
        });
      },
      redo: () => {
        setSelectedModel(undoableChange.newValue as DiurnalTemperatureModel);
        setCommonStore((state) => {
          state.world.diurnalTemperatureModel = undoableChange.newValue as DiurnalTemperatureModel;
        });
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    setSelectedModel(newModel);
    setCommonStore((state) => {
      state.world.diurnalTemperatureModel = newModel;
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
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 400) + 'px',
          }}
        >
          <Header className="handle">
            <span>
              {i18n.t('menu.tool.DiurnalTemperature', lang) + ': ' + city + ' | ' + dayjs(now).format('MM/DD')}
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
