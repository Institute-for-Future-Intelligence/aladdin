/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector2, Vector3 } from 'three';
import { Point2 } from '../models/Point2';

export interface UndoableSizeGroupChange extends Undoable {
  // old values might be different, so we store their IDs and values in a map
  oldSizes: Map<string, number>;
  // but there is only one new value, so no need to use a map.
  newSize: number;

  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
  oldChildrenVerticesMap?: Map<string, Point2[]>;
  newChildrenVerticesMap?: Map<string, Point2[]>;
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
}
