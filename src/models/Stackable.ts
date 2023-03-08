import { ObjectType } from 'src/types';
import { ElementModel } from './ElementModel';

export interface Stackable {
  stackable?: boolean;
}

export type StackableModel = ElementModel & Stackable;

export function isStackableModel(element: ElementModel) {
  return element.type === ObjectType.Cuboid;
}
