/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';

export class DefaultSolarPanelArrayLayoutConstraints implements SolarPanelArrayLayoutConstraints {
  minimumInterRowSpacing: number;
  maximumInterRowSpacing: number;
  minimumRowsPerRack: number;
  maximumRowsPerRack: number;

  constructor() {
    this.minimumInterRowSpacing = 3;
    this.maximumInterRowSpacing = 10;
    this.minimumRowsPerRack = 1;
    this.maximumRowsPerRack = 6;
  }
}
