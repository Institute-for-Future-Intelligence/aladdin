/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutConstraints } from './SolarPanelArrayLayoutConstraints';
import { HALF_PI } from '../constants';
import { immerable } from 'immer';
import { Orientation, RowAxis } from '../types';

export class DefaultSolarPanelArrayLayoutConstraints implements SolarPanelArrayLayoutConstraints {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  minimumInterRowSpacing: number;
  maximumInterRowSpacing: number;
  minimumRowsPerRack: number;
  maximumRowsPerRack: number;
  minimumTiltAngle: number;
  maximumTiltAngle: number;
  poleHeight: number;
  poleSpacing: number;
  orientation: Orientation;
  pvModelName: string;
  rowAxis: RowAxis;
  margin?: number;

  constructor() {
    this.minimumInterRowSpacing = 2;
    this.maximumInterRowSpacing = 10;
    this.minimumRowsPerRack = 1;
    this.maximumRowsPerRack = 6;
    this.minimumTiltAngle = -HALF_PI;
    this.maximumTiltAngle = HALF_PI;
    this.poleHeight = 1;
    this.poleSpacing = 5;
    this.orientation = Orientation.landscape;
    this.pvModelName = 'CS6X-355P-FG';
    this.rowAxis = RowAxis.leftRight;
  }
}
