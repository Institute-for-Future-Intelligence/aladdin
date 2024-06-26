import { Sphere } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { MOVE_HANDLE_COLOR_1 } from 'src/constants';
import { useHandle } from './hooks';
import { useHandleSize } from '../wall/hooks';

interface MoveHandleProps {
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}

const MoveHandle = React.memo(({ onPointerDown }: MoveHandleProps) => {
  const { _color, _onPointerDown, _onPointerEnter, _onPointerLeave } = useHandle(MOVE_HANDLE_COLOR_1);
  const handleSize = useHandleSize();
  return (
    <Sphere
      name="Move_Handle"
      args={[handleSize]}
      onPointerDown={(e) => {
        onPointerDown(e);
        _onPointerDown();
      }}
      onPointerEnter={_onPointerEnter}
      onPointerLeave={_onPointerLeave}
    >
      <meshBasicMaterial color={_color} />
    </Sphere>
  );
});

export default MoveHandle;
