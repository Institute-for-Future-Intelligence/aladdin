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
  oldArchHeight?: number;
  newArchHeight?: number;
  oldPolygonTop?: number[];
  newPolygonTop?: number[];
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
  oldJoints: string[][];
  newJoints: string[][];
  oldPoint: number[][];
  newPoint: number[][];
  flippedWallSide: FlippedWallSide;
}

export interface UndoableResizeWallHeight extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldHeights: number[];
  newHeights: number[];
  oldSameBuildingWallsHeightMap: Map<string, number>;
  newSameBuildingWallsHeightMap: Map<string, number>;
}

export interface UndoableResizeRoofRise extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  oldRise: number;
  newRise: number;
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

export interface UnoableResizeGambrelRoofRidge extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  type: string;
  oldVal: number[];
  newVal: number[];
}

export interface UnoableResizeMansardRoofRidge extends Undoable {
  resizedElementId: string;
  resizedElementType: ObjectType;
  type: string;
  oldVal: number;
  newVal: number;
}

export interface UnoableResizeSolarPanelOnRoof extends Undoable {
  id: string;
  oldPos: number[];
  newPos: number[];
  oldDms: number[];
  newDms: number[];
  oldRot: number[];
  newRot: number[];
  oldNor: number[];
  newNor: number[];
}

export interface UndoableResizeSkylight extends Undoable {
  id: string;
  oldPosition: number[];
  newPosition: number[];
  oldDimension: number[];
  newDimension: number[];
  oldArchHeight?: number | null;
  newArchHeight?: number | null;
}

export interface UndoableResizeSkylightPolygonTop extends Undoable {
  id: string;
  oldPolygonTop: number[];
  newPolygonTop: number[];
}
