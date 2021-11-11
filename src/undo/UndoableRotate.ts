/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableRotate extends Undoable {
  oldRotation: number[];
  newRotation: number[];
  rotatedElement: ElementModel;
}
