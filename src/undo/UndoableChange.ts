/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import {
  CuboidTexture,
  LineStyle,
  ObjectType,
  Orientation,
  ParabolicDishStructureType,
  SolarStructure,
  TrackerType,
} from '../types';
import { Point2 } from '../models/Point2';
import { Vector3 } from 'three';
import { RulerSnappedHandle, RulerType } from 'src/models/RulerModel';

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
    | Orientation
    | TrackerType
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
    | Orientation
    | TrackerType
    | SolarStructure;
  changedElementId: string;
  changedElementType?: ObjectType;
  changedSideIndex?: number;
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
}

export interface UndoableChangeRuler extends Undoable {
  elementId: string;
  oldLeftPointPosition: number[];
  oldRightPointPosition: number[];
  oldLeftSnappedHandle?: RulerSnappedHandle;
  oldRightSnappedHandle?: RulerSnappedHandle;
  newLeftPointPosition: number[];
  newRightPointPosition: number[];
  newLeftSnappedHandle?: RulerSnappedHandle;
  newRightSnappedHandle?: RulerSnappedHandle;
  oldVerticalOffset: number;
  newVerticalOffset: number;
}

export interface UndoableChangeRulerType extends Undoable {
  id: string;
  oldType: RulerType;
  newType: RulerType;
  oldRightPoint: number[];
  newRightPoint: number[];
}

export interface UndoableChangeProtractor extends Undoable {
  id: string;
  oldStartPointPosition: number[];
  oldEndPointPosition: number[];
  oldStartSnappedHandle?: RulerSnappedHandle;
  oldEndSnappedHandle?: RulerSnappedHandle;
  oldCenterPosition: number[];
  oldCenterSnappedHandle?: RulerSnappedHandle;

  newStartPointPosition: number[];
  newEndPointPosition: number[];
  newStartSnappedHandle?: RulerSnappedHandle;
  newEndSnappedHandle?: RulerSnappedHandle;
  newCenterPosition: number[];
  newCenterSnappedHandle?: RulerSnappedHandle;
}
