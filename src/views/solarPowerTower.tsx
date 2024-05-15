/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder, useTexture } from '@react-three/drei';
import { AdditiveBlending } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import GlowImage from '../resources/glow.png';
import { getSunDirection } from '../analysis/sunTools';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';

const SolarPowerTower = React.memo(({ foundation }: { foundation: FoundationModel }) => {
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);

  const glowTexture = useTexture(GlowImage);

  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);

  const { lz, solarPowerTower } = foundation;

  const towerRadius = solarPowerTower?.towerRadius ?? 1;
  const towerHeight = solarPowerTower?.towerHeight ?? 20;
  const receiverHeight = towerHeight / 10;
  const receiverRadius = towerRadius * 1.5;
  const haloSize = Math.max(receiverHeight, receiverRadius) * 2.4;

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Focus Tower'}
        castShadow={true}
        receiveShadow={false}
        args={[towerRadius, towerRadius, towerHeight, 6, 2]}
        position={[0, 0, towerHeight / 2 + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Center Receiver'}
        castShadow={true}
        receiveShadow={false}
        args={[receiverRadius, receiverRadius, receiverHeight, 10, 2]}
        position={[0, 0, towerHeight + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      {/* simple glow effect to create a halo */}
      {sunDirection.z > 0 && (
        <mesh position={[0, 0, towerHeight + lz / 2]}>
          <sprite scale={[haloSize, haloSize, haloSize]}>
            <spriteMaterial
              map={glowTexture}
              transparent={false}
              color={0xffffff}
              blending={AdditiveBlending}
              depthWrite={false} // this must be set to hide the rectangle of the texture image
            />
          </sprite>
        </mesh>
      )}
    </group>
  );
});

export default SolarPowerTower;
