/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector3 } from 'three';
import { Point2 } from '../models/Point2';
import { ObjectType } from '../types';

export interface UndoableSizeChange extends Undoable {
  oldSize: number;
  newSize: number;

  resizedElementId: string;
  resizedElementType: ObjectType;

  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
  oldChildrenVerticesMap?: Map<string, Point2[]>;
  newChildrenVerticesMap?: Map<string, Point2[]>;
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
}
