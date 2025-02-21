/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { ObjectType, Orientation, TrackerType } from '../types';
import { FoundationModel } from './FoundationModel';
import { SolarCollector } from './SolarCollector';

export interface SolarPanelModel extends SolarCollector {
  pvModelName: string;
  monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
  orientation: Orientation;
  trackerType: TrackerType;
  poleSpacing: number;
  parentType?: ObjectType;
  foundationModel?: FoundationModel;
  frameColor?: string;
  backsheetColor?: string;
  inverterEfficiency?: number;
  dcToAcRatio?: number;
  batteryStorageId?: string | null;
  version?: number; // version 1: change to ref solar panel.
}
