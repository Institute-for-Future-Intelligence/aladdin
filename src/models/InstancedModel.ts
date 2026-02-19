import { ElementModel } from './ElementModel';

export interface InstancedModel extends ElementModel {}

export interface InstancedTree extends InstancedModel {
  treeType: 'park' | 'street';
}
