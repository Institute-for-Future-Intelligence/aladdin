/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { ProjectState } from 'src/types';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { fetchProject } from 'src/cloudProjectUtil';
import { loadCloudFile } from 'src/cloudFileUtil';
import { HOME_URL } from 'src/constants';
import { useLanguage } from 'src/hooks';
import { ExampleMenuItem, MainMenuItem, MainSubMenu } from './mainMenuItems';

const TutorialsMenu = () => {
  const lang = useLanguage();

  const setCommonStore = useStore.getState().set;

  const setProjectState = (projectState: ProjectState) => {
    setCommonStore((state) => {
      state.projectState = { ...projectState };
      state.projectImages.clear();
      state.projectView = true;
      state.canvasPercentWidth = 50;
      state.viewState.showModelTree = false;
    });
    usePrimitiveStore.getState().set((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
      state.updateProjectsFlag = true;
    });
  };

  const loadProject = (title: string, designIndex: number) => {
    const owner = import.meta.env.VITE_EXAMPLE_PROJECT_OWNER;
    if (title && owner) {
      const params = new URLSearchParams(window.location.search);
      const viewOnly = params.get('viewonly') === 'true';
      fetchProject(owner, title, setProjectState).then(() => {
        loadCloudFile(owner, title + ' ' + designIndex, true, true, viewOnly).then(() => {
          setCommonStore((state) => {
            // if (state.canvasPercentWidth === 100) state.canvasPercentWidth = 50;
            state.canvasPercentWidth = 50;
            state.viewState.showModelTree = false;
          });
        });
      });
      usePrimitiveStore.getState().set((state) => {
        state.openModelsMap = false;
      });
      if (useStore.getState().loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Open Example: ' + title,
            timestamp: new Date().getTime(),
          };
        });
      }
      if (!viewOnly) {
        window.history.pushState({}, document.title, HOME_URL);
      }
    }
  };

  return (
    <MainSubMenu label={i18n.t('menu.tutorialsSubMenu', lang)}>
      {/* solar energy science */}
      <MainSubMenu label={i18n.t('menu.solarEnergyScienceSubMenu', lang)}>
        <ExampleMenuItem fileName="sun_angles">
          {i18n.t('menu.solarEnergyScienceTutorials.SunAngles', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="insolation_and_climate">
          {i18n.t('menu.solarEnergyScienceTutorials.InsolationAndClimate', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="solar_radiation_to_box">
          {i18n.t('menu.solarEnergyScienceTutorials.SolarRadiationToBox', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="sun_beam_at_center">
          {i18n.t('menu.solarEnergyExamples.SunBeamAndHeliodon', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* building science */}
      <MainSubMenu label={i18n.t('menu.buildingScienceSubMenu', lang)}>
        <ExampleMenuItem fileName="thermal_vs_building_envelope">
          {i18n.t('menu.buildingScienceTutorials.ThermalEnvelopeVsBuildingEnvelope', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_house_size">
          {i18n.t('menu.buildingScienceTutorials.EffectOfSizeOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_house_orientation">
          {i18n.t('menu.buildingScienceTutorials.EffectOfOrientationOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_wall_roof_insulation">
          {i18n.t('menu.buildingScienceTutorials.EffectOfInsulationOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_window_airtightness">
          {i18n.t('menu.buildingScienceTutorials.EffectOfAirtightnessOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_roof_color">
          {i18n.t('menu.buildingScienceTutorials.EffectOfRoofColorOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_eaves_overhang_length">
          {i18n.t('menu.buildingScienceTutorials.EffectOfEavesOverhangLengthOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_window_shgc">
          {i18n.t('menu.buildingScienceTutorials.EffectOfWindowSHGCOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_thermostat_setpoint">
          {i18n.t('menu.buildingScienceTutorials.EffectOfThermostatSetpointOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_programmable_thermostat">
          {i18n.t('menu.buildingScienceTutorials.EffectOfProgrammableThermostatOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_solar_panels">
          {i18n.t('menu.buildingScienceTutorials.EffectOfSolarPanelsOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_ground_temperature">
          {i18n.t('menu.buildingScienceTutorials.EffectOfGroundTemperatureOnBuildingEnergy', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_trees">
          {i18n.t('menu.buildingScienceTutorials.EffectOfTreesOnBuildingEnergy', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* building design */}
      <MainSubMenu label={i18n.t('menu.buildingDesignSubMenu', lang)}>
        <ExampleMenuItem fileName="gable_roof_vs_hip_roof">
          {i18n.t('menu.buildingDesignTutorials.GableRoofVsHipRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="colonial_vs_saltbox">
          {i18n.t('menu.buildingDesignTutorials.ColonialVsSaltbox', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="gambrel_roof_vs_mansard_roof">
          {i18n.t('menu.buildingDesignTutorials.GambrelRoofVsMansardRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="combination_roof_vs_bonnet_roof">
          {i18n.t('menu.buildingDesignTutorials.CombinationRoofVsBonnetRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="dutch_gable_roof">
          {i18n.t('menu.buildingDesignTutorials.DutchGableRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="raised_ranch">
          {i18n.t('menu.buildingDesignTutorials.RaisedRanch', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="overhang_floor">
          {i18n.t('menu.buildingDesignTutorials.OverhangFloor', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="gable_and_valley_roof">
          {i18n.t('menu.buildingDesignTutorials.GableAndValleyRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="clerestory_roof">
          {i18n.t('menu.buildingDesignTutorials.ClerestoryRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="monitor_roof">
          {i18n.t('menu.buildingDesignTutorials.MonitorRoof', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="a_frame_house">
          {i18n.t('menu.buildingDesignTutorials.AFrameHouse', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="half_timbered_house">
          {i18n.t('menu.buildingDesignTutorials.HalfTimberedHouse', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="all_roof_types">
          {i18n.t('menu.buildingDesignTutorials.AllBasicRoofTypes', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* photovoltaic solar power */}
      <MainSubMenu label={i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}>
        {/* basic topics */}
        <MainSubMenu label={i18n.t('word.BasicTopics', lang)}>
          <ExampleMenuItem fileName="effect_tilt_angle_solar_panel">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfTiltAngleOfSolarPanel', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="effect_azimuth_solar_panel">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfAzimuthOfSolarPanel', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="why_solar_array">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.CoveringGroundWithSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="inter_row_spacing">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.InterRowSpacingOfSolarPanelArray', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="effect_orientation_solar_panel">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.EffectOfOrientationOfSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_panel_types">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarPanelTypes', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_panel_array_auto_layout">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarPanelArrayAutomaticLayout', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        {/* advanced topics */}
        <MainSubMenu label={i18n.t('word.AdvancedTopics', lang)}>
          <ExampleMenuItem fileName="custom_solar_panels">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.DefineYourOwnSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="vertical_bifacial_solar_panels">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.VerticalBifacialSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="compare_monofacial_bifacial_solar_panels">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.CompareMonofacialAndBifacialSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_trackers">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarTrackers', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_panel_array_slope">
            {i18n.t('menu.photovoltaicSolarPowerTutorials.SolarPanelArrayOnSlope', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="rooftop_solar_panels">
            {i18n.t('menu.solarEnergyExamples.RooftopSolarPanels', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="compare_generation_consumption">
            {i18n.t('menu.solarEnergyExamples.CompareGenerationConsumption', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_canopy_form_factors">
            {i18n.t('menu.solarEnergyExamples.SolarCanopyFormFactors', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="bipv_01">
            {i18n.t('menu.solarEnergyExamples.BuildingIntegratedPhotovoltaics', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="vegetative_buffer_01">
            {i18n.t('menu.solarEnergyExamples.VegetativeBuffer', lang)}
          </ExampleMenuItem>
        </MainSubMenu>
      </MainSubMenu>

      {/* concentrated solar power */}
      <MainSubMenu label={i18n.t('menu.concentratedSolarPowerSubMenu', lang)}>
        <ExampleMenuItem fileName="parabolic_dish_focus_sunlight">
          {i18n.t('menu.concentratedSolarPowerTutorials.FocusSunlightWithParabolicDish', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_azimuth_parabolic_trough">
          {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfParabolicTrough', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_latus_rectum_parabolic_trough">
          {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfLatusRectumOfParabolicTrough', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="linear_fresnel_reflectors">
          {i18n.t('menu.concentratedSolarPowerTutorials.LinearFresnelReflectors', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_absorber_pipe_height">
          {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAbsorberPipeHeightForLinearFresnelReflectors', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_azimuth_fresnel_reflector">
          {i18n.t('menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfLinearFresnelReflectors', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="linear_fresnel_reflectors_two_absorbers">
          {i18n.t('menu.concentratedSolarPowerTutorials.LinearFresnelReflectorsWithTwoAbsorbers', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="building_integrated_fresnel_reflectors">
          {i18n.t('menu.concentratedSolarPowerTutorials.BuildingIntegratedFresnelReflectors', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="solar_power_tower">
          {i18n.t('menu.concentratedSolarPowerTutorials.SolarPowerTower', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="cosine_efficiency_heliostats">
          {i18n.t('menu.concentratedSolarPowerTutorials.CosineEfficiencyOfHeliostats', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="shadowing_blocking_heliostats">
          {i18n.t('menu.concentratedSolarPowerTutorials.ShadowingAndBlockingOfHeliostats', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_solar_power_tower_height">
          {i18n.t('menu.concentratedSolarPowerTutorials.EffectSolarPowerTowerHeight', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* other types of solar power */}
      <MainSubMenu label={i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}>
        <ExampleMenuItem fileName="solar_water_heaters">
          {i18n.t('menu.otherTypesOfSolarPowerTutorials.SolarWaterHeaters', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="solar_updraft_tower">
          {i18n.t('menu.otherTypesOfSolarPowerTutorials.SolarUpdraftTower', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* wind power */}
      <MainSubMenu label={i18n.t('menu.windPowerSubMenu', lang)}>
        <ExampleMenuItem fileName="effect_blade_number">
          {i18n.t('menu.windPowerTutorials.EffectOfBladeNumberOfWindTurbine', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="effect_pitch_angle">
          {i18n.t('menu.windPowerTutorials.EffectOfPitchAngleOfWindTurbineBlades', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="bird_safe_blade_design">
          {i18n.t('menu.windPowerTutorials.BirdSafeBladeDesign', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="offshore_wind_farm">
          {i18n.t('menu.windPowerTutorials.OffshoreWindFarm', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* storage */}
      <MainSubMenu label={i18n.t('menu.storageSubMenu', lang)}>
        <ExampleMenuItem fileName="home_solar_energy_storage">
          {i18n.t('menu.storageTutorials.HomeSolarEnergyStorage', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* colocation */}
      <MainSubMenu label={i18n.t('menu.colocationSubMenu', lang)}>
        <ExampleMenuItem fileName="agriculture_solar_wind_colocation">
          {i18n.t('menu.colocationTutorials.AgricultureSolarWindColocation', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* generative design */}
      <MainSubMenu label={i18n.t('menu.generativeDesignSubMenu', lang)}>
        <MainMenuItem onClick={() => loadProject('Tilt Angle', 48)}>
          {i18n.t('menu.generativeDesignTutorials.MonofacialSolarPanelArrayTiltAngle', lang)}
        </MainMenuItem>
        <MainMenuItem onClick={() => loadProject('Bifacial Tilt Angle', 50)}>
          {i18n.t('menu.generativeDesignTutorials.BifacialSolarPanelArrayTiltAngle', lang)}
        </MainMenuItem>
        <MainMenuItem onClick={() => loadProject('Inter-Row Spacing', 0)}>
          {i18n.t('menu.generativeDesignTutorials.SolarPanelArrayInterRowSpacing', lang)}
        </MainMenuItem>
        <MainMenuItem onClick={() => loadProject('Latitude', 0)}>
          {i18n.t('menu.generativeDesignTutorials.OutputOfSolarPanelArrayInDifferentPlaces', lang)}
        </MainMenuItem>
        <MainMenuItem onClick={() => loadProject('Pareto Front', 0)}>
          {i18n.t('menu.generativeDesignTutorials.SimpleSolarFarmParetoFront', lang)}
        </MainMenuItem>
        <MainMenuItem onClick={() => loadProject('LLM and Sim', 11)}>
          {i18n.t('menu.generativeDesignTutorials.GenerativeOptimizationEnergyEfficientHouse', lang)}
        </MainMenuItem>
      </MainSubMenu>
    </MainSubMenu>
  );
};

export default TutorialsMenu;
