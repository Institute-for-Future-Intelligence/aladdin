/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableZoomView extends Undoable {
  oldValue: number;
  newValue: number;
}
