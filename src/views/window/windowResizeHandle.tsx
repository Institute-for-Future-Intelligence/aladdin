/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mesh } from 'three';
import { Box } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import { ResizeHandleType } from 'src/types';
import * as Selector from 'src/stores/selector';

interface WindowResizeHandleProps {
  x: number;
  z: number;
  handleType: ResizeHandleType;
}

const WindowResizeHandle = ({ x, z, handleType }: WindowResizeHandleProps) => {
  const setCommonStore = useStore(Selector.set);
  const resizeHandleType = useStore(Selector.resizeHandleType);

  const handleRef = useRef<Mesh>();

  const [color, setColor] = useState('white');

  useEffect(() => {
    if (resizeHandleType === handleType) {
      setColor('red');
    } else {
      setColor('white');
    }
  }, [resizeHandleType]);

  return (
    <Box
      ref={handleRef}
      name={handleType}
      args={[0.2, 0.2, 0.2]}
      position={[x, 0, z]}
      onPointerEnter={() => {
        setColor('red');
        setCommonStore((state) => {
          state.hoveredHandle = handleType;
        });
      }}
      onPointerLeave={() => {
        if (resizeHandleType === null) {
          setColor('white');
        }
        setCommonStore((state) => {
          state.hoveredHandle = null;
        });
      }}
    >
      <meshBasicMaterial attach="material" color={color} />
    </Box>
  );
};

export default React.memo(WindowResizeHandle);
