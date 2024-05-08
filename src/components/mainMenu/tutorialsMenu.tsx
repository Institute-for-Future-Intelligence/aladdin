/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */
import { MenuProps } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { ProjectState } from 'src/types';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { fetchProject } from 'src/cloudProjectUtil';
import { loadCloudFile } from 'src/cloudFileUtil';
import { HOME_URL } from 'src/constants';

const mapFunction = ({ key, label }: { key: string; label: string }) => ({
  key,
  label: <MenuItem noPadding>{i18n.t(label, { lng: useStore.getState().language })}</MenuItem>,
});

export const createTutorialsMenu = (viewOnly: boolean) => {
  const lang = { lng: useStore.getState().language };
  const setCommonStore = useStore.getState().set;

  const setProjectState = (projectState: ProjectState) => {
    setCommonStore((state) => {
      state.projectState = { ...projectState };
      state.projectImages.clear();
      state.projectView = true;
    });
    usePrimitiveStore.getState().set((state) => {
      state.projectImagesUpdateFlag = !state.projectImagesUpdateFlag;
      state.updateProjectsFlag = true;
    });
  };

  const loadProject = (title: string, designIndex: number) => {
    const owner = import.meta.env.VITE_EXAMPLE_PROJECT_OWNER;
    if (title && owner) {
      fetchProject(owner, title, setProjectState).then(() => {
        loadCloudFile(owner, title + ' ' + designIndex, true, true, viewOnly).then(() => {
          // ignore
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

  const items: MenuProps['items'] = [
    {
      key: 'solar-energy-science',
      label: <MenuItem noPadding>{i18n.t('menu.solarEnergyScienceSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'sun_angles',
          label: 'menu.solarEnergyScienceTutorials.SunAngles',
        },
        {
          key: 'insolation_and_climate',
          label: 'menu.solarEnergyScienceTutorials.InsolationAndClimate',
        },
        {
          key: 'solar_radiation_to_box',
          label: 'menu.solarEnergyScienceTutorials.SolarRadiationToBox',
        },
        {
          key: 'sun_beam_at_center',
          label: 'menu.solarEnergyExamples.SunBeamAndHeliodon',
        },
      ].map(mapFunction),
    },
    {
      key: 'building-science',
      label: <MenuItem noPadding>{i18n.t('menu.buildingScienceSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'thermal_vs_building_envelope',
          label: 'menu.buildingScienceTutorials.ThermalEnvelopeVsBuildingEnvelope',
        },
        {
          key: 'effect_house_size',
          label: 'menu.buildingScienceTutorials.EffectOfSizeOnBuildingEnergy',
        },
        {
          key: 'effect_house_orientation',
          label: 'menu.buildingScienceTutorials.EffectOfOrientationOnBuildingEnergy',
        },
        {
          key: 'effect_wall_roof_insulation',
          label: 'menu.buildingScienceTutorials.EffectOfInsulationOnBuildingEnergy',
        },
        {
          key: 'effect_roof_color',
          label: 'menu.buildingScienceTutorials.EffectOfRoofColorOnBuildingEnergy',
        },
        {
          key: 'effect_eaves_overhang_length',
          label: 'menu.buildingScienceTutorials.EffectOfEavesOverhangLengthOnBuildingEnergy',
        },
        {
          key: 'effect_window_shgc',
          label: 'menu.buildingScienceTutorials.EffectOfWindowSHGCOnBuildingEnergy',
        },
        {
          key: 'effect_thermostat_setpoint',
          label: 'menu.buildingScienceTutorials.EffectOfThermostatSetpointOnBuildingEnergy',
        },
        {
          key: 'effect_solar_panels',
          label: 'menu.buildingScienceTutorials.EffectOfSolarPanelsOnBuildingEnergy',
        },
        {
          key: 'effect_ground_temperature',
          label: 'menu.buildingScienceTutorials.EffectOfGroundTemperatureOnBuildingEnergy',
        },
        {
          key: 'effect_trees',
          label: 'menu.buildingScienceTutorials.EffectOfTreesOnBuildingEnergy',
        },
      ].map(mapFunction),
    },
    {
      key: 'building-design',
      label: <MenuItem noPadding>{i18n.t('menu.buildingDesignSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'cape_cod_with_shed_dormer',
          label: 'menu.buildingDesignTutorials.CapeCodStyleHouseWithShedDormer',
        },
        {
          key: 'mansard_roof_with_dormers',
          label: 'menu.buildingDesignTutorials.MansardRoofWithDormers',
        },
        {
          key: 'gable_roof_vs_hip_roof',
          label: 'menu.buildingDesignTutorials.GableRoofVsHipRoof',
        },
        {
          key: 'colonial_vs_saltbox',
          label: 'menu.buildingDesignTutorials.ColonialVsSaltbox',
        },
        {
          key: 'gambrel_roof_vs_mansard_roof',
          label: 'menu.buildingDesignTutorials.GambrelRoofVsMansardRoof',
        },
        {
          key: 'combination_roof_vs_bonnet_roof',
          label: 'menu.buildingDesignTutorials.CombinationRoofVsBonnetRoof',
        },
        {
          key: 'dutch_gable_roof',
          label: 'menu.buildingDesignTutorials.DutchGableRoof',
        },
        {
          key: 'gable_and_valley_roof',
          label: 'menu.buildingDesignTutorials.GableAndValleyRoof',
        },
        {
          key: 'clerestory_roof',
          label: 'menu.buildingDesignTutorials.ClerestoryRoof',
        },
        {
          key: 'monitor_roof',
          label: 'menu.buildingDesignTutorials.MonitorRoof',
        },
        {
          key: 'a_frame_house',
          label: 'menu.buildingDesignTutorials.AFrameHouse',
        },
        {
          key: 'half_timbered_house',
          label: 'menu.buildingDesignTutorials.HalfTimberedHouse',
        },
        {
          key: 'all_roof_types',
          label: 'menu.buildingDesignTutorials.AllBasicRoofTypes',
        },
      ].map(mapFunction),
    },
    {
      key: 'photovoltaic-solar-power',
      label: <MenuItem noPadding>{i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'effect_tilt_angle_solar_panel',
          label: 'menu.photovoltaicSolarPowerTutorials.EffectOfTiltAngleOfSolarPanel',
        },
        {
          key: 'effect_azimuth_solar_panel',
          label: 'menu.photovoltaicSolarPowerTutorials.EffectOfAzimuthOfSolarPanel',
        },
        {
          key: 'solar_panel_types',
          label: 'menu.photovoltaicSolarPowerTutorials.SolarPanelTypes',
        },
        {
          key: 'vertical_bifacial_solar_panels',
          label: 'menu.photovoltaicSolarPowerTutorials.VerticalBifacialSolarPanels',
        },
        {
          key: 'compare_monofacial_bifacial_solar_panels',
          label: 'menu.photovoltaicSolarPowerTutorials.CompareMonofacialAndBifacialSolarPanels',
        },
        {
          key: 'solar_trackers',
          label: 'menu.photovoltaicSolarPowerTutorials.SolarTrackers',
        },
        {
          key: 'why_solar_array',
          label: 'menu.photovoltaicSolarPowerTutorials.CoveringGroundWithSolarPanels',
        },
        {
          key: 'inter_row_spacing',
          label: 'menu.photovoltaicSolarPowerTutorials.InterRowSpacingOfSolarPanelArray',
        },
        {
          key: 'effect_orientation_solar_panel',
          label: 'menu.photovoltaicSolarPowerTutorials.EffectOfOrientationOfSolarPanels',
        },
        {
          key: 'solar_panel_array_auto_layout',
          label: 'menu.photovoltaicSolarPowerTutorials.SolarPanelArrayAutomaticLayout',
        },
        {
          key: 'rooftop_solar_panels',
          label: 'menu.solarEnergyExamples.RooftopSolarPanels',
        },
        {
          key: 'solar_canopy_form_factors',
          label: 'menu.solarEnergyExamples.SolarCanopyFormFactors',
        },
        {
          key: 'bipv_01',
          label: 'menu.solarEnergyExamples.BuildingIntegratedPhotovoltaics',
        },
      ].map(mapFunction),
    },
    {
      key: 'concentrated-solar-power',
      label: <MenuItem noPadding>{i18n.t('menu.concentratedSolarPowerSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'parabolic_dish_focus_sunlight',
          label: 'menu.concentratedSolarPowerTutorials.FocusSunlightWithParabolicDish',
        },
        {
          key: 'effect_azimuth_parabolic_trough',
          label: 'menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfParabolicTrough',
        },
        {
          key: 'effect_latus_rectum_parabolic_trough',
          label: 'menu.concentratedSolarPowerTutorials.EffectOfLatusRectumOfParabolicTrough',
        },
        {
          key: 'linear_fresnel_reflectors',
          label: 'menu.concentratedSolarPowerTutorials.LinearFresnelReflectors',
        },
        {
          key: 'effect_absorber_pipe_height',
          label: 'menu.concentratedSolarPowerTutorials.EffectOfAbsorberPipeHeightForLinearFresnelReflectors',
        },
        {
          key: 'effect_azimuth_fresnel_reflector',
          label: 'menu.concentratedSolarPowerTutorials.EffectOfAzimuthOfLinearFresnelReflectors',
        },
        {
          key: 'linear_fresnel_reflectors_two_absorbers',
          label: 'menu.concentratedSolarPowerTutorials.LinearFresnelReflectorsWithTwoAbsorbers',
        },
        {
          key: 'solar_power_tower',
          label: 'menu.concentratedSolarPowerTutorials.SolarPowerTower',
        },
        {
          key: 'cosine_efficiency_heliostats',
          label: 'menu.concentratedSolarPowerTutorials.CosineEfficiencyOfHeliostats',
        },
        {
          key: 'shadowing_blocking_heliostats',
          label: 'menu.concentratedSolarPowerTutorials.ShadowingAndBlockingOfHeliostats',
        },
        {
          key: 'effect_solar_power_tower_height',
          label: 'menu.concentratedSolarPowerTutorials.EffectSolarPowerTowerHeight',
        },
      ].map(mapFunction),
    },
    {
      key: 'other-types-of-solar-power',
      label: <MenuItem noPadding>{i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'solar_updraft_tower',
          label: 'menu.otherTypesOfSolarPowerTutorials.SolarUpdraftTower',
        },
      ].map(mapFunction),
    },
    {
      key: 'wind-power',
      label: <MenuItem noPadding>{i18n.t('menu.windPowerSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'effect_blade_number',
          label: 'menu.windPowerTutorials.EffectOfBladeNumberOfWindTurbine',
        },
        {
          key: 'effect_pitch_angle',
          label: 'menu.windPowerTutorials.EffectOfPitchAngleOfWindTurbineBlades',
        },
        {
          key: 'bird_safe_blade_design',
          label: 'menu.windPowerTutorials.BirdSafeBladeDesign',
        },
        {
          key: 'offshore_wind_farm',
          label: 'menu.windPowerTutorials.OffshoreWindFarm',
        },
      ].map(mapFunction),
    },
    {
      key: 'colocation',
      label: <MenuItem noPadding>{i18n.t('menu.colocationSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'agriculture_solar_wind_colocation',
          label: 'menu.colocationTutorials.AgricultureSolarWindColocation',
        },
      ].map(mapFunction),
    },
    {
      key: 'generative-design',
      label: <MenuItem noPadding>{i18n.t('menu.generativeDesignSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'Tilt Angle',
          label: (
            <MenuItem noPadding onClick={() => loadProject('Tilt Angle', 48)}>
              {i18n.t('menu.generativeDesignTutorials.MonofacialSolarPanelArrayTiltAngle', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'Bifacial Tilt Angle',
          label: (
            <MenuItem noPadding onClick={() => loadProject('Bifacial Tilt Angle', 50)}>
              {i18n.t('menu.generativeDesignTutorials.BifacialSolarPanelArrayTiltAngle', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'Latitude',
          label: (
            <MenuItem noPadding onClick={() => loadProject('Latitude', 0)}>
              {i18n.t('menu.generativeDesignTutorials.OutputOfSolarPanelArrayInDifferentPlaces', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'Pareto Front',
          label: (
            <MenuItem noPadding onClick={() => loadProject('Pareto Front', 0)}>
              {i18n.t('menu.generativeDesignTutorials.SimpleSolarFarmParetoFront', lang)}
            </MenuItem>
          ),
        },
      ],
    },
  ];

  return items;
};
