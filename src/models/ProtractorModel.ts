import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';
import { RulerEndPoint, RulerSnappedHandle } from './RulerModel';

export interface ProtractorModel extends ElementModel {
  startArmEndPoint: RulerEndPoint;
  endArmEndPoint: RulerEndPoint;
  centerSnappedHandle?: RulerSnappedHandle;
  tickMarkColor?: string;
}
