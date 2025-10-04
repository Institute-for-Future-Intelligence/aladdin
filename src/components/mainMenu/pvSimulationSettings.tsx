/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import { Discretization, EnergyModelingType } from 'src/types';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';
import { SolarPanelDiscretizationSelect } from './solarPanelDiscretizationSelect';
import { SolarPanelNoAnimationSwitch } from './solarPanelNoAnimationSwitch';
import { SubMenu } from '@szhsin/react-menu';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import * as Selector from '../../stores/selector';

interface Props {
  hasMovingParts: boolean;
}

const PvSimulationSettings = ({ hasMovingParts }: Props) => {
  const lang = useLanguage();
  const discretization = useStore(Selector.world.discretization);

  return (
    <SubMenu label={i18n.t('menu.solarPanel.EnergyAnalysisOptions', lang)}>
      {/* solar panel simulation sampling frequency */}
      <SamplingFrequencySelect type={EnergyModelingType.PV} />

      {/* solar panel simulation sampling days */}
      <SimulationSamplingDaysSelect type={EnergyModelingType.PV} />

      {/* solar panel discretization */}
      <SolarPanelDiscretizationSelect />

      {/* solar panel simulation grid cell size */}
      {(!discretization || discretization === Discretization.APPROXIMATE) && (
        <EnergyGridCellSizeInput type={EnergyModelingType.PV} />
      )}

      {/* solar panel simulation no animation */}
      {!hasMovingParts && <SolarPanelNoAnimationSwitch />}
    </SubMenu>
  );
};

export default PvSimulationSettings;
