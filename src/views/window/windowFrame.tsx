/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Box } from '@react-three/drei';
import React, { useMemo } from 'react';

interface WindowFrameProps {
  lx: number;
  ly: number;
  lz: number;
  width: number;
  color: string;
}

const WindowFrame = ({ lx, ly, lz, width, color }: WindowFrameProps) => {
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const halfWidth = width / 2;

  const sillLength = lx + width * 3;
  const sillThickness = width;
  const sillDepth = width * 2;

  return (
    <group name={'Window Frame Group'} position={[0, 0, 0]}>
      {/* top */}
      <Box position={[0, -halfWidth, lz / 2]} args={[lx + width, width, width]}>
        {material}
      </Box>

      {/* left */}
      <Box position={[-lx / 2, -halfWidth, 0]} args={[width, width, lz]}>
        {material}
      </Box>

      {/* right */}
      <Box position={[lx / 2, -halfWidth, 0]} args={[width, width, lz]}>
        {material}
      </Box>

      {/* bottom */}
      <Box position={[0, -sillDepth / 2, -lz / 2 - sillThickness / 2]} args={[sillLength, sillDepth, sillThickness]}>
        {material}
      </Box>

      {/* center */}
      <Box position={[0, ly, 0]} args={[lx, width, width]}>
        {material}
      </Box>
    </group>
  );
};

export default React.memo(WindowFrame);
