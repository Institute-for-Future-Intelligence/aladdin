/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { Box, Cone, Line } from '@react-three/drei';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  LOCKED_ELEMENT_SELECTION_COLOR,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { DoubleSide, Euler, Material, Shape, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { Util } from '../../Util';
import { useDataStore } from '../../stores/commonData';
import { FoundationModel } from '../../models/FoundationModel';

interface RectangleDoorProps {
  id: string;
  dimension: number[];
  color: string;
  frameless: boolean;
  frameColor: string;
  selected: boolean;
  locked: boolean;
  material: Material;
  filled: boolean;
  showHeatFluxes: boolean;
  area: number;
  foundation: FoundationModel | null;
}

interface DoorWireFrameProps {
  dimension: number[];
  lineColor: string;
  lineWidth: number;
}

interface DoorFrameProps {
  dimension: number[];
  color: string;
}

const DoorWireFrame = React.memo(({ dimension, lineColor, lineWidth }: DoorWireFrameProps) => {
  const [hx, hy, hz] = dimension.map((val) => val / 2);
  const ul: [number, number, number] = [-hx, 0, hz + 0.05];
  const ur: [number, number, number] = [hx, 0, hz + 0.05];
  const ll: [number, number, number] = [-hx, 0, -hz];
  const lr: [number, number, number] = [hx, 0, -hz];
  return <Line points={[ll, ul, ur, lr]} lineWidth={lineWidth} color={lineColor} />;
});

const DoorFrame = React.memo(({ dimension, color }: DoorFrameProps) => {
  const [lx, ly, lz] = dimension;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const width = 0.1;
  const halfWidth = width / 2;

  return (
    <group name={'Door frame group'}>
      {/* top */}
      <Box position={[0, 0, lz / 2]} args={[lx, width, width]} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2 + halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box
        position={[lx / 2 - halfWidth, 0, 0]}
        args={[width, width, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const RectangleDoor = React.memo(
  ({
    id,
    dimension,
    color,
    frameColor,
    frameless,
    selected,
    locked,
    material,
    filled,
    area,
    showHeatFluxes,
    foundation,
  }: RectangleDoorProps) => {
    const world = useStore.getState().world;
    const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
    const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
    const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
    const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
    const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);

    const heatFluxArrowHead = useRef<number>(0);
    const heatFluxArrowEuler = useRef<Euler>();

    const [lx, ly, lz] = dimension;

    const heatFluxes: Vector3[][] | undefined = useMemo(() => {
      if (!showHeatFluxes) return undefined;
      if (foundation && foundation.notBuilding) return undefined;
      const heat = hourlyHeatExchangeArrayMap.get(id);
      if (!heat) return undefined;
      const sum = heat.reduce((a, b) => a + b, 0);
      if (area === 0) return undefined;
      const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
      const nx = Math.max(2, Math.round(lx / cellSize));
      const nz = Math.max(2, Math.round(lz / cellSize));
      const dx = lx / nx;
      const dz = lz / nz;
      const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
      heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
      heatFluxArrowEuler.current = Util.getEuler(
        UNIT_VECTOR_POS_Z,
        UNIT_VECTOR_POS_Y,
        'YXZ',
        Math.sign(intensity) * HALF_PI,
      );
      const vectors: Vector3[][] = [];
      if (intensity < 0) {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, intensity, rz));
            vectors.push(v);
          }
        }
      } else {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, -intensity, rz));
            vectors.push(v);
          }
        }
      }
      return vectors;
    }, [id, dimension, showHeatFluxes, heatFluxScaleFactor]);

    const doorShape = useMemo(() => {
      const s = new Shape();
      const [hx, hz] = [lx / 2, lz / 2];
      const width = Math.max(hx, hz) * 0.2;
      s.moveTo(-hx, -hz);
      s.lineTo(-hx, hz);
      s.lineTo(hx, hz);
      s.lineTo(hx, -hz);
      if (!filled) {
        s.lineTo(hx - width, -hz);
        s.lineTo(hx - width, hz - width);
        s.lineTo(-hx + width, hz - width);
        s.lineTo(-hx + width, -hz);
      }
      s.closePath();
      return s;
    }, [lx, lz, filled]);

    return (
      <group name={'Rectangle door group'} position={[0, -0.01, 0]}>
        <mesh
          name={'Rectangular Door Mesh'}
          rotation={[HALF_PI, 0, 0]}
          material={material}
          castShadow={shadowEnabled && filled}
          receiveShadow={shadowEnabled && filled}
        >
          <shapeGeometry args={[doorShape]} />
        </mesh>

        {filled && (
          <mesh
            name={'Rectangular Door Simulation Mesh'}
            rotation={[HALF_PI, 0, 0]}
            uuid={id}
            userData={{ simulation: true }}
            castShadow={false}
            receiveShadow={false}
            visible={false}
          >
            <shapeGeometry args={[doorShape]} />
            <meshBasicMaterial side={DoubleSide} />
          </mesh>
        )}

        {filled && (
          <mesh
            name={`Door plane inside`}
            position={[0, 0.1, 0]}
            rotation={[-HALF_PI, 0, Math.PI]}
            material={material}
            castShadow={shadowEnabled && filled}
            receiveShadow={shadowEnabled && filled}
          >
            <shapeGeometry args={[doorShape]} />
          </mesh>
        )}

        <DoorWireFrame
          dimension={dimension}
          lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : 'black'}
          lineWidth={selected && locked ? 2 : 0.2}
        />

        {!frameless && <DoorFrame dimension={dimension} color={frameColor} />}

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
                <Cone
                  userData={{ unintersectable: true }}
                  position={v[heatFluxArrowHead.current]
                    .clone()
                    .add(new Vector3(0, heatFluxArrowHead.current === 0 ? -0.1 : 0.1, 0))}
                  args={[0.06, 0.2, 4, 1]}
                  name={'Normal Vector Arrow Head'}
                  rotation={heatFluxArrowEuler.current ?? [0, 0, 0]}
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

export default RectangleDoor;
