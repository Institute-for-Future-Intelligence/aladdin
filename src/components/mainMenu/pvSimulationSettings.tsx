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

export const pvSimulationSettings = (hasMovingParts: boolean) => {
  const discretization = useStore.getState().world.discretization;

  const items: MenuProps['items'] = [
    {
      key: 'solar-panel-simulation-sampling-frequency',
      label: <SamplingFrequencySelect type={EnergyModelingType.PV} />,
    },
    {
      key: 'solar-panel-simulation-sampling-days',
      label: <SimulationSamplingDaysSelect type={EnergyModelingType.PV} />,
    },
    {
      key: 'solar-panel-discretization',
      label: <SolarPanelDiscretizationSelect />,
    },
  ];

  if (!discretization || discretization === Discretization.APPROXIMATE) {
    items.push({
      key: 'solar-panel-simulation-grid-cell-size',
      label: <EnergyGridCellSizeInput type={EnergyModelingType.PV} />,
    });
  }

  if (!hasMovingParts) {
    items.push({
      key: 'solar-panel-simulation-no-animation',
      label: <SolarPanelNoAnimationSwitch />,
    });
  }

  return items;
};
