/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Circle, Cone, Cylinder, Line } from '@react-three/drei';
import { Color, DoubleSide, Euler, FrontSide, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI, TWO_PI } from '../constants';
import { LineData } from './LineData';

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

  const streamlines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    const airInletZ = ((solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz)) + lz) / 2;
    const airOutletZ = solarUpdraftTowerChimneyHeight ?? Math.max(lx, ly);
    const collectorRadius = solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2;
    const chimneyRadius = solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly));
    const airInletR1 = collectorRadius * 1.1;
    const airInletR2 = chimneyRadius * 0.5;
    const airOutletR1 = chimneyRadius;
    const airOutletR2 = chimneyRadius * 2;
    const airOutletR3 = chimneyRadius * 4;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const angle = (TWO_PI / n) * i;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const line: Vector3[] = [];
      line.push(new Vector3(airInletR1 * cos, airInletR1 * sin, airInletZ));
      line.push(new Vector3(airInletR2 * cos, airInletR2 * sin, airInletZ));
      line.push(new Vector3(airInletR2 * cos, airInletR2 * sin, airOutletZ));
      line.push(new Vector3(airOutletR1 * cos, airOutletR1 * sin, airOutletZ * 1.02));
      line.push(new Vector3(airOutletR2 * cos, airOutletR2 * sin, airOutletZ * 1.04));
      line.push(new Vector3(airOutletR3 * cos, airOutletR3 * sin, airOutletZ * 1.06));
      array.push({ points: line } as LineData);
    }
    return array;
  }, [
    lx,
    ly,
    lz,
    solarUpdraftTowerCollectorRadius,
    solarUpdraftTowerCollectorHeight,
    solarUpdraftTowerChimneyRadius,
    solarUpdraftTowerChimneyHeight,
  ]);

  const gridLines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    const h = (solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz)) + lz;
    const r = solarUpdraftTowerCollectorRadius ?? Math.min(lx, ly) / 2;
    const n = 25;
    const delta = (2 * r) / n;
    for (let i = 0; i <= n; i++) {
      const line: Vector3[] = [];
      const y = -r + i * delta;
      const x = Math.sqrt(r * r - y * y);
      line.push(new Vector3(-x, y, h));
      line.push(new Vector3(x, y, h));
      array.push({ points: line } as LineData);
    }
    for (let i = 0; i <= n; i++) {
      const line: Vector3[] = [];
      const x = -r + i * delta;
      const y = Math.sqrt(r * r - x * x);
      line.push(new Vector3(x, -y, h));
      line.push(new Vector3(x, y, h));
      array.push({ points: line } as LineData);
    }
    return array;
  }, [lx, ly, lz, solarUpdraftTowerCollectorRadius, solarUpdraftTowerCollectorHeight]);

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Chimney'}
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
        name={'Chimney Base'}
        castShadow={true}
        receiveShadow={false}
        args={[
          solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          (solarUpdraftTowerChimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly))) * 1.6,
          (solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz)) * 4,
          16,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTowerCollectorHeight ?? Math.max(3, 10 * lz)) * 2 + lz]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
      </Cylinder>
      <Cylinder
        userData={{ unintersectable: true }}
        name={'Greenhouse Wall'}
        castShadow={true}
        receiveShadow={true}
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
      {gridLines &&
        gridLines.map((lineData, index) => {
          return (
            <Line
              key={index}
              name={'Greenhouse Roof Grid Lines'}
              userData={{ unintersectable: true }}
              points={lineData.points}
              castShadow={false}
              receiveShadow={false}
              lineWidth={0.2}
              color={'gray'}
            />
          );
        })}
      {streamlines &&
        streamlines.map((lineData, index) => {
          const x2 = lineData.points[0].x + lineData.points[1].x;
          const y2 = lineData.points[0].y + lineData.points[1].y;
          const angle = new Euler(0, 0, (TWO_PI * index) / streamlines.length + HALF_PI);
          return (
            <React.Fragment key={index}>
              <Line
                name={'Streamlines'}
                userData={{ unintersectable: true }}
                points={lineData.points}
                castShadow={false}
                receiveShadow={false}
                lineWidth={0.25}
                dashed={true}
                dashSize={3}
                gapSize={1}
                color={'white'}
              />
              <Cone
                userData={{ unintersectable: true }}
                args={[2, 8, 4, 2]}
                name={'Streamline Inlet Arrow Head'}
                position={[x2 * 0.1, y2 * 0.1, lineData.points[0].z]}
                rotation={angle}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cone>
              <Cone
                userData={{ unintersectable: true }}
                args={[2, 8, 4, 2]}
                name={'Streamline Inlet Arrow Head'}
                position={[x2 * 0.9, y2 * 0.9, lineData.points[0].z]}
                rotation={angle}
              >
                <meshStandardMaterial attach="material" color={'white'} />
              </Cone>
            </React.Fragment>
          );
        })}
    </group>
  );
};

export default React.memo(SolarUpdraftTower);
