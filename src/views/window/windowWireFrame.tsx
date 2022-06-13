/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Cylinder, Line } from '@react-three/drei';
import { HALF_PI } from 'src/constants';

interface WindowWireFrameProps {
  lx: number;
  lz: number;
  lineColor: string;
  lineWidth?: number;
}

const WindowWireFrame = ({ lx, lz, lineColor, lineWidth = 0.2 }: WindowWireFrameProps) => {
  lineWidth /= 20;

  const radialSegments = 4;
  const heightSegments = 1;

  const radius = lineWidth / 2;
  const rotation = HALF_PI / 2;

  const hx = lx / 2;
  const hz = lz / 2;

  const outerMat = <meshStandardMaterial color={lineColor} />;
  const innerMat = <meshStandardMaterial color={'white'} />;

  return (
    <React.Fragment>
      <Cylinder args={[0.01, 0.01, lx, radialSegments, heightSegments]} rotation={[0, 0, HALF_PI]} receiveShadow>
        {innerMat}
      </Cylinder>
      <Cylinder args={[0.01, 0.01, lz, radialSegments, heightSegments]} rotation={[HALF_PI, 0, 0]} receiveShadow>
        {innerMat}
      </Cylinder>

      <Cylinder
        args={[lineWidth, lineWidth, lx, radialSegments, heightSegments]}
        rotation={[rotation, 0, HALF_PI]}
        position={[0, 0, hz - radius]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lx, radialSegments, heightSegments]}
        rotation={[rotation, 0, HALF_PI]}
        position={[0, 0, -hz + radius]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lz, radialSegments, heightSegments]}
        rotation={[HALF_PI, rotation, 0]}
        position={[hx - radius, 0, 0]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lz, radialSegments, heightSegments]}
        rotation={[HALF_PI, rotation, 0]}
        position={[-hx + radius, 0, 0]}
      >
        {outerMat}
      </Cylinder>
    </React.Fragment>
  );
};

export default React.memo(WindowWireFrame);
