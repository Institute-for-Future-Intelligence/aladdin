/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from '../types';

export interface ElementModel {
  readonly id: string;
  readonly type: ObjectType;
  cx: number; // x coordinate of the center
  cy: number; // y coordinate of the center
  cz: number; // z coordinate of the center
  lx: number; // length in x direction
  ly: number; // length in y direction
  lz: number; // length in z direction
  normal: number[]; // normal vector of this element's primary surface if applicable
  rotation: number[]; // Euler angle for the orientation

  parentId: string;
  foundationId?: string;
  referenceId?: string;
  selected?: boolean;
  locked?: boolean;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
  label?: string;
  showLabel?: boolean;
  labelSize?: number;
  labelFontSize?: number;
  labelColor?: string;
  labelHeight?: number;

  // EVIL: DO NOT DO THIS!!!
  //[key: string]: any;
}
