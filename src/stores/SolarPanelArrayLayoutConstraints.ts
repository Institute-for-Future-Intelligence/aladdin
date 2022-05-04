/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Orientation, RowAxis } from '../types';

export interface SolarPanelArrayLayoutConstraints {
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
}
