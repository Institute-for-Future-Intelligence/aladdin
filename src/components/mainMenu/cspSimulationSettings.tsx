/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';
import { EnergyModelingType } from '../../types';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';
import { SubMenu } from '@szhsin/react-menu';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';

const CspSimulationSettings = () => {
  const lang = useLanguage();

  return (
    <SubMenu label={i18n.t('menu.AnalysisOptions', lang)}>
      {/* simulation sampling frequency */}
      <SamplingFrequencySelect type={EnergyModelingType.CSP} />

      {/* simulation sampling days */}
      <SimulationSamplingDaysSelect type={EnergyModelingType.CSP} />

      {/* simulation grid cell size */}
      <EnergyGridCellSizeInput type={EnergyModelingType.CSP} />
    </SubMenu>
  );
};

export default CspSimulationSettings;
