/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from './stores/common';

const CameraController = () => {
  const cameraPosition = useStore((state) => state.world.cameraPosition);

  return (
    <React.Fragment>
      <perspectiveCamera position={cameraPosition} fov={45} />
    </React.Fragment>
  );
};

export default React.memo(CameraController);
