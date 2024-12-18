/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { Cylinder, Plane, useTexture } from '@react-three/drei';
import { DoubleSide, Euler, Group, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI } from '../constants';
import { useStore } from 'src/stores/common';
import * as Selector from '../stores/selector';
import { getSunDirection } from 'src/analysis/sunTools';
import GlowImage_Cylinderic from '../resources/glow_cylinderic.png';
import GlowImage_Corner from '../resources/glow_corner.png';
import { AdditiveBlending } from 'three';
import { useFrame } from '@react-three/fiber';

const SolarReceiverPipe = React.memo(({ foundation }: { foundation: FoundationModel }) => {
  const { ly, lz, solarAbsorberPipe } = foundation;

  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);
  const glowTexture = useTexture(GlowImage_Cylinderic);
  const glowTexture_2 = useTexture(GlowImage_Corner);
  const haloGroupRef = useRef<Group>(null!);

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

  useFrame(({ camera }) => {
    if (!haloGroupRef.current) return;
    const worldPosition = haloGroupRef.current.localToWorld(new Vector3(0, 0, 0));
    const cameraLocalPosition = new Vector3()
      .subVectors(camera.position, worldPosition)
      .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
    const rot = Math.atan2(cameraLocalPosition.z, cameraLocalPosition.x);
    haloGroupRef.current.rotation.y = -Math.PI / 2 - rot;
  });

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
      >
        {sunDirection.z > 0 ? (
          <meshStandardMaterial color={[1, 1, 1]} toneMapped={false} side={DoubleSide} />
        ) : (
          <meshStandardMaterial color={'white'} side={DoubleSide} />
        )}
      </Cylinder>

      {sunDirection.z > 0 && (
        <group ref={haloGroupRef} position={[0, 0, absorberHeight + lz / 2 - apertureWidth / 4]}>
          <Plane args={[2, relativeLength * ly + apertureWidth / 2]}>
            <meshBasicMaterial
              side={DoubleSide}
              map={glowTexture}
              color={'white'}
              blending={AdditiveBlending}
              transparent
            />
          </Plane>
          <Plane
            args={[1, 1]}
            rotation={[0, 0, Math.PI]}
            position={[0.5, 0.5 + (relativeLength * ly + apertureWidth / 2) / 2, 0]}
          >
            <meshBasicMaterial
              side={DoubleSide}
              map={glowTexture_2}
              color={'white'}
              blending={AdditiveBlending}
              transparent
            />
          </Plane>
          <Plane
            args={[1, 1]}
            rotation={[0, 0, -Math.PI / 2]}
            position={[-0.5, 0.5 + (relativeLength * ly + apertureWidth / 2) / 2, 0]}
          >
            <meshBasicMaterial
              side={DoubleSide}
              map={glowTexture_2}
              color={'white'}
              blending={AdditiveBlending}
              transparent
            />
          </Plane>
          <Plane
            args={[1, 1]}
            rotation={[0, 0, Math.PI / 2]}
            position={[0.5, -0.5 - (relativeLength * ly + apertureWidth / 2) / 2, 0]}
          >
            <meshBasicMaterial
              side={DoubleSide}
              map={glowTexture_2}
              color={'white'}
              blending={AdditiveBlending}
              transparent
            />
          </Plane>
          <Plane args={[1, 1]} position={[-0.5, -0.5 - (relativeLength * ly + apertureWidth / 2) / 2, 0]}>
            <meshBasicMaterial
              side={DoubleSide}
              map={glowTexture_2}
              color={'white'}
              blending={AdditiveBlending}
              transparent
            />
          </Plane>
        </group>
      )}
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
