/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableDelete extends Undoable {
  deletedElements: ElementModel[];
  selectedElementId: string;
}

export interface UndoableDeleteMultiple extends UndoableDelete {
  selectedElementIdSet: Set<string>;
}
