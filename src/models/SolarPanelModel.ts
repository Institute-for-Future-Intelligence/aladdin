/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Orientation, TrackerType } from '../types';
import { SolarCollector } from './SolarCollector';

export interface SolarPanelModel extends SolarCollector {
  pvModelName: string;
  monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
  orientation: Orientation;
  trackerType: TrackerType;
  poleSpacing: number;
}
