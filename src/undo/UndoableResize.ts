/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableResize extends Undoable {
  oldCx: number;
  oldCy: number;
  oldCz: number;
  newCx: number;
  newCy: number;
  newCz: number;

  oldLx: number;
  oldLy: number;
  oldLz: number;
  newLx: number;
  newLy: number;
  newLz: number;

  resizedElement: ElementModel;
}
