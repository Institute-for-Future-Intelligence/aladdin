/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector3 } from 'three';
import { Point2 } from '../models/Point2';

export interface UndoableResize extends Undoable {
  oldCx: number;
  oldCy: number;
  oldCz: number;
  newCx: number;
  newCy: number;
  newCz: number;

  oldLx: number;
  oldLy: number;
  oldLz: number;
  newLx: number;
  newLy: number;
  newLz: number;

  resizedElementId: string;

  oldChildrenPositionsMap: Map<string, Vector3>;
  newChildrenPositionsMap: Map<string, Vector3>;
  oldPolygonVerticesMap: Map<string, Point2[]>;
  newPolygonVerticesMap: Map<string, Point2[]>;

  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
}
