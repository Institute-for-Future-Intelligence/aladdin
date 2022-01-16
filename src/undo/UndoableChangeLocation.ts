/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableChangeLocation extends Undoable {
  oldLatitude: number;
  newLatitude: number;
  oldLongitude: number;
  newLongitude: number;
  oldAddress: string;
  newAddress: string;
}
