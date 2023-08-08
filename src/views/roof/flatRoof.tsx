/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import {
  BoxBufferGeometry,
  BufferGeometry,
  CanvasTexture,
  Euler,
  ExtrudeBufferGeometry,
  FrontSide,
  Material,
  Mesh,
  Shape,
  Vector3,
} from 'three';
import { RoofSegmentProps } from './roofRenderer';
import { ObjectType, RoofTexture } from 'src/types';
import React, { useMemo, useRef } from 'react';
import { CSG } from 'three-csg-ts';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useDataStore } from 'src/stores/commonData';
import { useRoofTexture, useTransparent, useUpdateAfterMounted } from './hooks';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
} from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { Cone, Line } from '@react-three/drei';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { getPolygonWindowShape } from '../window/polygonalWindow';
import { getArchedWindowShape } from '../window/archedWindow';
import { FoundationModel } from '../../models/FoundationModel';
import { RoofType } from '../../models/RoofModel';
import { DEFAULT_POLYGONTOP } from '../window/window';
import shallow from 'zustand/shallow';

interface TopExtrudeProps {
  uuid?: string;
  simulation?: boolean;
  shape: Shape;
  thickness: number;
  holeMeshes: Mesh<BufferGeometry, Material | Material[]>[];
  castShadow: boolean;
  receiveShadow: boolean;
  children: JSX.Element;
}

interface FlatRoofProps {
  id: string;
  foundationModel: FoundationModel | null;
  roofType: RoofType;
  roofSegments: RoofSegmentProps[];
  center: Vector3;
  thickness: number;
  lineWidth: number;
  lineColor: string;
  sideColor: string;
  color: string;
  textureType: RoofTexture;
  heatmap: CanvasTexture | null;
}

const drawShapeOfGambrelRoof = (shape: Shape, roofSegments: RoofSegmentProps[]) => {
  const [frontSide, frontTop, backTop, backSide] = roofSegments;
  shape.moveTo(frontSide.points[0].x, frontSide.points[0].y);
  shape.lineTo(frontSide.points[1].x, frontSide.points[1].y);
  shape.lineTo(backSide.points[0].x, backSide.points[0].y);
  shape.lineTo(backSide.points[1].x, backSide.points[1].y);
  shape.closePath();
};

export const getRoofPointsOfGambrelRoof = (roofSegments: RoofSegmentProps[], array?: Vector3[]) => {
  const arr: Vector3[] = [];
  const [frontSide, frontTop, backTop, backSide] = roofSegments;
  arr.push(frontSide.points[0].clone());
  arr.push(frontSide.points[1].clone());
  arr.push(backSide.points[0].clone());
  arr.push(backSide.points[1].clone());
  if (array) {
    array.push(...arr);
    return array;
  } else {
    return arr;
  }
};

export const TopExtrude = ({
  uuid,
  shape,
  thickness,
  holeMeshes,
  simulation,
  castShadow,
  receiveShadow,
  children,
}: TopExtrudeProps) => {
  const ref = useRef<Mesh>(null);

  if (ref.current) {
    ref.current.geometry = new ExtrudeBufferGeometry(shape, { steps: 1, depth: thickness, bevelEnabled: false });
    ref.current.updateMatrix();

    if (holeMeshes.length > 0) {
      const operationBuffer: Mesh[] = [];

      for (let i = 0; i < holeMeshes.length; i++) {
        const holeMesh = holeMeshes[i];
        if (i === 0) {
          operationBuffer.push(CSG.subtract(ref.current, holeMesh));
        } else {
          operationBuffer.push(CSG.subtract(operationBuffer[i - 1], holeMesh));
        }
      }

      const resultMesh = operationBuffer.pop();

      if (resultMesh) {
        ref.current.geometry = resultMesh.geometry;
        ref.current.updateMatrix();
      }
    }
  }

  useUpdateAfterMounted();

  return (
    <mesh
      uuid={uuid}
      userData={{ simulation: simulation }}
      ref={ref}
      name={'Flat roof top extrude'}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {children}
    </mesh>
  );
};

const FlatRoof = ({
  id,
  foundationModel,
  roofType,
  roofSegments,
  center,
  thickness,
  lineColor,
  lineWidth,
  sideColor,
  color,
  textureType,
  heatmap,
}: FlatRoofProps) => {
  const world = useStore.getState().world;
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const getRoofSegmentVerticesWithoutOverhang = useStore(Selector.getRoofSegmentVerticesWithoutOverhang);
  const hourlyHeatExchangeArrayMap = useDataStore.getState().hourlyHeatExchangeArrayMap;

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowLength = useRef<Vector3>();
  const heatFluxArrowEuler = useRef<Euler>();

  const { transparent, opacity } = useTransparent();

  const windows = useStore(
    (state) => state.elements.filter((e) => e.type === ObjectType.Window && e.parentId === id),
    shallow,
  ) as WindowModel[];

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    if (foundationModel && foundationModel.notBuilding) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments || !segments[0]) return undefined;
    const vectors: Vector3[][] = [];
    const s = segments[0].map((v) => v.clone().sub(center));
    const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
    const s0 = s[0].clone();
    const s1 = s[1].clone();
    const s2 = s[2].clone();
    const v10 = new Vector3().subVectors(s1, s0);
    const v20 = new Vector3().subVectors(s2, s0);
    const v21 = new Vector3().subVectors(s2, s1);
    const length10 = v10.length();
    // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
    const distance = new Vector3().crossVectors(v20, v21).length() / length10;
    const m = Math.max(2, Math.floor(length10 / cellSize));
    const n = Math.max(2, Math.floor(distance / cellSize));
    v10.normalize();
    v20.normalize();
    v21.normalize();
    // find the normal vector of the quad
    const normal = new Vector3().crossVectors(v20, v21).normalize();
    // find the incremental vector going along the bottom edge (half of length)
    const dm = v10.multiplyScalar((0.5 * length10) / m);
    // find the incremental vector going from bottom to top (half of length)
    const dn = new Vector3()
      .crossVectors(normal, v10)
      .normalize()
      .multiplyScalar((0.5 * distance) / n);
    // find the starting point of the grid (shift half of length in both directions)
    const v0 = s0.clone().add(dm).add(dn).add(new Vector3(0, 0, thickness));
    // double half-length to full-length for the increment vectors in both directions
    dm.multiplyScalar(2);
    dn.multiplyScalar(2);
    heatFluxArrowLength.current = normal.clone().multiplyScalar(0.1);
    const origin = new Vector3();
    const vertices = new Array<Point2>();
    for (const p of s) {
      vertices.push({ x: p.x, y: p.y } as Point2);
    }
    const area = Util.getPolygonArea(vertices);
    if (area === 0) return undefined;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowEuler.current = new Euler(-Math.sign(intensity) * HALF_PI, 0, 0);
    for (let p = 0; p < m; p++) {
      const dmp = dm.clone().multiplyScalar(p);
      for (let q = 0; q < n; q++) {
        origin.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
        if (Util.isPointInside(origin.x, origin.y, vertices)) {
          const v: Vector3[] = [];
          if (intensity < 0) {
            v.push(origin.clone());
            v.push(origin.clone().add(normal.clone().multiplyScalar(-intensity)));
          } else {
            v.push(origin.clone());
            v.push(origin.clone().add(normal.clone().multiplyScalar(intensity)));
          }
          vectors.push(v);
        }
      }
    }
    return vectors;
  }, [showHeatFluxes, heatFluxScaleFactor]);

  const wireFramePoints = useMemo(() => {
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return [new Vector3()];
    const points: Vector3[] = [];
    if (roofType === RoofType.Gambrel) {
      getRoofPointsOfGambrelRoof(roofSegments, points);
      const maxZ = points.reduce((prev, curr) => Math.max(prev, curr.z), 0);
      points.forEach((p) => p.setZ(maxZ));
    } else {
      points.push(roofSegments[0].points[0]);
      for (const segment of roofSegments) {
        const rightPoint = segment.points[1];
        points.push(rightPoint);
      }
    }
    return points;
  }, [roofSegments, roofType]);

  const thicknessVector = useMemo(() => {
    return new Vector3(0, 0, thickness);
  }, [thickness]);

  const periphery = <Line points={wireFramePoints} lineWidth={lineWidth} color={lineColor} />;
  const texture = useRoofTexture(textureType);

  const shape = useMemo(() => {
    const shape = new Shape();
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return shape;
    if (roofType === RoofType.Gambrel) {
      drawShapeOfGambrelRoof(shape, roofSegments);
    } else {
      const startPoint = roofSegments[0].points[0];
      shape.moveTo(startPoint.x, startPoint.y);
      for (const segment of roofSegments) {
        const rightPoint = segment.points[1];
        shape.lineTo(rightPoint.x, rightPoint.y);
      }
      shape.closePath();
    }
    return shape;
  }, [roofSegments, center, roofType]);

  const shapeWithHoles = useMemo(() => {
    const shape = new Shape();
    if (roofSegments.length === 0) return shape;
    if (roofType === RoofType.Gambrel) {
      drawShapeOfGambrelRoof(shape, roofSegments);
    } else {
      const startPoint = roofSegments[0].points[0];
      shape.moveTo(startPoint.x, startPoint.y);
      for (const segment of roofSegments) {
        const rightPoint = segment.points[1];
        shape.lineTo(rightPoint.x, rightPoint.y);
      }
      shape.closePath();
    }

    if (windows.length > 0) {
      for (const window of windows) {
        const c = new Vector3(window.cx, window.cy, window.cz).sub(center);
        switch (window.windowType) {
          case WindowType.Polygonal: {
            const [topX, topH] = window.polygonTop ?? DEFAULT_POLYGONTOP;
            const [hx, hy, tx] = [window.lx / 2, window.lz / 2, topX * window.lx];
            const hole = getPolygonWindowShape(hx, hy, tx, topH, c.x, c.y);
            shape.holes.push(hole);
            break;
          }
          case WindowType.Arched: {
            const hole = getArchedWindowShape(window.lx, window.lz, window.archHeight, c.x, c.y);
            shape.holes.push(hole);
            break;
          }
          default: {
            const hole = new Shape();
            const [hx, hy] = [window.lx / 2, window.lz / 2];
            hole.moveTo(c.x - hx, c.y - hy);
            hole.lineTo(c.x + hx, c.y - hy);
            hole.lineTo(c.x + hx, c.y + hy);
            hole.lineTo(c.x - hx, c.y + hy);
            hole.closePath();
            shape.holes.push(hole);
          }
        }
      }
    }

    return shape;
  }, [roofSegments, center, windows, roofType]);

  const holeMeshes = useMemo(
    () =>
      windows.map((window) => {
        const [a, b, c] = window.rotation;
        const position = new Vector3(window.cx, window.cy, window.cz).sub(center);
        const euler = new Euler().fromArray([...window.rotation, 'ZXY']);
        switch (window.windowType) {
          case WindowType.Polygonal: {
            const [topX, topH] = window.polygonTop ?? DEFAULT_POLYGONTOP;
            const [hx, hy, tx] = [window.lx / 2, window.lz / 2, topX * window.lx];
            const shape = getPolygonWindowShape(hx, hy, tx, topH);
            const holeMesh = new Mesh(
              new ExtrudeBufferGeometry([shape], { steps: 1, depth: window.ly, bevelEnabled: false }),
            );
            const offset = new Vector3(0, 0, -window.ly).applyEuler(euler);
            holeMesh.position.copy(position.clone().add(offset));
            holeMesh.rotation.copy(euler);
            holeMesh.updateMatrix();
            return holeMesh;
          }
          case WindowType.Arched: {
            const shape = getArchedWindowShape(window.lx, window.lz, window.archHeight);
            const holeMesh = new Mesh(
              new ExtrudeBufferGeometry([shape], { steps: 1, depth: window.ly, bevelEnabled: false }),
            );
            const offset = new Vector3(0, 0, -window.ly).applyEuler(euler);
            holeMesh.position.copy(position.clone().add(offset));
            holeMesh.rotation.copy(euler);
            holeMesh.updateMatrix();
            return holeMesh;
          }
          default: {
            const holeMesh = new Mesh(new BoxBufferGeometry(window.lx, window.lz, window.ly * 2));
            holeMesh.position.copy(position);
            holeMesh.rotation.set(a, b, c);
            holeMesh.updateMatrix();
            return holeMesh;
          }
        }
      }),
    [windows, thickness],
  );

  const noTextureAndOneColor = textureType === RoofTexture.NoTexture && color && color === sideColor;
  const castShadow = shadowEnabled && !transparent;
  const showHeatmap = showSolarRadiationHeatmap && heatmap;

  return (
    <>
      {/*special case: the whole roof segment has no texture and only one color */}
      {noTextureAndOneColor && !showHeatmap ? (
        <TopExtrude
          uuid={id}
          simulation={true}
          shape={shape}
          holeMeshes={holeMeshes}
          thickness={thickness}
          castShadow={castShadow}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </TopExtrude>
      ) : (
        <>
          {/* texture layer */}
          <mesh
            uuid={id}
            userData={{ simulation: true }}
            name={'Flat roof top shape'}
            position={[0, 0, thickness + 0.001]}
            receiveShadow={shadowEnabled}
          >
            <shapeBufferGeometry args={[shapeWithHoles]} />
            {showHeatmap ? (
              <meshBasicMaterial map={heatmap} side={FrontSide} />
            ) : (
              <meshStandardMaterial
                map={texture}
                color={color}
                transparent={transparent}
                opacity={opacity}
                side={FrontSide}
              />
            )}
          </mesh>

          {/* body */}
          <TopExtrude
            shape={shape}
            holeMeshes={holeMeshes}
            thickness={thickness}
            castShadow={castShadow}
            receiveShadow={shadowEnabled}
          >
            <meshStandardMaterial color={sideColor ?? 'white'} transparent={transparent} opacity={opacity} />
          </TopExtrude>
        </>
      )}

      {/* wireframe */}
      {periphery}
      <group position={[0, 0, thickness]}>
        {periphery}
        {wireFramePoints.map((point, idx) => {
          const points = [point.clone().sub(thicknessVector), point];
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
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
                position={
                  heatFluxArrowLength.current
                    ? v[heatFluxArrowHead.current].clone().add(heatFluxArrowLength.current)
                    : v[0]
                }
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

export default FlatRoof;
