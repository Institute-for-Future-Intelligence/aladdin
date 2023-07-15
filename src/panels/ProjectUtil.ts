/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { DesignProblem } from '../types';
import i18n from '../i18n/i18n';
import { useStore } from '../stores/common';

export class ProjectUtil {
  static lang = { lng: useStore.getState().language };

  static SOLAR_PANEL_ARRAY_PROPS = {
    titles: [
      i18n.t('polygonMenu.SolarPanelArrayRowWidth', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayTiltAngle', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayInterRowSpacing', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayOrientation', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayPoleHeight', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayPanelCount', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayYield', ProjectUtil.lang),
      i18n.t('polygonMenu.SolarPanelArrayProfit', ProjectUtil.lang),
    ],
    variables: [
      'rowWidth',
      'tiltAngle',
      'interRowSpacing',
      'orientation',
      'poleHeight',
      'panelCount',
      'yield',
      'profit',
    ],
    types: ['number', 'number', 'number', 'boolean', 'number', 'number', 'number', 'number'],
    digits: [0, 1, 1, 0, 1, 0, 1, 1],
    units: [
      ' ' + i18n.t('solarPanelMenu.Panels', ProjectUtil.lang),
      '°',
      ' ' + i18n.t('word.MeterAbbreviation', ProjectUtil.lang),
      '',
      ' ' + i18n.t('word.MeterAbbreviation', ProjectUtil.lang),
      '',
      ' MWh',
      'K',
    ],
  };

  static getTitles(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return ProjectUtil.SOLAR_PANEL_ARRAY_PROPS.titles;
    return [];
  }

  static getVariables(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return ProjectUtil.SOLAR_PANEL_ARRAY_PROPS.variables;
    return [];
  }

  static getTypes(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return ProjectUtil.SOLAR_PANEL_ARRAY_PROPS.types;
    return [];
  }

  static getDigits(projectType: DesignProblem): number[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return ProjectUtil.SOLAR_PANEL_ARRAY_PROPS.digits;
    return [];
  }

  static getUnits(projectType: DesignProblem): string[] {
    if (projectType === DesignProblem.SOLAR_PANEL_ARRAY) return ProjectUtil.SOLAR_PANEL_ARRAY_PROPS.units;
    return [];
  }
}
