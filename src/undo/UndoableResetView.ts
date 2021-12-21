/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableResetView extends Undoable {
  oldCameraPosition: number[];
  oldPanCenter: number[];
}
