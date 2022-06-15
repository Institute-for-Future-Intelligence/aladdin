/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import { HALF_PI } from 'src/constants';

interface WindowWireFrameProps {
  lx: number;
  lz: number;
  mullionWidth: number;
  lineColor: string;
  lineWidth?: number;
}

const WindowWireFrame = ({ lx, lz, mullionWidth, lineColor, lineWidth = 0.2 }: WindowWireFrameProps) => {
  lineWidth /= 20;

  const radialSegments = 2;
  const heightSegments = 1;

  const wireframeRadius = lineWidth / 2;
  const mullionRadius = mullionWidth / 2;

  const hx = lx / 2;
  const hz = lz / 2;

  const outerMat = useMemo(() => <meshStandardMaterial color={lineColor} />, [lineColor]);
  const innerMat = useMemo(() => <meshStandardMaterial color={'white'} />, []);

  const verticalMullion = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lx / 0.5) - 1;
    if (dividers <= 0) {
      return arr;
    }
    let x = 0.25;
    if (dividers % 2 !== 0) {
      arr.push(0);
      x = 0.5;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, x += 0.5) {
      arr.push(x, -x);
    }
    return arr;
  }, [lx]);

  const horizontalMullion = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lz / 0.5) - 1;
    if (dividers <= 0) {
      return arr;
    }
    let z = 0.25;
    if (dividers % 2 !== 0) {
      arr.push(0);
      z = 0.5;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, z += 0.5) {
      arr.push(z, -z);
    }
    return arr;
  }, [lz]);

  return (
    <group name={'Window Wireframe'} position={[0, -0.001, 0]}>
      {verticalMullion.map((x) => (
        <Cylinder
          position={[x, 0.00025, 0]}
          args={[mullionRadius, mullionRadius, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow
        >
          {innerMat}
        </Cylinder>
      ))}
      {horizontalMullion.map((z) => (
        <Cylinder
          position={[0, 0.0005, z]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow
        >
          {innerMat}
        </Cylinder>
      ))}

      <Cylinder
        args={[lineWidth, lineWidth, lx, radialSegments, heightSegments]}
        rotation={[0, 0, HALF_PI]}
        position={[0, 0, hz - wireframeRadius]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lx, radialSegments, heightSegments]}
        rotation={[0, 0, HALF_PI]}
        position={[0, 0, -hz + wireframeRadius]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lz, radialSegments, heightSegments]}
        rotation={[HALF_PI, HALF_PI, 0]}
        position={[hx - wireframeRadius, 0, 0]}
      >
        {outerMat}
      </Cylinder>
      <Cylinder
        args={[lineWidth, lineWidth, lz, radialSegments, heightSegments]}
        rotation={[HALF_PI, HALF_PI, 0]}
        position={[-hx + wireframeRadius, 0, 0]}
      >
        {outerMat}
      </Cylinder>
    </group>
  );
};

export default React.memo(WindowWireFrame);
