/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Table } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { HumanData } from '../HumanData';
import { Rectangle } from '../models/Rectangle';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { Z_INDEX_FRONT_PANEL } from '../constants';

const { Column } = Table;

const Container = styled.div`
  position: fixed;
  top: 90px;
  right: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 8;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
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
  direction: rtl;
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

const VisibilityResultsPanel = () => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const panelRect = useStore(Selector.viewState.visibilityResultsPanelRect);
  const solarPanelVisibilityResults = useDataStore(Selector.solarPanelVisibilityResults);
  const countObservers = useStore(Selector.countObservers);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 570;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [resultArray, setResultArray] = useState<any[]>([]);

  const lang = { lng: language };

  useEffect(() => {
    setCurPosition({
      x: Math.max(panelRect?.x, wOffset - window.innerWidth),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.max(panelRect?.x, wOffset - window.innerWidth),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.visibilityResultsPanelRect) {
                state.viewState.visibilityResultsPanelRect = new Rectangle(0, 0, 600, 470);
              }
              state.viewState.visibilityResultsPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.visibilityResultsPanelRect.height = wrapperRef.current.offsetHeight;
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
  }, []);

  useEffect(() => {
    if (solarPanelVisibilityResults) {
      const arr: any[] = [];
      solarPanelVisibilityResults.forEach((result, vantage) => {
        let total = 0;
        let fieldString = '';
        let count = 0;
        result.forEach((visibility, field) => {
          count++;
          total += visibility;
          fieldString += visibility.toFixed(2) + ', ';
        });
        arr.push({
          key: vantage.observer.id,
          observer: HumanData.fetchLabel(vantage.observer.name, lang),
          vantage:
            '(' +
            vantage.position.x.toFixed(1) +
            ', ' +
            vantage.position.y.toFixed(1) +
            ', ' +
            vantage.position.z.toFixed(1) +
            ') ' +
            i18n.t('word.MeterAbbreviation', lang),
          total: total.toFixed(2),
          itemized: count > 1 ? fieldString.substring(0, fieldString.length - 2) : '---',
        });
      });
      setResultArray(arr);
    }
  }, [solarPanelVisibilityResults, language]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.visibilityResultsPanelRect) {
        state.viewState.visibilityResultsPanelRect = new Rectangle(0, 0, 600, 470);
      }
      state.viewState.visibilityResultsPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.visibilityResultsPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showSolarPanelVisibilityResultsPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Visibility Results Panel',
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
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'visibilityResultsPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'visibilityResultsPanel' ? Z_INDEX_FRONT_PANEL : 8 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 470) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('visibilityPanel.SolarPanelVisibility', lang) + ' — ' + moment(now).format('h:mm A MM/DD')}
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
          <Table
            id={'visibility-results-table'}
            style={{ width: '100%', direction: 'ltr' }}
            dataSource={resultArray}
            pagination={{
              defaultPageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '50'],
            }}
          >
            <Column title={i18n.t('visibilityPanel.Observer', lang)} dataIndex="observer" key="observer" />
            <Column title={i18n.t('visibilityPanel.VantagePoint', lang)} dataIndex="vantage" key="vantage" />
            <Column title={i18n.t('visibilityPanel.TotalVisibility', lang)} dataIndex="total" key="total" />
            <Column
              title={i18n.t('visibilityPanel.ItemizedVisibilityByFields', lang)}
              dataIndex="itemized"
              key="itemized"
            />
          </Table>

          <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={() => {
                const observerCount = countObservers();
                if (observerCount === 0) {
                  showInfo(i18n.t('analysisManager.NoObserverForVisibilityAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  usePrimitiveStore.setState((state) => {
                    state.simulationInProgress = true;
                    state.runSolarPanelVisibilityAnalysis = true;
                  });
                  setCommonStore((state) => {
                    if (loggable) {
                      state.actionInfo = {
                        name: 'Run Visibility Analysis For Solar Panels',
                        timestamp: new Date().getTime(),
                      };
                    }
                  });
                }, 100);
              }}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('visibility-results-table', 'visibility-results', {}).then(() => {
                  showInfo(i18n.t('message.ScreenshotSaved', lang));
                });
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(VisibilityResultsPanel);
