/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';

export interface RoofModel extends ElementModel {
  wallsId: string[];
  roofType: RoofType;
  textureType: RoofTexture;
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

export enum RoofTexture {
  Default = 'Roof Texture Default',
  Texture01 = 'Roof Texture #1',
  Texture02 = 'Roof Texture #2',
  Texture03 = 'Roof Texture #3',
  Texture04 = 'Roof Texture #4',
  Texture05 = 'Roof Texture #5',
  Texture06 = 'Roof Texture #6',
  Texture07 = 'Roof Texture #7',
  NoTexture = 'No Roof Texture',
}
