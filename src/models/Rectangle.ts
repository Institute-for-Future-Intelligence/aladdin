/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

export class Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  centerX(): number {
    return this.x + this.width / 2;
  }

  centerY(): number {
    return this.y + this.height / 2;
  }

  minX(): number {
    return this.x;
  }

  maxX(): number {
    return this.x + this.width;
  }

  minY(): number {
    return this.y;
  }

  maxY(): number {
    return this.y + this.height;
  }

  contains(x: number, y: number): boolean {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
  }
}
