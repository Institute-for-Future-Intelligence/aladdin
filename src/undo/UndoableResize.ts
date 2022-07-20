/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector2, Vector3 } from 'three';
import { Point2 } from '../models/Point2';
import { FlippedWallSide } from './UndoableAdd';
import { ObjectType } from '../types';

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
  resizedElementType: ObjectType;

  oldChildrenPositionsMap: Map<string, Vector3>;
  newChildrenPositionsMap: Map<string, Vector3>;
  oldPolygonVerticesMap: Map<string, Point2[]>;
  newPolygonVerticesMap: Map<string, Point2[]>;
  oldWallPointsMap: Map<string, Vector2[]>;
  newWallPointsMap: Map<string, Vector2[]>;

  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
}

export interface UndoableResizeElementOnWall extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldPosition: number[];
  newPosition: number[];
  oldDimension: number[];
  newDimension: number[];
}

export interface UndoableResizeWall extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldPosition: Vector3;
  newPosition: Vector3;
  oldDimension: Vector3;
  newDimension: Vector3;
  oldAngle: number;
  newAngle: number;
  oldJoints: string[];
  newJoints: string[];
  oldPoint: number[][];
  newPoint: number[][];
  flippedWallSide: FlippedWallSide;
}

export interface UndoableResizeRoofHeight extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldHeight: number;
  newHeight: number;
}

export interface UndoableResizeHipRoofRidge extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldLeftRidgeLength: number;
  oldRightRidgeLength: number;
  newLeftRidgeLength: number;
  newRightRidgeLength: number;
}

export interface UnoableResizeGableRoofRidge extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldLeft: number;
  oldRight: number;
  newLeft: number;
  newRight: number;
}

export interface UnoableResizeGambrelAndMansardRoofRidge extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  type: string;
  oldVal: number;
  newVal: number;
}
