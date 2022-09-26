/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindowModel extends ElementModel {
  mullionWidth: number;
  mullionSpacing: number;
  opacity: number;
  tint: string;
  shutter: Shutter;
}

export interface Shutter {
  showLeft: boolean;
  showRight: boolean;
  color: string;
  width: number;
}
