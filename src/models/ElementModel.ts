/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { GroundModel } from './GroundModel';

export interface ElementModel {
  id: string;
  type: string;
  cx: number; // x coordinate of the center
  cy: number; // y coordinate of the center
  cz: number; // y coordinate of the center
  lx: number; // length in x direction
  ly: number; // length in y direction
  lz: number; // length in z direction
  normal: number[]; // normal vector of this element's primary surface if applicable
  rotation: number[]; // Euler angle for the orientation

  parent: ElementModel | GroundModel;
  selected?: boolean;
  locked?: boolean;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
  label?: string;
  showLabel?: boolean;

  [key: string]: any;
}
