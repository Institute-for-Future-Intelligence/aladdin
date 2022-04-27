/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { RightCircleOutlined, SaveOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';
import EvolutionBiaxialLineGraph from '../components/evolutionBiaxialLineGraph';
import { DesignProblem, EvolutionMethod, ObjectiveFunctionType, ObjectType } from '../types';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
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
  height: 400px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

const SolarPanelOptimizationResult = () => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const fittestIndividualResults = useStore(Selector.fittestIndividualResults);
  const variableLabels = useStore(Selector.variableLabels);
  const panelX = useStore(Selector.viewState.evolutionPanelX);
  const panelY = useStore(Selector.viewState.evolutionPanelY);
  const selectedElement = useStore(Selector.selectedElement);
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const evolutionaryAlgorithmState = useStore.getState().evolutionaryAlgorithmState;

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(panelX) ? 0 : Math.max(panelX, wOffset - window.innerWidth),
    y: isNaN(panelY) ? 0 : Math.min(panelY, window.innerHeight - hOffset),
  });

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const responsiveHeight = 100;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fittestIndividualResults]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(panelX, wOffset - window.innerWidth),
        y: Math.min(panelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.evolutionPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.evolutionPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showEvolutionPanel = false;
    });
  };

  const params = useMemo(() => {
    return !evolutionMethod || evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM
      ? evolutionaryAlgorithmState.geneticAlgorithmParams
      : evolutionaryAlgorithmState.particleSwarmOptimizationParams;
  }, [evolutionMethod, evolutionaryAlgorithmState]);

  const labelAxisX = useMemo(() => {
    return i18n.t(
      evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM ? 'optimizationMenu.Generation' : 'optimizationMenu.Step',
      lang,
    );
  }, [evolutionMethod, lang]);

  const labelVariable = useMemo(() => {
    if (params.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE) return i18n.t('solarPanelMenu.TiltAngle', lang);
    return i18n.t('optimizationMenu.NormalizedVariables', lang);
  }, [params.problem, lang]);

  const unitY1 = useMemo(() => {
    if (params.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE) return '°';
    return '';
  }, [params.problem]);

  const unitY2 = useMemo(() => {
    if (
      params.problem === DesignProblem.SOLAR_PANEL_ARRAY &&
      (params.objectiveFunctionType === ObjectiveFunctionType.DAILY_PROFIT ||
        params.objectiveFunctionType === ObjectiveFunctionType.YEARLY_PROFIT)
    ) {
      return i18n.t('word.dollar', lang);
    }
    return i18n.t('word.kWh', lang);
  }, [params.problem, lang]);

  const labelObjective = useMemo(() => {
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_PROFIT:
        return i18n.t('optimizationMenu.ObjectiveFunctionDailyProfit', lang);
      case ObjectiveFunctionType.YEARLY_PROFIT:
        return i18n.t('optimizationMenu.ObjectiveFunctionYearlyProfit', lang);
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
        return i18n.t('ObjectiveFunctionDailyAverageOutput', lang);
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        return i18n.t('ObjectiveFunctionYearlyAverageOutput', lang);
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
        return i18n.t('ObjectiveFunctionDailyTotalOutput', lang);
    }
    return i18n.t('ObjectiveFunctionYearlyTotalOutput', lang);
  }, [params.objectiveFunctionType, lang]);

  const buttonEnabled = useMemo(() => {
    if (!selectedElement) return false;
    if (params.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE) return selectedElement.type === ObjectType.Foundation;
    if (params.problem === DesignProblem.SOLAR_PANEL_ARRAY) return selectedElement.type === ObjectType.Polygon;
    return false;
  }, [params.problem, selectedElement]);

  const title = useMemo(() => {
    let s = '';
    if (params.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE)
      s += i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang);
    if (params.problem === DesignProblem.SOLAR_PANEL_ARRAY) s += i18n.t('optimizationMenu.SolarPanelArrayLayout', lang);
    s += ': ';
    s +=
      evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM
        ? i18n.t('optimizationMenu.GeneticAlgorithm', lang)
        : i18n.t('optimizationMenu.ParticleSwarmOptimization', lang);
    return s;
  }, [params.problem, evolutionMethod, lang]);

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
            <span>{title}</span>
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
          <EvolutionBiaxialLineGraph
            dataSource={fittestIndividualResults}
            labels={variableLabels}
            height={responsiveHeight}
            dataKeyAxisX={'Step'}
            labelX={labelAxisX}
            labelY1={labelVariable}
            labelY2={labelObjective}
            unitY1={unitY1}
            unitY2={unitY2}
            curveType={'linear'}
            fractionDigits={2}
          />
          <Space style={{ alignSelf: 'center' }}>
            {buttonEnabled && (
              <Button
                type="default"
                icon={<RightCircleOutlined />}
                title={i18n.t('word.Run', lang)}
                onClick={() => {
                  showInfo(i18n.t('message.EvolutionStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      state.runEvolution = true;
                      state.pauseEvolution = false;
                      state.evolutionInProgress = true;
                    });
                  }, 100);
                }}
              />
            )}
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot(
                  'biaxial-line-graph-' + labelAxisX + '-' + labelVariable + '-' + labelObjective,
                  'solar-panel-tilt-angle-evolution',
                  {},
                ).then(() => {
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

export default React.memo(SolarPanelOptimizationResult);
