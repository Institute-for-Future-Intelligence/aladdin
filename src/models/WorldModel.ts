/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';
import { GroundModel } from './GroundModel';
import { Discretization } from '../types';

export interface WorldModel {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  cameraPosition: Vector3;
  panCenter: Vector3;
  ground: GroundModel;

  timesPerHour: number;
  solarPanelGridCellSize: number;
  discretization: Discretization;
}
