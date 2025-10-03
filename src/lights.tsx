/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { DirectionalLight } from 'three';
import {
  DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY,
  DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY,
  DEFAULT_VIEW_SHADOW_CAMERA_FAR,
  STARLIGHT_INTENSITY,
  UNIT_VECTOR_POS_Z,
} from './constants';
import { Util } from './Util';
import BloomEffect from './bloomEffect';

const Lights = React.memo(() => {
  const directLightIntensity = useStore(Selector.viewState.directLightIntensity) ?? DEFAULT_VIEW_DIRECT_LIGHT_INTENSITY;
  const ambientLightIntensity =
    useStore(Selector.viewState.ambientLightIntensity) ?? DEFAULT_VIEW_AMBIENT_LIGHT_INTENSITY;
  const shadowCameraFar = useStore(Selector.viewState.shadowCameraFar) ?? DEFAULT_VIEW_SHADOW_CAMERA_FAR;
  const shadowMapSize = Util.getShadowMapSize();
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const sceneRadius = useStore(Selector.sceneRadius);
  const positionExtent = 2 * sceneRadius;
  const cameraExtent = sceneRadius + 100;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const ref = useRef<DirectionalLight>(null);

  if (ref.current) {
    ref.current.shadow.camera.left = -cameraExtent;
    ref.current.shadow.camera.bottom = -cameraExtent;
    ref.current.shadow.camera.right = cameraExtent;
    ref.current.shadow.camera.top = cameraExtent;
    ref.current.shadow.camera.updateProjectionMatrix();
  }

  const day = sunlightDirection.z > 0;
  const dot = day ? sunlightDirection.normalize().dot(UNIT_VECTOR_POS_Z) : 0;

  return (
    <>
      <BloomEffect />
      <ambientLight intensity={STARLIGHT_INTENSITY + (day ? ambientLightIntensity * dot : 0)} name={'Ambient Light'} />
      <directionalLight
        ref={ref}
        name={'Directional Light'}
        color="white"
        position={sunlightDirection.normalize().multiplyScalar(positionExtent)}
        intensity={day ? directLightIntensity * dot : 0}
        castShadow={shadowEnabled}
        shadow-bias={0} // may be used to reduce shadow artifacts
        shadow-mapSize-height={shadowMapSize}
        shadow-mapSize-width={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={shadowCameraFar}
      />
    </>
  );
});

export default Lights;
