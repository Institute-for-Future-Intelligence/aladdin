/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { MoveHandleType, ResizeHandleType } from 'src/types';
import WindowResizeHandle from './windowResizeHandle';
import WindowMoveHandle from './windowMoveHandle';

interface WindowHandleWrapperProps {
  lx: number;
  lz: number;
}

const WindowHandleWrapper = ({ lx, lz }: WindowHandleWrapperProps) => {
  const isSettingNewWindow = lx === 0 && lz === 0;
  return (
    <group>
      {!isSettingNewWindow && (
        <>
          <WindowResizeHandle x={-lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperLeft} />
          <WindowResizeHandle x={lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperRight} />
          <WindowResizeHandle x={-lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerLeft} />
          <WindowResizeHandle x={lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerRight} />
        </>
      )}
      <WindowMoveHandle handleType={MoveHandleType.Mid} />
    </group>
  );
};

export default React.memo(WindowHandleWrapper);
