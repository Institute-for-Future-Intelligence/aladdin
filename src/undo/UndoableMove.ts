/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';
import { Vector3 } from 'three';

export interface UndoableMove extends Undoable {
  oldCx: number;
  oldCy: number;
  oldCz: number;
  newCx: number;
  newCy: number;
  newCz: number;
  oldNormal?: Vector3;
  newNormal?: Vector3;
  movedElement: ElementModel;
}
