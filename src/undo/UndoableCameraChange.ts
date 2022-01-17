/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableCameraChange extends Undoable {
  oldCameraPosition: number[];
  oldPanCenter: number[];
  newCameraPosition: number[];
  newPanCenter: number[];
}
