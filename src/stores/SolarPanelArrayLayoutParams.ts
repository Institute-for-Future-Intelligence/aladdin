/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Orientation, RowAxis } from '../types';

export interface SolarPanelArrayLayoutParams {
  pvModelName: string;
  rowAxis: RowAxis;
  orientation: Orientation;
  tiltAngle: number;
  rowsPerRack: number;
  interRowSpacing: number;
  poleHeight: number;
  poleSpacing: number;
  margin: number;
}
