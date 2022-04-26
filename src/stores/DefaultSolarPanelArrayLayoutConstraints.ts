/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';
import { HALF_PI } from '../constants';

export class DefaultSolarPanelArrayLayoutConstraints implements SolarPanelArrayLayoutConstraints {
  minimumInterRowSpacing: number;
  maximumInterRowSpacing: number;
  minimumRowsPerRack: number;
  maximumRowsPerRack: number;
  minimumTiltAngle: number;
  maximumTiltAngle: number;

  constructor() {
    this.minimumInterRowSpacing = 2;
    this.maximumInterRowSpacing = 10;
    this.minimumRowsPerRack = 1;
    this.maximumRowsPerRack = 6;
    this.minimumTiltAngle = -HALF_PI;
    this.maximumTiltAngle = HALF_PI;
  }
}
