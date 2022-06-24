/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import { HALF_PI } from 'src/constants';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';

interface WindowWireFrameProps {
  lx: number;
  lz: number;
  mullionWidth: number;
  mullionSpace: number;
  lineColor: string;
  lineWidth?: number;
}

const WindowWireFrame = ({ lx, lz, mullionWidth, mullionSpace, lineColor, lineWidth = 0.2 }: WindowWireFrameProps) => {
  lineWidth /= 20;

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

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
    const dividers = Math.round(lx / mullionSpace) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lx / (dividers + 1);
    let x = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      x = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, x += step) {
      arr.push(x, -x);
    }
    return arr;
  }, [lx, mullionWidth, mullionSpace]);

  const horizontalMullion = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lz / mullionSpace) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lz / (dividers + 1);
    let z = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      z = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, z += step) {
      arr.push(z, -z);
    }
    return arr;
  }, [lz, mullionWidth, mullionSpace]);

  return (
    <group name={'Window Wireframe'} position={[0, -0.001, 0]}>
      {verticalMullion.map((x) => (
        <Cylinder
          position={[x, 0.00025, 0]}
          args={[mullionRadius, mullionRadius, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {innerMat}
        </Cylinder>
      ))}
      {horizontalMullion.map((z) => (
        <Cylinder
          position={[0, 0.0005, z]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
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