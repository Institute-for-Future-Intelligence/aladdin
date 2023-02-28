/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { Box } from '@react-three/drei';
import { useRefStore } from 'src/stores/commonRef';
import { useStore } from 'src/stores/common';
import { MoveHandleType, ResizeHandleType } from 'src/types';
import { WindowType } from 'src/models/WindowModel';
import WindowResizeHandle from './windowResizeHandle';
import WindowMoveHandle from './windowMoveHandle';

interface WindowHandleWrapperProps {
  lx: number;
  lz: number;
  windowType: WindowType;
}

export const ArchResizeHandle = ({ z }: { z: number }) => {
  const ref = useRef<Mesh>();

  const [color, setColor] = useState('white');
  return (
    <Box
      ref={ref}
      name={ResizeHandleType.Arch}
      args={[0.2, 0.2, 0.2]}
      position={[0, 0, z]}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        setColor('white');
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
};

const WindowHandleWrapper = ({ lx, lz, windowType }: WindowHandleWrapperProps) => {
  const isSettingNewWindow = lx === 0 && lz === 0;

  return (
    <group name={'handle wrapper'}>
      {!isSettingNewWindow && (
        <>
          <WindowResizeHandle x={-lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperLeft} />
          <WindowResizeHandle x={lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperRight} />
          <WindowResizeHandle x={-lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerLeft} />
          <WindowResizeHandle x={lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerRight} />

          {/* arch resize handle */}
          {windowType === WindowType.Arched && <ArchResizeHandle z={lz / 2} />}
        </>
      )}
      <WindowMoveHandle handleType={MoveHandleType.Mid} />
    </group>
  );
};

export default React.memo(WindowHandleWrapper);
