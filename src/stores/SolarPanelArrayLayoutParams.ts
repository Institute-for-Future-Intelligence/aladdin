/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Orientation, RowAxis } from '../types';

export interface SolarPanelArrayLayoutParams {
  pvModelName: string;
  rowAxis: RowAxis;
  orientation: Orientation;
  tiltAngle: number;
  rowWidth: number;
  interRowSpacing: number;
  poleHeight: number;
  poleSpacing: number;
}
