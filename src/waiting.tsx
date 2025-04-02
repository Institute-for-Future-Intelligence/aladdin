/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 *
 */

import React, { useEffect } from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { Util } from './Util';
import SimulationControlPanel from './panels/simulationControlPanel';
import EvolutionControlPanel from './panels/evolutionControlPanel';
import Spinner from './components/spinner';
import { usePrimitiveStore } from './stores/commonPrimitive';

export default React.memo(function Waiting({ initializing }: { initializing: boolean }) {
  const waiting = usePrimitiveStore(Selector.waiting);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const evolutionInProgress = usePrimitiveStore(Selector.evolutionInProgress);
  const simulationPaused = usePrimitiveStore(Selector.simulationPaused);
  const evolutionPaused = usePrimitiveStore(Selector.evolutionPaused);
  const noAnimationForSensorDataCollection = useStore(Selector.world.noAnimationForSensorDataCollection);
  const noAnimationForSolarPanelSimulation = useStore(Selector.world.noAnimationForSolarPanelSimulation);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const noAnimationForSolarUpdraftTowerSimulation = useStore(Selector.world.noAnimationForSolarUpdraftTowerSimulation);
  const noAnimationForThermalSimulation = useStore(Selector.world.noAnimationForThermalSimulation);
  const runDailySimulationForSolarPanels = usePrimitiveStore(Selector.runDailySimulationForSolarPanels);
  const runYearlySimulationForSolarPanels = usePrimitiveStore(Selector.runYearlySimulationForSolarPanels);
  const runDailyLightSensor = usePrimitiveStore(Selector.runDailyLightSensor);
  const runYearlyLightSensor = usePrimitiveStore(Selector.runYearlyLightSensor);
  const runDailySimulationForUpdraftTower = usePrimitiveStore(Selector.runDailySimulationForUpdraftTower);
  const runYearlySimulationForUpdraftTower = usePrimitiveStore(Selector.runYearlySimulationForUpdraftTower);
  const runDynamicSimulation = usePrimitiveStore(Selector.runDynamicSimulation);
  const runDailyThermalSimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);
  const runYearlyThermalSimulation = usePrimitiveStore(Selector.runYearlyThermalSimulation);

  const elements = useStore.getState().elements;

  return (
    <>
      {(initializing || waiting || simulationInProgress || evolutionInProgress) && (
        <>
          {simulationInProgress &&
            ((!noAnimationForHeatmapSimulation && runDynamicSimulation) ||
              (!noAnimationForThermalSimulation && (runDailyThermalSimulation || runYearlyThermalSimulation)) ||
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

export const EndWaiting = () => {
  useStore(Selector.fileChanged);
  const waiting = usePrimitiveStore.getState().waiting;
  if (!waiting) return null;

  const End = () => {
    useEffect(() => {
      // ensure that the scene radius is updated after the model is loaded and rendered
      setTimeout(() => {
        useStore.getState().set((state) => {
          state.updateSceneRadiusFlag = !state.updateSceneRadiusFlag;
        });
      }, 10);
      usePrimitiveStore.getState().set((state) => {
        state.waiting = false;
      });
      return () => {
        usePrimitiveStore.getState().set((state) => {
          state.waiting = false;
        });
      };
    });
    return null;
  };

  return <End />;
};
