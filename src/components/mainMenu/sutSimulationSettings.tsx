/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps } from 'antd';
import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';
import { EnergyModelingType } from '../../types';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';

export const sutSimulationSettings = () => {
  return [
    {
      key: `sut-simulation-sampling-frequency`,
      label: <SamplingFrequencySelect type={EnergyModelingType.SUT} />,
    },
    {
      key: `sut-simulation-sampling-days`,
      label: <SimulationSamplingDaysSelect type={EnergyModelingType.SUT} />,
    },
    {
      key: `sut-simulation-grid-cell-size`,
      label: <EnergyGridCellSizeInput type={EnergyModelingType.SUT} />,
    },
  ] as MenuProps['items'];
};
