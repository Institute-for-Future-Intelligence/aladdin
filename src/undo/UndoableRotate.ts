/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ObjectType } from '../types';

export interface UndoableRotate extends Undoable {
  oldRotation: number[];
  newRotation: number[];
  rotatedElementId: string;
  rotatedElementType: ObjectType;
}
