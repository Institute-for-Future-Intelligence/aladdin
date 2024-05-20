/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';
import { EnergyModelingType } from '../../types';

export const buildingEnergySimulationSettingsSubmenu = () => {
  return [
    {
      key: 'building-energy-simulation-sampling-frequency',
      label: <SamplingFrequencySelect type={EnergyModelingType.BUILDING} />,
    },
    {
      key: 'building-energy-simulation-sampling-days',
      label: <SimulationSamplingDaysSelect type={EnergyModelingType.BUILDING} />,
    },
    {
      key: 'building-energy-simulation-grid-cell-size',
      label: <EnergyGridCellSizeInput type={EnergyModelingType.BUILDING} />,
    },
  ] as MenuProps['items'];
};
