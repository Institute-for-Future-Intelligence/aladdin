/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Cylinder, useTexture } from '@react-three/drei';
import { AdditiveBlending, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import GlowImage from '../resources/glow.png';

const SolarUpdraftTower = ({ foundation, sunDirection }: { foundation: FoundationModel; sunDirection: Vector3 }) => {
  const glowTexture = useTexture(GlowImage);

  const {
    lz,
    solarTowerRadius = 0.5,
    solarReceiverHeight = 20,
    solarTowerCentralReceiverRadius,
    solarTowerCentralReceiverHeight = 2,
  } = foundation;

  const haloSize = solarTowerCentralReceiverHeight * 2 + 1;

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Focus Tower'}
        castShadow={false}
        receiveShadow={false}
        args={[solarTowerRadius, solarTowerRadius, solarReceiverHeight, 6, 2]}
        position={[0, 0, solarReceiverHeight / 2 + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Center Receiver'}
        castShadow={false}
        receiveShadow={false}
        args={[
          solarTowerCentralReceiverRadius,
          solarTowerCentralReceiverRadius,
          solarTowerCentralReceiverHeight,
          10,
          2,
        ]}
        position={[0, 0, solarReceiverHeight + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      {/* simple glow effect to create a halo */}
      {sunDirection.z > 0 && (
        <mesh position={[0, 0, solarReceiverHeight + lz / 2]}>
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
};

export default React.memo(SolarUpdraftTower);
