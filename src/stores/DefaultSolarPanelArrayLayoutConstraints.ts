/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';

export class DefaultSolarPanelArrayLayoutConstraints implements SolarPanelArrayLayoutConstraints {
  minimumRowsPerRack: number;
  maximumRowsPerRack: number;

  constructor() {
    this.minimumRowsPerRack = 1;
    this.maximumRowsPerRack = 6;
  }
}
