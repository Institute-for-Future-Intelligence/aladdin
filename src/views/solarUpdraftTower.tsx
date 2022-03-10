/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Circle, Cylinder } from '@react-three/drei';
import { Color, DoubleSide, FrontSide } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI, TWO_PI } from '../constants';

const SolarUpdraftTower = ({ foundation }: { foundation: FoundationModel }) => {
  const {
    lx,
    ly,
    lz,
    solarUpdraftTowerChimneyRadius,
    solarUpdraftTowerChimneyHeight,
    solarUpdraftTowerCollectorRadius,
    solarUpdraftTowerCollectorHeight,
  } = foundation;

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Updraft Tower Chimney'}
        castShadow={true}
        receiveShadow={false}
        args={[
          solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          solarUpdraftTowerChimneyHeight ?? Math.max(lx, ly),
          16,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTowerChimneyHeight ?? Math.max(lx, ly)) / 2 + lz]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Greenhouse Wall'}
        castShadow={false}
        receiveShadow={false}
        args={[
          solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2,
          solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2,
          solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz),
          50,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz)) / 2 + lz]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
      </Cylinder>
      <Circle
        userData={{ unintersectable: true }}
        name={'Greenhouse Ceiling'}
        castShadow={false}
        receiveShadow={false}
        args={[solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2, 50, 0, TWO_PI]}
        position={[0, 0, lz + (solarUpdraftTowerCollectorHeight ?? 5 * lz)]}
      >
        <meshPhongMaterial
          attach="material"
          specular={new Color('white')}
          shininess={50}
          side={FrontSide}
          color={'lightskyblue'}
          transparent={true}
          opacity={0.5}
        />
      </Circle>
    </group>
  );
};

export default React.memo(SolarUpdraftTower);
