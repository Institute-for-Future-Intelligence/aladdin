/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableRotate extends Undoable {
  oldRotation: number[];
  newRotation: number[];
  rotatedElementId: string;
}
