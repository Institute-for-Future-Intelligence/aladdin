/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Box } from '@react-three/drei';
import React, { useMemo } from 'react';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';

interface WindowFrameProps {
  lx: number;
  ly: number;
  lz: number;
  width: number;
  color: string;
}

const WindowFrame = ({ lx, ly, lz, width, color }: WindowFrameProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const halfWidth = width / 2;
  const depth = halfWidth;

  const sillLength = lx + width * 3;
  const sillThickness = width;
  const sillDepth = width;

  return (
    <group name={'Window Frame Group'} position={[0, 0, 0]}>
      {/* top */}
      <Box
        position={[0, 0, lz / 2]}
        args={[lx + width, depth, width]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2, 0, 0]}
        args={[width, depth, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box position={[lx / 2, 0, 0]} args={[width, depth, lz]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        {material}
      </Box>

      {/* bottom */}
      <Box
        position={[0, -sillDepth / 2, -lz / 2 - sillThickness / 2]}
        args={[sillLength, sillDepth, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
};

export default React.memo(WindowFrame);
