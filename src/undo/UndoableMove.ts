/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector3 } from 'three';
import { ObjectType } from '../types';
import { FlippedWallSide } from './UndoableAdd';

export interface UndoableMove extends Undoable {
  oldCx: number;
  oldCy: number;
  oldCz: number;
  newCx: number;
  newCy: number;
  newCz: number;
  oldNormal?: Vector3;
  newNormal?: Vector3;
  movedElementId: string;
  movedElementType?: ObjectType;
  oldParentId?: string;
  newParentId?: string;
}

export interface UndoableMoveFoundationGroup extends Undoable {
  oldPositionMap: Map<string, number[]>;
  newPositionMap: Map<string, number[]>;
}

export interface UndoableMoveSolarPanelOnRoof extends Undoable {
  id: string;
  oldPos: number[];
  newPos: number[];
  oldRot: number[];
  newRot: number[];
  oldNor: number[];
  newNor: number[];
}

export interface UndoableMoveWall extends Undoable {
  id: string;
  oldPoints: number[][];
  newPoints: number[][];
  oldJoints: string[][];
  newJoints: string[][];
  oldAngle: number;
  newAngle: number;
  flippedWallSide: FlippedWallSide;
}
