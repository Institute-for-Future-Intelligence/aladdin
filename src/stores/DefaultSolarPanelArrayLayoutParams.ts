/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { SolarPanelArrayLayoutParams } from './SolarPanelArrayLayoutParams';
import { Orientation, RowAxis } from '../types';

export class DefaultSolarPanelArrayLayoutParams implements SolarPanelArrayLayoutParams {
  pvModelName: string;
  rowAxis: RowAxis;
  orientation: Orientation;
  tiltAngle: number;
  rowWidth: number;
  interRowSpacing: number;
  poleHeight: number;
  poleSpacing: number;

  constructor() {
    this.pvModelName = 'SPR-X21-335-BLK';
    this.rowAxis = RowAxis.zonal;
    this.orientation = Orientation.portrait;
    this.tiltAngle = 0;
    this.rowWidth = 1.05;
    this.interRowSpacing = 2 * this.rowWidth;
    this.poleHeight = 1;
    this.poleSpacing = 3;
  }
}
