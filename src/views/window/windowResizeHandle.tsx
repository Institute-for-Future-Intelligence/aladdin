/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { Box } from '@react-three/drei';
import { useStoreRef } from 'src/stores/commonRef';
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
      onPointerDown={(e) => {
        useStoreRef.getState().setEnableOrbitController(false);
        setCommonStore((state) => {
          state.resizeHandleType = handleType;
          if (handleRef.current) {
            const anchor = handleRef.current.localToWorld(new Vector3(-x * 2, 0, -z * 2));
            state.resizeAnchor.copy(anchor);
          }
        });
      }}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        if (resizeHandleType === null) {
          setColor('white');
        }
      }}
    >
      <meshBasicMaterial attach="material" color={color} />
    </Box>
  );
};

export default React.memo(WindowResizeHandle);
