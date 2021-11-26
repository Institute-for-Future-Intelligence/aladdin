/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture } from '../types';

export interface UndoableChange extends Undoable {
  oldValue: string | number | string[] | CuboidTexture[];
  newValue: string | number | string[] | CuboidTexture[];
}
