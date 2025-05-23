import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';

export interface RulerModel extends ElementModel {
  leftEndPoint: RulerEndPoint;
  rightEndPoint: RulerEndPoint;
  tickColor: string;
  rulerType: RulerType;
  verticalOffset: number;
}

export interface RulerEndPoint {
  position: number[];
  snappedHandle?: RulerSnappedHandle;
}

export enum RulerType {
  Horizontal = 'Horizontal',
  Vertical = 'Vertical',
  Arbitrary = 'Arbitrary',
}

export type RulerSnappedHandle = { elementId: string; direction: number[] };

export type RulerGroundSnapPoint = {
  elementId: string;
  position: Vector3;
  direction: Vector3;
};

export type RulerVerticalSnapPoint = {
  elementId: string;
  z: number;
};
