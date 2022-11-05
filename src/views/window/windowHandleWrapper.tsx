/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';
import { Box } from '@react-three/drei';
import { useStoreRef } from 'src/stores/commonRef';
import { useStore } from 'src/stores/common';
import { MoveHandleType, ResizeHandleType } from 'src/types';
import * as Selector from 'src/stores/selector';
import { WindowType } from 'src/models/WindowModel';
import WindowResizeHandle from './windowResizeHandle';
import WindowMoveHandle from './windowMoveHandle';

interface WindowHandleWrapperProps {
  lx: number;
  lz: number;
  windowType: WindowType;
}

const ArchResizeHandle = ({ z }: { z: number }) => {
  const ref = useRef<Mesh>();

  const [color, setColor] = useState('white');
  return (
    <Box
      ref={ref}
      args={[0.2, 0.2, 0.2]}
      position={[0, 0, z]}
      onPointerDown={() => {
        useStoreRef.getState().setEnableOrbitController(false);
        useStore.getState().set((state) => {
          state.resizeHandleType = ResizeHandleType.WindowArch;
          if (ref.current) {
            state.resizeAnchor = ref.current.localToWorld(new Vector3(0, 0, -z)).clone();
          }
        });
      }}
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
    <group>
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
