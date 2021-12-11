/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableHorizontalMove extends Undoable {
  displacement: number;
  movedElementId: string;
}
