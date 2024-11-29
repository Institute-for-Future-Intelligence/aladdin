/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { PvModel } from '../models/PvModel';

export interface UndoableCustomSolarPanelAction extends Undoable {
  pvModel: PvModel;
  info?: string;
}
