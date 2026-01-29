/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { Design, DesignProblem, Orientation } from '../types';
import i18n from '../i18n/i18n';
import { Util } from '../Util';
import { useStore } from 'src/stores/common';

export class ProjectUtil {
  static localSelectParameter(selected: boolean, parameter: string) {
    useStore.getState().set((state) => {
      if (state.projectState.hiddenParameters) {
        if (selected) {
          if (state.projectState.hiddenParameters.includes(parameter)) {
            state.projectState.hiddenParameters.splice(state.projectState.hiddenParameters.indexOf(parameter), 1);
          }
        } else {
          if (!state.projectState.hiddenParameters.includes(parameter)) {
            state.projectState.hiddenParameters.push(parameter);
          }
        }
      }
    });
  }

  static getDefaultHiddenParameters(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return ['latitude', 'orientation', 'poleHeight'];
    }
    if (projectType === DesignProblem.BUILDING_DESIGN) {
      return ['heating', 'cooling', 'solar', 'net'];
    }
    return [];
  }

  static getVariables(projectType: DesignProblem, hidden: string[]): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: string[] = [];
      if (!hidden.includes('rowWidth')) a.push('rowWidth');
      if (!hidden.includes('tiltAngle')) a.push('tiltAngle');
      if (!hidden.includes('interRowSpacing')) a.push('interRowSpacing');
      if (!hidden.includes('latitude')) a.push('latitude');
      if (!hidden.includes('orientation')) a.push('orientation');
      if (!hidden.includes('poleHeight')) a.push('poleHeight');
      if (!hidden.includes('unitCost')) a.push('unitCost');
      if (!hidden.includes('sellingPrice')) a.push('sellingPrice');
      if (!hidden.includes('totalYearlyCost')) a.push('totalYearlyCost');
      if (!hidden.includes('totalYearlyYield')) a.push('totalYearlyYield');
      if (!hidden.includes('meanYearlyYield')) a.push('meanYearlyYield');
      if (!hidden.includes('yearlyProfit')) a.push('yearlyProfit');
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('floorArea')) a.push('floorArea');
      if (!hidden?.includes('volume')) a.push('volume');
      if (!hidden?.includes('surfaceArea')) a.push('surfaceArea');
      if (!hidden?.includes('windowToWallRatio')) a.push('windowToWallRatio');
      if (!hidden?.includes('height')) a.push('height');
      if (!hidden?.includes('buildingOrientation')) a.push('buildingOrientation');
      if (!hidden?.includes('heating')) a.push('heating');
      if (!hidden?.includes('cooling')) a.push('cooling');
      if (!hidden?.includes('solar')) a.push('solar');
      if (!hidden?.includes('net')) a.push('net');
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('heliostatLength')) a.push('heliostatLength');
      if (!hidden?.includes('heliostatWidth')) a.push('heliostatWidth');
      if (!hidden?.includes('heliostatCount')) a.push('heliostatCount');
      if (!hidden?.includes('towerHeight')) a.push('towerHeight');
      if (!hidden?.includes('packingDensity')) a.push('packingDensity');
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push('numberOfBuildings');
      if (!hidden?.includes('packingDensity')) a.push('packingDensity');
      if (!hidden?.includes('greenspaceRatio')) a.push('greenspaceRatio');
      if (!hidden?.includes('totalArea')) a.push('totalArea');
      if (!hidden?.includes('totalRoadLength')) a.push('totalRoadLength');
      return a;
    }
    return [];
  }

  static getTitles(projectType: DesignProblem, l: { lng: string }, hidden: string[]): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: string[] = [];
      if (!hidden.includes('rowWidth')) a.push(i18n.t('polygonMenu.SolarPanelArrayRowWidth', l));
      if (!hidden.includes('tiltAngle')) a.push(i18n.t('polygonMenu.SolarPanelArrayTiltAngle', l));
      if (!hidden.includes('interRowSpacing')) a.push(i18n.t('polygonMenu.SolarPanelArrayRowSpacing', l));
      if (!hidden.includes('latitude')) a.push(i18n.t('word.Latitude', l));
      if (!hidden.includes('orientation')) a.push(i18n.t('polygonMenu.SolarPanelArrayOrientation', l));
      if (!hidden.includes('poleHeight')) a.push(i18n.t('polygonMenu.SolarPanelArrayPoleHeight', l));
      if (!hidden.includes('unitCost')) a.push(i18n.t('economicsPanel.UnitCost', l));
      if (!hidden.includes('sellingPrice')) a.push(i18n.t('economicsPanel.SellingPrice', l));
      if (!hidden.includes('totalYearlyCost')) a.push(i18n.t('polygonMenu.SolarPanelArrayTotalYearlyCost', l));
      if (!hidden.includes('totalYearlyYield')) a.push(i18n.t('polygonMenu.SolarPanelArrayTotalYearlyYield', l));
      if (!hidden.includes('meanYearlyYield')) a.push(i18n.t('polygonMenu.SolarPanelArrayMeanYearlyYield', l));
      if (!hidden.includes('yearlyProfit')) a.push(i18n.t('polygonMenu.SolarPanelArrayYearlyProfit', l));
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('floorArea')) a.push(i18n.t('solutionSpace.FloorArea', l));
      if (!hidden?.includes('volume')) a.push(i18n.t('solutionSpace.Volume', l));
      if (!hidden?.includes('surfaceArea')) a.push(i18n.t('solutionSpace.SurfaceArea', l));
      if (!hidden?.includes('windowToWallRatio')) a.push(i18n.t('solutionSpace.WindowToWallRatio', l));
      if (!hidden?.includes('height')) a.push(i18n.t('word.Height', l));
      if (!hidden?.includes('buildingOrientation')) a.push(i18n.t('solutionSpace.BuildingOrientation', l));
      if (!hidden?.includes('heating')) a.push(i18n.t('solutionSpace.Heating', l));
      if (!hidden?.includes('cooling')) a.push(i18n.t('solutionSpace.Cooling', l));
      if (!hidden?.includes('solar')) a.push(i18n.t('solutionSpace.Solar', l));
      if (!hidden?.includes('net')) a.push(i18n.t('solutionSpace.Net', l));
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('heliostatLength')) a.push(i18n.t('solutionSpace.HeliostatLength', l));
      if (!hidden?.includes('heliostatWidth')) a.push(i18n.t('solutionSpace.HeliostatWidth', l));
      if (!hidden?.includes('heliostatCount')) a.push(i18n.t('solutionSpace.heliostatCount', l));
      if (!hidden?.includes('towerHeight')) a.push(i18n.t('solutionSpace.TowerHeight', l));
      if (!hidden?.includes('packingDensity')) a.push(i18n.t('solutionSpace.PackingDensity', l));
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push(i18n.t('solutionSpace.NumberOfBuildings', l));
      if (!hidden?.includes('packingDensity')) a.push(i18n.t('solutionSpace.PackingDensity', l));
      if (!hidden?.includes('greenspaceRatio')) a.push(i18n.t('solutionSpace.GreenspaceRatio', l));
      if (!hidden?.includes('totalArea')) a.push(i18n.t('solutionSpace.TotalArea', l));
      if (!hidden?.includes('totalRoadLength')) a.push(i18n.t('solutionSpace.TotalRoadLength', l));
      return a;
    }
    return [];
  }

  static getTypes(projectType: DesignProblem, hidden: string[]): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: string[] = [];
      if (!hidden.includes('rowWidth')) a.push('number');
      if (!hidden.includes('tiltAngle')) a.push('number');
      if (!hidden.includes('interRowSpacing')) a.push('number');
      if (!hidden.includes('latitude')) a.push('number');
      if (!hidden.includes('orientation')) a.push('boolean');
      if (!hidden.includes('poleHeight')) a.push('number');
      if (!hidden.includes('unitCost')) a.push('number');
      if (!hidden.includes('sellingPrice')) a.push('number');
      if (!hidden.includes('totalYearlyCost')) a.push('number');
      if (!hidden.includes('totalYearlyYield')) a.push('number');
      if (!hidden.includes('meanYearlyYield')) a.push('number');
      if (!hidden.includes('yearlyProfit')) a.push('number');
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('floorArea')) a.push('number');
      if (!hidden?.includes('volume')) a.push('number');
      if (!hidden?.includes('surfaceArea')) a.push('number');
      if (!hidden?.includes('windowToWallRatio')) a.push('number');
      if (!hidden?.includes('height')) a.push('number');
      if (!hidden?.includes('buildingOrientation')) a.push('number');
      if (!hidden?.includes('heating')) a.push('number');
      if (!hidden?.includes('cooling')) a.push('number');
      if (!hidden?.includes('solar')) a.push('number');
      if (!hidden?.includes('net')) a.push('number');
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('heliostatLength')) a.push('number');
      if (!hidden?.includes('heliostatWidth')) a.push('number');
      if (!hidden?.includes('heliostatCount')) a.push('number');
      if (!hidden?.includes('towerHeight')) a.push('number');
      if (!hidden?.includes('packingDensity')) a.push('number');
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push('number');
      if (!hidden?.includes('packingDensity')) a.push('number');
      if (!hidden?.includes('greenspaceRatio')) a.push('number');
      if (!hidden?.includes('totalArea')) a.push('number');
      if (!hidden?.includes('totalRoadLength')) a.push('number');
      return a;
    }
    return [];
  }

  static getDigits(projectType: DesignProblem, hidden: string[]): number[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: number[] = [];
      if (!hidden.includes('rowWidth')) a.push(0);
      if (!hidden.includes('tiltAngle')) a.push(1);
      if (!hidden.includes('interRowSpacing')) a.push(1);
      if (!hidden.includes('latitude')) a.push(1);
      if (!hidden.includes('orientation')) a.push(0);
      if (!hidden.includes('poleHeight')) a.push(1);
      if (!hidden.includes('unitCost')) a.push(2);
      if (!hidden.includes('sellingPrice')) a.push(2);
      if (!hidden.includes('totalYearlyCost')) a.push(1);
      if (!hidden.includes('totalYearlyYield')) a.push(1);
      if (!hidden.includes('meanYearlyYield')) a.push(1);
      if (!hidden.includes('yearlyProfit')) a.push(3);
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: number[] = [];
      if (!hidden?.includes('floorArea')) a.push(1);
      if (!hidden?.includes('volume')) a.push(1);
      if (!hidden?.includes('surfaceArea')) a.push(1);
      if (!hidden?.includes('windowToWallRatio')) a.push(2);
      if (!hidden?.includes('height')) a.push(1);
      if (!hidden?.includes('buildingOrientation')) a.push(1);
      if (!hidden?.includes('heating')) a.push(1);
      if (!hidden?.includes('cooling')) a.push(1);
      if (!hidden?.includes('solar')) a.push(1);
      if (!hidden?.includes('net')) a.push(1);
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: number[] = [];
      if (!hidden?.includes('heliostatLength')) a.push(1);
      if (!hidden?.includes('heliostatWidth')) a.push(1);
      if (!hidden?.includes('heliostatCount')) a.push(0);
      if (!hidden?.includes('towerHeight')) a.push(1);
      if (!hidden?.includes('packingDensity')) a.push(0);
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: number[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push(0);
      if (!hidden?.includes('packingDensity')) a.push(0);
      if (!hidden?.includes('greenspaceRatio')) a.push(0);
      if (!hidden?.includes('totalArea')) a.push(2);
      if (!hidden?.includes('totalRoadLength')) a.push(2);
      return a;
    }
    return [];
  }

  static getTickIntegers(projectType: DesignProblem, hidden: string[]): boolean[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: boolean[] = [];
      if (!hidden.includes('rowWidth')) a.push(true);
      if (!hidden.includes('tiltAngle')) a.push(false);
      if (!hidden.includes('interRowSpacing')) a.push(false);
      if (!hidden.includes('latitude')) a.push(false);
      if (!hidden.includes('orientation')) a.push(true);
      if (!hidden.includes('poleHeight')) a.push(false);
      if (!hidden.includes('unitCost')) a.push(false);
      if (!hidden.includes('sellingPrice')) a.push(false);
      if (!hidden.includes('totalYearlyCost')) a.push(false);
      if (!hidden.includes('totalYearlyYield')) a.push(false);
      if (!hidden.includes('meanYearlyYield')) a.push(false);
      if (!hidden.includes('yearlyProfit')) a.push(false);
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: boolean[] = [];
      if (!hidden?.includes('floorArea')) a.push(false);
      if (!hidden?.includes('volume')) a.push(false);
      if (!hidden?.includes('surfaceArea')) a.push(false);
      if (!hidden?.includes('windowToWallRatio')) a.push(false);
      if (!hidden?.includes('height')) a.push(false);
      if (!hidden?.includes('buildingOrientation')) a.push(false);
      if (!hidden?.includes('heating')) a.push(false);
      if (!hidden?.includes('cooling')) a.push(false);
      if (!hidden?.includes('solar')) a.push(false);
      if (!hidden?.includes('net')) a.push(false);
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: boolean[] = [];
      if (!hidden?.includes('heliostatLength')) a.push(false);
      if (!hidden?.includes('heliostatWidth')) a.push(false);
      if (!hidden?.includes('heliostatCount')) a.push(false);
      if (!hidden?.includes('towerHeight')) a.push(false);
      if (!hidden?.includes('packingDensity')) a.push(false);
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: boolean[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push(true);
      if (!hidden?.includes('packingDensity')) a.push(false);
      if (!hidden?.includes('greenspaceRatio')) a.push(false);
      if (!hidden?.includes('totalArea')) a.push(false);
      if (!hidden?.includes('totalRoadLength')) a.push(false);
      return a;
    }
    return [];
  }

  static getUnits(projectType: DesignProblem, l: { lng: string }, hidden: string[]): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: string[] = [];
      if (!hidden.includes('rowWidth')) a.push(' ' + i18n.t('solarPanelMenu.Panels', l));
      if (!hidden.includes('tiltAngle')) a.push('°');
      if (!hidden.includes('interRowSpacing')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden.includes('latitude')) a.push('°');
      if (!hidden.includes('orientation')) a.push('');
      if (!hidden.includes('poleHeight')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden.includes('unitCost')) a.push('');
      if (!hidden.includes('sellingPrice')) a.push('');
      if (!hidden.includes('totalYearlyCost')) a.push('K');
      if (!hidden.includes('totalYearlyYield')) a.push(' MWh');
      if (!hidden.includes('meanYearlyYield')) a.push(' kWh');
      if (!hidden.includes('yearlyProfit')) a.push('K');
      return a;
    } else if (projectType === DesignProblem.BUILDING_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('floorArea')) a.push(' m²');
      if (!hidden?.includes('volume')) a.push(' m³');
      if (!hidden?.includes('surfaceArea')) a.push(' m²');
      if (!hidden?.includes('windowToWallRatio')) a.push('');
      if (!hidden?.includes('height')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden?.includes('buildingOrientation')) a.push('°');
      if (!hidden?.includes('heating')) a.push('kWh');
      if (!hidden?.includes('cooling')) a.push('kWh');
      if (!hidden?.includes('solar')) a.push('kWh');
      if (!hidden?.includes('net')) a.push('kWh');
      return a;
    } else if (projectType === DesignProblem.SOLAR_POWER_TOWER_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('heliostatLength')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden?.includes('heliostatWidth')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden?.includes('heliostatCount')) a.push('');
      if (!hidden?.includes('towerHeight')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden?.includes('packingDensity')) a.push('%');
      return a;
    } else if (projectType === DesignProblem.URBAN_DESIGN) {
      const a: string[] = [];
      if (!hidden?.includes('numberOfBuildings')) a.push('');
      if (!hidden?.includes('packingDensity')) a.push('%');
      if (!hidden?.includes('greenspaceRatio')) a.push('%');
      if (!hidden?.includes('totalArea')) a.push(' km²');
      if (!hidden?.includes('totalRoadLength')) a.push(' km');
      return a;
    }
    return [];
  }

  static getUnit(variable: string, l: { lng: string }): string {
    if (variable === 'tiltAngle' || variable === 'latitude') return '°';
    if (variable === 'totalYearlyYield') return 'MWh';
    if (variable === 'meanYearlyYield') return 'kWh';
    if (variable === 'totalYearlyCost') return 'K';
    if (variable === 'yearlyProfit') return 'K';
    if (variable === 'buildingOrientation') return '°';
    if (variable === 'volume') return 'm³';
    if (variable === 'floorArea') return 'm²';
    if (variable === 'surfaceArea') return 'm²';
    if (variable === 'totalRoadLength') return 'km';
    if (variable === 'totalArea') return 'km²';
    if (variable === 'heating') return 'kWh';
    if (variable === 'cooling') return 'kWh';
    if (variable === 'solar') return 'kWh';
    if (variable === 'net') return 'kWh';
    switch (variable) {
      case 'interRowSpacing':
      case 'poleHeight':
      case 'height':
      case 'heliostatLength':
      case 'heliostatWidth':
      case 'towerHeight':
      case 'packingDensity':
      case 'greenspaceRatio':
        return '%';
    }
    return '';
  }

  static setScatterData(name: string, axis: 'x' | 'y', datum: { x: number; y: number }, design: Design) {
    switch (name) {
      case 'heating':
        datum[axis] = design.heating;
        break;
      case 'cooling':
        datum[axis] = design.cooling;
        break;
      case 'solar':
        datum[axis] = design.solar;
        break;
      case 'net':
        datum[axis] = design.net;
        break;
      case 'floorArea':
        datum[axis] = design.floorArea;
        break;
      case 'volume':
        datum[axis] = design.volume;
        break;
      case 'surfaceArea':
        datum[axis] = design.surfaceArea;
        break;
      case 'windowToWallRatio':
        datum[axis] = design.windowToWallRatio;
        break;
      case 'height':
        datum[axis] = design.height;
        break;
      case 'buildingOrientation':
        datum[axis] = design.buildingOrientation;
        break;
      case 'rowWidth':
        datum[axis] = design.rowsPerRack;
        break;
      case 'tiltAngle':
        datum[axis] = Util.toDegrees(design.tiltAngle);
        break;
      case 'interRowSpacing':
        datum[axis] = design.interRowSpacing;
        break;
      case 'latitude':
        datum[axis] = design.latitude;
        break;
      case 'orientation':
        datum[axis] = design.orientation === Orientation.landscape ? 0 : 1;
        break;
      case 'poleHeight':
        datum[axis] = design.poleHeight;
        break;
      case 'unitCost':
        datum[axis] = design.unitCost;
        break;
      case 'sellingPrice':
        datum[axis] = design.sellingPrice;
        break;
      case 'totalYearlyCost':
        datum[axis] = Util.calculateCost(design);
        break;
      case 'totalYearlyYield':
        datum[axis] = design.yearlyYield * 0.001;
        break;
      case 'meanYearlyYield':
        datum[axis] = design.yearlyYield / design.panelCount;
        break;
      case 'yearlyProfit':
        datum[axis] = Util.calculateProfit(design);
        break;
      case 'heliostatLength':
        datum[axis] = design.heliostatLength;
        break;
      case 'heliostatWidth':
        datum[axis] = design.heliostatWidth;
        break;
      case 'heliostatCount':
        datum[axis] = design.heliostatCount;
        break;
      case 'towerHeight':
        datum[axis] = design.towerHeight;
        break;
      case 'packingDensity':
        datum[axis] = design.packingDensity;
        break;
      case 'numberOfBuildings':
        datum[axis] = design.numberOfBuildings;
        break;
      case 'greenspaceRatio':
        datum[axis] = design.greenspaceRatio;
        break;
      case 'totalArea':
        datum[axis] = design.totalArea;
        break;
      case 'totalRoadLength':
        datum[axis] = design.totalRoadLength;
        break;
    }
  }
}
