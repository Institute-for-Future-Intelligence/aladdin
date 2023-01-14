/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { useStore } from 'src/stores/common';
import { DoubleSide, Euler, Material, Shape, Vector3 } from 'three';
import { ArchedWireframe } from '../window/archedWindow';
import { WireframeDataType } from '../window/window';
import * as Selector from 'src/stores/selector';
import { Cone, Line } from '@react-three/drei';
import { Util } from '../../Util';
import { useDataStore } from '../../stores/commonData';

interface ArchedDoorProps {
  id: string;
  dimension: number[];
  color: string;
  selected: boolean;
  locked: boolean;
  material: Material;
  filled: boolean;
  showHeatFluxes: boolean;
  area: number;
}

const ArchedDoor = React.memo(
  ({ id, dimension, color, selected, locked, material, filled, showHeatFluxes, area }: ArchedDoorProps) => {
    const world = useStore.getState().world;
    const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
    const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
    const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
    const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
    const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);

    const heatFluxArrowHead = useRef<number>(0);
    const heatFluxEuler = useRef<Euler>();

    const [lx, ly, lz, archHeight] = dimension;

    const pointWithinArch = (x: number, z: number) => {
      if (archHeight > 0) {
        const hx = 0.5 * lx;
        const hz = 0.5 * lz;
        const ah = Math.min(archHeight, lz, hx); // actual arch height
        const r = 0.5 * (ah + (hx * hx) / ah); // arc radius
        // check if the point is within the rectangular part
        if (Math.abs(x) < hx && z < hz - ah && z > -hz) {
          return true;
        }
        // check if the point is within the arch part
        const dz = z - (lz - r - hz);
        return x * x + dz * dz < r * r;
      }
      return true;
    };

    const heatFluxes: Vector3[][] | undefined = useMemo(() => {
      if (!showHeatFluxes) return undefined;
      const heat = hourlyHeatExchangeArrayMap.get(id);
      if (!heat) return undefined;
      const sum = heat.reduce((a, b) => a + b, 0);
      if (area === 0) return undefined;
      const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
      const nx = Math.max(2, Math.round(lx / cellSize));
      const nz = Math.max(2, Math.round(lz / cellSize));
      const dx = lx / nx;
      const dz = lz / nz;
      const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
      heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
      heatFluxEuler.current = Util.getEuler(UNIT_VECTOR_POS_Z, UNIT_VECTOR_POS_Y, Math.sign(intensity) * HALF_PI);
      const vectors: Vector3[][] = [];
      if (intensity < 0) {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            if (pointWithinArch(rx, rz)) {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, intensity, rz));
              vectors.push(v);
            }
          }
        }
      } else {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            if (pointWithinArch(rx, rz)) {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, -intensity, rz));
              vectors.push(v);
            }
          }
        }
      }
      return vectors;
    }, [id, dimension, showHeatFluxes, heatFluxScaleFactor]);

    const doorShape = useMemo(() => {
      const s = new Shape();
      const hx = lx / 2;
      const hz = lz / 2;
      const ah = Math.min(archHeight, lz, hx);
      s.moveTo(hx, -hz);
      s.lineTo(hx, hz - ah);
      if (ah > 0.1) {
        const r = ah / 2 + lx ** 2 / (8 * ah);
        const [cX, cY] = [0, hz - r];
        const startAngle = Math.acos(Math.min(hx / r, 1));
        const endAngle = Math.PI - startAngle;
        s.absarc(cX, cY, r, startAngle, endAngle, false);
      } else {
        s.lineTo(-hx, hz);
      }
      s.lineTo(-hx, -hz);

      if (!filled) {
        const ihx = lx * 0.4;
        const ihz = lz * 0.4;
        const iah = Math.min(archHeight * 0.8, lz * 0.8, hx * 0.8);
        s.lineTo(-ihx, -hz);
        if (iah > 0.1) {
          s.lineTo(-ihx, hz - iah);
          const r = iah / 2 + (lx * 0.8) ** 2 / (8 * iah);
          const [cX, cY] = [0, ihz - r];
          const startAngle = Math.acos(Math.min(ihx / r, 1));
          const endAngle = Math.PI - startAngle;
          s.absarc(cX, cY, r, endAngle, startAngle, true);
        } else {
          s.lineTo(-ihx, ihz);
          s.lineTo(ihx, ihz);
        }
        s.lineTo(ihx, -hz);
      }
      s.closePath();
      return s;
    }, [lx, lz, archHeight, filled]);

    const wireframeData = useMemo(() => {
      const lineWidth = locked && selected ? 0.2 : 0.1;
      return { lineColor: 'black', lineWidth, opacity: 1, selected, locked } as WireframeDataType;
    }, [selected, locked]);

    return (
      <group name={'Arched door group'}>
        <mesh
          name={'Arched Door Mesh'}
          rotation={[HALF_PI, 0, 0]}
          material={material}
          castShadow={shadowEnabled && filled}
          receiveShadow={shadowEnabled && filled}
        >
          <shapeBufferGeometry args={[doorShape]} />
        </mesh>

        {filled && (
          <mesh
            name={'Arched Door Simulation Mesh'}
            rotation={[HALF_PI, 0, 0]}
            material={material}
            uuid={id}
            userData={{ simulation: true }}
            castShadow={false}
            receiveShadow={false}
            visible={false}
          >
            <shapeBufferGeometry args={[doorShape]} />
            <meshBasicMaterial side={DoubleSide} />
          </mesh>
        )}

        {filled && (
          <mesh
            name={'Door plane mesh inside'}
            position={[0, 0.1, 0]}
            rotation={[-HALF_PI, 0, Math.PI]}
            material={material}
            castShadow={shadowEnabled && filled}
            receiveShadow={shadowEnabled && filled}
          >
            <shapeBufferGeometry args={[doorShape]} />
          </mesh>
        )}

        <ArchedWireframe cy={0} dimension={dimension} wireframeData={wireframeData} />
        <ArchedWireframe cy={ly} dimension={dimension} wireframeData={wireframeData} />

        {heatFluxes &&
          heatFluxes.map((v, index) => {
            return (
              <React.Fragment key={index}>
                <Line
                  points={v}
                  name={'Heat Flux ' + index}
                  lineWidth={heatFluxWidth ?? DEFAULT_HEAT_FLUX_WIDTH}
                  color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR}
                />
                ;
                <Cone
                  userData={{ unintersectable: true }}
                  position={v[heatFluxArrowHead.current]
                    .clone()
                    .add(new Vector3(0, heatFluxArrowHead.current === 0 ? -0.1 : 0.1, 0))}
                  args={[0.06, 0.2, 4, 1]}
                  name={'Normal Vector Arrow Head'}
                  rotation={heatFluxEuler.current ?? [0, 0, 0]}
                >
                  <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
                </Cone>
              </React.Fragment>
            );
          })}
      </group>
    );
  },
);

export default ArchedDoor;
