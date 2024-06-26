/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../stores/common';
import * as Selector from 'src/stores/selector';
import { showError, showInfo } from '../../helpers';
import i18n from '../../i18n/i18n';
import { DatumEntry, DesignProblem, EvolutionMethod, ObjectiveFunctionType, ObjectType } from '../../types';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { SolarPanelTiltAngleOptimizerGa } from './algorithm/SolarPanelTiltAngleOptimizerGa';
import { FoundationModel } from '../../models/FoundationModel';
import { HALF_PI } from '../../constants';
import { Util } from '../../Util';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { useLanguage } from '../../hooks';

const SolarPanelTiltAngleGa = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const pauseEvolution = usePrimitiveStore(Selector.pauseEvolution);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const setFittestIndividualResults = useStore(Selector.setFittestIndividualResults);
  const objectiveEvaluationIndex = usePrimitiveStore(Selector.objectiveEvaluationIndex);
  const geneLabels = useStore(Selector.variableLabels);
  const setGeneLabels = useStore(Selector.setVariableLabels);
  const params = useStore(Selector.evolutionaryAlgorithmState).geneticAlgorithmParams;

  const lang = useLanguage();
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizerGa>();
  const individualIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const initialSolarPanelsRef = useRef<SolarPanelModel[]>([]);

  useEffect(() => {
    if (params.problem !== DesignProblem.SOLAR_PANEL_TILT_ANGLE) return;
    if (evolutionMethod !== EvolutionMethod.GENETIC_ALGORITHM) return;
    if (runEvolution) {
      init();
      requestRef.current = requestAnimationFrame(evolve);
      const initialSolarPanelsCopy = [...initialSolarPanelsRef.current];
      return () => {
        // this is called when the recursive call of requestAnimationFrame exits
        cancelAnimationFrame(requestRef.current);
        if (!evolutionCompletedRef.current) {
          showInfo(i18n.t('message.EvolutionAborted', lang));
          usePrimitiveStore.getState().set((state) => {
            state.evolutionInProgress = false;
          });
          // revert to the initial solar panels
          if (initialSolarPanelsCopy.length > 0) {
            solarPanelsRef.current = initialSolarPanelsCopy;
            runCallback(true);
          }
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runEvolution]);

  useEffect(() => {
    pauseRef.current = pauseEvolution;
    if (pauseEvolution) {
      cancelAnimationFrame(requestRef.current);
      usePrimitiveStore.getState().set((state) => {
        state.evolutionPaused = true;
      });
      showInfo(i18n.t('message.EvolutionPaused', lang));
    } else {
      usePrimitiveStore.getState().set((state) => {
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
    usePrimitiveStore.getState().set((state) => {
      state.evolutionInProgress = true;
      state.objectiveEvaluationIndex = 0;
    });
    evolutionCompletedRef.current = false;
    const originalSolarPanels = getChildrenOfType(ObjectType.SolarPanel, foundation.id) as SolarPanelModel[];
    // store a copy of the initial solar panels for possible reversion
    initialSolarPanelsRef.current.length = 0;
    for (const osp of originalSolarPanels) {
      initialSolarPanelsRef.current.push(JSON.parse(JSON.stringify(osp)) as SolarPanelModel);
    }
    solarPanelsRef.current = [];
    const labels: (string | undefined)[] = [];
    for (const osp of originalSolarPanels) {
      solarPanelsRef.current.push(JSON.parse(JSON.stringify(osp)) as SolarPanelModel);
      labels.push(osp.label);
    }
    if (solarPanelsRef.current.length > 0) {
      optimizerRef.current = new SolarPanelTiltAngleOptimizerGa(
        solarPanelsRef.current,
        foundation,
        params.objectiveFunctionType,
        params.populationSize,
        params.maximumGenerations,
        params.selectionMethod,
        params.convergenceThreshold,
        params.searchMethod,
        params.localSearchRadius,
      );
      optimizerRef.current.selectionRate = params.selectionRate;
      optimizerRef.current.crossoverRate = params.crossoverRate;
      optimizerRef.current.mutationRate = params.mutationRate;
      individualIndexRef.current = 0;
      convergedRef.current = false;
      setGeneLabels(labels);
      optimizerRef.current.startEvolving();
      setCommonStore((state) => {
        state.viewState.showEvolutionPanel = true;
        state.selectedFloatingWindow = 'solarPanelOptimizationResult';
      });
    } else {
      showError(i18n.t('message.EncounterEvolutionError', lang));
    }
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT: {
        const dailyPvYield = useDataStore.getState().dailyPvYield;
        for (const datum of dailyPvYield) {
          for (const prop in datum) {
            if (Object.hasOwn(datum, prop)) {
              if (prop === 'Total') {
                total += datum[prop] as number;
              }
            }
          }
        }
        break;
      }
      case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT: {
        const yearlyPvYield = useDataStore.getState().yearlyPvYield;
        for (const datum of yearlyPvYield) {
          for (const prop in datum) {
            if (Object.hasOwn(datum, prop)) {
              if (prop === 'Total') {
                total += datum[prop] as number;
              }
            }
          }
        }
        total *= 12 / daysPerYear;
        break;
      }
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
    updateResults();
    individualIndexRef.current++;
    optimizerRef.current.outsideGenerationCounter = Math.floor(individualIndexRef.current / params.populationSize);
    // recursive call to the next step of the evolution, which is to evaluate the next individual
    requestRef.current = requestAnimationFrame(evolve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveEvaluationIndex]);

  const evolve = () => {
    if (!optimizerRef.current) return;
    if (evolutionMethod !== EvolutionMethod.GENETIC_ALGORITHM) return;
    if (runEvolution && !pauseRef.current) {
      if (convergedRef.current || optimizerRef.current.outsideGenerationCounter >= params.maximumGenerations) {
        cancelAnimationFrame(requestRef.current);
        evolutionCompletedRef.current = true;
        optimizerRef.current.applyFittest();
        updateResults();
        runCallback(true);
        showInfo(
          i18n.t('message.EvolutionCompleted', lang) +
            '\n' +
            (convergedRef.current
              ? i18n.t('message.ConvergenceThresholdHasBeenReached', lang)
              : i18n.t('message.MaximumNumberOfGenerationsHasBeenReached', lang)),
        );
        if (loggable && optimizerRef.current) {
          const best = optimizerRef.current.population.getFittest();
          if (best) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Genetic Algorithm for Solar Panel Tilt Angle Completed',
                result: SolarPanelTiltAngleOptimizerGa.individualToString(best),
                steps: optimizerRef.current?.outsideGenerationCounter,
                timestamp: new Date().getTime(),
              };
            });
          }
        }
        return;
      }
      optimizerRef.current.translateIndividual(individualIndexRef.current % params.populationSize);
      runCallback(false);
    }
  };

  const runCallback = (lastStep: boolean) => {
    usePrimitiveStore.getState().set((state) => {
      if (solarPanelsRef.current) {
        switch (params.objectiveFunctionType) {
          case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
            if (lastStep) {
              state.runDailySimulationForSolarPanelsLastStep = true;
            } else {
              state.runDailySimulationForSolarPanels = true;
            }
            break;
          case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
            if (lastStep) {
              state.runYearlySimulationForSolarPanelsLastStep = true;
            } else {
              state.runYearlySimulationForSolarPanels = true;
            }
            break;
          default:
            showError(i18n.t('message.ObjectiveFunctionTypeError', lang), 60);
        }
      }
    });
    setCommonStore((state) => {
      if (solarPanelsRef.current) {
        switch (params.objectiveFunctionType) {
          case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
            if (state.graphState) state.graphState.dailyPvIndividualOutputs = false;
            break;
          case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
            if (state.graphState) state.graphState.yearlyPvIndividualOutputs = false;
            break;
          default:
            showError(i18n.t('message.ObjectiveFunctionTypeError', lang), 60);
        }
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
      }
    });
    if (lastStep) {
      usePrimitiveStore.getState().set((state) => {
        state.runEvolution = false;
        state.evolutionInProgress = false;
        state.objectiveEvaluationIndex = 0;
      });
    }
  };

  const updateResults = () => {
    if (!optimizerRef.current) return;
    const results: DatumEntry[] = [];
    for (let index = 0; index < optimizerRef.current.fittestOfGenerations.length; index++) {
      const datum: DatumEntry = {};
      // the first fittest starts from index 1 because index 0 is used for the initial state
      const fg = optimizerRef.current.fittestOfGenerations[index];
      if (fg) {
        const n = fg.chromosome.length;
        datum['Step'] = index;
        for (let k = 0; k < n; k++) {
          let key = 'Var' + (k + 1);
          if (geneLabels[k]) {
            const trimmed = geneLabels[k]?.trim();
            if (trimmed && trimmed !== '') key = trimmed;
          }
          datum[key] = Util.toDegrees((2 * fg.chromosome[k] - 1) * HALF_PI);
        }
        datum['Objective'] = fg.fitness;
        // the first generation of population starts from index 0
        if (index > 0) {
          const pg = optimizerRef.current.populationOfGenerations[index - 1];
          if (pg) {
            let counter = 0;
            for (let i = 0; i < pg.individuals.length; i++) {
              const n = pg.individuals[i].chromosome.length;
              for (let k = 0; k < n; k++) {
                const key = 'Individual' + ++counter;
                datum[key] = Util.toDegrees((2 * pg.individuals[i].chromosome[k] - 1) * HALF_PI);
              }
            }
          }
        }
      }
      if (Object.keys(datum).length > 0) {
        results.push(datum);
      }
    }
    setFittestIndividualResults(results);
  };

  return <></>;
});

export default SolarPanelTiltAngleGa;
