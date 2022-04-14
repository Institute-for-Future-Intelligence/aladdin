/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { showError, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { DatumEntry, ObjectiveFunctionType, ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { SolarPanelTiltAngleOptimizer } from './algorithm/SolarPanelTiltAngleOptimizer';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import { Util } from '../Util';

const SolarPanelTiltAngleEvolution = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const runEvolution = useStore(Selector.runEvolution);
  const pauseEvolution = useStore(Selector.pauseEvolution);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const setFittestIndividualResults = useStore(Selector.setFittestIndividualResults);
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
    if (!foundation) return;
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
    if (solarPanelsRef.current.length > 0) {
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
    } else {
      showError(i18n.t('message.EncounterEvolutionError', lang));
    }
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_OUTPUT:
        const dailyPvYield = useStore.getState().dailyPvYield;
        for (const datum of dailyPvYield) {
          for (const prop in datum) {
            if (datum.hasOwnProperty(prop)) {
              if (prop === 'Total') {
                total += datum[prop] as number;
              }
            }
          }
        }
        break;
      case ObjectiveFunctionType.YEARLY_OUTPUT:
        const yearlyPvYield = useStore.getState().yearlyPvYield;
        for (const datum of yearlyPvYield) {
          for (const prop in datum) {
            if (datum.hasOwnProperty(prop)) {
              if (prop === 'Total') {
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
        if (solarPanelsRef.current) {
          for (const sp of solarPanelsRef.current) {
            updateSolarPanelTiltAngleById(sp.id, sp.tiltAngle);
          }
        }
        updateResults();
        showInfo(
          i18n.t('message.EvolutionCompleted', lang) +
            '\n' +
            (convergedRef.current
              ? i18n.t('message.ConvergenceThresholdHasBeenReached', lang)
              : i18n.t('message.MaximumNumberOfGenerationsHasBeenReached', lang)),
        );
        setCommonStore((state) => {
          state.viewState.showEvolutionPanel = true;
        });
        return;
      }
      optimizerRef.current.translateIndividual(individualIndexRef.current % params.populationSize);
      setCommonStore((state) => {
        if (solarPanelsRef.current) {
          for (const e of state.elements) {
            if (e.type === ObjectType.SolarPanel) {
              const panel = e as SolarPanelModel;
              for (const sp of solarPanelsRef.current) {
                if (panel.id === sp.id) {
                  panel.tiltAngle = sp.tiltAngle;
                  break;
                }
              }
            }
          }
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
        }
      });
    }
  };

  const updateResults = () => {
    if (!optimizerRef.current) return;
    const results: DatumEntry[] = [];
    for (const [index, fg] of optimizerRef.current.fittestOfGenerations.entries()) {
      if (fg) {
        const n = fg.chromosome.length;
        const datum: DatumEntry = {};
        datum['Generation'] = index;
        for (let k = 0; k < n; k++) {
          datum['Gene' + (k + 1)] = Util.toDegrees((2 * fg.chromosome[k] - 1) * HALF_PI);
        }
        datum['Objective'] = fg.fitness;
        results.push(datum);
      }
    }
    setFittestIndividualResults(results);
  };

  return <></>;
};

export default React.memo(SolarPanelTiltAngleEvolution);
