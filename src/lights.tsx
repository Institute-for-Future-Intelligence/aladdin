/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { DEFAULT_FAR } from './constants';

const Lights = () => {
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const sceneRadius = useStore(Selector.sceneRadius);
  const positionExtent = 2 * sceneRadius;
  const cameraExtent = 10 * sceneRadius;

  return (
    <>
      <ambientLight intensity={0.25} name={'Ambient Light'} />
      <directionalLight
        name={'Directional Light'}
        color="white"
        position={sunlightDirection.normalize().multiplyScalar(positionExtent)}
        intensity={sunlightDirection.z > 0 ? 0.5 : 0}
        castShadow
        shadow-mapSize-height={4096}
        shadow-mapSize-width={4096}
        shadow-camera-near={1}
        shadow-camera-far={DEFAULT_FAR}
        shadow-camera-left={-cameraExtent}
        shadow-camera-right={cameraExtent}
        shadow-camera-top={cameraExtent}
        shadow-camera-bottom={-cameraExtent}
      />
    </>
  );
};

export default React.memo(Lights);
