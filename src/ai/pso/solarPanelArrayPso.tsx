/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../stores/common';
import * as Selector from 'src/stores/selector';
import { showInfo } from '../../helpers';
import i18n from '../../i18n/i18n';
import { DatumEntry, DesignProblem, EvolutionMethod, ObjectiveFunctionType, ObjectType } from '../../types';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { FoundationModel } from '../../models/FoundationModel';
import { SolarPanelArrayOptimizerPso } from './algorithm/SolarPanelArrayOptimizerPso';
import { PolygonModel } from '../../models/PolygonModel';

const SolarPanelArrayPso = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const runEvolution = useStore(Selector.runEvolution);
  const pauseEvolution = useStore(Selector.pauseEvolution);
  const getParent = useStore(Selector.getParent);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const setFittestParticleResults = useStore(Selector.setFittestIndividualResults);
  const objectiveEvaluationIndex = useStore(Selector.objectiveEvaluationIndex);
  const particleLabels = useStore(Selector.variableLabels);
  const setParticleLabels = useStore(Selector.setVariableLabels);
  const params = useStore(Selector.evolutionaryAlgorithmState).particleSwarmOptimizationParams;
  const constraints = useStore(Selector.solarPanelArrayLayoutConstraints);
  const economics = useStore.getState().economicsParams;
  const getPvModule = useStore(Selector.getPvModule);
  const removeElementsByReferenceId = useStore(Selector.removeElementsByReferenceId);

  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelArrayOptimizerPso>();
  const particleIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const solarPanelArrayRef = useRef<SolarPanelModel[]>([]);

  const lang = { lng: language };
  const foundation = polygon ? (getParent(polygon) as FoundationModel) : undefined;

  useEffect(() => {
    if (params.problem !== DesignProblem.SOLAR_PANEL_ARRAY) return;
    if (evolutionMethod !== EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION) return;
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
    optimizerRef.current = new SolarPanelArrayOptimizerPso(
      getPvModule(solarPanelsRef.current.length > 0 ? solarPanelsRef.current[0].pvModelName : 'CS6X-355P-FG'),
      solarPanelsRef.current,
      polygon,
      foundation,
      params.swarmSize,
      params.vmax,
      params.maximumSteps,
      params.convergenceThreshold,
      params.searchMethod,
      params.localSearchRadius,
      constraints.minimumInterRowSpacing,
      constraints.maximumInterRowSpacing,
      constraints.minimumRowsPerRack,
      constraints.maximumRowsPerRack,
      constraints.minimumTiltAngle,
      constraints.maximumTiltAngle,
    );
    optimizerRef.current.inertia = params.inertia;
    optimizerRef.current.cognitiveCoefficient = params.cognitiveCoefficient;
    optimizerRef.current.socialCoefficient = params.socialCoefficient;
    particleIndexRef.current = 0;
    convergedRef.current = false;
    setParticleLabels(['Tilt Angle', 'Inter-Row Spacing', 'Rack Width']);
    optimizerRef.current.startEvolving();
    setCommonStore((state) => {
      state.viewState.showEvolutionPanel = true;
    });
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.DAILY_PROFIT:
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
      case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.YEARLY_PROFIT:
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
    const count = optimizerRef.current?.solarPanelCount;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        total = count ? total / count : total;
        break;
      case ObjectiveFunctionType.DAILY_PROFIT:
        total = total * economics.electricitySellingPrice - (count ?? 0) * economics.operationalCostPerUnit;
        break;
      case ObjectiveFunctionType.YEARLY_PROFIT:
        total = total * economics.electricitySellingPrice - (count ?? 0) * economics.operationalCostPerUnit * 365;
        break;
    }
    return total;
  };

  // the increment of objectiveEvaluationIndex is used as a trigger to request the next animation frame
  useEffect(() => {
    if (!optimizerRef.current || !objectiveEvaluationIndex) return;
    // the number of particles to evaluate is less than or equal to maximumSteps * swarmSize,
    // subject to the convergence criterion
    convergedRef.current = optimizerRef.current.updateParticle(particleIndexRef.current % params.swarmSize, getTotal());
    updateResults();
    particleIndexRef.current++;
    optimizerRef.current.outsideStepCounter = Math.floor(particleIndexRef.current / params.swarmSize);
    // recursive call to the next step of the evolution, which is to evaluate the next particle
    requestRef.current = requestAnimationFrame(evolve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveEvaluationIndex]);

  const evolve = () => {
    if (!optimizerRef.current) return;
    if (evolutionMethod !== EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION) return;
    if (runEvolution && !pauseRef.current) {
      if (convergedRef.current || optimizerRef.current.outsideStepCounter >= params.maximumSteps) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runEvolution = false;
          state.evolutionInProgress = false;
          state.objectiveEvaluationIndex = 0;
        });
        evolutionCompletedRef.current = true;
        if (solarPanelArrayRef.current.length > 0) {
          removeElementsByReferenceId(polygon.id, false);
        }
        solarPanelArrayRef.current = optimizerRef.current.translateBest();
        optimizerRef.current.applyFittest();
        setCommonStore((state) => {
          state.elements.push(...solarPanelArrayRef.current);
        });
        updateResults();
        showInfo(
          i18n.t('message.EvolutionCompleted', lang) +
            '\n' +
            (convergedRef.current
              ? i18n.t('message.ConvergenceThresholdHasBeenReached', lang)
              : i18n.t('message.MaximumNumberOfStepsHasBeenReached', lang)),
        );
        return;
      }
      if (solarPanelArrayRef.current.length > 0) {
        removeElementsByReferenceId(polygon.id, false);
      }
      solarPanelArrayRef.current = optimizerRef.current.translateParticleByIndex(
        particleIndexRef.current % params.swarmSize,
      );
      setCommonStore((state) => {
        state.elements.push(...solarPanelArrayRef.current);
        switch (params.objectiveFunctionType) {
          case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
          case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
          case ObjectiveFunctionType.DAILY_PROFIT:
            state.dailyPvIndividualOutputs = false;
            state.runDailySimulationForSolarPanels = true;
            break;
          case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
          case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
          case ObjectiveFunctionType.YEARLY_PROFIT:
            state.yearlyPvIndividualOutputs = false;
            state.runYearlySimulationForSolarPanels = true;
            break;
        }
      });
    }
  };

  const updateResults = () => {
    if (!optimizerRef.current) return;
    const results: DatumEntry[] = [];
    for (let index = 0; index < optimizerRef.current.bestPositionOfSteps.length; index++) {
      const datum: DatumEntry = {};
      // the first fittest starts from index 1 because index 0 is used for the initial state
      const ps = optimizerRef.current.bestPositionOfSteps[index];
      if (ps) {
        const n = ps.length;
        datum['Step'] = index;
        for (let k = 0; k < n; k++) {
          let key = 'Var' + (k + 1);
          if (particleLabels[k]) {
            const trimmed = particleLabels[k]?.trim();
            if (trimmed && trimmed !== '') key = trimmed;
          }
          datum[key] = ps[k];
        }
        datum['Objective'] = optimizerRef.current.bestFitnessOfSteps[index];
        // the first step of the swarm starts from index 0
        if (index > 0) {
          const ss = optimizerRef.current.swarmOfSteps[index - 1];
          if (ss) {
            let counter = 0;
            for (let i = 0; i < ss.particles.length; i++) {
              const n = ss.particles[i].position.length;
              for (let k = 0; k < n; k++) {
                const key = 'Individual' + ++counter;
                datum[key] = ss.particles[i].position[k];
              }
            }
          }
        }
      }
      if (Object.keys(datum).length > 0) {
        results.push(datum);
      }
    }
    setFittestParticleResults(results);
  };

  return <></>;
};

export default React.memo(SolarPanelArrayPso);
