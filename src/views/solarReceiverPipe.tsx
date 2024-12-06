/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import { DoubleSide, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';
import { getSunDirection } from 'src/analysis/sunTools';

const SolarReceiverPipe = React.memo(({ foundation }: { foundation: FoundationModel }) => {
  const { ly, lz, solarAbsorberPipe } = foundation;

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);

  const absorberHeight = solarAbsorberPipe?.absorberHeight ?? 10;
  const apertureWidth = solarAbsorberPipe?.apertureWidth ?? 0.6;
  const relativeLength = solarAbsorberPipe?.relativeLength ?? 0.9;
  const poleNumber = solarAbsorberPipe?.poleNumber ?? 5;

  const solarReceiverPipePoles = useMemo<Vector3[] | undefined>(() => {
    const array: Vector3[] = [];
    const dy = (relativeLength * ly) / (poleNumber + 1);
    for (let i = 1; i <= poleNumber; i++) {
      array.push(new Vector3(0, i * dy - (relativeLength * ly) / 2, absorberHeight / 2 + lz / 2));
    }
    return array;
  }, [ly, lz, poleNumber, absorberHeight, relativeLength]);

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Receiver Vertical Pipe 1'}
        castShadow={false}
        receiveShadow={false}
        args={[apertureWidth / 4, apertureWidth / 4, absorberHeight, 6, 2]}
        position={[0, (-relativeLength * ly) / 2, absorberHeight / 2 + lz / 2]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Receiver Vertical Pipe 2'}
        castShadow={false}
        receiveShadow={false}
        args={[apertureWidth / 4, apertureWidth / 4, absorberHeight, 6, 2]}
        position={[0, (relativeLength * ly) / 2, absorberHeight / 2 + lz / 2]}
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
          apertureWidth / 2,
          apertureWidth / 2,
          relativeLength * ly + apertureWidth / 2,
          6,
          2,
          false,
          3 * HALF_PI,
          Math.PI,
        ]}
        position={[0, 0, absorberHeight + lz / 2 - apertureWidth / 4]}
        rotation={[0, 0, 0]}
      >
        {sunDirection.z > 0 ? (
          <meshBasicMaterial color={[11, 11, 11]} toneMapped={false} side={DoubleSide} />
        ) : (
          <meshStandardMaterial color={'white'} side={DoubleSide} />
        )}
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
              args={[apertureWidth / 8, apertureWidth / 8, absorberHeight, 4, 2]}
              position={p}
              rotation={[HALF_PI, 0, 0]}
            >
              <meshStandardMaterial attach="material" color={'white'} />
            </Cylinder>
          );
        })}
    </group>
  );
});

export default SolarReceiverPipe;
