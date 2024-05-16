/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import ResidentialBuildingIcon from '../assets/map_residential_building.png';
import CommercialBuildingIcon from '../assets/map_commercial_building.png';
import SchoolBuildingIcon from '../assets/map_school_building.png';
import TouristAttractionIcon from '../assets/map_tourist_attraction.png';
import SolarPanelIcon from '../assets/map_solar_panel.png';
import ParabolicDishIcon from '../assets/map_parabolic_dish.png';
import ParabolicTroughIcon from '../assets/map_parabolic_trough.png';
import FresnelReflectorIcon from '../assets/map_fresnel_reflector.png';
import HeliostatIcon from '../assets/map_heliostat.png';
import UnderConstructionIcon from '../assets/map_under_construction.png';
import UnknownIcon from '../assets/map_marker.png';
import WindTurbineIcon from '../assets/map_wind_turbine.png';
import ColocationProjectsIcon from '../assets/map_colocation_projects.png';
import { ModelSite, ModelType } from '../types';

export const getIconUrl = (site: ModelSite) => {
  switch (site.type) {
    case ModelType.PHOTOVOLTAIC:
      return SolarPanelIcon;
    case ModelType.PARABOLIC_DISH:
      return ParabolicDishIcon;
    case ModelType.PARABOLIC_TROUGH:
      return ParabolicTroughIcon;
    case ModelType.FRESNEL_REFLECTOR:
      return FresnelReflectorIcon;
    case ModelType.SOLAR_POWER_TOWER:
      return HeliostatIcon;
    case ModelType.WIND_TURBINE:
      return WindTurbineIcon;
    case ModelType.COLOCATION_PROJECTS:
      return ColocationProjectsIcon;
    case ModelType.RESIDENTIAL_BUILDING:
      return ResidentialBuildingIcon;
    case ModelType.COMMERCIAL_BUILDING:
      return CommercialBuildingIcon;
    case ModelType.SCHOOL_BUILDING:
      return SchoolBuildingIcon;
    case ModelType.TOURIST_ATTRACTION:
      return TouristAttractionIcon;
    case ModelType.UNDER_CONSTRUCTION:
      return UnderConstructionIcon;
  }
  return UnknownIcon;
};
