import React from 'react';
import { ResizeHandleType } from 'src/types';
import { useHandle } from './hooks';
import { RESIZE_HANDLE_COLOR } from 'src/constants';
import { Box } from '@react-three/drei';

interface ResizeHandleProps {
  cx: number;
  cy: number;
  size: number;
  type: ResizeHandleType;
}

const ResizeHandle = React.memo(({ cx, cy, size, type }: ResizeHandleProps) => {
  const { _color, _onPointerDown, _onPointerMove, _onPointerLeave } = useHandle(RESIZE_HANDLE_COLOR, 'pointer');
  return (
    <Box
      name={type}
      position={[cx, cy, 0.1]}
      args={[size, size, 0.1]}
      onPointerDown={_onPointerDown}
      onPointerMove={_onPointerMove}
      onPointerLeave={_onPointerLeave}
    >
      <meshBasicMaterial color={_color} />
    </Box>
  );
});

export default ResizeHandle;
