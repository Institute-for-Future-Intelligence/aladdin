/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture, DoorTexture, RoofTexture, WallTexture } from '../types';
import { Vector3 } from 'three';

export interface UndoableChangeGroup extends Undoable {
  // old values might be different, so we store their IDs and values in a map
  oldValues: Map<
    string,
    boolean | string | number | string[] | CuboidTexture[] | WallTexture | RoofTexture | DoorTexture
  >;
  // but there is only one new value, so no need to use a map.
  newValue: boolean | string | number | string[] | CuboidTexture[] | WallTexture | RoofTexture;
  groupId: string;
  normal?: number[]; // if normal is not needed, set it to undefined
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
}
