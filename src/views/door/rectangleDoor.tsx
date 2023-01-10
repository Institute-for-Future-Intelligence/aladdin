/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Box, Line, Plane } from '@react-three/drei';
import { DEFAULT_HEAT_FLUX_SCALE_FACTOR, HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { DoubleSide, Material, Shape, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from '../../stores/commonPrimitive';

interface RectangleDoorProps {
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
  ({ id, dimension, color, selected, locked, material, filled, area, showHeatFluxes }: RectangleDoorProps) => {
    const world = useStore.getState().world;
    const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
    const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
    const hourlyHeatExchangeArrayMap = usePrimitiveStore(Selector.hourlyHeatExchangeArrayMap);

    const [lx, ly, lz] = dimension;

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
      const arrowLength = 0.1;
      const arrowLengthHalf = arrowLength / 2;
      const vectors: Vector3[][] = [];
      if (intensity < 0) {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, intensity, rz));
            v.push(new Vector3(rx, intensity + arrowLength, rz - arrowLengthHalf));
            v.push(new Vector3(rx, intensity, rz));
            v.push(new Vector3(rx, intensity + arrowLength, rz + arrowLengthHalf));
            vectors.push(v);
          }
        }
      } else {
        for (let kx = 0; kx < nx; kx++) {
          for (let kz = 0; kz < nz; kz++) {
            const v: Vector3[] = [];
            const rx = (kx - nx / 2 + 0.5) * dx;
            const rz = (kz - nz / 2 + 0.5) * dz;
            v.push(new Vector3(rx, -arrowLength, rz - arrowLengthHalf));
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, -arrowLength, rz + arrowLengthHalf));
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, -intensity, rz));
            vectors.push(v);
          }
        }
      }
      return vectors;
    }, [id, dimension, showHeatFluxes]);

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
          <shapeBufferGeometry args={[doorShape]} />
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
            <shapeBufferGeometry args={[doorShape]} />
            <meshBasicMaterial side={DoubleSide} />
          </mesh>
        )}

        {filled && (
          <Plane
            name={`Door plane inside`}
            args={[lx, lz]}
            position={[0, 0.1, 0]}
            rotation={[-HALF_PI, 0, Math.PI]}
            material={material}
            castShadow={shadowEnabled && filled}
            receiveShadow={shadowEnabled && filled}
          />
        )}

        <DoorWireFrame
          dimension={dimension}
          lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : 'black'}
          lineWidth={selected && locked ? 2 : 0.2}
        />

        <DoorFrame dimension={dimension} color={color} />

        {heatFluxes &&
          heatFluxes.map((v, index) => {
            return <Line key={index} points={v} name={'Heat Flux ' + index} lineWidth={1} color={'gray'} />;
          })}
      </group>
    );
  },
);

export default RectangleDoor;
