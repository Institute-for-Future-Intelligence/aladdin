/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { DEFAULT_FAR } from './constants';
import { DirectionalLight, Mesh } from 'three';

const Lights = () => {
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const sceneRadius = useStore(Selector.sceneRadius);
  const positionExtent = 2 * sceneRadius;
  const cameraExtent = 2 * sceneRadius;

  const ref = useRef<DirectionalLight>();

  if (ref.current) {
    ref.current.shadow.camera.left = -cameraExtent;
    ref.current.shadow.camera.bottom = -cameraExtent;
    ref.current.shadow.camera.right = cameraExtent;
    ref.current.shadow.camera.top = cameraExtent;
    ref.current.shadow.camera.updateProjectionMatrix();
  }

  return (
    <>
      <ambientLight intensity={0.25} name={'Ambient Light'} />
      <directionalLight
        ref={ref}
        name={'Directional Light'}
        color="white"
        position={sunlightDirection.normalize().multiplyScalar(positionExtent)}
        intensity={sunlightDirection.z > 0 ? 0.5 : 0}
        castShadow
        shadow-mapSize-height={4096}
        shadow-mapSize-width={4096}
        shadow-camera-near={1}
        shadow-camera-far={DEFAULT_FAR}
      />
    </>
  );
};

export default React.memo(Lights);
