/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Rectangle } from '../../../models/Rectangle';
import { Constraint } from './Constraint';

export class RectangularBound implements Constraint {
  rectangle: Rectangle;

  constructor(centerX: number, centerY: number, width: number, height: number) {
    this.rectangle = new Rectangle(centerX - width * 0.5, centerY - height * 0.5, width, height);
  }

  contains(x: number, y: number): boolean {
    return this.rectangle.contains(x, y);
  }
}
