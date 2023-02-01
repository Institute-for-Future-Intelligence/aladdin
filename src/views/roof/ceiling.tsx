/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { Extrude } from '@react-three/drei';
import React from 'react';
import { WallModel } from 'src/models/WallModel';
import { DoubleSide, Shape } from 'three';

interface CeilingProps {
  currWallArray: WallModel[];
}

const Ceiling = ({ currWallArray }: CeilingProps) => {
  const points = currWallArray.map((wall) => wall.rightPoint);
  const wall0 = currWallArray[0];

  const shape = new Shape();

  shape.moveTo(wall0.leftPoint[0], wall0.leftPoint[1]);

  for (const [x, y] of points) {
    shape.lineTo(x, y);
  }

  shape.closePath();

  return (
    <Extrude position={[0, 0, wall0.lz]} args={[shape, { steps: 1, depth: 0.1, bevelEnabled: false }]}>
      <meshStandardMaterial side={DoubleSide} />
    </Extrude>
  );
};

export default React.memo(Ceiling);
