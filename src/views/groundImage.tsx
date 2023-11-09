/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { DoubleSide, Mesh } from 'three';
import { getRoadMap, getSatelliteImage } from '../helpers';
import { Util } from '../Util';
import { ThreeEvent } from '@react-three/fiber';
import { InnerCommonStoreState } from '../stores/InnerCommonState';
import { ObjectType } from '../types';
import { UNIT_VECTOR_POS_Z } from '../constants';

// The image that Google Maps API returns is 640x640. That image needs to be rescaled in such a way
// that one meter in a Google Map is exactly same length as one meter in Aladdin.
// I used the Morse Institute library in Natick as a reference to find the correct scale factor,
// but this factor varies with latitude as Google Maps use the Mercator projection.

const NATICK_MAP_SCALE_FACTOR = 0.7;
const NATICK_LATITUDE = 42.2845513;
const MERCATOR_PROJECTION_SCALE_CONSTANT = NATICK_MAP_SCALE_FACTOR / Math.cos(Util.toRadians(NATICK_LATITUDE));

const GroundImage = () => {
  const setCommonStore = useStore(Selector.set);
  const latitude = useStore(Selector.world.latitude);
  const longitude = useStore(Selector.world.longitude);
  const mapZoom = useStore(Selector.viewState.mapZoom);
  const mapType = useStore(Selector.viewState.mapType);

  const groundImageRef = useRef<Mesh>(null);

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

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0) {
      const groundImageClicked = e.intersections[0].object === groundImageRef.current;
      if (groundImageClicked) {
        setCommonStore((state) => {
          InnerCommonStoreState.selectNone(state);
          state.pastePoint.copy(e.intersections[0].point);
          state.clickObjectType = ObjectType.Ground;
          state.contextMenuObjectType = ObjectType.Ground;
          state.pasteNormal = UNIT_VECTOR_POS_Z;
        });
      }
    }
  };

  return texture ? (
    <mesh
      rotation={[0, 0, 0]}
      position={[0, 0, 0]}
      renderOrder={-1}
      scale={[scale, scale, 1]}
      receiveShadow={true}
      ref={groundImageRef}
      onContextMenu={handleContextMenu}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial attach="material" depthTest={false} side={DoubleSide} map={texture} opacity={1} />
    </mesh>
  ) : (
    <></>
  );
};

export default React.memo(GroundImage);
