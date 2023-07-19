/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { DesignProblem } from '../types';
import i18n from '../i18n/i18n';

export class ProjectUtil {
  static getVariables(projectType: DesignProblem, hidden: string[]): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      const a: string[] = [];
      if (!hidden.includes('rowWidth')) a.push('rowWidth');
      if (!hidden.includes('tiltAngle')) a.push('tiltAngle');
      if (!hidden.includes('interRowSpacing')) a.push('interRowSpacing');
      if (!hidden.includes('orientation')) a.push('orientation');
      if (!hidden.includes('poleHeight')) a.push('poleHeight');
      if (!hidden.includes('unitCost')) a.push('unitCost');
      if (!hidden.includes('sellingPrice')) a.push('sellingPrice');
      if (!hidden.includes('panelCount')) a.push('panelCount');
      if (!hidden.includes('yield')) a.push('yield');
      if (!hidden.includes('profit')) a.push('profit');
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
      if (!hidden.includes('orientation')) a.push(i18n.t('polygonMenu.SolarPanelArrayOrientation', l));
      if (!hidden.includes('poleHeight')) a.push(i18n.t('polygonMenu.SolarPanelArrayPoleHeight', l));
      if (!hidden.includes('unitCost')) a.push(i18n.t('economicsPanel.UnitCost', l));
      if (!hidden.includes('sellingPrice')) a.push(i18n.t('economicsPanel.SellingPrice', l));
      if (!hidden.includes('panelCount')) a.push(i18n.t('polygonMenu.SolarPanelArrayPanelCount', l));
      if (!hidden.includes('yield')) a.push(i18n.t('polygonMenu.SolarPanelArrayYield', l));
      if (!hidden.includes('profit')) a.push(i18n.t('polygonMenu.SolarPanelArrayProfit', l));
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
      if (!hidden.includes('orientation')) a.push('boolean');
      if (!hidden.includes('poleHeight')) a.push('number');
      if (!hidden.includes('unitCost')) a.push('number');
      if (!hidden.includes('sellingPrice')) a.push('number');
      if (!hidden.includes('panelCount')) a.push('number');
      if (!hidden.includes('yield')) a.push('number');
      if (!hidden.includes('profit')) a.push('number');
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
      if (!hidden.includes('orientation')) a.push(0);
      if (!hidden.includes('poleHeight')) a.push(1);
      if (!hidden.includes('unitCost')) a.push(2);
      if (!hidden.includes('sellingPrice')) a.push(2);
      if (!hidden.includes('panelCount')) a.push(0);
      if (!hidden.includes('yield')) a.push(1);
      if (!hidden.includes('profit')) a.push(1);
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
      if (!hidden.includes('orientation')) a.push('');
      if (!hidden.includes('poleHeight')) a.push(' ' + i18n.t('word.MeterAbbreviation', l));
      if (!hidden.includes('unitCost')) a.push('');
      if (!hidden.includes('sellingPrice')) a.push('');
      if (!hidden.includes('panelCount')) a.push('');
      if (!hidden.includes('yield')) a.push(' MWh');
      if (!hidden.includes('profit')) a.push('K');
      return a;
    }
    return [];
  }
}
