/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Scope } from '../types';

export interface UndoableChange extends Undoable {
  oldValue: string | number;
  newValue: string | number;
  scope?: Scope;
}
