/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { CatmullRomCurve3, EllipseCurve, FrontSide, MeshStandardMaterial, Shape, Vector3 } from 'three';
import { Box, Cylinder, Extrude, Line, Plane } from '@react-three/drei';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR } from 'src/constants';
import { FrameDataType, MullionDataType, Shutter, WireframeDataType } from './window';
import { ShutterProps } from 'src/models/WindowModel';
import { usePrimitiveStore } from '../../stores/commonPrimitive';

interface ArchedWindowProps {
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

interface ArchedWireframeProps {
  cy: number;
  dimension: number[];
  wireframeData: WireframeDataType;
  drawBottom?: boolean;
}

type ArgsType = [x: number, y: number, z: number];

const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: FrontSide });

const Mullion = React.memo(({ dimension, mullionData, shadowEnabled }: MullionProps) => {
  const [lx, ly, lz, archHeight] = dimension;
  const ah = Math.min(archHeight, lz, lx / 2);

  const { width, spacingX, spacingY, color } = mullionData;

  const radialSegments = 3;
  const heightSegments = 1;
  const mullionRadius = width / 2;
  const radialMullionAngle = useMemo(() => Math.atan2(lx / 2, ah), [lx, ah]);
  const radialMullionLength = useMemo(() => {
    const r = ah / 2 + lx ** 2 / (8 * ah);
    const a = r - ah;
    if (a === 0) {
      return r;
    }
    const angle = Math.PI - radialMullionAngle;
    const aSquare = a ** 2;
    const bSquare = r ** 2;
    const cSquare =
      aSquare +
      bSquare -
      2 * aSquare * Math.sin(angle) ** 2 -
      2 * a * Math.sqrt((bSquare - aSquare * Math.sin(angle) ** 2) * Math.cos(angle) ** 2);
    return Math.sqrt(cSquare);
  }, [lx, ah, radialMullionAngle]);

  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const drawArchMullionShape = (radius: number) => {
    return new Shape()
      .moveTo(0, radius)
      .quadraticCurveTo(radius, radius, radius, 0)
      .quadraticCurveTo(radius, -radius, 0, -radius)
      .quadraticCurveTo(-radius, -radius, -radius, 0)
      .quadraticCurveTo(-radius, radius, 0, radius);
  };

  const drawArchMullionPath = (ah: number, x: number) => {
    const h = (ah * x) / (lx / 2);
    const r = h / 2 + (x * 2) ** 2 / (8 * h);
    const startAngle = Math.acos(x / r);
    const endAngle = Math.PI - startAngle;
    const points = new EllipseCurve(0, h - r, r, r, startAngle, endAngle, false, 0)
      .getPoints(24)
      .map((v2) => new Vector3(v2.x, v2.y));
    return new CatmullRomCurve3(points);
  };

  const verticalMullions = useMemo(() => {
    const arr: number[] = [];
    const dividers = Math.round(lx / spacingX) - 1;
    if (dividers <= 0 || width === 0) {
      return null;
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
  }, [lx, width, spacingX]);

  const horizontalMullions = useMemo(() => {
    const arr: number[] = [];
    if (width === 0) {
      return arr;
    }
    const top = lz / 2 - ah; // include
    const totalDist = lz - ah;
    const number = Math.ceil(totalDist / spacingY);
    let curr = top;
    for (let i = 0; i < number; i++) {
      arr.push(curr);
      curr -= spacingY;
    }
    return arr;
  }, [lx, lz, ah, width, spacingY]);

  const archMullions = useMemo(() => {
    const arr: number[] = [];

    const dividers = Math.round(lx / spacingX) - 1;
    if (dividers <= 0 || width === 0) {
      return null;
    }
    const step = lx / (dividers + 1);
    let x = step / 2;
    if (dividers % 2 !== 0) {
      x = step;
    }
    for (let num = 0; num < Math.floor(dividers / 2); num++, x += step) {
      if (x !== 0) {
        arr.push(x);
      }
    }

    const shape = drawArchMullionShape(mullionRadius);

    return arr.map((x, idx) => {
      if (ah < lx / 4 && idx % 2 === 1) {
        return null;
      }
      if (ah < lx / 6 && idx % 3 !== 0) {
        return null;
      }
      return { shape, path: drawArchMullionPath(ah, x) };
    });
  }, [lx, lz, ah, width, spacingX]);

  const renderRadialMullion = (length: number, angle: number) => {
    return (
      <group position={[0, 0, lz / 2 - ah]} rotation={[0, angle, 0]}>
        <Cylinder
          position={[0, 0, length / 2]}
          args={[mullionRadius, mullionRadius, length, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      </group>
    );
  };

  return (
    <group name={'Window Mullion Group'} position={[0, -0.001, 0]}>
      {horizontalMullions.map((z, index) => (
        <Cylinder
          key={index}
          position={[0, 0, z]}
          args={[mullionRadius, mullionRadius, lx, radialSegments, heightSegments]}
          rotation={[0, 0, HALF_PI]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
      {verticalMullions?.map((x, index) => (
        <Cylinder
          key={index}
          position={[x, 0, -ah / 2]}
          args={[mullionRadius, mullionRadius, lz - ah, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          receiveShadow={shadowEnabled}
          castShadow={shadowEnabled}
        >
          {material}
        </Cylinder>
      ))}
      {ah > 0 &&
        archMullions?.map((item, index) => {
          if (item === null) return null;
          const { shape, path } = item;
          return (
            <Extrude
              key={index}
              position={[0, mullionRadius / 2, lz / 2 - ah]}
              rotation={[HALF_PI, 0, 0]}
              args={[shape, { extrudePath: path, steps: 12, bevelEnabled: false }]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
            >
              {material}
            </Extrude>
          );
        })}

      {renderRadialMullion(ah, 0)}
      {renderRadialMullion(radialMullionLength, radialMullionAngle)}
      {renderRadialMullion(radialMullionLength, -radialMullionAngle)}
    </group>
  );
});

const Frame = React.memo(({ dimension, frameData, shadowEnabled }: FrameProps) => {
  const [lx, ly, lz, archHeight] = dimension;
  const hx = lx / 2;
  const ah = Math.min(archHeight, lz, hx);

  const { color, width } = frameData;
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const halfWidth = width / 2;
  const depth = halfWidth / 2;

  const sillLength = lx + width * 3;
  const sillThickness = width;
  const sillDepth = width;

  const archedFrameShape = useMemo(() => {
    const [x1, x2] = [hx + width, hx];

    const h1 = ah + width;
    const r1 = h1 / 2 + (x1 * 2) ** 2 / (8 * h1);
    const startAngle1 = Math.acos(x1 / r1);
    const endAngle1 = Math.PI - startAngle1;
    const y1 = h1 - r1;

    const h2 = ah;
    const r2 = h2 / 2 + (x2 * 2) ** 2 / (8 * h2);
    const startAngle2 = Math.acos(x2 / r2);
    const endAngle2 = Math.PI - startAngle2;
    const y2 = h2 - r2;

    const points1 = new EllipseCurve(0, y1, r1, r1, startAngle1, endAngle1, false, 0).getPoints(36);
    const points2 = new EllipseCurve(0, y2, r2, r2, endAngle2, startAngle2, true, 0).getPoints(36);

    return new Shape([...points1, ...points2]);
  }, [archHeight, lz, lx, width]);

  return (
    <group name={'Window Frame Group'} position={[0, -depth / 2, 0]}>
      {/* top */}
      {ah > 0.1 ? (
        <Extrude
          position={[0, depth / 2, lz / 2 - ah]}
          rotation={[HALF_PI, 0, 0]}
          args={[archedFrameShape, { depth, steps: 1, bevelEnabled: false }]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          {material}
        </Extrude>
      ) : (
        <Box
          position={[0, 0, lz / 2]}
          args={[lx + 2 * width, depth, width]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          {material}
        </Box>
      )}

      {/* left */}
      <Box
        position={[-lx / 2 - halfWidth, 0, -ah / 2]}
        args={[width, depth, lz - ah]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* right */}
      <Box
        position={[lx / 2 + halfWidth, 0, -ah / 2]}
        args={[width, depth, lz - ah]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>

      {/* bottom */}
      <Box
        position={[0, 0, -lz / 2 - sillThickness / 2]}
        args={[sillLength, sillDepth, sillThickness]}
        castShadow={shadowEnabled}
        receiveShadow={shadowEnabled}
      >
        {material}
      </Box>
    </group>
  );
});

export const ArchedWireframe = React.memo(({ cy, dimension, wireframeData, drawBottom }: ArchedWireframeProps) => {
  const [lx, ly, lz, archHeight] = dimension;
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const thinLine = lineWidth / 20;
  const boldLine = lineWidth / 5;

  const hx = lx / 2;
  const hz = lz / 2;
  const ah = Math.min(archHeight, lz, hx);

  const radialSegments = 6;
  const heightSegments = 1;

  const drawArchedPath = (ah: number, x: number) => {
    const r = ah / 2 + (x * 2) ** 2 / (8 * ah);
    const startAngle = Math.acos(x / r);
    const endAngle = Math.PI - startAngle;
    const points = new EllipseCurve(0, ah - r, r, r, startAngle, endAngle, false, 0)
      .getPoints(24)
      .map((v2) => new Vector3(v2.x, v2.y));
    return new CatmullRomCurve3(points);
  };

  const drawCircleShape = (radius: number) => {
    return new Shape()
      .moveTo(0, radius)
      .quadraticCurveTo(radius, radius, radius, 0)
      .quadraticCurveTo(radius, -radius, 0, -radius)
      .quadraticCurveTo(-radius, -radius, -radius, 0)
      .quadraticCurveTo(-radius, radius, 0, radius);
  };

  const material = useMemo(() => new MeshStandardMaterial({ color: lineColor }), [lineColor]);
  const highLightMaterial = useMemo(() => new MeshStandardMaterial({ color: LOCKED_ELEMENT_SELECTION_COLOR }), []);

  const renderLines = (width: number, mat: MeshStandardMaterial) => {
    return (
      <>
        {/* top */}
        {ah > 0.1 ? (
          <Extrude
            position={[0, 0, lz / 2 - ah]}
            rotation={[HALF_PI, 0, 0]}
            args={[drawCircleShape(width), { extrudePath: drawArchedPath(ah, hx), steps: 24, bevelEnabled: false }]}
            material={mat}
          />
        ) : (
          <Cylinder
            args={[width, width, lx, radialSegments, heightSegments]}
            rotation={[0, 0, HALF_PI]}
            position={[0, 0, hz - width / 2]}
            material={mat}
          />
        )}

        {/* bottom */}
        {drawBottom && (
          <Cylinder
            args={[width, width, lx, radialSegments, heightSegments]}
            rotation={[0, 0, HALF_PI]}
            position={[0, 0, -hz]}
            material={mat}
          />
        )}

        {/* right */}
        <Cylinder
          args={[width, width, lz - ah, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[hx, 0, -ah / 2]}
          material={mat}
        />

        {/* left */}
        <Cylinder
          args={[width, width, lz - ah, radialSegments, heightSegments]}
          rotation={[HALF_PI, HALF_PI, 0]}
          position={[-hx, 0, -ah / 2]}
          material={mat}
        />
      </>
    );
  };

  return (
    <group name={'Window Wireframe Group'}>
      {opacity > 0 && <group position={[0, cy, 0]}>{renderLines(thinLine, material)}</group>}
      {locked && selected && renderLines(boldLine, highLightMaterial)}
    </group>
  );
});

const ArchedWindow = ({
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
}: ArchedWindowProps) => {
  const world = useStore.getState().world;
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const hourlyHeatExchangeArrayMap = usePrimitiveStore(Selector.hourlyHeatExchangeArrayMap);

  const [lx, ly, lz, archHeight] = dimension;
  const [cx, cy, cz] = position;

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
    const intensity = (sum / area) * (heatFluxScaleFactor ?? 100);
    const arrowLength = 0.1;
    const arrowLengthHalf = arrowLength / 2;
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
            v.push(new Vector3(rx, intensity + arrowLength, rz - arrowLengthHalf));
            v.push(new Vector3(rx, intensity, rz));
            v.push(new Vector3(rx, intensity + arrowLength, rz + arrowLengthHalf));
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
            v.push(new Vector3(rx, -arrowLength, rz - arrowLengthHalf));
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, -arrowLength, rz + arrowLengthHalf));
            v.push(new Vector3(rx, 0, rz));
            v.push(new Vector3(rx, -intensity, rz));
            vectors.push(v);
          }
        }
      }
    }
    return vectors;
  }, [id, dimension, showHeatFluxes]);

  const shutterWidth = useMemo(() => shutter.width * lx, [lx, shutter.width]);
  const shutterHeight = useMemo(() => lz - Math.min(archHeight, lz, lx / 2), [lx, lz, archHeight]);
  const shutterPosX = useMemo(
    () => ((shutterWidth + frameData.width + lx) / 2) * 1.025,
    [lx, shutterWidth, frameData.width],
  );
  const shutterPosZ = useMemo(() => -Math.min(archHeight, lz, lx / 2) / 2, [lz, shutterHeight]);

  const glassShape = useMemo(() => {
    const s = new Shape();
    const hx = lx / 2;
    const hz = lz / 2;
    const ah = Math.min(archHeight, lz, hx);
    s.moveTo(-hx, -hz);
    s.lineTo(hx, -hz);
    s.lineTo(hx, hz - ah);
    if (ah > 0) {
      const r = ah / 2 + lx ** 2 / (8 * ah);
      const [cX, cY] = [0, hz - r];
      const startAngle = Math.acos(hx / r);
      const endAngle = Math.PI - startAngle;
      s.absarc(cX, cY, r, startAngle, endAngle, false);
    } else {
      s.lineTo(-hx, hz);
    }
    s.closePath();
    return s;
  }, [lx, lz]);

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
      <group name={'Arched Window Plane Group'} position={[0, cy, 0]}>
        <mesh name={'Window Glass mesh'} rotation={[HALF_PI, 0, 0]}>
          <shapeBufferGeometry args={[glassShape]} />
          {glassMaterial}
        </mesh>

        {mullionData.showMullion && archHeight !== undefined && (
          <Mullion dimension={dimension} mullionData={mullionData} shadowEnabled={shadowEnabled} />
        )}
      </group>

      {frameData.showFrame && <Frame dimension={dimension} frameData={frameData} shadowEnabled={shadowEnabled} />}

      <ArchedWireframe cy={cy} dimension={dimension} wireframeData={wireframeData} drawBottom />

      <Shutter
        cx={shutterPosX}
        cz={shutterPosZ}
        lx={shutterWidth}
        lz={shutterHeight}
        color={shutter.color}
        showLeft={shutter.showLeft}
        showRight={shutter.showRight}
        spacing={frameData.showFrame ? frameData.width / 2 : 0}
      />

      {renderSealPlane([ly, lz], [-lx / 2, ly / 2, 0], [HALF_PI, HALF_PI, 0])}
      {renderSealPlane([ly, lz], [lx / 2, ly / 2, 0], [HALF_PI, -HALF_PI, 0])}
      {/* {renderSealPlane([lx, ly], [0, ly / 2, lz / 2], [Math.PI, 0, 0])} */}
      {renderSealPlane([lx, ly], [0, ly / 2, -lz / 2])}

      {heatFluxes &&
        heatFluxes.map((v, index) => {
          return <Line key={index} points={v} name={'Heat Flux ' + index} lineWidth={1} color={'gray'} />;
        })}
    </>
  );
};

export default React.memo(ArchedWindow);
