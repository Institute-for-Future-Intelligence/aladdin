/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Box, Line, Plane } from '@react-three/drei';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { Shape } from 'three';

interface ArchedDoorProps {
  dimension: number[];
  color: string;
  selected: boolean;
  locked: boolean;
}

interface DoorWireFrameProps {
  dimension: number[];
  lineColor: string;
  lineWidth: number;
}

const DoorWireFrame = React.memo(({ dimension, lineColor, lineWidth }: DoorWireFrameProps) => {
  const [hx, hy, hz] = dimension.map((val) => val / 2);
  const ul: [number, number, number] = [-hx, 0, hz];
  const ur: [number, number, number] = [hx, 0, hz];
  const ll: [number, number, number] = [-hx, 0, -hz];
  const lr: [number, number, number] = [hx, 0, -hz];
  return <Line points={[ul, ll, lr, ur, ul]} lineWidth={lineWidth} color={lineColor} />;
});

const ArchedDoor = React.memo(({ dimension, color, selected, locked }: ArchedDoorProps) => {
  const [lx, ly, lz, archHeight] = dimension;

  const doorShape = useMemo(() => {
    const s = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const ah = Math.min(archHeight, lz, hx);
    s.moveTo(-hx, -hz);
    s.lineTo(hx, -hz);
    s.lineTo(hx, hz - ah);
    if (ah > 0) {
      const r = ah / 2 + lx ** 2 / (8 * ah);
      const [cX, cY] = [0, hz - r];
      const startAngle = Math.acos(hx / r);
      const endAngle = Math.PI - startAngle;
      s.absarc(cX, cY, r, startAngle, endAngle, false);
    } else {
      s.lineTo(-hx, hz);
    }
    s.closePath();
    return s;
  }, [lx, lz, archHeight]);

  return (
    <group name={'Arched door group'}>
      <mesh name={'Door plane mesh'} rotation={[HALF_PI, 0, 0]}>
        <shapeBufferGeometry args={[doorShape]} />
        <meshStandardMaterial opacity={0.3} transparent color={'blue'} />
      </mesh>

      {/* <DoorFrame dimension={dimension} color={color} /> */}
    </group>
  );
});

export default ArchedDoor;
