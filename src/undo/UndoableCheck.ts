/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ObjectType } from '../types';

export interface UndoableCheck extends Undoable {
  checked: boolean;
  selectedElementId?: string;
  selectedElementType?: ObjectType;
}

export interface UndoableCheckWindowShutter extends Undoable {
  selectedElementId: string;
  selectedElementType: ObjectType;
  oldShow: boolean[];
  newShow: boolean[];
}
