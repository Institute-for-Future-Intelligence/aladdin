/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { DesignProblem } from '../types';
import i18n from '../i18n/i18n';

export class ProjectUtil {
  static getTitles(projectType: DesignProblem, lang: { lng: string }): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return [
        i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang),
        i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang),
        i18n.t('polygonMenu.SolarPanelArrayRowSpacing', lang),
        i18n.t('polygonMenu.SolarPanelArrayOrientation', lang),
        i18n.t('economicsPanel.UnitCost', lang),
        i18n.t('economicsPanel.SellingPrice', lang),
        i18n.t('polygonMenu.SolarPanelArrayPanelCount', lang),
        i18n.t('polygonMenu.SolarPanelArrayYield', lang),
        i18n.t('polygonMenu.SolarPanelArrayProfit', lang),
      ];
    }
    return [];
  }

  static getVariables(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return [
        'rowWidth',
        'tiltAngle',
        'interRowSpacing',
        'orientation',
        'unitCost',
        'sellingPrice',
        'panelCount',
        'yield',
        'profit',
      ];
    }
    return [];
  }

  static getTypes(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return ['number', 'number', 'number', 'boolean', 'number', 'number', 'number', 'number', 'number'];
    }
    return [];
  }

  static getDigits(projectType: DesignProblem): number[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return [0, 1, 1, 0, 2, 1, 0, 1, 1];
    return [];
  }

  static getUnits(projectType: DesignProblem, lang: { lng: string }): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) {
      return [
        ' ' + i18n.t('solarPanelMenu.Panels', lang),
        '°',
        ' ' + i18n.t('word.MeterAbbreviation', lang),
        '',
        '',
        '',
        '',
        ' MWh',
        'K',
      ];
    }
    return [];
  }
}
