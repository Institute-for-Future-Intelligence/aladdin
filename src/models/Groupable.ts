import { ObjectType } from 'src/types';
import { ElementModel } from './ElementModel';

export interface Groupable {
  enableGroupMaster?: boolean;
}

export type GroupableModel = ElementModel & Groupable;

export function isGroupable(element: ElementModel) {
  return element.type === ObjectType.Foundation || element.type === ObjectType.Cuboid;
}
