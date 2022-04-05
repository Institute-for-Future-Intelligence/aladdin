/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';
import { SolarPanelArrayLayoutParams } from '../stores/SolarPanelArrayLayoutParams';

export interface UndoableLayout extends Undoable {
  oldElements: ElementModel[];
  newElements: ElementModel[];
  oldParams: SolarPanelArrayLayoutParams;
  newParams: SolarPanelArrayLayoutParams;
  referenceId: string;
}
