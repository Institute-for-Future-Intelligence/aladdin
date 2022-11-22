/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import React from 'react';
import { RoofTexture } from 'src/types';
import { useRoofTexture, useTransparent } from './hooks';
import { RoofSegmentProps } from './roofRenderer';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';

export const RoofSegment = ({
  idx,
  segment,
  defaultAngle,
  thickness,
  textureType,
  color,
}: {
  idx: number;
  segment: RoofSegmentProps;
  defaultAngle: number;
  thickness: number;
  textureType: RoofTexture;
  color: string;
}) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const { transparent, opacity } = useTransparent();
  const texture = useRoofTexture(textureType);

  const { points, angle, length } = segment;
  const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
  const isFlat = Math.abs(leftRoof.z) < 0.1;

  return (
    <mesh
      name={`Roof segment ${idx}`}
      castShadow={shadowEnabled && !transparent}
      receiveShadow={shadowEnabled}
      userData={{ simulation: true }}
    >
      <convexGeometry args={[points, isFlat ? defaultAngle : angle, isFlat ? 1 : length]} />
      <meshStandardMaterial
        map={texture}
        color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
};

export default React.memo(RoofSegment);
