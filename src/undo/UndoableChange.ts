/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture } from '../types';
import { Point2 } from '../models/Point2';

export interface UndoableChange extends Undoable {
  oldValue: string | number | string[] | CuboidTexture[] | Point2[];
  newValue: string | number | string[] | CuboidTexture[] | Point2[];
  changedElementId: string;
  changedSideIndex: number;
}
