/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
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
import {
  getGroundTemperatureAtMinute,
  computeOutsideTemperature,
  getOutsideTemperatureAtMinute,
} from '../analysis/heatTools';
import { computeSunriseAndSunsetInMinutes } from '../analysis/sunTools';
import dayjs from 'dayjs';
import { Radio, Space } from 'antd';
import { Rectangle } from '../models/Rectangle';
import { DEFAULT_FOUNDATION_SLAB_DEPTH, FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { UndoableChange } from '../undo/UndoableChange';
import { Undoable } from '../undo/Undoable';
import { useLanguage, useWeather } from '../hooks';

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
`;

export interface DiurnalTemperaturePanelProps {
  city: string | null;
}

const DiurnalTemperaturePanel = React.memo(({ city }: DiurnalTemperaturePanelProps) => {
  const addUndoable = useStore(Selector.addUndoable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const dateString = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const ground = useStore(Selector.world.ground);
  const diurnalTemperatureModel =
    useStore(Selector.world.diurnalTemperatureModel) ?? DiurnalTemperatureModel.Sinusoidal;
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const panelRect = useStore(Selector.viewState.diurnalTemperaturePanelRect);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

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

  const now = new Date(dateString);
  const lang = useLanguage();
  const weather = useWeather(city);

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
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  const getData = useMemo(() => {
    const result = [];
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
          Ground: getGroundTemperatureAtMinute(
            latitude,
            Util.dayOfYear(now),
            m,
            weather.lowestTemperatures,
            weather.highestTemperatures,
            highestTemperatureTimeInMinutes,
            0.5 * (t.high - t.low),
            ground.thermalDiffusivity ?? 0.05,
            DEFAULT_FOUNDATION_SLAB_DEPTH,
          ),
        });
      }
    }
    return result;
  }, [weather, highestTemperatureTimeInMinutes, dateString, latitude, ground.thermalDiffusivity]);

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
    const undoable = {
      name: 'Close Diurnal Temperature Panel',
      timestamp: Date.now(),
      undo: () => {
        setCommonStore((state) => {
          state.viewState.showDiurnalTemperaturePanel = true;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.viewState.showDiurnalTemperaturePanel = false;
        });
      },
    } as Undoable;
    addUndoable(undoable);
    setCommonStore((state) => {
      state.viewState.showDiurnalTemperaturePanel = false;
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
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'diurnalTemperaturePanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'diurnalTemperaturePanel' ? Z_INDEX_FRONT_PANEL : 10 }}
      >
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
              {i18n.t('menu.settings.DiurnalTemperature', lang) + ': ' + city + ' | ' + dayjs(now).format('MM/DD')}
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
            <Space>{i18n.t('diurnalTemperaturePanel.SelectAirTemperatureModel', lang)}</Space>
            <Radio.Group onChange={onChangeModel} value={selectedModel} style={{ display: 'flex' }}>
              <Radio style={{ width: 'auto' }} value={DiurnalTemperatureModel.Sinusoidal}>
                {i18n.t('diurnalTemperaturePanel.Sinusoidal', lang)}
              </Radio>
              <Radio style={{ width: 'auto' }} value={DiurnalTemperatureModel.PartonLogan}>
                Parton-Logan
              </Radio>
            </Radio.Group>
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
});

export default DiurnalTemperaturePanel;
