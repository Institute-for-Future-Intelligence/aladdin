/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useTexture } from '@react-three/drei';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { DoubleSide } from 'three';
import { getRoadMap, getSatelliteImage } from '../helpers';
import { Util } from '../Util';

// The image that Google Maps API returns is 640x640. That image needs to be rescaled in such a way
// that one meter in a Google Map is exactly same length as one meter in Aladdin.
// I used the Morse Institute library in Natick as a reference to find the correct scale factor,
// but this factor varies with latitude as Google Maps use the Mercator projection.

const NATICK_MAP_SCALE_FACTOR = 0.7;
const NATICK_LATITUDE = 42.2845513;
const MERCATOR_PROJECTION_SCALE_CONSTANT = NATICK_MAP_SCALE_FACTOR / Math.cos(Util.toRadians(NATICK_LATITUDE));

const GroundImage = () => {
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const mapType = useStore(Selector.viewState.mapType);

  const texture = useTexture(
    mapType === 'satellite' || mapType === 'hybrid'
      ? getSatelliteImage(640, latitude, longitude, mapZoom)
      : getRoadMap(640, latitude, longitude, mapZoom),
  );

  let zoomScale;
  if (mapZoom === 21) {
    zoomScale = 0.5;
  } else if (mapZoom === 20) {
    zoomScale = 1;
  } else {
    zoomScale = Math.pow(2, 20 - mapZoom);
  }
  const scale = MERCATOR_PROJECTION_SCALE_CONSTANT * Math.cos(Util.toRadians(latitude)) * zoomScale;

  return texture ? (
    <mesh rotation={[0, 0, 0]} position={[0, 0, 0]} renderOrder={-1} scale={[scale, scale, 1]} receiveShadow={true}>
      <planeBufferGeometry args={[100, 100]} />
      <meshStandardMaterial attach="material" depthTest={false} side={DoubleSide} map={texture} opacity={1} />
    </mesh>
  ) : (
    <></>
  );
};

export default React.memo(GroundImage);
