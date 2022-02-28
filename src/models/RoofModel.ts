/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';

export interface RoofModel extends ElementModel {
  // points: Point2[];
  centerPoint: Point2;
  wallsId: string[];
  roofType: RoofType;
  texture: RoofTexture;
}

export interface PyramidRoofModel extends RoofModel {}
export interface GableRoofModel extends RoofModel {}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export enum RoofType {
  Pyramid = 'Pyramid',
  Gable = 'Gable',
}

export enum RoofTexture {
  Default = 'Roof Texture Default',
  Texture01 = 'Roof Texture #1',
  Texture02 = 'Roof Texture #2',
  Texture03 = 'Roof Texture #3',
  Texture04 = 'Roof Texture #4',
  Texture05 = 'Roof Texture #5',
  NoTexture = 'No Roof Texture',
}
