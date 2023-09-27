/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { Box, Cone, Cylinder, Extrude, Line, Plane } from '@react-three/drei';
import React, { useMemo, useRef } from 'react';
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
import { useStore } from 'src/stores/common';
import { DoubleSide, Euler, MeshStandardMaterial, Shape, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { FrameDataType, Shutter, WireframeDataType } from './window';
import { RoofUtil } from '../roof/RoofUtil';
import { useDataStore } from '../../stores/commonData';
import { Util } from '../../Util';
import { Point2 } from '../../models/Point2';
import { FoundationModel } from '../../models/FoundationModel';

interface PolygonalWindowProps {
  id: string;
  dimension: number[];
  position: number[];
  polygonTop: number[];
  glassMaterial: JSX.Element;
  empty: boolean;
  interior: boolean;
  wireframeData: WireframeDataType;
  frameData: FrameDataType;
  leftShutter: boolean;
  rightShutter: boolean;
  shutterColor: string;
  shutterWidth: number;
  area: number;
  showHeatFluxes: boolean;
  foundation: FoundationModel | null;
}

interface FrameProps {
  dimension: number[];
  polygonTop: number[];
  frameData: FrameDataType;
  shadowEnabled: boolean;
}

const CYLINDER_HEIGHT_SEGMENTS = 1;
const CYLINDER_RADIAL_SEGMENTS = 3;
const sealPlanesMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });
const HALF_PI_Z_EULER = new Euler(0, 0, -HALF_PI);

const Frame = React.memo(({ dimension, polygonTop, frameData, shadowEnabled }: FrameProps) => {
  const [lx, ly, lz] = dimension;
  const [topX, topH] = polygonTop;
  const { color, width, sillWidth } = frameData;
  const material = useMemo(() => <meshStandardMaterial color={color} />, [color]);

  const [hx, hz] = [lx / 2, lz / 2];
  const halfWidth = width / 2;
  const depth = halfWidth / 2;
  const sillLength = lx + width * 3;
  const sillThickness = width;

  // from right to left, 2D. length should be 5.
  const innerPoints = useMemo(() => {
    const botRight = new Vector3(hx, -hz);
    const topRight = new Vector3(hx, hz);
    const topLeft = new Vector3(-hx, hz);
    const botLeft = new Vector3(-hx, -hz);
    const topMid = new Vector3(topX * lx, topH + hz);
    return [botRight, topRight, topMid, topLeft, botLeft];
  }, [hx, hz, topX, topH]);

  const outerPoints = useMemo(() => {
    const normals: Vector3[] = [];
    for (let i = 1; i < innerPoints.length; i++) {
      const p1 = innerPoints[i - 1];
      const p2 = innerPoints[i];
      const n = new Vector3().subVectors(p2, p1).normalize().applyEuler(HALF_PI_Z_EULER);
      normals.push(n);
    }

    const edgesAfterOffset: { start: Vector3; end: Vector3 }[] = [];
    for (let i = 0; i < normals.length; i++) {
      const n = normals[i];
      const offset = n.clone().multiplyScalar(width);
      if (i < innerPoints.length - 1) {
        const p1 = innerPoints[i].clone().add(offset);
        const p2 = innerPoints[i + 1].clone().add(offset);
        edgesAfterOffset.push({ start: p1, end: p2 });
      }
    }

    const points: Vector3[] = [];
    points.push(edgesAfterOffset[0].start);
    for (let i = 1; i < edgesAfterOffset.length; i++) {
      const edge1 = edgesAfterOffset[i - 1];
      const edge2 = edgesAfterOffset[i];
      const point = RoofUtil.getIntersectionPoint(edge1.start, edge1.end, edge2.start, edge2.end);
      points.push(point);
    }
    points.push(edgesAfterOffset[edgesAfterOffset.length - 1].end);

    return points;
  }, [innerPoints, width]);

  const shape = useMemo(() => {
    const s = new Shape();
    for (let i = 0; i < outerPoints.length; i++) {
      const point = outerPoints[i];
      if (i === 0) {
        s.moveTo(point.x, point.y);
      } else {
        s.lineTo(point.x, point.y);
      }
    }
    for (let i = innerPoints.length - 1; i >= 0; i--) {
      const point = innerPoints[i];
      s.lineTo(point.x, point.y);
    }
    s.closePath();
    return s;
  }, [innerPoints, outerPoints]);

  return (
    <group name={'Window Frame Group'} position={[0, -depth / 2, 0]}>
      <Extrude
        position={[0, depth / 2, 0]}
        rotation={[HALF_PI, 0, 0]}
        args={[shape, { steps: 1, depth: depth, bevelEnabled: false }]}
      >
        {material}
      </Extrude>
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

const PolygonalWindow = ({
  id,
  dimension,
  polygonTop,
  position,
  glassMaterial,
  empty,
  interior,
  wireframeData,
  frameData,
  leftShutter,
  rightShutter,
  shutterColor,
  shutterWidth,
  area,
  showHeatFluxes,
  foundation,
}: PolygonalWindowProps) => {
  const world = useStore.getState().world;
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowEuler = useRef<Euler>();

  const [cx, cy, cz] = position;
  const [lx, ly, lz] = dimension;
  const [hx, hy, hz] = dimension.map((v) => v / 2);
  const [topX, topH] = polygonTop;
  const { lineWidth, lineColor, selected, locked, opacity } = wireframeData;

  const absTopX = topX * lx;
  const topRightLength = Math.hypot(topH, hx - absTopX);
  const topRightRotation = Math.asin(topH / topRightLength);
  const topLeftLength = Math.hypot(topH, hx + absTopX);
  const topLeftRotation = -Math.asin(topH / topLeftLength);

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const pointWithinPolygon = (x: number, z: number) => {
    const hx = 0.5 * lx;
    const hz = 0.5 * (lz + polygonTop[1]);
    const shiftZ = polygonTop[1];
    const points: Point2[] = [
      { x: -hx, y: -hz } as Point2,
      { x: hx, y: -hz } as Point2,
      { x: hx, y: hz - shiftZ } as Point2,
      { x: lx * polygonTop[0], y: hz } as Point2,
      { x: -hx, y: hz - shiftZ } as Point2,
    ];
    return Util.isPointInside(x, z, points);
  };

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes || interior) return undefined;
    if (foundation && foundation.notBuilding) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    if (area === 0) return undefined;
    const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
    const bz = lz + polygonTop[1];
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(bz / cellSize));
    const dx = lx / nx;
    const dz = bz / nz;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowEuler.current = Util.getEuler(
      UNIT_VECTOR_POS_Z,
      UNIT_VECTOR_POS_Y,
      'YXZ',
      Math.sign(intensity) * HALF_PI,
    );
    const vectors: Vector3[][] = [];
    const shiftZ = polygonTop[1] / 2;
    if (intensity < 0) {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          const v: Vector3[] = [];
          const rx = (kx - nx / 2 + 0.5) * dx;
          const rz = (kz - nz / 2 + 0.5) * dz;
          if (pointWithinPolygon(rx, rz)) {
            v.push(new Vector3(rx, 0, rz + shiftZ));
            v.push(new Vector3(rx, intensity, rz + shiftZ));
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
          if (pointWithinPolygon(rx, rz)) {
            v.push(new Vector3(rx, 0, rz + shiftZ));
            v.push(new Vector3(rx, -intensity, rz + shiftZ));
            vectors.push(v);
          }
        }
      }
    }
    return vectors;
  }, [id, dimension, showHeatFluxes, heatFluxScaleFactor]);

  const shutterLength = useMemo(() => shutterWidth * lx, [lx, shutterWidth]);
  const shutterPosX = useMemo(
    () => ((shutterLength + frameData.width + lx) / 2) * 1.025,
    [lx, shutterLength, frameData.width],
  );

  const glassShape = useMemo(() => {
    const [hx, hz] = [lx / 2, lz / 2];
    const tx = topX * lx; // abs
    return getPolygonWindowShape(hx, hz, tx, topH);
  }, [lx, lz, topX, topH]);

  const wireframeMaterial = useMemo(() => {
    if (selected && locked) {
      return new MeshStandardMaterial({ color: LOCKED_ELEMENT_SELECTION_COLOR });
    } else {
      return new MeshStandardMaterial({ color: lineColor });
    }
  }, [lineColor, selected, locked]);

  const wireframeWidth = useMemo(() => {
    if (locked && selected) {
      return lineWidth / 5;
    } else {
      return lineWidth / 20;
    }
  }, [lineWidth, selected, locked]);

  const wireframeCy = useMemo(() => {
    if (locked && selected) {
      return -ly / 2;
    } else {
      return -cy;
    }
  }, [cy, ly, selected, locked]);

  const renderWireframeLine = (length: number, offset = 0) => {
    return (
      <Cylinder
        args={[wireframeWidth, wireframeWidth, length, CYLINDER_RADIAL_SEGMENTS, CYLINDER_HEIGHT_SEGMENTS]}
        position={[offset, wireframeCy, 0]}
        rotation={[0, 0, HALF_PI]}
        material={wireframeMaterial}
      />
    );
  };

  const renderSealPlane = (length: number, offset = 0) => {
    return (
      <Plane
        args={[length, ly]}
        position={[offset, 0, 0]}
        material={sealPlanesMaterial}
        receiveShadow={shadowEnabled}
        castShadow={shadowEnabled}
      />
    );
  };

  return (
    <>
      {!empty && (
        <mesh name={'Triangle Glass Plane'} position={[0, cy, 0]} rotation={[HALF_PI, 0, 0]}>
          <shapeBufferGeometry args={[glassShape]} />
          {glassMaterial}
        </mesh>
      )}

      {frameData.showFrame && (
        <Frame dimension={dimension} polygonTop={polygonTop} frameData={frameData} shadowEnabled={shadowEnabled} />
      )}

      <Shutter
        cx={shutterPosX}
        lx={shutterLength}
        lz={lz}
        color={shutterColor}
        showLeft={leftShutter}
        showRight={rightShutter}
        spacing={frameData.showFrame ? frameData.width / 2 : 0}
      />

      <group position={[0, hy, -hz + 0.001]}>
        {renderSealPlane(lx)}
        {renderWireframeLine(lx)}
      </group>

      <group position={[-hx + 0.001, hy, 0]} rotation={[0, HALF_PI, 0]}>
        {renderSealPlane(lz)}
        {renderWireframeLine(lz)}
      </group>

      <group position={[hx - 0.001, hy, 0]} rotation={[0, -HALF_PI, 0]}>
        {renderSealPlane(lz)}
        {renderWireframeLine(lz)}
      </group>

      <group position={[-hx + 0.001, hy, hz - 0.01]} rotation={[0, topLeftRotation, 0]}>
        {renderSealPlane(topLeftLength, topLeftLength / 2)}
        {renderWireframeLine(topLeftLength, topLeftLength / 2)}
      </group>

      <group position={[hx - 0.001, hy, hz - 0.01]} rotation={[0, topRightRotation, 0]}>
        {renderSealPlane(topRightLength, -topRightLength / 2)}
        {renderWireframeLine(topRightLength, -topRightLength / 2)}
      </group>

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

export const getPolygonWindowShape = (hx: number, hy: number, tx: number, th: number, cx = 0, cy = 0) => {
  const shape = new Shape();
  shape.moveTo(cx - hx, cy - hy);
  shape.lineTo(cx + hx, cy - hy);
  shape.lineTo(cx + hx, cy + hy);
  shape.lineTo(cx + tx, cy + hy + th);
  shape.lineTo(cx - hx, cy + hy);
  shape.closePath();
  return shape;
};

export default React.memo(PolygonalWindow);
