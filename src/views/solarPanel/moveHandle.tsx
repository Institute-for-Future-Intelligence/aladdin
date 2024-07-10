import { Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import React from 'react';
import { MOVE_HANDLE_COLOR_1 } from 'src/constants';
import { useHandle } from './hooks';
import { useHandleSize } from '../wall/hooks';

interface MoveHandleProps {
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}

const MoveHandle = React.memo(({ onPointerDown }: MoveHandleProps) => {
  const { _color, _onPointerDown, _onPointerMove, _onPointerLeave } = useHandle(MOVE_HANDLE_COLOR_1, 'move');
  const handleSize = useHandleSize();

  const { gl } = useThree();
  return (
    <Sphere
      name="Move_Handle"
      args={[handleSize]}
      onPointerDown={(e) => {
        onPointerDown(e);
        _onPointerDown();
        gl.domElement.style.cursor = 'move';
      }}
      onPointerMove={_onPointerMove}
      onPointerLeave={_onPointerLeave}
    >
      <meshBasicMaterial color={_color} />
    </Sphere>
  );
});

export default MoveHandle;
