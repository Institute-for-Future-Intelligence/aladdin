/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Scope } from '../types';

export interface UndoableChangeGroup extends Undoable {
  oldValues: Map<string, string | number>; // old values might be different, so we store their IDs and values in a map
  newValue: string | number; // but there is only one new value, so no need to use a map.
  scope?: Scope;
}
