/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutParams } from './SolarPanelArrayLayoutParams';
import { Orientation, RowAxis } from '../types';
import { immerable } from 'immer';

export class DefaultSolarPanelArrayLayoutParams implements SolarPanelArrayLayoutParams {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  pvModelName: string;
  rowAxis: RowAxis;
  orientation: Orientation;
  tiltAngle: number;
  rowsPerRack: number;
  interRowSpacing: number;
  poleHeight: number;
  poleSpacing: number;
  margin?: number;

  constructor() {
    this.pvModelName = 'CS6X-355P-FG';
    this.rowAxis = RowAxis.leftRight;
    this.orientation = Orientation.landscape;
    this.tiltAngle = 0;
    this.rowsPerRack = 1;
    this.interRowSpacing = 2;
    this.poleHeight = 1;
    this.poleSpacing = 3;
  }
}
