/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { HvacSystem } from 'src/models/HvacSystem';

export interface UndoableHvacSystem extends Undoable {
  foundationID: string;
  systemID?: string;
  oldValues: Map<string, HvacSystem>;
  newValue: HvacSystem;
}
