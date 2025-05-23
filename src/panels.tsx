/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 *
 */

import React, { useEffect, useState } from 'react';
import MapPanel from './panels/mapPanel';
import HeliodonPanel from './panels/heliodonPanel';
import WeatherPanel from './panels/weatherPanel';
import YearlyLightSensorPanel from './panels/yearlyLightSensorPanel';
import DailyLightSensorPanel from './panels/dailyLightSensorPanel';
import StickyNotePanel from './panels/stickyNotePanel';
import InstructionPanel from './panels/instructionPanel';
import YearlyPvYieldPanel from './panels/yearlyPvYieldPanel';
import DailyPvYieldPanel from './panels/dailyPvYieldPanel';
import DesignInfoPanel from './panels/designInfoPanel';
import SiteInfoPanel from './panels/siteInfoPanel';
import VisualizationControlPanel from './panels/visualizationControlPanel';
import VisibilityResultsPanel from './panels/visibilityResultsPanel';
import YearlyParabolicTroughYieldPanel from './panels/yearlyParabolicTroughYieldPanel';
import DailyParabolicTroughYieldPanel from './panels/dailyParabolicTroughYieldPanel';
import DailyParabolicDishYieldPanel from './panels/dailyParabolicDishYieldPanel';
import YearlyParabolicDishYieldPanel from './panels/yearlyParabolicDishYieldPanel';
import DailyFresnelReflectorYieldPanel from './panels/dailyFresnelReflectorYieldPanel';
import YearlyFresnelReflectorYieldPanel from './panels/yearlyFresnelReflectorYieldPanel';
import DailyHeliostatYieldPanel from './panels/dailyHeliostatYieldPanel';
import YearlyHeliostatYieldPanel from './panels/yearlyHeliostatYieldPanel';
import DailySolarUpdraftTowerYieldPanel from './panels/dailySolarUpdraftTowerYieldPanel';
import DiurnalTemperaturePanel from './panels/diurnalTemperaturePanel';
import YearlySolarUpdraftTowerYieldPanel from './panels/yearlySolarUpdraftTowerYieldPanel';
import SolarPanelOptimizationResult from './panels/solarPanelOptimizationResult';
import EconomicsPanel from './panels/economicsPanel';
import DailyBuildingEnergyPanel from './panels/dailyBuildingEnergyPanel';
import YearlyBuildingEnergyPanel from './panels/yearlyBuildingEnergyPanel';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { GraphDataType } from './types';
import NavigationPanel from './panels/navigationPanel';
import ShadowSettingsPanel from './panels/shadowSettingsPanel';
import SolarPanelCustomizationPanel from './panels/solarPanelCustomizationPanel';
import DailyBatteryStoragePanel from './panels/dailyBatteryStoragePanel';
import YearlyBatteryStoragePanel from './panels/yearlyBatteryStoragePanel';
import EditorPanel from './panels/editorPanel';
import AudioPlayerPanel from './panels/audioPlayerPanel';

const Panels = React.memo(() => {
  const showSiteInfoPanel = useStore(Selector.viewState.showSiteInfoPanel);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);
  const showInstructionPanel = useStore(Selector.viewState.showInstructionPanel);
  const showMapPanel = useStore(Selector.viewState.showMapPanel);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const showStickyNotePanel = useStore(Selector.viewState.showStickyNotePanel);
  const showAudioPlayerPanel = useStore(Selector.viewState.showAudioPlayerPanel);
  const showWeatherPanel = useStore(Selector.viewState.showWeatherPanel);
  const showDiurnalTemperaturePanel = useStore(Selector.viewState.showDiurnalTemperaturePanel);
  const showSolarPanelCustomizationPanel = usePrimitiveStore(Selector.showSolarPanelCustomizationPanel);
  const showEconomicsPanel = usePrimitiveStore(Selector.showEconomicsPanel);
  const showEditorPanel = usePrimitiveStore(Selector.showEditorPanel);
  const showNavigationPanel = usePrimitiveStore(Selector.showNavigationPanel);
  const showShadowSettings = usePrimitiveStore(Selector.showShadowSettings);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const showDailyLightSensorPanel = useStore(Selector.viewState.showDailyLightSensorPanel);
  const showYearlyLightSensorPanel = useStore(Selector.viewState.showYearlyLightSensorPanel);
  const showDailyPvYieldPanel = useStore(Selector.viewState.showDailyPvYieldPanel);
  const showYearlyPvYieldPanel = useStore(Selector.viewState.showYearlyPvYieldPanel);
  const showVisibilityResultsPanel = useStore(Selector.viewState.showVisibilityResultsPanel);
  const showDailyParabolicTroughYieldPanel = useStore(Selector.viewState.showDailyParabolicTroughYieldPanel);
  const showYearlyParabolicTroughYieldPanel = useStore(Selector.viewState.showYearlyParabolicTroughYieldPanel);
  const showDailyParabolicDishYieldPanel = useStore(Selector.viewState.showDailyParabolicDishYieldPanel);
  const showYearlyParabolicDishYieldPanel = useStore(Selector.viewState.showYearlyParabolicDishYieldPanel);
  const showDailyFresnelReflectorYieldPanel = useStore(Selector.viewState.showDailyFresnelReflectorYieldPanel);
  const showYearlyFresnelReflectorYieldPanel = useStore(Selector.viewState.showYearlyFresnelReflectorYieldPanel);
  const showDailyHeliostatYieldPanel = useStore(Selector.viewState.showDailyHeliostatYieldPanel);
  const showYearlyHeliostatYieldPanel = useStore(Selector.viewState.showYearlyHeliostatYieldPanel);
  const showDailyUpdraftTowerYieldPanel = useStore(Selector.viewState.showDailyUpdraftTowerYieldPanel);
  const showYearlyUpdraftTowerYieldPanel = useStore(Selector.viewState.showYearlyUpdraftTowerYieldPanel);
  const showDailyBuildingEnergyPanel = useStore(Selector.viewState.showDailyBuildingEnergyPanel);
  const showYearlyBuildingEnergyPanel = useStore(Selector.viewState.showYearlyBuildingEnergyPanel);
  const showDailyBatteryStorageEnergyPanel = useStore(Selector.viewState.showDailyBatteryStorageEnergyPanel);
  const showYearlyBatteryStorageEnergyPanel = useStore(Selector.viewState.showYearlyBatteryStorageEnergyPanel);
  const showEvolutionPanel = useStore(Selector.viewState.showEvolutionPanel);
  const projectView = useStore(Selector.projectView);
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const getClosestCity = useStore(Selector.getClosestCity);
  const setWeatherModel = useStore(Selector.setWeatherModel);
  const weatherData = useStore(Selector.weatherData);
  const navigation = useStore(Selector.viewState.navigationView) ?? false;

  const [city, setCity] = useState<string>('Boston MA, USA');

  useEffect(() => {
    // weatherData has the city info, return if it has not been loaded and try again after it is loaded
    if (Object.keys(weatherData).length === 0) return;
    const location = getClosestCity(worldLatitude, worldLongitude) ?? 'Boston MA, USA';
    setCity(location);
    setWeatherModel(location);
  }, [worldLatitude, worldLongitude, weatherData]);

  return (
    <>
      {showMapPanel && <MapPanel />}
      {showHeliodonPanel && <HeliodonPanel />}
      {showStickyNotePanel && <StickyNotePanel />}
      {showAudioPlayerPanel && <AudioPlayerPanel />}
      {showSiteInfoPanel && <SiteInfoPanel />}
      {showDesignInfoPanel && <DesignInfoPanel />}
      {(showInstructionPanel || navigation) && !projectView && <InstructionPanel />}
      {showWeatherPanel && (
        <WeatherPanel city={city} graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]} />
      )}
      {showDiurnalTemperaturePanel && <DiurnalTemperaturePanel city={city} />}
      {showSolarPanelCustomizationPanel && (
        <SolarPanelCustomizationPanel
          setDialogVisible={(visible) => {
            usePrimitiveStore.getState().set((state) => {
              state.showSolarPanelCustomizationPanel = visible;
            });
          }}
        />
      )}
      {showEconomicsPanel && (
        <EconomicsPanel
          setDialogVisible={(visible) => {
            usePrimitiveStore.getState().set((state) => {
              state.showEconomicsPanel = visible;
            });
          }}
        />
      )}
      {showEditorPanel && (
        <EditorPanel
          setDialogVisible={(visible) => {
            usePrimitiveStore.getState().set((state) => {
              state.showEditorPanel = visible;
            });
          }}
        />
      )}
      {showNavigationPanel && (
        <NavigationPanel
          setDialogVisible={(visible) => {
            usePrimitiveStore.getState().set((state) => {
              state.showNavigationPanel = visible;
            });
          }}
        />
      )}
      {showShadowSettings && (
        <ShadowSettingsPanel
          setDialogVisible={(visible) => {
            usePrimitiveStore.getState().set((state) => {
              state.showShadowSettings = visible;
            });
          }}
        />
      )}
      {showYearlyLightSensorPanel && <YearlyLightSensorPanel city={city} />}
      {showDailyLightSensorPanel && <DailyLightSensorPanel city={city} />}
      {showYearlyPvYieldPanel && <YearlyPvYieldPanel city={city} />}
      {showDailyPvYieldPanel && <DailyPvYieldPanel city={city} />}
      {showVisibilityResultsPanel && <VisibilityResultsPanel />}
      {showYearlyParabolicTroughYieldPanel && <YearlyParabolicTroughYieldPanel city={city} />}
      {showDailyParabolicTroughYieldPanel && <DailyParabolicTroughYieldPanel city={city} />}
      {showYearlyParabolicDishYieldPanel && <YearlyParabolicDishYieldPanel city={city} />}
      {showDailyParabolicDishYieldPanel && <DailyParabolicDishYieldPanel city={city} />}
      {showDailyFresnelReflectorYieldPanel && <DailyFresnelReflectorYieldPanel city={city} />}
      {showYearlyFresnelReflectorYieldPanel && <YearlyFresnelReflectorYieldPanel city={city} />}
      {showDailyHeliostatYieldPanel && <DailyHeliostatYieldPanel city={city} />}
      {showYearlyHeliostatYieldPanel && <YearlyHeliostatYieldPanel city={city} />}
      {showDailyUpdraftTowerYieldPanel && <DailySolarUpdraftTowerYieldPanel city={city} />}
      {showYearlyUpdraftTowerYieldPanel && <YearlySolarUpdraftTowerYieldPanel city={city} />}
      {showDailyBuildingEnergyPanel && <DailyBuildingEnergyPanel city={city} />}
      {showYearlyBuildingEnergyPanel && <YearlyBuildingEnergyPanel city={city} />}
      {showDailyBatteryStorageEnergyPanel && <DailyBatteryStoragePanel city={city} />}
      {showYearlyBatteryStorageEnergyPanel && <YearlyBatteryStoragePanel city={city} />}
      {showSolarRadiationHeatmap && <VisualizationControlPanel />}
      {showEvolutionPanel && <SolarPanelOptimizationResult />}
    </>
  );
});

export default Panels;
