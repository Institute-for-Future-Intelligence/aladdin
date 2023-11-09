/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';

export const SYMBOLS = [
  'circle',
  'square',
  'triangle up',
  'triangle down',
  'triangle right',
  'triangle left',
  'star',
  'diamond',
  'hexagon',
];

export enum Direction {
  DOWN,
  UP,
  LEFT,
  RIGHT,
}

const strokeWidth = 1;

export const CircleSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, numberOfPoints, numberOfSymbols, scale, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    return (
      <svg x={cx - 10 * scale} y={cy - 10 * scale} width={20 * scale} height={20 * scale} viewBox="-10 -10 20 20">
        <circle
          cx="0"
          cy="0"
          r="3"
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const SquareSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, scale, numberOfPoints, numberOfSymbols, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    return (
      <svg x={cx - 10 * scale} y={cy - 10 * scale} width={20 * scale} height={20 * scale} viewBox="-10 -10 20 20">
        <rect
          x="-3"
          y="-3"
          width="6"
          height="6"
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const TriangleSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, scale, numberOfPoints, numberOfSymbols, direction, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    let pointsString;
    switch (direction) {
      case Direction.UP:
        pointsString = '-4,2.5,4,2.5,0,-3.5';
        break;
      case Direction.LEFT:
        pointsString = '2.5,4,2.5,-4,-3.5,0';
        break;
      case Direction.RIGHT:
        pointsString = '-2.5,4,-2.5,-4,3.5,0';
        break;
      default:
        pointsString = '-4,-2.5,4,-2.5,0,3.5';
    }
    // strokeWidth needs to be halved as the view box is too small
    return (
      <svg x={cx - 10 * scale} y={cy - 10 * scale} width={20 * scale} height={20 * scale} viewBox="-10 -10 20 20">
        <polygon
          points={pointsString}
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const DiamondSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, scale, numberOfPoints, numberOfSymbols, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    // strokeWidth needs to be halved as the view box is too small
    return (
      <svg x={cx - 10 * scale} y={cy - 10 * scale} width={20 * scale} height={20 * scale} viewBox="-10 -10 20 20">
        <polygon
          points="-3,0,0,5,3,0,0,-5"
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const StarSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, scale, numberOfPoints, numberOfSymbols, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    // we need to scale down by 50% first before applying the scale factor as the original svg is too large
    const s = 0.05 * scale;
    return (
      // strokeWidth needs to be doubled as the view box is too large
      <svg x={cx - 100 * s} y={cy - 100 * s} width={300 * s} height={300 * s} viewBox="0 0 300 300">
        <polygon
          points="100,10 40,180 190,60 10,60 160,180"
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const HexagonSymbol = (props: any) => {
  const { cx, cy, opacity, stroke, index, scale, numberOfPoints, numberOfSymbols, fillColor } = props;
  const interval = numberOfPoints ? Math.round(numberOfPoints / numberOfSymbols) : 1;
  if (cx && cy && index > 0 && index % interval === 0) {
    const s = 0.02 * scale;
    return (
      <svg x={cx - 150 * s} y={cy - 150 * s} width={300 * s} height={300 * s} viewBox="0 0 300 300">
        <polygon
          className="hex"
          points="300,150 225,280 75,280 0,150 75,20 225,20"
          style={{ opacity: opacity, stroke: stroke, fill: fillColor ?? 'white', strokeWidth: strokeWidth }}
        />
      </svg>
    );
  }
  return null;
};

export const createSymbol = (
  type: string,
  size: number,
  numberOfPoints: number,
  numberOfSymbols: number,
  opacity: number,
  fillColor?: string,
) => {
  switch (type) {
    case 'circle':
      return (
        <CircleSymbol
          scale={size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'square':
      return (
        <SquareSymbol
          scale={size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'triangle up':
      return (
        <TriangleSymbol
          scale={1.1 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          direction={Direction.UP}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'triangle down':
      return (
        <TriangleSymbol
          scale={1.1 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          direction={Direction.DOWN}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'triangle right':
      return (
        <TriangleSymbol
          scale={1.1 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          direction={Direction.RIGHT}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'triangle left':
      return (
        <TriangleSymbol
          scale={1.1 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          direction={Direction.LEFT}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'star':
      return (
        <StarSymbol
          scale={1.25 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'diamond':
      return (
        <DiamondSymbol
          scale={1.1 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
    case 'hexagon':
      return (
        <HexagonSymbol
          scale={1.3 * size}
          numberOfPoints={numberOfPoints}
          numberOfSymbols={numberOfSymbols}
          opacity={opacity}
          fillColor={fillColor}
        />
      );
  }
};
