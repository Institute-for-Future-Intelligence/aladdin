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

  const lang = { lng: language };
  const requestRef = useRef<number>(0);
  const evolutionCompletedRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const solarPanelsRef = useRef<SolarPanelModel[]>();
  const optimizerRef = useRef<SolarPanelTiltAngleOptimizer>();
  const individualIndexRef = useRef<number>(0);

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
      params.populationSize,
      params.maximumGenerations,
      0,
    );
    optimizerRef.current.mutationRate = params.mutationRate;
    individualIndexRef.current = 0;
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
      if (optimizerRef.current.outsideGenerationCounter >= params.maximumGenerations) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runEvolution = false;
        });
        evolutionCompletedRef.current = true;
        optimizerRef.current.applyFittest(); // show the fittest
        setCommonStore((state) => {
          state.evolutionInProgress = false;
        });
        showInfo(i18n.t('message.EvolutionCompleted', lang));
        return;
      }
      // the number of individuals to evaluate is maximumGeneration * population.size(), subject to the convergence criterion
      optimizerRef.current.computeIndividual(individualIndexRef.current % params.populationSize);
      updateSolarPanels();
      individualIndexRef.current++;
      optimizerRef.current.outsideGenerationCounter = Math.floor(individualIndexRef.current / params.populationSize);
      // recursive call to the next step of the evolution, which is to evaluate the next individual
      requestRef.current = requestAnimationFrame(evolve);
    }
  };

  return <></>;
};

export default React.memo(SolarPanelTiltAngleEvolution);
