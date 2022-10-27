/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindowModel extends ElementModel {
  opacity: number;
  tint: string;

  shutter: Shutter;

  mullion: boolean;
  mullionWidth: number;
  mullionSpacing: number;
  mullionColor: string;

  // frameColor is using color
  frame: boolean;
  frameWidth: number;
}

export interface Shutter {
  showLeft: boolean;
  showRight: boolean;
  color: string;
  width: number;
}
