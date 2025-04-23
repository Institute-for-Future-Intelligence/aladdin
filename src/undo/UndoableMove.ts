/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector2, Vector3 } from 'three';
import { ObjectType } from '../types';
import { FlippedWallSide } from './UndoableAdd';
import { ElementModel } from 'src/models/ElementModel';
import { RulerModel } from 'src/models/RulerModel';

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
  oldFoundationId?: string;
  newFoundationId?: string;
  oldParentType: ObjectType;
  newParentType: ObjectType;
  oldRotation?: number[];
  newRotation?: number[];
}

export interface UndoableMoveFoundationGroup extends Undoable {
  oldPositionMap: Map<string, number[]>;
  newPositionMap: Map<string, number[]>;
}

export interface UndoableMoveElementOnRoof extends Undoable {
  id: string;
  oldParentId: string;
  newParentId: string;
  oldFoundationId: string | undefined;
  newFoundationId: string | undefined;
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
  autoDeletedElements: ElementModel[];
}

export interface UndoableMoveSkylight extends Undoable {
  id: string;
  oldPosition: number[];
  newPosition: number[];
  oldRotation: number[];
  newRotation: number[];
}

export interface UndoableMoveSelectedByKey extends Undoable {
  movedElementsDisplacementMap: Map<string, Vector2>;
  oldRuler?: RulerModel | null;
}

export interface UndoableMoveAllByKey extends Undoable {
  displacement: Vector2;
}
