/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { RoofTexture } from 'src/types';
import { useRoofTexture, useTransparent } from './hooks';
import { RoofSegmentProps } from './roofRenderer';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Texture,
  Vector2,
  Vector3,
} from 'three';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { Util } from '../../Util';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  UNIT_VECTOR_POS_Z,
} from '../../constants';
import { useDataStore } from '../../stores/commonData';
import { Box, Cone, Line } from '@react-three/drei';
import { Point2 } from '../../models/Point2';
import { RoofType } from '../../models/RoofModel';
import { CSG } from 'three-csg-ts';

export const RoofSegment = ({
  id,
  index,
  roofType,
  segment,
  centroid,
  thickness,
  color,
  sideColor,
  textureType,
  heatmap,
}: {
  id: string;
  index: number;
  roofType: RoofType;
  segment: RoofSegmentProps;
  centroid: Vector3;
  defaultAngle: number;
  thickness: number;
  color: string;
  sideColor: string;
  textureType: RoofTexture;
  heatmap?: CanvasTexture;
}) => {
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const getRoofSegmentVerticesWithoutOverhang = useStore(Selector.getRoofSegmentVerticesWithoutOverhang);

  const { transparent, opacity } = useTransparent();
  const texture = useRoofTexture(textureType);

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowLength = useRef<Vector3>();
  const heatFluxArrowEuler = useRef<Euler>();

  const world = useStore.getState().world;
  const hourlyHeatExchangeArrayMap = useDataStore.getState().hourlyHeatExchangeArrayMap;
  const { points } = segment;

  const overhangLines: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments) return undefined;
    const lines: Vector3[][] = [];
    const thicknessVector = new Vector3(0, 0, thickness + 0.1);
    switch (roofType) {
      case RoofType.Hip:
      case RoofType.Pyramid:
        for (const seg of segments) {
          const p: Vector3[] = [];
          p.push(seg[0].clone().sub(centroid).add(thicknessVector));
          p.push(seg[1].clone().sub(centroid).add(thicknessVector));
          lines.push(p);
        }
        break;
      case RoofType.Mansard:
        for (const [i, seg] of segments.entries()) {
          if (i === segments.length - 1) continue;
          const p: Vector3[] = [];
          p.push(seg[0].clone().sub(centroid).add(thicknessVector));
          p.push(seg[1].clone().sub(centroid).add(thicknessVector));
          lines.push(p);
        }
        break;
      case RoofType.Gambrel:
        for (const [i, seg] of segments.entries()) {
          if (i === 0 || i === 3) {
            const p: Vector3[] = [];
            p.push(seg[0].clone().sub(centroid).add(thicknessVector));
            p.push(seg[1].clone().sub(centroid).add(thicknessVector));
            lines.push(p);
          }
          let p: Vector3[] = [];
          p.push(seg[0].clone().sub(centroid).add(thicknessVector));
          p.push(seg[3].clone().sub(centroid).add(thicknessVector));
          lines.push(p);
          p = [];
          p.push(seg[1].clone().sub(centroid).add(thicknessVector));
          p.push(seg[2].clone().sub(centroid).add(thicknessVector));
          lines.push(p);
        }
        break;
    }
    return lines;
  }, [showHeatFluxes]);

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id + '-' + index);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments) return undefined;
    const [wallLeft, wallRight, ridgeRight, ridgeLeft, wallLeftAfterOverhang] = points;
    const thickness = wallLeftAfterOverhang.z - wallLeft.z;
    const s = segments[index].map((v) => v.clone().sub(centroid).add(new Vector3(0, 0, thickness)));
    if (!s) return undefined;
    const projectedVertices: Point2[] = [];
    for (const t of s) {
      projectedVertices.push({ x: t.x, y: t.y } as Point2);
    }
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
    const v0 = s0.clone().add(dm).add(dn);
    // double half-length to full-length for the increment vectors in both directions
    dm.multiplyScalar(2);
    dn.multiplyScalar(2);
    heatFluxArrowLength.current = normal.clone().multiplyScalar(0.1);
    const vectors: Vector3[][] = [];
    const origin = new Vector3();
    const area =
      s.length === 4
        ? Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0])
        : Util.getTriangleArea(s[0], s[1], s[2]);
    if (area === 0) return undefined;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowEuler.current = Util.getEuler(UNIT_VECTOR_POS_Z, normal, 'YXZ', -Math.sign(intensity) * HALF_PI);
    for (let p = 0; p < m; p++) {
      const dmp = dm.clone().multiplyScalar(p);
      for (let q = 0; q < n; q++) {
        origin.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
        if (Util.isPointInside(origin.x, origin.y, projectedVertices)) {
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

  return (
    <>
      <BufferRoofSegment
        id={id}
        index={index}
        segment={segment}
        color={color}
        sideColor={sideColor}
        texture={texture}
        heatmap={heatmap}
        transparent={transparent}
        opacity={opacity}
      />

      {overhangLines &&
        overhangLines.map((v, index) => {
          return (
            <Line
              key={index}
              points={v}
              color={'gray'}
              lineWidth={0.5}
              dashed={true}
              dashSize={0.2}
              gapSize={0.1}
              receiveShadow={false}
              castShadow={false}
              name={'Overhang Boundary ' + index}
            />
          );
        })}

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
                name={'Normal Vector Arrow Head ' + index}
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

interface BufferRoofSegmentProps {
  id: string;
  index: number;
  segment: RoofSegmentProps;
  color: string;
  sideColor: string;
  texture: Texture;
  heatmap?: CanvasTexture;
  transparent: boolean;
  opacity: number;
}

export const BufferRoofSegment = React.memo(
  ({ id, index, segment, color, sideColor, texture, heatmap, transparent, opacity }: BufferRoofSegmentProps) => {
    const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
    const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);

    const ref = useRef<Mesh>(null);

    const { points } = segment;
    const topLayerTexture = showSolarRadiationHeatmap ? heatmap : texture;
    const isTri = points.length === 6;
    const isQuad = points.length === 8;

    // const holeMesh = useMemo(() => new Mesh(new BoxBufferGeometry(0.5, 0.5, 5), new MeshBasicMaterial()), []);

    const materialGroupNumber = render() ?? 6;

    const materialArray = useMemo(() => Array(materialGroupNumber).fill(0), [materialGroupNumber]);

    useEffect(() => {
      render();
    }, []);

    if (!isTri && !isQuad) return null;

    function render() {
      if (!ref.current || (!isTri && !isQuad)) return;

      const geometry = ref.current.geometry;
      geometry.index = null;
      geometry.clearGroups();

      const positions: number[] = [];
      const uvs: number[] = [];

      let vertexIndex = 0;
      let matierialIndex = 0;

      /*
       7----6
      /|   /|       5
     4----5 |      /|\
     | |  | |     3---4
     | 3--|-2     | 2 |
     |/   |/      |/ \|
     0----1       0---1
      quad         tri
    */

      if (isTri) {
        // set top layer positions, uvs and groups
        const topLayerPoints = points.slice(points.length / 2);
        addPositions(topLayerPoints);
        showSolarRadiationHeatmap ? addHeatmapUVs() : addUVs(topLayerPoints);
        addGroup(3);

        // set bottom layer positions, uvs, groups
        const bottomLayerPoints = points.slice(0, points.length / 2).reverse();
        addPositions(bottomLayerPoints);
        uvs.push(0, 0, 1, 0, 0, 1);
        addGroup(3);

        // side surfaces
        buildSideSurface([
          [0, 1, 4, 3],
          [1, 2, 5, 4],
          [2, 0, 3, 5],
        ]);
      } else if (isQuad) {
        // set top layer positions
        const topLayerPoints = points.slice(points.length / 2);
        const [triTopLower, triTopUpper] = triangulate(topLayerPoints);
        addPositions(triTopLower);
        addPositions(triTopUpper);

        const [ta, tb, tc, td] = topLayerPoints;
        const isLowerLeft = triTopLower[2].equals(td); // is segment triangulated by lowerLeft and upperRight

        // set top layer uvs
        if (!showSolarRadiationHeatmap) {
          const ab = new Vector3().subVectors(tb, ta);
          const ac = new Vector3().subVectors(tc, ta);
          const ad = new Vector3().subVectors(td, ta);
          const abxy = new Vector2(tb.x - ta.x, tb.y - ta.y);
          const lab = abxy.length();

          const ub = lab;
          const vb = 0;
          const uc = ab.dot(ac) / lab;
          const vc = ab.clone().cross(ac).length() / lab;
          const ud = ab.dot(ad) / lab;
          const vd = ab.clone().cross(ad).length() / lab;

          if (isLowerLeft) {
            uvs.push(0, 0, ub, vb, ud, vd); // lower
            uvs.push(ub, vb, uc, vc, ud, vd); // upper
          } else {
            uvs.push(0, 0, ub, vb, uc, vc); // lower
            uvs.push(0, 0, uc, vc, ud, vd); // upper
          }
        } else {
          addHeatmapUVs(isLowerLeft);
        }

        // set top layer groups
        addGroup(6);

        // set bottom layer positions, uvs, groups
        const bottomLayerPoints = points.slice(0, points.length / 2);
        const [triBotLower, triBotUpper] = triangulate(bottomLayerPoints);
        addPositions(triBotLower.reverse());
        addPositions(triBotUpper.reverse());
        uvs.push(0, 0, 1, 0, 0, 1);
        uvs.push(0, 1, 1, 0, 1, 1);
        addGroup(6);

        // side surfaces
        buildSideSurface([
          [0, 1, 5, 4],
          [1, 2, 6, 5],
          [2, 3, 7, 6],
          [3, 0, 4, 7],
        ]);
      } else {
        throw new Error('segment is neither quad nor tri');
      }

      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      geometry.computeVertexNormals();

      // TODO: add window here
      // holeMesh.position.set(0, -2, 0);
      // holeMesh.updateMatrix();
      // const res = CSG.subtract(ref.current, holeMesh);
      // geometry.copy(res.geometry);

      const groupsNumber = geometry.groups.length;

      return groupsNumber;

      function addPositions(points: Vector3[]) {
        for (const point of points) {
          const { x, y, z } = point;
          positions.push(x, y, z);
        }
      }

      function addUVs(points: Vector3[]) {
        const [a, b, c] = points;
        const ab = new Vector3().subVectors(b, a);
        const lab = ab.length();
        const ac = new Vector3().subVectors(c, a);
        const abxy = new Vector2(b.x - a.x, b.y - a.y);

        const ub = abxy.length();
        const vb = 0;
        const uc = ab.dot(ac) / lab;
        const vc = ab.clone().cross(ac).length() / lab;

        uvs.push(0, 0, ub, vb, uc, vc);
      }

      function addHeatmapUVs(isLowerLeft = false) {
        const v10 = new Vector3().subVectors(points[1], points[0]);
        const length10 = v10.length();
        v10.normalize();
        const v20 = new Vector3().subVectors(points[2], points[0]);
        if (isTri) {
          // find the position of the top point relative to the first edge point
          const mid = v20.dot(v10) / length10;
          uvs.push(0, 0, 1, 0, mid, 1);
        } else if (isQuad) {
          // find the position of the top-left and top-right points relative to the lower-left point
          // the points go anticlockwise
          const v30 = new Vector3().subVectors(points[3], points[0]);
          const topLeft = v30.dot(v10) / length10;
          const topRight = v20.dot(v10) / length10;
          if (isLowerLeft) {
            uvs.push(0, 0, 1, 0, topLeft, 1);
            uvs.push(1, 0, topRight, 1, topLeft, 1);
          } else {
            uvs.push(0, 0, 1, 0, topRight, 1);
            uvs.push(0, 0, topRight, 1, topLeft, 1);
          }
        }
      }

      function addGroup(verticesNumber: number) {
        geometry.addGroup(vertexIndex, verticesNumber, matierialIndex++);
        vertexIndex += verticesNumber;
      }

      function buildSideSurface(surfacePointIndices: number[][]) {
        for (const indices of surfacePointIndices) {
          const [a, b, c, d] = indices;
          const tri1 = [a, b, d].reduce((acc, i) => acc.concat(points[i].x, points[i].y, points[i].z), [] as number[]);
          const tri2 = [d, b, c].reduce((acc, i) => acc.concat(points[i].x, points[i].y, points[i].z), [] as number[]);
          positions.push(...tri1);
          positions.push(...tri2);
          uvs.push(0, 0, 1, 0, 0, 1);
          uvs.push(0, 1, 1, 0, 1, 1);
          addGroup(6);
        }
      }
    }

    function triangulate(points: Vector3[]) {
      const [a, b, c, d] = points;
      const dDis = Util.distanceFromPointToLine2D(d, a, b);
      const cDis = Util.distanceFromPointToLine2D(c, a, b);
      const lower: Vector3[] = [];
      const upper: Vector3[] = [];
      if (Math.abs(dDis - cDis) < 0.01) {
        if (a.z > b.z) {
          lower.push(a, b, c);
          upper.push(a, c, d);
        } else {
          lower.push(a, b, d);
          upper.push(b, c, d);
        }
      } else if (dDis <= cDis) {
        lower.push(a, b, d);
        upper.push(b, c, d);
      } else {
        lower.push(a, b, c);
        upper.push(a, c, d);
      }
      return [lower, upper];
    }

    const HeatMapMaterial = () => (
      <meshBasicMaterial
        attachArray="material"
        color={color}
        map={topLayerTexture}
        transparent={transparent}
        opacity={opacity}
      />
    );

    const TopLayerMaterial = () => (
      <meshStandardMaterial
        attachArray="material"
        color={color}
        map={topLayerTexture}
        transparent={transparent}
        opacity={opacity}
      />
    );

    const SideSurfaceMaterial = () => (
      <meshStandardMaterial attachArray="material" color={sideColor} transparent={transparent} opacity={opacity} />
    );

    const enableShadow = shadowEnabled && !showSolarRadiationHeatmap;

    return (
      <mesh
        ref={ref}
        name={`Buffer Roof Segment ${index}`}
        uuid={id + '-' + index}
        userData={{ simulation: true }}
        receiveShadow={enableShadow}
        castShadow={enableShadow}
        frustumCulled={false}
      >
        {materialArray.map((_, i) => {
          if (i !== 0) {
            return <SideSurfaceMaterial key={i} />;
          } else if (showSolarRadiationHeatmap) {
            return <HeatMapMaterial key={i} />;
          } else {
            return <TopLayerMaterial key={i} />;
          }
        })}
      </mesh>
    );
  },
);

export default React.memo(RoofSegment);
