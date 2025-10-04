/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { ExampleMenuItem, MainSubMenu } from './mainMenuItems';

const ExamplesMenu = () => {
  const lang = useLanguage();

  return (
    <MainSubMenu label={i18n.t('menu.examplesSubMenu', lang)}>
      {/* solar energy */}
      <MainSubMenu label={i18n.t('menu.solarEnergySubMenu', lang)}>
        <MainSubMenu label={i18n.t('menu.photovoltaicSolarPowerSubMenu', lang)}>
          <ExampleMenuItem fileName="solar_canopy_over_bleachers">
            {i18n.t('menu.solarEnergyExamples.SolarCanopyOverBleachers', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_canopy_over_garage">
            {i18n.t('menu.solarEnergyExamples.SolarCanopyOverGarage', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_bus_stop">
            {i18n.t('menu.solarEnergyExamples.SolarBusStop', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_facade_tesla">
            {i18n.t('menu.solarEnergyExamples.SolarFacadeTesla', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="floatovoltaics">
            {i18n.t('menu.solarEnergyExamples.Floatovoltaics', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="rainbow_swash_solar_farm">
            {i18n.t('menu.solarEnergyExamples.RainbowSwashSolarFarmBostonMA', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="mickey_mouse_solar_farm">
            {i18n.t('menu.solarEnergyExamples.MickeyMouseSolarFarmOrlandoFL', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_panels_over_canal">
            {i18n.t('menu.solarEnergyExamples.SolarPanelsOverCanalBakersfieldCA', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_noise_barrier">
            {i18n.t('menu.solarEnergyExamples.SolarNoiseBarrierLexingtonMA', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_farm_hsat_array">
            {i18n.t('menu.solarEnergyExamples.HSATSolarTrackersRaleighNC', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solar_farm_aadat_array">
            {i18n.t('menu.solarEnergyExamples.AADATSolarTrackersLancasterCA', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.concentratedSolarPowerSubMenu', lang)}>
          <ExampleMenuItem fileName="nevada_solar_one_parabolic_troughs">
            {i18n.t('menu.solarEnergyExamples.NevadaSolarOneParabolicTroughArray', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="tooele_parabolic_dish_array">
            {i18n.t('menu.solarEnergyExamples.TooeleParabolicDishArray', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="tucson_sundt_station">
            {i18n.t('menu.solarEnergyExamples.TucsonLinearFresnelReflectors', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="ps10_solar_power_tower">
            {i18n.t('menu.solarEnergyExamples.PS10SolarPowerTower', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.otherTypesOfSolarPowerSubMenu', lang)}>
          <ExampleMenuItem fileName="solar_updraft_tower_city">
            {i18n.t('menu.solarEnergyExamples.SolarUpdraftTowerInCity', lang)}
          </ExampleMenuItem>
        </MainSubMenu>
      </MainSubMenu>

      {/* built environment */}
      <MainSubMenu label={i18n.t('menu.builtEnvironmentSubMenu', lang)}>
        <MainSubMenu label={i18n.t('menu.residentialBuildingsSubMenu', lang)}>
          <ExampleMenuItem fileName="cape_cod_with_shed_dormer">
            {i18n.t('menu.buildingDesignTutorials.CapeCodStyleHouseWithShedDormer', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="cape_cod_with_garage">
            {i18n.t('menu.residentialBuildingExamples.CapeCodHouseWithGarage', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="colonial_house">
            {i18n.t('menu.residentialBuildingExamples.ColonialHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="dutch_colonial_house">
            {i18n.t('menu.residentialBuildingExamples.DutchColonialHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="mansard_roof_with_dormers">
            {i18n.t('menu.buildingDesignTutorials.MansardRoofWithDormers', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="t_shaped_house">
            {i18n.t('menu.residentialBuildingExamples.TShapedHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="solarium">
            {i18n.t('menu.residentialBuildingExamples.Solarium', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="butterfly_roof_house">
            {i18n.t('menu.residentialBuildingExamples.ButterflyRoofHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="adobe_taos_house">
            {i18n.t('menu.residentialBuildingExamples.AdobeTaosHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="ranch_house">
            {i18n.t('menu.residentialBuildingExamples.RanchHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="bonnet_house">
            {i18n.t('menu.residentialBuildingExamples.BonnetHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="barn_house">
            {i18n.t('menu.residentialBuildingExamples.BarnStyleHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="modern_house_01">
            {i18n.t('menu.residentialBuildingExamples.ModernHouse', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.commercialBuildingsSubMenu', lang)}>
          <ExampleMenuItem fileName="white_house">
            {i18n.t('menu.commercialBuildingExamples.WhiteHouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="harold_washington_college">
            {i18n.t('menu.commercialBuildingExamples.HaroldWashingtonCollege', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="bilim_mersin_turkiye">
            {i18n.t('menu.commercialBuildingExamples.BilimMersinTurkiye', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="spanish_style_hotel">
            {i18n.t('menu.commercialBuildingExamples.SpanishStyleHotel', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="apartment_building_01">
            {i18n.t('menu.commercialBuildingExamples.ApartmentBuilding', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="office_building_01">
            {i18n.t('menu.commercialBuildingExamples.OfficeBuilding', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="hotel_01">{i18n.t('menu.commercialBuildingExamples.Hotel', lang)}</ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.otherBuildingsSubMenu', lang)}>
          <ExampleMenuItem fileName="greenhouse">
            {i18n.t('menu.otherBuildingExamples.Greenhouse', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="church_01">
            {i18n.t('menu.residentialBuildingExamples.Church1', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="cathedral_01">
            {i18n.t('menu.residentialBuildingExamples.Cathedral1', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="cathedral_02">
            {i18n.t('menu.residentialBuildingExamples.Cathedral2', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="mosque_01">
            {i18n.t('menu.residentialBuildingExamples.Mosque1', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="pavilion">{i18n.t('menu.otherBuildingExamples.Pavilion', lang)}</ExampleMenuItem>
          <ExampleMenuItem fileName="octagonal_pagoda">
            {i18n.t('menu.otherBuildingExamples.OctagonalPagoda', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="ocean_front">
            {i18n.t('menu.otherBuildingExamples.OceanFront', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="egyptian_pyramids">
            {i18n.t('menu.otherBuildingExamples.EgyptianPyramids', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="mayan_pyramid">
            {i18n.t('menu.otherBuildingExamples.MayanPyramid', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="si_o_se_pol">
            {i18n.t('menu.otherBuildingExamples.SiOSePol', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="stacked_cuboids">
            {i18n.t('menu.otherBuildingExamples.StackedCuboids', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.buildingComplexesSubMenu', lang)}>
          <ExampleMenuItem fileName="south_burlington_high_school">
            {i18n.t('menu.buildingComplexExamples.SouthBurlingtonHighSchoolVermont', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="mescalero_apache_school">
            {i18n.t('menu.buildingComplexExamples.MescaleroApacheSchoolNewMexico', lang)}
          </ExampleMenuItem>
        </MainSubMenu>

        <MainSubMenu label={i18n.t('menu.urbanPlanningSubMenu', lang)}>
          <ExampleMenuItem fileName="city_block_heatmap">
            {i18n.t('menu.urbanPlanningExamples.CityBlockHeatmap', lang)}
          </ExampleMenuItem>
          <ExampleMenuItem fileName="chicago_skyline">
            {i18n.t('menu.urbanPlanningExamples.ChicagoSkyline', lang)}
          </ExampleMenuItem>
        </MainSubMenu>
      </MainSubMenu>

      {/* artificial intelligence */}
      <MainSubMenu label={i18n.t('menu.artificialIntelligenceSubMenu', lang)}>
        <ExampleMenuItem fileName="ai_tilt_angle_one_row">
          {i18n.t('menu.artificialIntelligenceExamples.OptimizingTiltAngleOfOneSolarPanelRow', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="ai_tilt_angles_multiple_rows">
          {i18n.t('menu.artificialIntelligenceExamples.OptimizingTiltAnglesOfMultipleSolarPanelRows', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="ai_solar_farm_design">
          {i18n.t('menu.artificialIntelligenceExamples.SolarFarmGenerativeDesign', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="ai_solar_farm_design_block">
          {i18n.t('menu.artificialIntelligenceExamples.SolarFarmGenerativeDesignWithBlock', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="ai_fitchburg_solar_farm">
          {i18n.t('menu.artificialIntelligenceExamples.FitchburgSolarFarmGenerativeDesign', lang)}
        </ExampleMenuItem>
      </MainSubMenu>

      {/* benchmarks */}
      <MainSubMenu label={i18n.t('menu.benchmarksSubMenu', lang)}>
        <ExampleMenuItem fileName="solar_radiation_predicted_vs_measured">
          {i18n.t('menu.benchmarks.SolarRadiationPredictionVsMeasurement', lang)}
        </ExampleMenuItem>
        <ExampleMenuItem fileName="bestest_case_600">{i18n.t('menu.benchmarks.BESTESTCase600', lang)}</ExampleMenuItem>
        <ExampleMenuItem fileName="bestest_case_610">{i18n.t('menu.benchmarks.BESTESTCase610', lang)}</ExampleMenuItem>
        <ExampleMenuItem fileName="bestest_case_620">{i18n.t('menu.benchmarks.BESTESTCase620', lang)}</ExampleMenuItem>
        <ExampleMenuItem fileName="bestest_case_630">{i18n.t('menu.benchmarks.BESTESTCase630', lang)}</ExampleMenuItem>
      </MainSubMenu>
    </MainSubMenu>
  );
};

export default ExamplesMenu;
