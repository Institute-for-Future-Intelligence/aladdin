/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import { DoubleSide, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';

const SolarReceiverPipe = ({ foundation }: { foundation: FoundationModel }) => {
  const {
    ly,
    lz,
    solarReceiverHeight = 10,
    solarReceiverApertureWidth = 0.6,
    solarReceiverPipeRelativeLength = 0.9,
    solarReceiverPipePoleNumber = 5,
  } = foundation;

  const solarReceiverPipePoles = useMemo<Vector3[] | undefined>(() => {
    const array: Vector3[] = [];
    const dy = (solarReceiverPipeRelativeLength * ly) / (solarReceiverPipePoleNumber + 1);
    for (let i = 1; i <= solarReceiverPipePoleNumber; i++) {
      array.push(new Vector3(0, i * dy - (solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2));
    }
    return array;
  }, [ly, lz, solarReceiverPipePoleNumber, solarReceiverHeight, solarReceiverPipeRelativeLength]);

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Receiver Vertical Pipe 1'}
        castShadow={false}
        receiveShadow={false}
        args={[solarReceiverApertureWidth / 4, solarReceiverApertureWidth / 4, solarReceiverHeight, 6, 2]}
        position={[0, (-solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Receiver Vertical Pipe 2'}
        castShadow={false}
        receiveShadow={false}
        args={[solarReceiverApertureWidth / 4, solarReceiverApertureWidth / 4, solarReceiverHeight, 6, 2]}
        position={[0, (solarReceiverPipeRelativeLength * ly) / 2, solarReceiverHeight / 2 + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Receiver Horizontal Pipe'}
        castShadow={false}
        receiveShadow={false}
        args={[
          solarReceiverApertureWidth / 2,
          solarReceiverApertureWidth / 2,
          solarReceiverPipeRelativeLength * ly + solarReceiverApertureWidth / 2,
          6,
          2,
          false,
          3 * HALF_PI,
          Math.PI,
        ]}
        position={[0, 0, solarReceiverHeight + lz / 2 - solarReceiverApertureWidth / 4]}
        rotation={[0, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
      </Cylinder>
      {/* draw poles */}
      {solarReceiverPipePoles &&
        solarReceiverPipePoles.map((p, i) => {
          return (
            <Cylinder
              userData={{ unintersectable: true }}
              key={i}
              name={'Solar Receiver Pole ' + i}
              castShadow={false}
              receiveShadow={false}
              args={[solarReceiverApertureWidth / 8, solarReceiverApertureWidth / 8, solarReceiverHeight, 4, 2]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={'white'} />
            </Cylinder>
          );
        })}
    </group>
  );
};

export default React.memo(SolarReceiverPipe);
