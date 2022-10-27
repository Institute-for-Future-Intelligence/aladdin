/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindowModel extends ElementModel {
  mullion: boolean;
  mullionWidth: number;
  mullionSpacing: number;
  mullionColor: string;
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
