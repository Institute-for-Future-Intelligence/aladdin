/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 */

import React from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { Util } from './Util';
import SimulationControlPanel from './panels/simulationControlPanel';
import EvolutionControlPanel from './panels/evolutionControlPanel';
import Spinner from './components/spinner';

export default React.memo(function Loading({ loading }: { loading: boolean }) {
  const loadingFile = useStore(Selector.loadingFile);
  const simulationInProgress = useStore(Selector.simulationInProgress);
  const evolutionInProgress = useStore(Selector.evolutionInProgress);
  const simulationPaused = useStore(Selector.simulationPaused);
  const evolutionPaused = useStore(Selector.evolutionPaused);
  const noAnimationForSensorDataCollection = useStore(Selector.world.noAnimationForSensorDataCollection);
  const noAnimationForSolarPanelSimulation = useStore(Selector.world.noAnimationForSolarPanelSimulation);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const noAnimationForSolarUpdraftTowerSimulation = useStore(Selector.world.noAnimationForSolarUpdraftTowerSimulation);
  const noAnimationForThermalSimulation = useStore(Selector.world.noAnimationForThermalSimulation);
  const runDailySimulationForSolarPanels = useStore(Selector.runDailySimulationForSolarPanels);
  const runYearlySimulationForSolarPanels = useStore(Selector.runYearlySimulationForSolarPanels);
  const runDailyLightSensor = useStore(Selector.runDailyLightSensor);
  const runYearlyLightSensor = useStore(Selector.runYearlyLightSensor);
  const runDailySimulationForUpdraftTower = useStore(Selector.runDailySimulationForUpdraftTower);
  const runYearlySimulationForUpdraftTower = useStore(Selector.runYearlySimulationForUpdraftTower);
  const runDynamicSimulation = useStore(Selector.runDynamicSimulation);
  const runDailyThermalSimulation = useStore(Selector.runDailyThermalSimulation);

  const elements = useStore.getState().elements;

  return (
    <>
      {(loading || loadingFile || simulationInProgress || evolutionInProgress) && (
        <>
          {simulationInProgress &&
            ((!noAnimationForHeatmapSimulation && runDynamicSimulation) ||
              (!noAnimationForThermalSimulation && runDailyThermalSimulation) ||
              (!noAnimationForSensorDataCollection && (runDailyLightSensor || runYearlyLightSensor)) ||
              (!noAnimationForSolarUpdraftTowerSimulation &&
                (runDailySimulationForUpdraftTower || runYearlySimulationForUpdraftTower)) ||
              (!noAnimationForSolarPanelSimulation &&
                (runDailySimulationForSolarPanels || runYearlySimulationForSolarPanels)) ||
              Util.hasMovingParts(elements)) && <SimulationControlPanel />}
          {evolutionInProgress && <EvolutionControlPanel />}
          <Spinner spinning={!simulationPaused || !evolutionPaused} />
        </>
      )}
    </>
  );
});
