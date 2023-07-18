/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { DesignProblem } from '../types';
import i18n from '../i18n/i18n';

export class ProjectUtil {
  static getVariables(projectType: DesignProblem, visibleMap?: Map<string, boolean>): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: string[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push('rowWidth');
      if (!visibleMap || visibleMap.get('tiltAngle')) array.push('tiltAngle');
      if (!visibleMap || visibleMap.get('interRowSpacing')) array.push('interRowSpacing');
      if (!visibleMap || visibleMap.get('orientation')) array.push('orientation');
      if (!visibleMap || visibleMap.get('unitCost')) array.push('unitCost');
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push('sellingPrice');
      if (!visibleMap || visibleMap.get('panelCount')) array.push('panelCount');
      if (!visibleMap || visibleMap.get('yield')) array.push('yield');
      if (!visibleMap || visibleMap.get('profit')) array.push('profit');
      return array;
    }
    return [];
  }

  static getTitles(projectType: DesignProblem, lang: { lng: string }, visibleMap?: Map<string, boolean>): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: string[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push(i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang));
      if (!visibleMap || visibleMap.get('tiltAngle')) array.push(i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang));
      if (!visibleMap || visibleMap.get('interRowSpacing'))
        array.push(i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang));
      if (!visibleMap || visibleMap.get('orientation'))
        array.push(i18n.t('polygonMenu.SolarPanelArrayOrientation', lang));
      if (!visibleMap || visibleMap.get('unitCost')) array.push(i18n.t('economicsPanel.UnitCost', lang));
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push(i18n.t('economicsPanel.SellingPrice', lang));
      if (!visibleMap || visibleMap.get('panelCount'))
        array.push(i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang));
      if (!visibleMap || visibleMap.get('yield')) array.push(i18n.t('polygonMenu.SolarPanelArrayYield', lang));
      if (!visibleMap || visibleMap.get('profit')) array.push(i18n.t('polygonMenu.SolarPanelArrayProfit', lang));
      return array;
    }
    return [];
  }

  static getTypes(projectType: DesignProblem, visibleMap?: Map<string, boolean>): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: string[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push('number');
      if (!visibleMap || visibleMap.get('tiltAngle')) array.push('number');
      if (!visibleMap || visibleMap.get('interRowSpacing')) array.push('number');
      if (!visibleMap || visibleMap.get('orientation')) array.push('boolean');
      if (!visibleMap || visibleMap.get('unitCost')) array.push('number');
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push('number');
      if (!visibleMap || visibleMap.get('panelCount')) array.push('number');
      if (!visibleMap || visibleMap.get('yield')) array.push('number');
      if (!visibleMap || visibleMap.get('profit')) array.push('number');
      return array;
    }
    return [];
  }

  static getDigits(projectType: DesignProblem, visibleMap?: Map<string, boolean>): number[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: number[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push(0);
      if (!visibleMap || visibleMap.get('tiltAngle')) array.push(1);
      if (!visibleMap || visibleMap.get('interRowSpacing')) array.push(1);
      if (!visibleMap || visibleMap.get('orientation')) array.push(0);
      if (!visibleMap || visibleMap.get('unitCost')) array.push(2);
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push(2);
      if (!visibleMap || visibleMap.get('panelCount')) array.push(0);
      if (!visibleMap || visibleMap.get('yield')) array.push(1);
      if (!visibleMap || visibleMap.get('profit')) array.push(1);
      return array;
    }
    return [];
  }

  static getUnits(projectType: DesignProblem, lang: { lng: string }, visibleMap?: Map<string, boolean>): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const array: string[] = [];
      if (!visibleMap || visibleMap.get('rowWidth')) array.push(' ' + i18n.t('solarPanelMenu.Panels', lang));
      if (!visibleMap || visibleMap.get('tiltAngle')) array.push('°');
      if (!visibleMap || visibleMap.get('interRowSpacing')) array.push(' ' + i18n.t('word.MeterAbbreviation', lang));
      if (!visibleMap || visibleMap.get('orientation')) array.push('');
      if (!visibleMap || visibleMap.get('unitCost')) array.push('');
      if (!visibleMap || visibleMap.get('sellingPrice')) array.push('');
      if (!visibleMap || visibleMap.get('panelCount')) array.push('');
      if (!visibleMap || visibleMap.get('yield')) array.push(' MWh');
      if (!visibleMap || visibleMap.get('profit')) array.push('K');
      return array;
    }
    return [];
  }
}
