/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { RoofTexture } from 'src/types';
import { ElementModel } from './ElementModel';

export interface RoofModel extends ElementModel {
  wallsId: string[];
  roofType: RoofType;
  textureType: RoofTexture;
  overhang: number;
  thickness: number;
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
  topRidgeLeftPoint: number[];
  topRidgeRightPoint: number[];
  frontRidgeLeftPoint: number[];
  frontRidgeRightPoint: number[];
  backRidgeLeftPoint: number[];
  backRidgeRightPoint: number[];
}

export interface MansardRoofModel extends RoofModel {
  frontRidge: number;
  backRidge: number;
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
