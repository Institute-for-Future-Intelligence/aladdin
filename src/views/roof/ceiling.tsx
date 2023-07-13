/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Extrude } from '@react-three/drei';
import React from 'react';
import { WallModel } from 'src/models/WallModel';
import { DoubleSide, Shape, Vector3 } from 'three';

interface CeilingProps {
  cz: number;
  points: Vector3[];
}

const Ceiling = ({ cz, points }: CeilingProps) => {
  const shape = new Shape();

  shape.moveTo(points[0].x, points[0].y);

  for (const { x, y } of points) {
    shape.lineTo(x, y);
  }

  shape.closePath();

  return (
    <Extrude scale={0.99} position={[0, 0, cz]} args={[shape, { steps: 1, depth: 0.1, bevelEnabled: false }]}>
      <meshStandardMaterial side={DoubleSide} color={'white'} />
    </Extrude>
  );
};

export default React.memo(Ceiling);
