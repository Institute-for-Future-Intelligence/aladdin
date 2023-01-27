/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import sun_angles from './examples/sun_angles.json';
import insolation_and_climate from './examples/insolation_and_climate.json';
import solar_radiation_to_box from './examples/solar_radiation_to_box.json';
import sun_beam_at_center from './examples/sun_beam_at_center.json';
import solar_panel_types from './examples/solar_panel_types.json';
import rooftop_solar_panels from './examples/rooftop_solar_panels.json';
import solar_farm_fixed_array from './examples/solar_farm_fixed_array.json';
import solar_farm_hsat_array from './examples/solar_farm_hsat_array.json';
import solar_farm_aadat_array from './examples/solar_farm_aadat_array.json';
import solar_noise_barrier from './examples/solar_noise_barrier.json';
import solar_panels_over_canal from './examples/solar_panels_over_canal.json';
import solar_trackers from './examples/solar_trackers.json';
import all_roof_types from './examples/all_roof_types.json';
import cape_cod_with_shed_dormer from './examples/cape_cod_with_shed_dormer.json';
import mansard_roof_with_dormers from './examples/mansard_roof_with_dormers.json';
import t_shaped_house from './examples/t_shaped_house.json';
import cape_cod_with_garage from './examples/cape_cod_with_garage.json';
import adobe_taos_house from './examples/adobe_taos_house.json';
import bonnet_house from './examples/bonnet_house.json';
import barn_house from './examples/barn_house.json';
import modern_house_01 from './examples/modern_house_01.json';
import solarium from './examples/solarium.json';
import mosque_01 from './examples/mosque_01.json';
import church_01 from './examples/church_01.json';
import cathedral_01 from './examples/cathedral_01.json';
import cathedral_02 from './examples/cathedral_02.json';
import colonial_house from './examples/colonial_house.json';
import dutch_colonial_house from './examples/dutch_colonial_house.json';
import dutch_gable_roof from './examples/dutch_gable_roof.json';
import a_frame_house from './examples/a_frame_house.json';
import combination_roof_vs_bonnet_roof from './examples/combination_roof_vs_bonnet_roof.json';
import butterfly_roof_house from './examples/butterfly_roof_house.json';
import gable_roof_vs_hip_roof from './examples/gable_roof_vs_hip_roof.json';
import gable_and_valley_roof from './examples/gable_and_valley_roof.json';
import clerestory_roof from './examples/clerestory_roof.json';
import monitor_roof from './examples/monitor_roof.json';
import colonial_vs_saltbox from './examples/colonial_vs_saltbox.json';
import gambrel_roof_vs_mansard_roof from './examples/gambrel_roof_vs_mansard_roof.json';
import white_house from './examples/white_house.json';
import office_building_01 from './examples/office_building_01.json';
import hotel_01 from './examples/hotel_01.json';
import spanish_style_hotel from './examples/spanish_style_hotel.json';
import apartment_building_01 from './examples/apartment_building_01.json';
import south_burlington_high_school from './examples/south_burlington_high_school.json';
import mescalero_apache_school from './examples/mescalero_apache_school.json';
import heatmap_01 from './examples/heatmap_01.json';
import greenhouse from './examples/greenhouse.json';
import pavilion from './examples/pavilion.json';
import octagonal_pagoda from './examples/octagonal_pagoda.json';
import ocean_front from './examples/ocean_front.json';
import egyptian_pyramids from './examples/egyptian_pyramids.json';
import mayan_pyramid from './examples/mayan_pyramid.json';
import si_o_se_pol from './examples/si_o_se_pol.json';
import vegetative_buffer_01 from './examples/vegetative_buffer_01.json';
import effect_tilt_angle_solar_panel from './examples/effect_tilt_angle_solar_panel.json';
import effect_azimuth_solar_panel from './examples/effect_azimuth_solar_panel.json';
import effect_azimuth_parabolic_trough from './examples/effect_azimuth_parabolic_trough.json';
import effect_latus_rectum_parabolic_trough from './examples/effect_latus_rectum_parabolic_trough.json';
import effect_orientation_solar_panel from './examples/effect_orientation_solar_panel.json';
import why_solar_array from './examples/why_solar_array.json';
import solar_canopy_form_factors from './examples/solar_canopy_form_factors.json';
import solar_canopy_over_bleachers from './examples/solar_canopy_over_bleachers.json';
import solar_bus_stop from './examples/solar_bus_stop.json';
import bipv_01 from './examples/bipv_01.json';
import solar_canopy_over_garage from './examples/solar_canopy_over_garage.json';
import solar_facade_tesla from './examples/solar_facade_tesla.json';
import floatovoltaics from './examples/floatovoltaics.json';
import agrivoltaics from './examples/agrivoltaics.json';
import inter_row_spacing from './examples/inter_row_spacing.json';
import ps10_solar_power_tower from './examples/ps10_solar_power_tower.json';
import nevada_solar_one_parabolic_troughs from './examples/nevada_solar_one_parabolic_troughs.json';
import parabolic_dish_focus_sunlight from './examples/parabolic_dish_focus_sunlight.json';
import tooele_parabolic_dish_array from './examples/tooele_parabolic_dish_array.json';
import linear_fresnel_reflectors from './examples/linear_fresnel_reflectors.json';
import linear_fresnel_reflectors_two_absorbers from './examples/linear_fresnel_reflectors_two_absorbers.json';
import effect_absorber_pipe_height from './examples/effect_absorber_pipe_height.json';
import effect_azimuth_fresnel_reflector from './examples/effect_azimuth_fresnel_reflector.json';
import cosine_efficiency_heliostats from './examples/cosine_efficiency_heliostats.json';
import shadowing_blocking_heliostats from './examples/shadowing_blocking_heliostats.json';
import effect_solar_power_tower_height from './examples/effect_solar_power_tower_height.json';
import solar_power_tower from './examples/solar_power_tower.json';
import solar_radiation_predicted_vs_measured from './examples/solar_radiation_predicted_vs_measured.json';
import bestest_case_600 from './examples/bestest_case_600.json';
import bestest_case_610 from './examples/bestest_case_610.json';
import bestest_case_620 from './examples/bestest_case_620.json';
import bestest_case_630 from './examples/bestest_case_630.json';
import solar_updraft_tower from './examples/solar_updraft_tower.json';
import solar_updraft_tower_city from './examples/solar_updraft_tower_city.json';
import tucson_sundt_station from './examples/tucson_sundt_station.json';
import ai_tilt_angle_one_row from './examples/ai_tilt_angle_one_row.json';
import ai_tilt_angles_multiple_rows from './examples/ai_tilt_angles_multiple_rows.json';
import ai_solar_farm_design from './examples/ai_solar_farm_design.json';
import ai_solar_farm_design_block from './examples/ai_solar_farm_design_block.json';
import ai_fitchburg_solar_farm from './examples/ai_fitchburg_solar_farm.json';
import effect_house_size from './examples/effect_house_size.json';
import effect_house_orientation from './examples/effect_house_orientation.json';
import effect_wall_roof_insulation from './examples/effect_wall_roof_insulation.json';
import effect_roof_color from './examples/effect_roof_color.json';
import effect_eaves_overhang_length from './examples/effect_eaves_overhang_length.json';
import effect_window_shgc from './examples/effect_window_shgc.json';
import effect_thermostat_setpoint from './examples/effect_thermostat_setpoint.json';
import effect_solar_panels from './examples/effect_solar_panels.json';
import effect_trees from './examples/effect_trees.json';
import thermal_vs_building_envelope from './examples/thermal_vs_building_envelope.json';

export const getExample = (name: string) => {
  let input: any;
  switch (name) {
    case 'sun_angles':
      input = sun_angles;
      break;
    case 'insolation_and_climate':
      input = insolation_and_climate;
      break;
    case 'solar_radiation_to_box':
      input = solar_radiation_to_box;
      break;
    case 'sun_beam_at_center':
      input = sun_beam_at_center;
      break;
    case 'thermal_vs_building_envelope':
      input = thermal_vs_building_envelope;
      break;
    case 'effect_house_size':
      input = effect_house_size;
      break;
    case 'effect_house_orientation':
      input = effect_house_orientation;
      break;
    case 'effect_wall_roof_insulation':
      input = effect_wall_roof_insulation;
      break;
    case 'effect_roof_color':
      input = effect_roof_color;
      break;
    case 'effect_eaves_overhang_length':
      input = effect_eaves_overhang_length;
      break;
    case 'effect_window_shgc':
      input = effect_window_shgc;
      break;
    case 'effect_thermostat_setpoint':
      input = effect_thermostat_setpoint;
      break;
    case 'effect_solar_panels':
      input = effect_solar_panels;
      break;
    case 'effect_trees':
      input = effect_trees;
      break;
    case 'office_building_01':
      input = office_building_01;
      break;
    case 'hotel_01':
      input = hotel_01;
      break;
    case 'spanish_style_hotel':
      input = spanish_style_hotel;
      break;
    case 'apartment_building_01':
      input = apartment_building_01;
      break;
    case 'white_house':
      input = white_house;
      break;
    case 'south_burlington_high_school':
      input = south_burlington_high_school;
      break;
    case 'mescalero_apache_school':
      input = mescalero_apache_school;
      break;
    case 'heatmap_01':
      input = heatmap_01;
      break;
    case 'vegetative_buffer_01':
      input = vegetative_buffer_01;
      break;
    case 'solar_canopy_form_factors':
      input = solar_canopy_form_factors;
      break;
    case 'solar_canopy_over_bleachers':
      input = solar_canopy_over_bleachers;
      break;
    case 'solar_bus_stop':
      input = solar_bus_stop;
      break;
    case 'solar_facade_tesla':
      input = solar_facade_tesla;
      break;
    case 'solar_canopy_over_garage':
      input = solar_canopy_over_garage;
      break;
    case 'bipv_01':
      input = bipv_01;
      break;
    case 'floatovoltaics':
      input = floatovoltaics;
      break;
    case 'agrivoltaics':
      input = agrivoltaics;
      break;
    case 'effect_tilt_angle_solar_panel':
      input = effect_tilt_angle_solar_panel;
      break;
    case 'effect_azimuth_solar_panel':
      input = effect_azimuth_solar_panel;
      break;
    case 'effect_azimuth_parabolic_trough':
      input = effect_azimuth_parabolic_trough;
      break;
    case 'effect_latus_rectum_parabolic_trough':
      input = effect_latus_rectum_parabolic_trough;
      break;
    case 'parabolic_dish_focus_sunlight':
      input = parabolic_dish_focus_sunlight;
      break;
    case 'effect_orientation_solar_panel':
      input = effect_orientation_solar_panel;
      break;
    case 'solar_panel_types':
      input = solar_panel_types;
      break;
    case 'why_solar_array':
      input = why_solar_array;
      break;
    case 'inter_row_spacing':
      input = inter_row_spacing;
      break;
    case 'rooftop_solar_panels':
      input = rooftop_solar_panels;
      break;
    case 'solar_panels_over_canal':
      input = solar_panels_over_canal;
      break;
    case 'solar_noise_barrier':
      input = solar_noise_barrier;
      break;
    case 'solar_farm_fixed_array':
      input = solar_farm_fixed_array;
      break;
    case 'solar_farm_hsat_array':
      input = solar_farm_hsat_array;
      break;
    case 'solar_farm_aadat_array':
      input = solar_farm_aadat_array;
      break;
    case 'solar_trackers':
      input = solar_trackers;
      break;
    case 'nevada_solar_one_parabolic_troughs':
      input = nevada_solar_one_parabolic_troughs;
      break;
    case 'tooele_parabolic_dish_array':
      input = tooele_parabolic_dish_array;
      break;
    case 'ps10_solar_power_tower':
      input = ps10_solar_power_tower;
      break;
    case 'linear_fresnel_reflectors':
      input = linear_fresnel_reflectors;
      break;
    case 'linear_fresnel_reflectors_two_absorbers':
      input = linear_fresnel_reflectors_two_absorbers;
      break;
    case 'effect_absorber_pipe_height':
      input = effect_absorber_pipe_height;
      break;
    case 'effect_azimuth_fresnel_reflector':
      input = effect_azimuth_fresnel_reflector;
      break;
    case 'cosine_efficiency_heliostats':
      input = cosine_efficiency_heliostats;
      break;
    case 'shadowing_blocking_heliostats':
      input = shadowing_blocking_heliostats;
      break;
    case 'effect_solar_power_tower_height':
      input = effect_solar_power_tower_height;
      break;
    case 'solar_power_tower':
      input = solar_power_tower;
      break;
    case 'solar_updraft_tower':
      input = solar_updraft_tower;
      break;
    case 'solar_updraft_tower_city':
      input = solar_updraft_tower_city;
      break;
    case 'cape_cod_with_shed_dormer':
      input = cape_cod_with_shed_dormer;
      break;
    case 'mansard_roof_with_dormers':
      input = mansard_roof_with_dormers;
      break;
    case 't_shaped_house':
      input = t_shaped_house;
      break;
    case 'all_roof_types':
      input = all_roof_types;
      break;
    case 'a_frame_house':
      input = a_frame_house;
      break;
    case 'dutch_gable_roof':
      input = dutch_gable_roof;
      break;
    case 'combination_roof_vs_bonnet_roof':
      input = combination_roof_vs_bonnet_roof;
      break;
    case 'butterfly_roof_house':
      input = butterfly_roof_house;
      break;
    case 'gable_roof_vs_hip_roof':
      input = gable_roof_vs_hip_roof;
      break;
    case 'gable_and_valley_roof':
      input = gable_and_valley_roof;
      break;
    case 'clerestory_roof':
      input = clerestory_roof;
      break;
    case 'monitor_roof':
      input = monitor_roof;
      break;
    case 'colonial_vs_saltbox':
      input = colonial_vs_saltbox;
      break;
    case 'gambrel_roof_vs_mansard_roof':
      input = gambrel_roof_vs_mansard_roof;
      break;
    case 'colonial_house':
      input = colonial_house;
      break;
    case 'dutch_colonial_house':
      input = dutch_colonial_house;
      break;
    case 'cape_cod_with_garage':
      input = cape_cod_with_garage;
      break;
    case 'greenhouse':
      input = greenhouse;
      break;
    case 'solarium':
      input = solarium;
      break;
    case 'pavilion':
      input = pavilion;
      break;
    case 'octagonal_pagoda':
      input = octagonal_pagoda;
      break;
    case 'ocean_front':
      input = ocean_front;
      break;
    case 'mosque_01':
      input = mosque_01;
      break;
    case 'church_01':
      input = church_01;
      break;
    case 'cathedral_01':
      input = cathedral_01;
      break;
    case 'cathedral_02':
      input = cathedral_02;
      break;
    case 'adobe_taos_house':
      input = adobe_taos_house;
      break;
    case 'egyptian_pyramids':
      input = egyptian_pyramids;
      break;
    case 'mayan_pyramid':
      input = mayan_pyramid;
      break;
    case 'si_o_se_pol':
      input = si_o_se_pol;
      break;
    case 'barn_house':
      input = barn_house;
      break;
    case 'bonnet_house':
      input = bonnet_house;
      break;
    case 'modern_house_01':
      input = modern_house_01;
      break;
    case 'solar_radiation_predicted_vs_measured':
      input = solar_radiation_predicted_vs_measured;
      break;
    case 'bestest_case_600':
      input = bestest_case_600;
      break;
    case 'bestest_case_610':
      input = bestest_case_610;
      break;
    case 'bestest_case_620':
      input = bestest_case_620;
      break;
    case 'bestest_case_630':
      input = bestest_case_630;
      break;
    case 'tucson_sundt_station':
      input = tucson_sundt_station;
      break;
    case 'ai_tilt_angle_one_row':
      input = ai_tilt_angle_one_row;
      break;
    case 'ai_tilt_angles_multiple_rows':
      input = ai_tilt_angles_multiple_rows;
      break;
    case 'ai_solar_farm_design':
      input = ai_solar_farm_design;
      break;
    case 'ai_solar_farm_design_block':
      input = ai_solar_farm_design_block;
      break;
    case 'ai_fitchburg_solar_farm':
      input = ai_fitchburg_solar_farm;
      break;
  }
  return input;
};
