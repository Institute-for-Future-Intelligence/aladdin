/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Sphere } from '@react-three/drei';
import { useHandleSize } from './wallResizeHandleWrapper';
import { HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_COLOR_2 } from 'src/constants';
import { useStore } from 'src/stores/common';
import { MoveHandleType } from 'src/types';
import { ThreeEvent } from '@react-three/fiber';
import { useStoreRef } from 'src/stores/commonRef';

interface HandleProps {
  cy: number;
  size: number;
  type: MoveHandleType;
}

interface WrapperProps {
  ply: number;
  phz: number;
}

const MoveHandle = ({ cy, size, type }: HandleProps) => {
  const [color, setColor] = useState(MOVE_HANDLE_COLOR_2);

  const onPointerEnter = () => {
    setColor(HIGHLIGHT_HANDLE_COLOR);
  };

  const onPointerOut = () => {
    setColor(MOVE_HANDLE_COLOR_2);
  };

  return (
    <Sphere name={type} args={[size]} position={[0, cy, 0]} onPointerEnter={onPointerEnter} onPointerOut={onPointerOut}>
      <meshBasicMaterial attach="material" color={color} />
    </Sphere>
  );
};

const WallMoveHandleWrapper = ({ ply, phz }: WrapperProps) => {
  const handleSize = useHandleSize();

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.parent === e.eventObject) {
      useStore.getState().set((state) => {
        state.moveHandleType = e.object.name as MoveHandleType;
      });
      useStoreRef.getState().setEnableOrbitController(false);
    }
  };

  return (
    <group name={'Move Handle Group'} position={[0, 0, -phz]} onPointerDown={onPointerDown}>
      <MoveHandle cy={-handleSize} size={handleSize} type={MoveHandleType.Lower} />
      <MoveHandle cy={ply + handleSize} size={handleSize} type={MoveHandleType.Upper} />
    </group>
  );
};

export default React.memo(WallMoveHandleWrapper);
