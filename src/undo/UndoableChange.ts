/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableChange extends Undoable {
  oldValue: string | number;
  newValue: string | number;
}
