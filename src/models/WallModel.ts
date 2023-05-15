/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { WallTexture } from 'src/types';

export interface WallModel extends ElementModel {
  // using ly as wall thickness
  relativeAngle: number;
  leftPoint: number[];
  rightPoint: number[];
  leftJoints: string[];
  rightJoints: string[];
  textureType: WallTexture;

  roofId?: string | null;
  leftRoofHeight?: number;
  rightRoofHeight?: number;
  centerRoofHeight?: number[]; // [x, h];
  centerLeftRoofHeight?: number[]; // [x, h];
  centerRightRoofHeight?: number[]; // [x, h];

  wallStructure?: WallStructure;
  structureSpacing?: number;
  structureWidth?: number;
  structureColor?: string;

  opacity?: number;
  rValue: number;
  volumetricHeatCapacity: number;

  fill: WallFill;
  leftUnfilledHeight: number;
  rightUnfilledHeight: number;
  leftTopPartialHeight: number;
  rightTopPartialHeight: number;

  eavesLength: number;

  parapet: ParapetArgs;

  // old property
  unfilledHeight?: number;
}

export interface ParapetArgs {
  display: boolean;
  color: string;
  textureType: WallTexture;
  parapetHeight: number;
  copingsWidth: number;
  copingsHeight: number;
}

export enum WallFill {
  Full = 'Full',
  Partial = 'Partial',
  Empty = 'Empty',
}

export enum WallStructure {
  Default = 'Default',
  Stud = 'Stud',
  Pillar = 'Pillar',
}
