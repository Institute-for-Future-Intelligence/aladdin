import { Vec2, Vector3 } from 'three';
import { ElementModel } from './ElementModel';

export interface RulerModel extends ElementModel {
  leftEndPoint: RulerEndPoint;
  rightEndPoint: RulerEndPoint;
  isVertical?: boolean;
}

export interface RulerEndPoint {
  position: number[];
  snappedHandle?: RulerSnappedHandle;
}

export type RulerSnappedHandle = { elementId: string; direction: number[] };

export type RulerSnapPoint = {
  elementId: string;
  position: Vector3;
  direction: Vector3;
};
