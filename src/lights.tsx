/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { DEFAULT_FAR, DEFAULT_SHADOW_CAMERA_OFFSET } from './constants';

const Lights = () => {
  const sunlightDirection = useStore(Selector.sunlightDirection);

  return (
    <>
      <ambientLight intensity={0.25} name={'Ambient Light'} />
      <directionalLight
        name={'Directional Light'}
        color="white"
        position={sunlightDirection.normalize().multiplyScalar(100)}
        intensity={sunlightDirection.z > 0 ? 0.5 : 0}
        castShadow
        shadow-mapSize-height={4096}
        shadow-mapSize-width={4096}
        shadowCameraNear={1}
        shadowCameraFar={DEFAULT_FAR}
        shadowCameraLeft={-DEFAULT_SHADOW_CAMERA_OFFSET}
        shadowCameraRight={DEFAULT_SHADOW_CAMERA_OFFSET}
        shadowCameraTop={DEFAULT_SHADOW_CAMERA_OFFSET}
        shadowCameraBottom={-DEFAULT_SHADOW_CAMERA_OFFSET}
      />
    </>
  );
};

export default React.memo(Lights);
