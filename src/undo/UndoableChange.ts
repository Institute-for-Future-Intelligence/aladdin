/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture, LineStyle, ObjectType, ParabolicDishStructureType, SolarStructure } from '../types';
import { Point2 } from '../models/Point2';
import { Vector3 } from 'three';

export interface UndoableChange extends Undoable {
  oldValue:
    | boolean
    | string
    | number
    | string[]
    | number[]
    | CuboidTexture[]
    | Point2[]
    | LineStyle
    | ParabolicDishStructureType
    | SolarStructure;
  newValue:
    | boolean
    | string
    | number
    | string[]
    | number[]
    | CuboidTexture[]
    | Point2[]
    | LineStyle
    | ParabolicDishStructureType
    | SolarStructure;
  changedElementId?: string;
  changedElementType?: ObjectType;
  changedSideIndex?: number;
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
}
