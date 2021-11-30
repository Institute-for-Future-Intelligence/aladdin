/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector3 } from 'three';

export interface UndoableResetView extends Undoable {
  oldCameraPosition: Vector3;
  oldPanCenter: Vector3;
}
