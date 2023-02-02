/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../../stores/common';
import * as Selector from 'src/stores/selector';
import { showError, showInfo } from '../../helpers';
import i18n from '../../i18n/i18n';
import { DatumEntry, DesignProblem, EvolutionMethod, ObjectiveFunctionType, ObjectType } from '../../types';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { FoundationModel } from '../../models/FoundationModel';
import { HALF_PI } from '../../constants';
import { Util } from '../../Util';
import { SolarPanelTiltAngleOptimizerPso } from './algorithm/SolarPanelTiltAngleOptimizerPso';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';

const SolarPanelTiltAnglePso = () => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const pauseEvolution = usePrimitiveStore(Selector.pauseEvolution);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const setFittestParticleResults = useStore(Selector.setFittestIndividualResults);
  const objectiveEvaluationIndex = usePrimitiveStore(Selector.objectiveEvaluationIndex);
  const particleLabels = useStore(Selector.variableLabels);
  const setParticleLabels = useStore(Selector.setVariableLabels);
  const params = useStore(Selector.evolutionaryAlgorithmState).particleSwarmOptimizationParams;

  const lang = { lng: language };
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizerPso>();
  const particleIndexRef = useRef<number>(0);
  const convergedRef = useRef<boolean>(false);
  const initialSolarPanelsRef = useRef<SolarPanelModel[]>([]);

  useEffect(() => {
    if (params.problem !== DesignProblem.SOLAR_PANEL_TILT_ANGLE) return;
    if (evolutionMethod !== EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION) return;
    if (runEvolution) {
      init();
      requestRef.current = requestAnimationFrame(evolve);
      return () => {
        // this is called when the recursive call of requestAnimationFrame exits
        cancelAnimationFrame(requestRef.current);
        if (!evolutionCompletedRef.current) {
          showInfo(i18n.t('message.EvolutionAborted', lang));
          usePrimitiveStore.setState((state) => {
            state.evolutionInProgress = false;
          });
          // revert to the initial solar panels
          if (initialSolarPanelsRef.current.length > 0) {
            solarPanelsRef.current = [...initialSolarPanelsRef.current];
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
      usePrimitiveStore.setState((state) => {
        state.evolutionPaused = true;
      });
      showInfo(i18n.t('message.EvolutionPaused', lang));
    } else {
      usePrimitiveStore.setState((state) => {
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
    usePrimitiveStore.setState((state) => {
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
      optimizerRef.current = new SolarPanelTiltAngleOptimizerPso(
        solarPanelsRef.current,
        foundation,
        params.objectiveFunctionType,
        params.swarmSize,
        params.vmax,
        params.maximumSteps,
        params.convergenceThreshold,
        params.searchMethod,
        params.localSearchRadius,
      );
      optimizerRef.current.inertia = params.inertia;
      optimizerRef.current.cognitiveCoefficient = params.cognitiveCoefficient;
      optimizerRef.current.socialCoefficient = params.socialCoefficient;
      particleIndexRef.current = 0;
      convergedRef.current = false;
      setParticleLabels(labels);
      optimizerRef.current.startEvolving();
      setCommonStore((state) => {
        state.viewState.showEvolutionPanel = true;
      });
    } else {
      showError(i18n.t('message.EncounterEvolutionError', lang));
    }
  };

  const getTotal = (): number => {
    let total = 0;
    switch (params.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
        const dailyPvYield = useDataStore.getState().dailyPvYield;
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
        const yearlyPvYield = useDataStore.getState().yearlyPvYield;
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
        evolutionCompletedRef.current = true;
        optimizerRef.current.applyFittest();
        updateResults();
        runCallback(true);
        showInfo(
          i18n.t('message.EvolutionCompleted', lang) +
            '\n' +
            (convergedRef.current
              ? i18n.t('message.ConvergenceThresholdHasBeenReached', lang)
              : i18n.t('message.MaximumNumberOfStepsHasBeenReached', lang)),
        );
        if (loggable && optimizerRef.current) {
          const bestPosition = optimizerRef.current.swarm.bestPositionOfSwarm;
          const fitness = optimizerRef.current.swarm.bestFitness;
          if (bestPosition && fitness) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Particle Swarm Optimization for Solar Panel Tilt Angle Completed',
                result: SolarPanelTiltAngleOptimizerPso.particleToString(bestPosition, fitness),
                steps: optimizerRef.current?.outsideStepCounter,
                timestamp: new Date().getTime(),
              };
            });
          }
        }
        return;
      }
      optimizerRef.current.translateParticle(particleIndexRef.current % params.swarmSize);
      runCallback(false);
    }
  };

  const runCallback = (lastStep: boolean) => {
    usePrimitiveStore.setState((state) => {
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
      usePrimitiveStore.setState((state) => {
        state.runEvolution = false;
        state.evolutionInProgress = false;
        state.objectiveEvaluationIndex = 0;
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
          datum[key] = Util.toDegrees((2 * ps[k] - 1) * HALF_PI);
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
                datum[key] = Util.toDegrees((2 * ss.particles[i].position[k] - 1) * HALF_PI);
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

export default React.memo(SolarPanelTiltAnglePso);
