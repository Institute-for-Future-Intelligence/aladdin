/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Box, Line, Plane } from '@react-three/drei';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { DoorTexture } from 'src/types';
import { useDoorTexture } from './hooks';
import { BackSide, DoubleSide, Material } from 'three';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { DoorType } from 'src/models/DoorModel';

interface RectangleDoorProps {
  dimension: number[];
  color: string;
  selected: boolean;
  locked: boolean;
  material: Material;
  filled: boolean;
}

interface DoorWireFrameProps {
  dimension: number[];
  lineColor: string;
  lineWidth: number;
}

interface DoorFrameProps {
  dimension: number[];
  color: string;
}

const DoorWireFrame = React.memo(({ dimension, lineColor, lineWidth }: DoorWireFrameProps) => {
  const [hx, hy, hz] = dimension.map((val) => val / 2);
  const ul: [number, number, number] = [-hx, 0, hz + 0.05];
  const ur: [number, number, number] = [hx, 0, hz + 0.05];
  const ll: [number, number, number] = [-hx, 0, -hz];
  const lr: [number, number, number] = [hx, 0, -hz];
  return <Line points={[ll, ul, ur, lr]} lineWidth={lineWidth} color={lineColor} />;
});

const DoorFrame = React.memo(({ dimension, color }: DoorFrameProps) => {
  const [lx, ly, lz] = dimension;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const width = 0.1;
  const halfWidth = width / 2;

  return (
    <group name={'Door frame group'}>
      {/* top */}
      <Box position={[0, 0, lz / 2]} args={[lx, width, width]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2 + halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box
        position={[lx / 2 - halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const RectangleDoor = React.memo(({ dimension, color, selected, locked, material, filled }: RectangleDoorProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const [lx, ly, lz] = dimension;

  return (
    <group name={'Rectangle door group'} position={[0, -0.01, 0]}>
      <Plane
        name={`Door plane`}
        args={[lx, lz]}
        rotation={[HALF_PI, 0, 0]}
        material={material}
        castShadow={shadowEnabled && filled}
        receiveShadow={shadowEnabled && filled}
      />

      <DoorWireFrame
        dimension={dimension}
        lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : 'black'}
        lineWidth={selected && locked ? 2 : 0.2}
      />

      <DoorFrame dimension={dimension} color={color} />
    </group>
  );
});

export default RectangleDoor;
