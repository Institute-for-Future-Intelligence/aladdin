/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableLockAll extends Undoable {
  // old values might be different, so we store their IDs and values in a map
  oldValues: Map<string, boolean>;
  // but there is only one new value, so no need to use a map.
  newValue: boolean;
}
