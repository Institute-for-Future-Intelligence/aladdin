/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Cone, Cylinder, Line } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, Euler, FrontSide, Group, Vector3 } from 'three';
import { FoundationModel } from '../models/FoundationModel';
import { HALF_PI, TWO_PI } from '../constants';
import { LineData } from './LineData';
import { getSunDirection } from '../analysis/sunTools';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { useFrame } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { Util } from '../Util';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';

const SolarUpdraftTower = React.memo(({ foundation }: { foundation: FoundationModel }) => {
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const animate = usePrimitiveStore(Selector.animateSun);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const simulationPaused = usePrimitiveStore(Selector.simulationPaused);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);

  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const streamlinesRef = useRef<Group>(null);

  const { lx, ly, lz, solarUpdraftTower } = foundation;

  const arrowRadius = (solarUpdraftTower?.collectorRadius ?? 100) * 0.016;
  const sunDirection = useMemo(() => {
    return getSunDirection(new Date(date), latitude);
  }, [date, latitude]);

  const streamlines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    const airInletZ = ((solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz)) + lz) / 2;
    const airOutletZ = solarUpdraftTower?.chimneyHeight ?? Math.max(lx, ly);
    const collectorRadius = solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2;
    const chimneyRadius = solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly));
    const airInletR1 = collectorRadius * 1.15;
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
    solarUpdraftTower?.collectorRadius,
    solarUpdraftTower?.collectorHeight,
    solarUpdraftTower?.chimneyRadius,
    solarUpdraftTower?.chimneyHeight,
  ]);

  const gridLines = useMemo<LineData[]>(() => {
    const array: LineData[] = [];
    const h = (solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz)) + lz;
    const r = solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2;
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
  }, [lx, ly, lz, solarUpdraftTower?.collectorRadius, solarUpdraftTower?.collectorHeight]);

  useEffect(() => {
    if (foundation && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(foundation.id + '-sut');
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useFrame((state, delta) => {
    if ((animate || (simulationInProgress && !simulationPaused)) && sunDirection.z > 0) {
      if (streamlinesRef.current) {
        streamlinesRef.current.children.forEach((child) => {
          if (child.name === 'Streamlines') {
            const line = child as Line2;
            line.material.uniforms.dashOffset.value -= delta * arrowRadius * 10;
          }
        });
      }
    }
  });

  return (
    <group>
      <Cylinder
        userData={{ unintersectable: true, simulation: true }}
        name={'Chimney'}
        castShadow={true}
        receiveShadow={false}
        args={[
          solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          solarUpdraftTower?.chimneyHeight ?? Math.max(lx, ly),
          16,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTower?.chimneyHeight ?? Math.max(lx, ly)) / 2 + lz]}
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
          solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly)),
          (solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(lx, ly))) * 1.6,
          (solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz)) * 4,
          16,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz)) * 2 + lz]}
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
          solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2,
          solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2,
          solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz),
          50,
          2,
          true,
        ]}
        position={[0, 0, (solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz)) / 2 + lz]}
        rotation={[HALF_PI, 0, 0]}
      >
        <meshStandardMaterial attach="material" color={'white'} side={DoubleSide} />
      </Cylinder>
      <Circle
        uuid={foundation.id + '-sut'}
        userData={{ unintersectable: true, simulation: true }}
        name={'Greenhouse Ceiling'}
        castShadow={false}
        receiveShadow={false}
        args={[solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2, 50, 0, TWO_PI]}
        position={[0, 0, lz + (solarUpdraftTower?.collectorHeight ?? Math.max(3, 10 * lz))]}
      >
        {showSolarRadiationHeatmap && heatmapTexture ? (
          <meshBasicMaterial attach="material" side={FrontSide} map={heatmapTexture} />
        ) : (
          <meshPhongMaterial
            attach="material"
            specular={new Color('white')}
            shininess={50}
            side={FrontSide}
            color={'lightskyblue'}
            transparent={true}
            opacity={0.75}
          />
        )}
      </Circle>
      <Circle
        userData={{ unintersectable: true }}
        name={'Greenhouse Ground'}
        castShadow={false}
        receiveShadow={true}
        args={[solarUpdraftTower?.collectorRadius ?? Math.min(lx, ly) / 2, 50, 0, TWO_PI]}
        position={[0, 0, 0.1]}
      >
        <meshStandardMaterial attach="material" color={'dimgray'} />
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
      {sunDirection.z > 0 && streamlines && (
        <group ref={streamlinesRef}>
          {streamlines.map((lineData, index) => {
            const x2 = lineData.points[0].x + lineData.points[1].x;
            const y2 = lineData.points[0].y + lineData.points[1].y;
            const angle = new Euler(0, 0, (TWO_PI * index) / streamlines.length + HALF_PI);
            const dashSize = arrowRadius;
            const gapSize = arrowRadius;
            return (
              <React.Fragment key={index}>
                <Line
                  name={'Streamlines'}
                  userData={{ unintersectable: true }}
                  points={lineData.points}
                  castShadow={false}
                  receiveShadow={false}
                  lineWidth={0.5}
                  dashed={true}
                  dashSize={dashSize}
                  gapSize={gapSize}
                  color={'white'}
                />
                <Cone
                  userData={{ unintersectable: true }}
                  args={[arrowRadius, arrowRadius * 4, 4, 2]}
                  name={'Streamline Inlet Arrow Head'}
                  position={[x2 * 0.1, y2 * 0.1, lineData.points[0].z]}
                  rotation={angle}
                >
                  <meshStandardMaterial attach="material" color={'white'} />
                </Cone>
                <Cone
                  userData={{ unintersectable: true }}
                  args={[arrowRadius, arrowRadius * 4, 4, 2]}
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
      )}
    </group>
  );
});

export default SolarUpdraftTower;
