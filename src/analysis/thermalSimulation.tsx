/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { RoofModel } from '../models/RoofModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ObjectType } from '../types';

export interface ThermalSimulationProps {
  city: string | null;
}

const ThermalSimulation = ({ city }: ThermalSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const runSimulation = useStore(Selector.runStaticSimulation);
  const getRoofSegmentVertices = useStore(Selector.getRoofSegmentVertices);

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');

  useEffect(() => {
    if (runSimulation) {
      if (elements && elements.length > 0) {
        calculateHeatTransfer();
        setCommonStore((state) => {
          state.simulationInProgress = false;
          state.runThermalSimulation = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSimulation]);

  const calculateHeatTransfer = () => {
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
          break;
        case ObjectType.Cuboid:
          break;
        case ObjectType.Wall:
          break;
        case ObjectType.Roof:
          calculateRoof(e as RoofModel);
          break;
      }
    }
  };

  const calculateRoof = (roof: RoofModel) => {
    const segments = getRoofSegmentVertices(roof.id);
    console.log(segments);
  };

  return <></>;
};

export default React.memo(ThermalSimulation);
