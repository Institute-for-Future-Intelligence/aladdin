/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../stores/common';
import * as Selector from 'src/stores/selector';
import { showError, showInfo } from '../../helpers';
import i18n from '../../i18n/i18n';
import { DatumEntry, EvolutionMethod, ObjectiveFunctionType, ObjectType } from '../../types';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { SolarPanelTiltAngleOptimizerGa } from './algorithm/SolarPanelTiltAngleOptimizerGa';
import { FoundationModel } from '../../models/FoundationModel';
import { HALF_PI } from '../../constants';
import { Util } from '../../Util';
import { PolygonModel } from '../../models/PolygonModel';

const SolarPanelArrayGa = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const runEvolution = useStore(Selector.runEvolution);
  const pauseEvolution = useStore(Selector.pauseEvolution);
  const getParent = useStore(Selector.getParent);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const setFittestIndividualResults = useStore(Selector.setFittestIndividualResults);
  const objectiveEvaluationIndex = useStore(Selector.objectiveEvaluationIndex);
  const geneLabels = useStore(Selector.variableLabels);
  const setGeneLabels = useStore(Selector.setVariableLabels);
  const params = useStore(Selector.evolutionaryAlgorithmState).geneticAlgorithmParams;

  const lang = { lng: language };
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizerGa>();
  const individualIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const foundation = getParent(polygon) as FoundationModel;

  useEffect(() => {
    if (runEvolution && evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM) {
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
    const labels: (string | undefined)[] = [];
    for (const osp of originalSolarPanels) {
      solarPanelsRef.current.push(JSON.parse(JSON.stringify(osp)) as SolarPanelModel);
      labels.push(osp.label);
    }
    if (solarPanelsRef.current.length > 0) {
      optimizerRef.current = new SolarPanelTiltAngleOptimizerGa(
        solarPanelsRef.current,
        foundation,
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
        total *= 12 / daysPerYear;
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
        setCommonStore((state) => {
          state.runEvolution = false;
          state.evolutionInProgress = false;
          state.objectiveEvaluationIndex = 0;
        });
        evolutionCompletedRef.current = true;
        optimizerRef.current.applyFittest();
        if (polygon && foundation) {
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
};

export default React.memo(SolarPanelArrayGa);
