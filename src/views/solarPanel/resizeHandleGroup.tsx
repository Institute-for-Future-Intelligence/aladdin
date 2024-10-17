import { ThreeEvent } from '@react-three/fiber';
import React, { forwardRef } from 'react';
import { ResizeHandleType } from 'src/types';
import { useHandleSize } from '../wall/hooks';
import { Group } from 'three';
import ResizeHandle from './resizeHandle';

interface ResizeHandleGroupProps {
  hlx: number;
  hly: number;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}

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
