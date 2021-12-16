/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mesh } from 'three';
import { Sphere } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { MoveHandleType } from 'src/types';

interface WindowMoveHandleProps {
  handleType: MoveHandleType;
}

const WindowMoveHandle = ({ handleType }: WindowMoveHandleProps) => {
  const setCommonStore = useStore(Selector.set);
  const moveHandleType = useStore(Selector.moveHandleType);

  const handleRef = useRef<Mesh>();

  const [color, setColor] = useState('white');

  useEffect(() => {
    if (moveHandleType === MoveHandleType.Mid) {
      setColor('red');
    } else {
      setColor('white');
    }
  }, [moveHandleType]);

  return (
    <Sphere
      ref={handleRef}
      name={handleType}
      onPointerDown={(e) => {
        setCommonStore((state) => {
          state.setEnableOrbitController(false);
          state.moveHandleType = handleType;
        });
      }}
      args={[0.1, 6, 6]}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        if (moveHandleType === null) {
          setColor('white');
        }
      }}
    >
      <meshBasicMaterial color={color} />
    </Sphere>
  );
};

export default React.memo(WindowMoveHandle);
