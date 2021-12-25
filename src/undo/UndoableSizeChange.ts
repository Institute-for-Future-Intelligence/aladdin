/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector2 } from 'three';
import { Point2 } from '../models/Point2';

export interface UndoableSizeChange extends Undoable {
  oldSize: number;
  newSize: number;

  resizedElementId: string;

  oldChildrenPositionsMap?: Map<string, Vector2>;
  newChildrenPositionsMap?: Map<string, Vector2>;
  oldChildrenVerticesMap?: Map<string, Point2[]>;
  newChildrenVerticesMap?: Map<string, Point2[]>;
}
