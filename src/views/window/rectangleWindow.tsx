/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { DoubleSide, Euler, FrontSide, MeshStandardMaterial, Vector3 } from 'three';
import { Box, Cone, Cylinder, Line, Plane } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
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
import { FrameDataType, MullionDataType, Shutter, WireframeDataType } from './window';
import { ShutterProps } from 'src/models/WindowModel';
import { Util } from '../../Util';
import { useDataStore } from '../../stores/commonData';

interface RectangleWindowProps {
  id: string;
  dimension: number[];
  position: number[];
  mullionData: MullionDataType;
  frameData: FrameDataType;
  wireframeData: WireframeDataType;
  shutter: ShutterProps;
  glassMaterial: JSX.Element;
  showHeatFluxes: boolean;
  area: number;
}

interface MullionProps {
  dimension: number[];
  mullionData: MullionDataType;
  shadowEnabled: boolean;
}

interface FrameProps {
  dimension: number[];
  frameData: FrameDataType;
  shadowEnabled: boolean;
}

interface WireframeProps {
  cy: number;
  dimension: number[];
  wireframeData: WireframeDataType;
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });

const Mullion = React.memo(({ dimension, mullionData, shadowEnabled }: MullionProps) => {
  const [lx, ly, lz] = dimension;

  const {
    width: mullionWidth,
    spacingX: mullionSpacingX,
    spacingY: mullionSpacingY,
    color: mullionColor,
  } = mullionData;

  const radialSegments = 3;
  const heightSegments = 1;

  const mullionRadius = mullionWidth / 2;

  const material = useMemo(() => <meshStandardMaterial color={mullionColor} />, [mullionColor]);

  const verticalMullions = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lx / mullionSpacingX) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lx / (dividers + 1);
    let x = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      x = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, x += step) {
      arr.push(x, -x);
    }
    return arr;
  }, [lx, mullionWidth, mullionSpacingX]);

  const horizontalMullions = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lz / mullionSpacingY) - 1;
    if (dividers <= 0 || mullionWidth === 0) {
      return arr;
    }
    const step = lz / (dividers + 1);
    let z = step / 2;
    if (dividers % 2 !== 0) {
      arr.push(0);
      z = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, z += step) {
      arr.push(z, -z);
    }
    return arr;
  }, [lz, mullionWidth, mullionSpacingY]);

  return (
    <group name={'Window Mullion Group'} position={[0, -0.001, 0]}>
      {verticalMullions.map((x, index) => (
        <Cylinder
          key={index}
          position={[x, 0.00025, 0]}
          args={[mullionRadius, mullionRadius, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
      {horizontalMullions.map((z, index) => (
        <Cylinder
          key={index}
          position={[0, 0.0005, z]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
    </group>
  );
});

const Frame = React.memo(({ dimension, frameData, shadowEnabled }: FrameProps) => {
  const [lx, ly, lz] = dimension;
  const { color, width, sillWidth } = frameData;
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const halfWidth = width / 2;
  const depth = halfWidth / 2;
  const sillLength = lx + width * 3;
  const sillThickness = width;

  return (
    <group name={'Window Frame Group'} position={[0, -depth / 2, 0]}>
      {/* top */}
      <Box
        position={[0, 0, lz / 2]}
        args={[lx + 2 * width, depth, width]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* left */}
      <Box
        position={[-lx / 2 - halfWidth, 0, 0]}
        args={[width, depth, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box
        position={[lx / 2 + halfWidth, 0, 0]}
        args={[width, depth, lz]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* bottom */}
      <Box
        position={[0, 0, -lz / 2 - (sillWidth === 0 ? 0 : sillThickness / 2)]}
        args={sillWidth === 0 ? [lx + 2 * width, depth, width] : [sillLength, sillWidth ?? width, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

const Wireframe = React.memo(({ cy, dimension, wireframeData }: WireframeProps) => {
  const [lx, ly, lz] = dimension;
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const hx = lx / 2;
  const hz = lz / 2;

  const radialSegments = 3;
  const heightSegments = 1;

  const material = useMemo(() => new MeshStandardMaterial({ color: lineColor }), [lineColor]);
  const highLightMaterial = useMemo(() => new MeshStandardMaterial({ color: LOCKED_ELEMENT_SELECTION_COLOR }), []);

  const renderLines = (width: number, mat: MeshStandardMaterial) => {
    const wireframeRadius = width / 2;
    return (
      <>
        <Cylinder
          args={[width, width, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          position={[0, 0, hz - wireframeRadius]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          position={[0, 0, -hz + wireframeRadius]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[hx - wireframeRadius, 0, 0]}
          material={mat}
        />
        <Cylinder
          args={[width, width, lz, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[-hx + wireframeRadius, 0, 0]}
          material={mat}
        />
      </>
    );
  };

  return (
    <group name={'Window Wireframe Group'}>
      {opacity > 0 && <group position={[0, cy, 0]}>{renderLines(lineWidth / 20, material)}</group>}
      {locked && selected && renderLines(lineWidth / 5, highLightMaterial)}
    </group>
  );
});

const RectangleWindow = ({
  id,
  dimension,
  position,
  mullionData,
  frameData,
  wireframeData,
  shutter,
  glassMaterial,
  showHeatFluxes,
  area,
}: RectangleWindowProps) => {
  const world = useStore.getState().world;
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowEuler = useRef<Euler>();

  const [lx, ly, lz] = dimension;
  const [cx, cy, cz] = position;

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
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

  const shutterLength = useMemo(() => shutter.width * lx, [lx, shutter]);
  const shutterPosX = useMemo(
    () => ((shutterLength + frameData.width + lx) / 2) * 1.025,
    [lx, shutterLength, frameData.width],
  );

  const renderSealPlane = (args: [width: number, height: number], position: ArgsType, rotation?: ArgsType) => (
    <Plane
      name={'Window Seal Plane'}
      args={args}
      position={position}
      rotation={rotation}
      material={sealPlanesMaterial}
      receiveShadow={shadowEnabled}
      castShadow={shadowEnabled}
    />
  );

  return (
    <>
      <group name={'Rectangle Window Plane Group'} position={[0, 0.3 * ly, 0]}>
        <Plane name={'Window Glass Plane'} args={[lx, lz]} rotation={[HALF_PI, 0, 0]}>
          {glassMaterial}
        </Plane>

        {mullionData.showMullion && (
          <Mullion dimension={dimension} mullionData={mullionData} shadowEnabled={shadowEnabled} />
        )}
      </group>

      {frameData.showFrame && <Frame dimension={dimension} frameData={frameData} shadowEnabled={shadowEnabled} />}

      <Shutter
        cx={shutterPosX}
        lx={shutterLength}
        lz={lz}
        color={shutter.color}
        showLeft={shutter.showLeft}
        showRight={shutter.showRight}
        spacing={frameData.showFrame ? frameData.width / 2 : 0}
      />

      <Wireframe cy={0.3 * ly} dimension={dimension} wireframeData={wireframeData} />

      {renderSealPlane([ly, lz], [-lx / 2, ly / 2, 0], [HALF_PI, HALF_PI, 0])}
      {renderSealPlane([ly, lz], [lx / 2, ly / 2, 0], [HALF_PI, -HALF_PI, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, lz / 2], [Math.PI, 0, 0])}
      {renderSealPlane([lx, ly], [0, ly / 2, -lz / 2])}

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
                rotation={heatFluxArrowEuler.current ?? [0, 0, 0]}
              >
                <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
              </Cone>
            </React.Fragment>
          );
        })}
    </>
  );
};

export default React.memo(RectangleWindow);
