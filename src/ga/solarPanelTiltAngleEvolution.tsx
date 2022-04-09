/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ObjectiveFunctionType, ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { SolarPanelTiltAngleOptimizer } from './algorithm/SolarPanelTiltAngleOptimizer';
import { FoundationModel } from '../models/FoundationModel';

const SolarPanelTiltAngleEvolution = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const runEvolution = useStore(Selector.runEvolution);
  const pauseEvolution = useStore(Selector.pauseEvolution);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const objectiveEvaluationIndex = useStore(Selector.objectiveEvaluationIndex);
  const params = useStore.getState().geneticAlgorithmState.solarPanelTiltAngleGeneticAlgorithmParams;

  const lang = { lng: language };
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizer>();
  const individualIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);

  useEffect(() => {
    if (runEvolution) {
      init();
      requestRef.current = requestAnimationFrame(evolve);
      return () => {
        // this is called when the recursive call of requestAnimationFrame exits
        cancelAnimationFrame(requestRef.current);
        if (!evolutionCompletedRef.current) {
          showInfo(i18n.t('message.EvolutionAborted', lang));
          setCommonStore((state) => {
            state.evolutionInProgress = false;
          });
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runEvolution]);

  useEffect(() => {
    pauseRef.current = pauseEvolution;
    if (pauseEvolution) {
      cancelAnimationFrame(requestRef.current);
      setCommonStore((state) => {
        state.evolutionPaused = true;
      });
      showInfo(i18n.t('message.EvolutionPaused', lang));
    } else {
      setCommonStore((state) => {
        state.evolutionPaused = false;
      });
      // continue the evolution
      evolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseEvolution]);

  // getting ready for the evolution
  const init = () => {
    setCommonStore((state) => {
      state.evolutionInProgress = true;
      state.objectiveEvaluationIndex = 0;
    });
    evolutionCompletedRef.current = false;
    const originalSolarPanels = getChildrenOfType(ObjectType.SolarPanel, foundation.id) as SolarPanelModel[];
    solarPanelsRef.current = [];
    for (const osp of originalSolarPanels) {
      solarPanelsRef.current.push(JSON.parse(JSON.stringify(osp)) as SolarPanelModel);
    }
    optimizerRef.current = new SolarPanelTiltAngleOptimizer(
      solarPanelsRef.current,
      foundation,
      params.populationSize,
      params.maximumGenerations,
      params.selectionMethod,
      params.convergenceThreshold,
    );
    optimizerRef.current.mutationRate = params.mutationRate;
    individualIndexRef.current = 0;
    convergedRef.current = false;
  };

  const updateSolarPanels = () => {
    if (solarPanelsRef.current) {
      for (const sp of solarPanelsRef.current) {
        updateSolarPanelTiltAngleById(sp.id, sp.tiltAngle);
      }
    }
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_OUTPUT:
        for (const datum of useStore.getState().dailyPvYield) {
          for (const prop in datum) {
            if (datum.hasOwnProperty(prop)) {
              if (prop !== 'Hour') {
                total += datum[prop] as number;
              }
            }
          }
        }
        break;
      case ObjectiveFunctionType.YEARLY_OUTPUT:
        for (const datum of useStore.getState().yearlyPvYield) {
          for (const prop in datum) {
            if (datum.hasOwnProperty(prop)) {
              if (prop !== 'Month') {
                total += datum[prop] as number;
              }
            }
          }
        }
        break;
    }
    return total;
  };

  // the increment of objectiveEvaluationIndex is used as a trigger to request the next animation frame
  useEffect(() => {
    if (!optimizerRef.current || !objectiveEvaluationIndex) return;
    // the number of individuals to evaluate is less than or equal to maximumGenerations * populationSize,
    // subject to the convergence criterion
    convergedRef.current = optimizerRef.current.evolveIndividual(
      individualIndexRef.current % params.populationSize,
      getTotal(),
    );
    individualIndexRef.current++;
    optimizerRef.current.outsideGenerationCounter = Math.floor(individualIndexRef.current / params.populationSize);
    // recursive call to the next step of the evolution, which is to evaluate the next individual
    requestRef.current = requestAnimationFrame(evolve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveEvaluationIndex]);

  const evolve = () => {
    if (!optimizerRef.current) return;
    if (runEvolution && !pauseRef.current) {
      if (convergedRef.current || optimizerRef.current.outsideGenerationCounter >= params.maximumGenerations) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runEvolution = false;
          state.evolutionInProgress = false;
          state.objectiveEvaluationIndex = 0;
        });
        evolutionCompletedRef.current = true;
        optimizerRef.current.applyFittest();
        updateSolarPanels();
        showInfo(
          i18n.t('message.EvolutionCompleted', lang) +
            '\n' +
            (convergedRef.current
              ? i18n.t('message.ConvergenceThresholdHasBeenReached', lang)
              : i18n.t('message.MaximumNumberOfGenerationsHasBeenReached', lang)),
        );
        return;
      }
      optimizerRef.current.translateIndividual(individualIndexRef.current % params.populationSize);
      updateSolarPanels();
      setCommonStore((state) => {
        switch (params.objectiveFunctionType) {
          case ObjectiveFunctionType.DAILY_OUTPUT:
            state.dailyPvIndividualOutputs = false;
            state.runDailySimulationForSolarPanels = true;
            break;
          case ObjectiveFunctionType.YEARLY_OUTPUT:
            state.yearlyPvIndividualOutputs = false;
            state.runYearlySimulationForSolarPanels = true;
            break;
        }
      });
    }
  };

  return <></>;
};

export default React.memo(SolarPanelTiltAngleEvolution);
