/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Orientation, TrackerType } from '../types';

export interface SolarPanelModel extends ElementModel {
  pvModelName: string;
  relativeAzimuth: number; // in radian
  tiltAngle: number; // in radian
  monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
  orientation: Orientation;
  drawSunBeam: boolean;

  trackerType: TrackerType;
  referenceId: string;

  poleHeight: number;
  poleRadius: number;
  poleSpacing: number;
}
