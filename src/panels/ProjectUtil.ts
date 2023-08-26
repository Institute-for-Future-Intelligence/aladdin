/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Design, DesignProblem, Orientation } from '../types';
import i18n from '../i18n/i18n';
import { Util } from '../Util';

export class ProjectUtil {
  static getDefaultHiddenParameters(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return ['latitude', 'orientation', 'poleHeight'];
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
    }
    return [];
  }

  static getUnit(variable: string, l: { lng: string }): string {
    if (variable === 'tiltAngle' || variable === 'latitude') return '°';
    if (variable === 'interRowSpacing') return i18n.t('word.MeterAbbreviation', l);
    if (variable === 'poleHeight') return i18n.t('word.MeterAbbreviation', l);
    if (variable === 'totalYearlyYield') return 'MWh';
    if (variable === 'meanYearlyYield') return 'kWh';
    if (variable === 'totalYearlyCost') return 'K';
    if (variable === 'yearlyProfit') return 'K';
    return '';
  }

  static setScatterData(name: string, axis: 'x' | 'y', datum: { x: number; y: number }, design: Design) {
    switch (name) {
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
    }
  }
}
