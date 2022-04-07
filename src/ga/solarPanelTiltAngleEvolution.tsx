/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ObjectType } from '../types';
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

  const params = useStore.getState().geneticAlgorithmState.solarPanelTiltAngleGeneticAlgorithmParams;
  const populationSizeRef = useRef<number>(params.populationSize);
  const maximumGenerationsRef = useRef<number>(params.maximumGenerations);
  const mutationRateRef = useRef<number>(params.mutationRate);

  const lang = { lng: language };
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizer>();

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
      populationSizeRef.current,
      maximumGenerationsRef.current,
      solarPanelsRef.current.length,
      0,
    );
    optimizerRef.current.mutationRate = mutationRateRef.current;
  };

  const updateSolarPanels = () => {
    if (solarPanelsRef.current) {
      for (const sp of solarPanelsRef.current) {
        updateSolarPanelTiltAngleById(sp.id, sp.tiltAngle);
      }
    }
  };

  const evolve = () => {
    if (!optimizerRef.current) return;
    if (runEvolution && !pauseRef.current) {
      if (optimizerRef.current.outsideGenerationCounter >= maximumGenerationsRef.current) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runEvolution = false;
        });
        evolutionCompletedRef.current = true;
        if (optimizerRef.current.maximumGenerations > 1) {
          optimizerRef.current.applyFittest(); // show the fittest
        }
        setCommonStore((state) => {
          state.evolutionInProgress = false;
        });
        showInfo(i18n.t('message.EvolutionCompleted', lang));
        return;
      }
      // the number of individuals to evaluate is maximumGeneration * population.size(), subject to the convergence criterion
      if (optimizerRef.current.maximumGenerations > 1) {
        while (!optimizerRef.current.shouldTerminate()) {
          for (let i = 0; i < optimizerRef.current.population.individuals.length; i++) {
            optimizerRef.current.computeIndividual(i);
            updateSolarPanels();
          }
          optimizerRef.current.outsideGenerationCounter++;
        }
      }

      // recursive call to the next step of the evolution, which is to evaluate the next individual
      requestRef.current = requestAnimationFrame(evolve);
    }
  };
  return <></>;
};

export default React.memo(SolarPanelTiltAngleEvolution);
