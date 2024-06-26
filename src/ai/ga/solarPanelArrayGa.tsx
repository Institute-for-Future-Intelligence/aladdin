/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../stores/common';
import * as Selector from 'src/stores/selector';
import { showInfo } from '../../helpers';
import i18n from '../../i18n/i18n';
import {
  DatumEntry,
  DesignProblem,
  EvolutionMethod,
  ObjectiveFunctionType,
  ObjectType,
  Orientation,
  RowAxis,
} from '../../types';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { FoundationModel } from '../../models/FoundationModel';
import { PolygonModel } from '../../models/PolygonModel';
import { SolarPanelArrayOptimizerGa } from './algorithm/SolarPanelArrayOptimizerGa';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { useLanguage } from '../../hooks';

const SolarPanelArrayGa = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const pauseEvolution = usePrimitiveStore(Selector.pauseEvolution);
  const getParent = useStore(Selector.getParent);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const setFittestIndividualResults = useStore(Selector.setFittestIndividualResults);
  const objectiveEvaluationIndex = usePrimitiveStore(Selector.objectiveEvaluationIndex);
  const geneLabels = useStore(Selector.variableLabels);
  const setGeneLabels = useStore(Selector.setVariableLabels);
  const getPvModule = useStore(Selector.getPvModule);
  const removeElementsByReferenceId = useStore(Selector.removeElementsByReferenceId);
  const params = useStore(Selector.evolutionaryAlgorithmState).geneticAlgorithmParams;
  const constraints = useStore.getState().solarPanelArrayLayoutConstraints;
  const economics = useStore.getState().economicsParams;
  const currentLayoutParams = useStore.getState().solarPanelArrayLayoutParams;

  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const optimizerRef = useRef<SolarPanelArrayOptimizerGa>();
  const individualIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const solarPanelArrayRef = useRef<SolarPanelModel[]>([]);
  const initialSolarPanelArrayRef = useRef<SolarPanelModel[]>([]);

  const lang = useLanguage();
  const foundation = polygon ? (getParent(polygon) as FoundationModel) : undefined;

  useEffect(() => {
    if (evolutionMethod !== EvolutionMethod.GENETIC_ALGORITHM) return;
    if (params.problem !== DesignProblem.SOLAR_PANEL_ARRAY) return;
    if (runEvolution) {
      init();
      requestRef.current = requestAnimationFrame(evolve);
      const initialSolarPanelArrayCopy = [...initialSolarPanelArrayRef.current];
      return () => {
        // this is called when the recursive call of requestAnimationFrame exits
        cancelAnimationFrame(requestRef.current);
        if (!evolutionCompletedRef.current) {
          showInfo(i18n.t('message.EvolutionAborted', lang));
          usePrimitiveStore.getState().set((state) => {
            state.evolutionInProgress = false;
            state.runDailySimulationForSolarPanels = false;
            state.runYearlySimulationForSolarPanels = false;
          });
          // this may put the function call to the last in the event queue to avoid crash in ray cast
          setTimeout(() => {
            // revert to the initial solar panel array
            if (solarPanelArrayRef.current.length > 0) {
              removeElementsByReferenceId(polygon.id, false);
            }
            if (initialSolarPanelArrayCopy.length > 0) {
              solarPanelArrayRef.current = initialSolarPanelArrayCopy;
              runCallback(true);
            }
          }, 100);
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
    if (!polygon || !foundation) return;
    usePrimitiveStore.getState().set((state) => {
      state.evolutionInProgress = true;
      state.objectiveEvaluationIndex = 0;
    });
    evolutionCompletedRef.current = false;
    const originalSolarPanels = getChildrenOfType(ObjectType.SolarPanel, foundation.id) as SolarPanelModel[];
    // store a copy of the initial solar panels for possible reversion
    initialSolarPanelArrayRef.current.length = 0;
    for (const osp of originalSolarPanels) {
      initialSolarPanelArrayRef.current.push(JSON.parse(JSON.stringify(osp)) as SolarPanelModel);
    }
    optimizerRef.current = new SolarPanelArrayOptimizerGa(
      getPvModule(constraints.pvModelName ?? 'CS6X-355P-FG'),
      constraints.rowAxis ?? RowAxis.leftRight,
      constraints.orientation ?? Orientation.landscape,
      constraints.poleHeight ?? 1,
      constraints.poleSpacing ?? 3,
      initialSolarPanelArrayRef.current,
      currentLayoutParams,
      polygon,
      foundation,
      params.objectiveFunctionType,
      params.populationSize,
      params.maximumGenerations,
      params.selectionMethod,
      params.convergenceThreshold,
      params.searchMethod,
      params.localSearchRadius,
      constraints.minimumInterRowSpacing,
      constraints.maximumInterRowSpacing,
      constraints.minimumRowsPerRack,
      constraints.maximumRowsPerRack,
      constraints.minimumTiltAngle,
      constraints.maximumTiltAngle,
      constraints.margin ?? 0,
    );
    optimizerRef.current.selectionRate = params.selectionRate;
    optimizerRef.current.crossoverRate = params.crossoverRate;
    optimizerRef.current.mutationRate = params.mutationRate;
    individualIndexRef.current = 0;
    convergedRef.current = false;
    setGeneLabels([...optimizerRef.current.geneNames]);
    optimizerRef.current.startEvolving();
    setCommonStore((state) => {
      state.viewState.showEvolutionPanel = true;
      state.selectedFloatingWindow = 'solarPanelOptimizationResult';
    });
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.DAILY_PROFIT: {
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
      case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.YEARLY_PROFIT: {
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
    const count = optimizerRef.current?.solarPanelCount;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        if (count) total /= count;
        break;
      case ObjectiveFunctionType.DAILY_PROFIT:
        total = total * economics.electricitySellingPrice;
        if (count) total -= count * economics.operationalCostPerUnit;
        break;
      case ObjectiveFunctionType.YEARLY_PROFIT:
        total = total * economics.electricitySellingPrice;
        if (count) total -= count * economics.operationalCostPerUnit * 365;
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
        if (solarPanelArrayRef.current.length > 0) {
          removeElementsByReferenceId(polygon.id, false);
        }
        solarPanelArrayRef.current = optimizerRef.current.translateBest();
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
        if (optimizerRef.current) {
          const best = optimizerRef.current.population.getFittest();
          if (best) {
            const tiltAngle =
              best.getGene(0) * (constraints.maximumTiltAngle - constraints.minimumTiltAngle) +
              constraints.minimumTiltAngle;
            const interRowSpacing =
              best.getGene(1) * (constraints.maximumInterRowSpacing - constraints.minimumInterRowSpacing) +
              constraints.minimumInterRowSpacing;
            const rowsPerRack = Math.floor(
              best.getGene(2) * (constraints.maximumRowsPerRack - constraints.minimumRowsPerRack) +
                constraints.minimumRowsPerRack,
            );
            setCommonStore((state) => {
              state.solarPanelArrayLayoutParams.tiltAngle = tiltAngle;
              state.solarPanelArrayLayoutParams.interRowSpacing = interRowSpacing;
              state.solarPanelArrayLayoutParams.rowsPerRack = rowsPerRack;
              state.solarPanelArrayLayoutParams.orientation = constraints.orientation;
              state.solarPanelArrayLayoutParams.poleHeight = constraints.poleHeight;
            });
            if (loggable) {
              setCommonStore((state) => {
                state.actionInfo = {
                  name: 'Genetic Algorithm for Solar Panel Array Layout Completed',
                  result: optimizerRef.current?.individualToString(best),
                  steps: optimizerRef.current?.outsideGenerationCounter,
                  timestamp: new Date().getTime(),
                };
              });
            }
          }
        }
        return;
      }
      removeElementsByReferenceId(polygon.id, false);
      // this may put the function call to the last in the event queue to avoid crash in ray cast
      // when switching the optimization method
      setTimeout(() => {
        if (optimizerRef.current) {
          solarPanelArrayRef.current = optimizerRef.current.translateIndividualByIndex(
            individualIndexRef.current % params.populationSize,
          );
        }
        runCallback(false);
      }, 100);
    }
  };

  const runCallback = (lastStep: boolean) => {
    usePrimitiveStore.getState().set((state) => {
      switch (params.objectiveFunctionType) {
        case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
        case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
        case ObjectiveFunctionType.DAILY_PROFIT:
          if (lastStep) {
            state.runDailySimulationForSolarPanelsLastStep = true;
          } else {
            state.runDailySimulationForSolarPanels = true;
          }
          break;
        case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
        case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        case ObjectiveFunctionType.YEARLY_PROFIT:
          if (lastStep) {
            state.runYearlySimulationForSolarPanelsLastStep = true;
          } else {
            state.runYearlySimulationForSolarPanels = true;
          }
          break;
      }
    });
    setCommonStore((state) => {
      switch (params.objectiveFunctionType) {
        case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
        case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
        case ObjectiveFunctionType.DAILY_PROFIT:
          if (state.graphState) state.graphState.dailyPvIndividualOutputs = false;
          break;
        case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
        case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        case ObjectiveFunctionType.YEARLY_PROFIT:
          if (state.graphState) state.graphState.yearlyPvIndividualOutputs = false;
          break;
      }
      state.elements.push(...solarPanelArrayRef.current);
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
          datum[geneLabels[k] ?? 'Var' + (k + 1)] = fg.chromosome[k];
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
                datum['Individual' + ++counter] = pg.individuals[i].chromosome[k];
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

export default SolarPanelArrayGa;
