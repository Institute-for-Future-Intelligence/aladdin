/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 *
 */

import React, { useEffect, useState } from 'react';
import ThermalSimulation from './analysis/thermalSimulation';
import StaticSolarRadiationSimulation from './analysis/staticSolarRadiationSimulation';
import DynamicSolarRadiationSimulation from './analysis/dynamicSolarRadiationSimulation';
import ParabolicTroughSimulation from './analysis/parabolicTroughSimulation';
import ParabolicDishSimulation from './analysis/parabolicDishSimulation';
import FresnelReflectorSimulation from './analysis/fresnelReflectorSimulation';
import HeliostatSimulation from './analysis/heliostatSimulation';
import SolarUpdraftTowerSimulation from './analysis/solarUpdraftTowerSimulation';
import SolarPanelVisibility from './analysis/solarPanelVisibility';
import SensorSimulation from './analysis/sensorSimulation';
import SolarPanelSimulation from './analysis/solarPanelSimulation';
import * as Selector from 'src/stores/selector';
import { useStore } from './stores/common';

const Simulations = React.memo(() => {
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const getClosestCity = useStore(Selector.getClosestCity);

  const [city, setCity] = useState<string>('Boston MA, USA');

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude) ?? 'Boston MA, USA');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldLatitude, worldLongitude]);

  return (
    <>
      <ThermalSimulation city={city} />
      <StaticSolarRadiationSimulation city={city} />
      <DynamicSolarRadiationSimulation city={city} />
      <SensorSimulation city={city} />
      <SolarPanelSimulation city={city} />
      <SolarPanelVisibility />
      <ParabolicTroughSimulation city={city} />
      <ParabolicDishSimulation city={city} />
      <FresnelReflectorSimulation city={city} />
      <HeliostatSimulation city={city} />
      <SolarUpdraftTowerSimulation city={city} />
    </>
  );
});

export default Simulations;
