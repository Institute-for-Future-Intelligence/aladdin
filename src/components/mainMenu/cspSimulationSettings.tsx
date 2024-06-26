/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';
import { EnergyModelingType } from '../../types';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';

export const cspSimulationSettings = (name: string) => {
  return [
    {
      key: `${name}-simulation-sampling-frequency`,
      label: <SamplingFrequencySelect type={EnergyModelingType.CSP} />,
    },
    {
      key: `${name}-simulation-sampling-days`,
      label: <SimulationSamplingDaysSelect type={EnergyModelingType.CSP} />,
    },
    {
      key: `${name}-simulation-grid-cell-size`,
      label: <EnergyGridCellSizeInput type={EnergyModelingType.CSP} />,
    },
  ] as MenuProps['items'];
};
