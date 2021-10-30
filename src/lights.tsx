/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from './stores/common';

const Lights = () => {
  const sunlightDirection = useStore((state) => state.sunlightDirection);

  return (
    <React.Fragment>
      <ambientLight intensity={0.25} name={'Ambient Light'} />
      <directionalLight
        name={'Directional Light'}
        color="white"
        position={sunlightDirection}
        intensity={sunlightDirection.z > 0 ? 0.5 : 0}
        castShadow
        shadow-mapSize-height={4096}
        shadow-mapSize-width={4096}
        shadowCameraNear={1}
        shadowCameraFar={10000}
        shadowCameraLeft={-100}
        shadowCameraRight={100}
        shadowCameraTop={100}
        shadowCameraBottom={-100}
      />
    </React.Fragment>
  );
};

export default React.memo(Lights);
