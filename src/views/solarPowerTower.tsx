/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder, useTexture } from '@react-three/drei';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import { getSunDirection } from '../analysis/sunTools';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import GlowImage from '../resources/glow.png';
import { AdditiveBlending } from 'three';

const SolarPowerTower = React.memo(({ foundation }: { foundation: FoundationModel }) => {
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);
  const glowTexture = useTexture(GlowImage);

  const { lz, solarPowerTower } = foundation;

  const towerRadius = solarPowerTower?.towerRadius ?? 1;
  const towerHeight = solarPowerTower?.towerHeight ?? 20;
  const receiverHeight = towerHeight / 10;
  const receiverRadius = towerRadius * 1.5;

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
        {sunDirection.z > 0 ? (
          <meshBasicMaterial color={[1, 1, 1]} toneMapped={false} />
        ) : (
          <meshStandardMaterial color={'white'} />
        )}
      </Cylinder>

      {sunDirection.z > 0 && (
        <sprite scale={[10, 10, 10]} position={[0, 0, towerHeight + lz / 2]}>
          <spriteMaterial map={glowTexture} color={'white'} blending={AdditiveBlending} depthWrite={false} />
        </sprite>
      )}
    </group>
  );
});

export default SolarPowerTower;
