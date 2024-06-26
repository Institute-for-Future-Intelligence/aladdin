import { Box } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React, { forwardRef } from 'react';
import { RESIZE_HANDLE_COLOR } from 'src/constants';
import { useHandle } from './hooks';
import { ResizeHandleType } from 'src/types';
import { useHandleSize } from '../wall/hooks';
import { Group } from 'three';

interface ResizeHandleProps {
  cx: number;
  cy: number;
  size: number;
  type: ResizeHandleType;
}

interface ResizeHandleGroupProps {
  hlx: number;
  hly: number;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}

const ResizeHandle = React.memo(({ cx, cy, size, type }: ResizeHandleProps) => {
  const { _color, _onPointerDown, _onPointerEnter, _onPointerLeave } = useHandle(RESIZE_HANDLE_COLOR);
  return (
    <Box
      name={type}
      position={[cx, cy, 0.1]}
      args={[size, size, 0.1]}
      onPointerDown={_onPointerDown}
      onPointerEnter={_onPointerEnter}
      onPointerLeave={_onPointerLeave}
    >
      <meshBasicMaterial color={_color} />
    </Box>
  );
});

const ResizeHandleGroup = React.memo(
  forwardRef<Group, ResizeHandleGroupProps>(({ hlx, hly, onPointerDown }: ResizeHandleGroupProps, ref) => {
    const handleSize = useHandleSize();

    return (
      <group name="Resize_Handles_Group" ref={ref} onPointerDown={onPointerDown}>
        <ResizeHandle type={ResizeHandleType.Left} cx={-hlx} cy={0} size={handleSize} />
        <ResizeHandle type={ResizeHandleType.Right} cx={hlx} cy={0} size={handleSize} />
        <ResizeHandle type={ResizeHandleType.Lower} cx={0} cy={-hly} size={handleSize} />
        <ResizeHandle type={ResizeHandleType.Upper} cx={0} cy={hly} size={handleSize} />
      </group>
    );
  }),
);

export default ResizeHandleGroup;
