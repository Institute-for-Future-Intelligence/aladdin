/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindowModel extends ElementModel {
  // solar heat gain coefficient (https://en.wikipedia.org/wiki/Solar_gain) = 1 - opacity
  opacity: number;
  tint: string;
  uValue: number;

  shutter: ShutterProps;

  mullion: boolean;
  mullionWidth: number;
  mullionSpacing: number;
  mullionColor: string;

  // frameColor is using color
  frame: boolean;
  frameWidth: number;
  sillWidth: number;

  windowType: WindowType;
  archHeight: number;
}

export interface ShutterProps {
  showLeft: boolean;
  showRight: boolean;
  color: string;
  width: number;
}

export enum WindowType {
  Default = 'Default',
  Arched = 'Arched',
  Circle = 'Circle',
}
