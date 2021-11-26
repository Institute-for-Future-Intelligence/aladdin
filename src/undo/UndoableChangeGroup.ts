/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture } from '../types';

export interface UndoableChangeGroup extends Undoable {
  // old values might be different, so we store their IDs and values in a map
  oldValues: Map<string, string | number | string[] | CuboidTexture[]>;
  // but there is only one new value, so no need to use a map.
  newValue: string | number | string[] | CuboidTexture[];
  groupId: string;
  normal?: number[]; // if normal is not needed, set it to undefined
}
