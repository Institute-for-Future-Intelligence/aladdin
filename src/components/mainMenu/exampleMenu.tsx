/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */
import { MenuProps } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';

const mapFunction = ({ key, label }: { key: string; label: string }) => ({
  key,
  label: <MenuItem noPadding>{i18n.t(label, { lng: useStore.getState().language })}</MenuItem>,
});

export const createExamplesMenu = () => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [
    {
      key: 'solar-energy',
      label: <MenuItem noPadding>{i18n.t('menu.solarEnergySubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'photovoltaic-solar-power-examples',
          label: <MenuItem noPadding>{i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}</MenuItem>,
          children: [
            { key: 'vegetative_buffer_01', label: 'menu.solarEnergyExamples.VegetativeBuffer' },
            { key: 'solar_canopy_over_bleachers', label: 'menu.solarEnergyExamples.SolarCanopyOverBleachers' },
            { key: 'solar_canopy_over_garage', label: 'menu.solarEnergyExamples.SolarCanopyOverGarage' },
            { key: 'solar_bus_stop', label: 'menu.solarEnergyExamples.SolarBusStop' },
            { key: 'solar_facade_tesla', label: 'menu.solarEnergyExamples.SolarFacadeTesla' },
            { key: 'floatovoltaics', label: 'menu.solarEnergyExamples.Floatovoltaics' },
            { key: 'rainbow_swash_solar_farm', label: 'menu.solarEnergyExamples.RainbowSwashSolarFarmBostonMA' },
            { key: 'mickey_mouse_solar_farm', label: 'menu.solarEnergyExamples.MickeyMouseSolarFarmOrlandoFL' },
            { key: 'solar_panels_over_canal', label: 'menu.solarEnergyExamples.SolarPanelsOverCanalBakersfieldCA' },
            { key: 'solar_noise_barrier', label: 'menu.solarEnergyExamples.SolarNoiseBarrierLexingtonMA' },
            { key: 'solar_farm_hsat_array', label: 'menu.solarEnergyExamples.HSATSolarTrackersRaleighNC' },
            { key: 'solar_farm_aadat_array', label: 'menu.solarEnergyExamples.AADATSolarTrackersLancasterCA' },
          ].map(mapFunction),
        },
        {
          key: 'concentrated-solar-power-examples',
          label: <MenuItem noPadding>{i18n.t('menu.concentratedSolarPowerSubMenu', lang)}</MenuItem>,
          children: [
            {
              key: 'nevada_solar_one_parabolic_troughs',
              label: 'menu.solarEnergyExamples.NevadaSolarOneParabolicTroughArray',
            },
            {
              key: 'tooele_parabolic_dish_array',
              label: 'menu.solarEnergyExamples.TooeleParabolicDishArray',
            },
            {
              key: 'tucson_sundt_station',
              label: 'menu.solarEnergyExamples.TucsonLinearFresnelReflectors',
            },
            {
              key: 'ps10_solar_power_tower',
              label: 'menu.solarEnergyExamples.PS10SolarPowerTower',
            },
          ].map(mapFunction),
        },
        {
          key: 'other-types-of-solar-power-examples',
          label: <MenuItem noPadding>{i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}</MenuItem>,
          children: [
            {
              key: 'solar_updraft_tower_city',
              label: 'menu.solarEnergyExamples.SolarUpdraftTowerInCity',
            },
          ].map(mapFunction),
        },
      ],
    },
    {
      key: 'built-environment',
      label: <MenuItem noPadding>{i18n.t('menu.builtEnvironmentSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'residential_buildings',
          label: <MenuItem noPadding>{i18n.t('menu.residentialBuildingsSubMenu', lang)}</MenuItem>,
          children: [
            { key: 'colonial_house', label: 'menu.residentialBuildingExamples.ColonialHouse' },
            { key: 'dutch_colonial_house', label: 'menu.residentialBuildingExamples.DutchColonialHouse' },
            { key: 't_shaped_house', label: 'menu.residentialBuildingExamples.TShapedHouse' },
            { key: 'cape_cod_with_garage', label: 'menu.residentialBuildingExamples.CapeCodHouseWithGarage' },
            { key: 'solarium', label: 'menu.residentialBuildingExamples.Solarium' },
            { key: 'butterfly_roof_house', label: 'menu.residentialBuildingExamples.ButterflyRoofHouse' },
            { key: 'adobe_taos_house', label: 'menu.residentialBuildingExamples.AdobeTaosHouse' },
            { key: 'ranch_house', label: 'menu.residentialBuildingExamples.RanchHouse' },
            { key: 'bonnet_house', label: 'menu.residentialBuildingExamples.BonnetHouse' },
            { key: 'barn_house', label: 'menu.residentialBuildingExamples.BarnStyleHouse' },
            { key: 'modern_house_01', label: 'menu.residentialBuildingExamples.ModernHouse' },
          ].map(mapFunction),
        },
        {
          key: 'commercial_buildings',
          label: <MenuItem noPadding>{i18n.t('menu.commercialBuildingsSubMenu', lang)}</MenuItem>,
          children: [
            { key: 'white_house', label: 'menu.commercialBuildingExamples.WhiteHouse' },
            { key: 'bilim_mersin_turkiye', label: 'menu.commercialBuildingExamples.BilimMersinTurkiye' },
            { key: 'spanish_style_hotel', label: 'menu.commercialBuildingExamples.SpanishStyleHotel' },
            { key: 'apartment_building_01', label: 'menu.commercialBuildingExamples.ApartmentBuilding' },
            { key: 'office_building_01', label: 'menu.commercialBuildingExamples.OfficeBuilding' },
            { key: 'hotel_01', label: 'menu.commercialBuildingExamples.Hotel' },
          ].map(mapFunction),
        },
        {
          key: 'other_buildings',
          label: <MenuItem noPadding>{i18n.t('menu.otherBuildingsSubMenu', lang)}</MenuItem>,
          children: [
            { key: 'greenhouse', label: 'menu.otherBuildingExamples.Greenhouse' },
            { key: 'church_01', label: 'menu.residentialBuildingExamples.Church1' },
            { key: 'cathedral_01', label: 'menu.residentialBuildingExamples.Cathedral1' },
            { key: 'cathedral_02', label: 'menu.residentialBuildingExamples.Cathedral2' },
            { key: 'mosque_01', label: 'menu.residentialBuildingExamples.Mosque1' },
            { key: 'pavilion', label: 'menu.otherBuildingExamples.Pavilion' },
            { key: 'octagonal_pagoda', label: 'menu.otherBuildingExamples.OctagonalPagoda' },
            { key: 'ocean_front', label: 'menu.otherBuildingExamples.OceanFront' },
            { key: 'egyptian_pyramids', label: 'menu.otherBuildingExamples.EgyptianPyramids' },
            { key: 'mayan_pyramid', label: 'menu.otherBuildingExamples.MayanPyramid' },
            { key: 'si_o_se_pol', label: 'menu.otherBuildingExamples.SiOSePol' },
            { key: 'stacked_cuboids', label: 'menu.otherBuildingExamples.StackedCuboids' },
          ].map(mapFunction),
        },
        {
          key: 'building_complexes',
          label: <MenuItem noPadding>{i18n.t('menu.buildingComplexesSubMenu', lang)}</MenuItem>,
          children: [
            {
              key: 'south_burlington_high_school',
              label: 'menu.buildingComplexExamples.SouthBurlingtonHighSchoolVermont',
            },
            {
              key: 'mescalero_apache_school',
              label: 'menu.buildingComplexExamples.MescaleroApacheSchoolNewMexico',
            },
          ].map(mapFunction),
        },
        {
          key: 'urban_planning',
          label: <MenuItem noPadding>{i18n.t('menu.urbanPlanningSubMenu', lang)}</MenuItem>,
          children: [{ key: 'heatmap_01', label: 'menu.urbanPlanningExamples.Heatmap1' }].map(mapFunction),
        },
      ],
    },
    {
      key: 'artificial-intelligence',
      label: <MenuItem noPadding>{i18n.t('menu.artificialIntelligenceSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'ai_tilt_angle_one_row',
          label: 'menu.artificialIntelligenceExamples.OptimizingTiltAngleOfOneSolarPanelRow',
        },
        {
          key: 'ai_tilt_angles_multiple_rows',
          label: 'menu.artificialIntelligenceExamples.OptimizingTiltAnglesOfMultipleSolarPanelRows',
        },
        {
          key: 'ai_solar_farm_design',
          label: 'menu.artificialIntelligenceExamples.SolarFarmGenerativeDesign',
        },
        {
          key: 'ai_solar_farm_design_block',
          label: 'menu.artificialIntelligenceExamples.SolarFarmGenerativeDesignWithBlock',
        },
        {
          key: 'ai_fitchburg_solar_farm',
          label: 'menu.artificialIntelligenceExamples.FitchburgSolarFarmGenerativeDesign',
        },
      ].map(mapFunction),
    },
    {
      key: 'benchmarks',
      label: <MenuItem noPadding>{i18n.t('menu.benchmarksSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'solar_radiation_predicted_vs_measured',
          label: 'menu.benchmarks.SolarRadiationPredictionVsMeasurement',
        },
        {
          key: 'bestest_case_600',
          label: 'menu.benchmarks.BESTESTCase600',
        },
        {
          key: 'bestest_case_610',
          label: 'menu.benchmarks.BESTESTCase610',
        },
        {
          key: 'bestest_case_620',
          label: 'menu.benchmarks.BESTESTCase620',
        },
        {
          key: 'bestest_case_630',
          label: 'menu.benchmarks.BESTESTCase630',
        },
      ].map(mapFunction),
    },
  ];

  return items;
};
