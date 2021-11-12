/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableCheck extends Undoable {
  checked: boolean;
}
