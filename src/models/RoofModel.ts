/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { RoofTexture } from 'src/types';
import { ElementModel } from './ElementModel';

export interface RoofModel extends ElementModel {
  wallsId: string[];
  roofType: RoofType;
  roofStructure?: RoofStructure;
  textureType: RoofTexture;
  overhang: number;
  thickness: number;
  sideColor?: string;
  rafterSpacing?: number;
  rafterWidth?: number;
  rafterColor?: string;
  glassTint?: string;
  opacity?: number;
  rValue: number;
  volumetricHeatCapacity: number;
  rise: number;
  ceiling: boolean;
}

export interface PyramidRoofModel extends RoofModel {}
export interface GableRoofModel extends RoofModel {
  ridgeLeftPoint: number[];
  ridgeRightPoint: number[];
}
export interface HipRoofModel extends RoofModel {
  rightRidgeLength: number;
  leftRidgeLength: number;
}

export interface GambrelRoofModel extends RoofModel {
  // [x, h] from left side view
  topRidgePoint: number[];
  frontRidgePoint: number[]; // x >= 0
  backRidgePoint: number[]; // x <= 0
  // old files
  topRidgeLeftPoint?: number[];
  topRidgeRightPoint?: number[];
  frontRidgeLeftPoint?: number[];
  frontRidgeRightPoint?: number[];
  backRidgeLeftPoint?: number[];
  backRidgeRightPoint?: number[];
}

export interface MansardRoofModel extends RoofModel {
  ridgeWidth: number;
  // old files
  frontRidge?: number;
  backRidge?: number;
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export enum RoofType {
  Pyramid = 'Pyramid',
  Gable = 'Gable',
  Hip = 'Hip',
  Gambrel = 'Gambrel',
  Mansard = 'Mansard',
}

export enum RoofStructure {
  Default = 'Default',
  Rafter = 'Rafter',
  Glass = 'Glass',
}
