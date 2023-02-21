/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PyramidRoofModel, RoofModel } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { CanvasTexture, Euler, FrontSide, Mesh, Raycaster, RepeatWrapping, Shape, Vector2, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { Cone, Extrude, Line, Plane } from '@react-three/drei';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  HALF_PI_Z_EULER,
  TWO_PI,
} from 'src/constants';
import { useRefStore } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { ActionType, ObjectType, RoofHandleType, RoofTexture } from 'src/types';
import {
  addUndoableResizeRoofRise,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofSegmentGroupUserData,
  RoofSegmentProps,
  RoofWireframeProps,
  updateRooftopElements,
} from './roofRenderer';
import { RoofUtil } from './RoofUtil';
import {
  useElementUndoable,
  useMultiCurrWallArray,
  useRoofHeight,
  useRoofTexture,
  useTransparent,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
} from './hooks';
import RoofSegment from './roofSegment';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import Ceiling from './ceiling';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector = new Vector3();
const zVector3 = new Vector3(0, 0, 1);

interface FlatRoofProps {
  id: string;
  roofSegments: RoofSegmentProps[];
  thickness: number;
  lineWidth: number;
  lineColor: string;
  sideColor: string;
  color: string;
  textureType: RoofTexture;
  heatmap: CanvasTexture | null;
}

export const FlatRoof = ({
  id,
  roofSegments,
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

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments) return undefined;
    const vectors: Vector3[][] = [];
    for (const seg of segments) {
      const z0 = seg[0].z;
      const s = seg.map((v) => new Vector3(v.x, v.y, v.z - z0 + thickness));
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
    }
    return vectors;
  }, [showHeatFluxes, heatFluxScaleFactor]);

  const wireFramePoints = useMemo(() => {
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return [new Vector3()];
    const startPoint = roofSegments[0].points[0];
    const points = [startPoint];
    for (const segment of roofSegments) {
      const rightPoint = segment.points[1];
      points.push(rightPoint);
    }
    return points;
  }, [roofSegments]);

  const shape = useMemo(() => {
    const s = new Shape();
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return s;
    const startPoint = roofSegments[0].points[0];
    s.moveTo(startPoint.x, startPoint.y);
    for (const segment of roofSegments) {
      const rightPoint = segment.points[1];
      s.lineTo(rightPoint.x, rightPoint.y);
    }
    return s;
  }, [roofSegments]);

  const thicknessVector = useMemo(() => {
    return new Vector3(0, 0, thickness);
  }, [thickness]);

  const periphery = <Line points={wireFramePoints} lineWidth={lineWidth} color={lineColor} />;
  const texture = useRoofTexture(textureType);

  return (
    <>
      {/*special case: the whole roof segment has no texture and only one color */}
      {textureType === RoofTexture.NoTexture && color && color === sideColor ? (
        <Extrude
          args={[shape, { steps: 1, depth: thickness, bevelEnabled: false }]}
          uuid={id}
          name={'Pyramid Flat Roof Extrude'}
          castShadow={shadowEnabled && !transparent}
          receiveShadow={shadowEnabled}
          userData={{ simulation: true }}
        >
          {showSolarRadiationHeatmap && heatmap ? (
            <meshBasicMaterial attach="material" map={heatmap} />
          ) : (
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          )}
        </Extrude>
      ) : (
        <>
          <mesh
            uuid={id}
            name={'Pyramid Flat Roof Surface'}
            castShadow={shadowEnabled && !transparent}
            receiveShadow={shadowEnabled}
            userData={{ simulation: true }}
            position={[0, 0, thickness + 0.01]}
          >
            <shapeBufferGeometry args={[shape]}></shapeBufferGeometry>
            {showSolarRadiationHeatmap && heatmap ? (
              <meshBasicMaterial attach="material" map={heatmap} color={'white'} side={FrontSide} />
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
          {!showSolarRadiationHeatmap && (
            <Extrude
              args={[shape, { steps: 1, depth: thickness, bevelEnabled: false }]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
            >
              <meshStandardMaterial color={sideColor ?? 'white'} transparent={transparent} opacity={opacity} />
            </Extrude>
          )}
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

const PyramidRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  for (let i = 0; i < roofSegments.length; i++) {
    const [leftPoint, rightPoint] = roofSegments[i].points;
    peripheryPoints.push(leftPoint);
    if (i === roofSegments.length - 1) {
      peripheryPoints.push(rightPoint);
    }
  }

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      {periphery}
      <group position={[0, 0, thickness]}>
        {periphery}
        {roofSegments.map((segment, idx) => {
          const [leftPoint, rightPoint, zeroVector] = segment.points;
          const isFlat = Math.abs(leftPoint.z) < 0.015;
          const points = [leftPoint.clone().sub(thicknessVector), leftPoint];
          if (!isFlat) {
            points.push(zeroVector);
          }
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const PyramidRoof = (roofModel: PyramidRoofModel) => {
  let {
    cx,
    cy,
    cz,
    lz,
    id,
    parentId,
    wallsId,
    selected,
    textureType,
    color = 'white',
    sideColor = 'white',
    thickness,
    locked,
    lineWidth = 0.2,
    lineColor = 'black',
    roofType,
    foundationId,
    rise = lz,
    ceiling = false,
  } = roofModel;

  const { currentWallArray, isLoopRef } = useMultiCurrWallArray(foundationId, id, wallsId);
  const texture = useRoofTexture(textureType);

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const updateRoofFlag = useStore(Selector.updateRoofFlag);

  const { camera, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useRoofHeight(currentWallArray, rise);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const isFirstMountRef = useRef(true);
  const isPointerDownRef = useRef(false);
  const oldRiseRef = useRef(rise);

  const prevWallsIdSet = new Set<string>(wallsId);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    const length = wallArray.length;
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    if (!isLoopRef.current) {
      if (
        (wallArray[length - 1].rightPoint[0] || wallArray[length - 1].rightPoint[0] === 0) &&
        (wallArray[length - 1].rightPoint[1] || wallArray[length - 1].rightPoint[1] === 0)
      ) {
        arr.push({ x: wallArray[length - 1].rightPoint[0], y: wallArray[length - 1].rightPoint[1] });
      }
    }
    return arr;
  };

  const needUpdateWallsId = (wallArray: WallModel[], wallsIdSet: Set<string>) => {
    if (wallArray.length !== wallsIdSet.size) {
      return true;
    }
    for (const w of wallArray) {
      if (!wallsIdSet.has(w.id)) {
        return true;
      }
    }
    return false;
  };

  const getOverhangHeight = () => {
    let height = Infinity;
    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1]);
      const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1]);
      // const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
      const dLeft = RoofUtil.getDistance(leftPoint, rightPoint, centerPointV3);
      const overhangHeightLeft = Math.min(((w.eavesLength ?? 0) / dLeft) * (centerPointV3.z - w.lz), w.lz);
      const dRight = RoofUtil.getDistance(leftPoint, rightPoint, centerPointV3);
      const overhangHeightRight = Math.min(((w.eavesLength ?? 0) / dRight) * (centerPointV3.z - w.lz), w.lz);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const centerPoint = useMemo(() => {
    if (currentWallArray.length < 2) {
      return { x: 0, y: 0 };
    }
    const points = getWallPoint(currentWallArray);
    if (points.length < 3) {
      return { x: 0, y: 0 };
    }
    const p = Util.calculatePolygonCentroid(points);
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
      return { x: 0, y: 0 };
    }
    return p;
  }, [currentWallArray, topZ]);

  const centerPointV3 = useMemo(() => {
    return new Vector3(centerPoint.x, centerPoint.y, topZ);
  }, [centerPoint, topZ]);

  const overhangs = useMemo(() => {
    const res = currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(wall.eavesLength ?? 0));
    if (!isLoopRef.current && res.length !== 0) {
      const n = new Vector3()
        .subVectors(
          new Vector3(
            currentWallArray[currentWallArray.length - 1].rightPoint[0],
            currentWallArray[currentWallArray.length - 1].rightPoint[1],
          ),
          new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]),
        )
        .applyEuler(HALF_PI_Z_EULER)
        .normalize()
        .multiplyScalar(0.3);
      res.push(n);
    }
    return res;
  }, [currentWallArray]);

  const wallPointsAfterOffset = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => ({
      leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
      rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
    }));
    if (!isLoopRef.current && res.length !== 0) {
      res.push({
        leftPoint: new Vector3(
          currentWallArray[currentWallArray.length - 1].rightPoint[0],
          currentWallArray[currentWallArray.length - 1].rightPoint[1],
        ).add(overhangs[overhangs.length - 1]),
        rightPoint: new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]).add(
          overhangs[overhangs.length - 1],
        ),
      });
    }
    return res;
  }, [currentWallArray, overhangs]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];
    if (currentWallArray.length < 2) {
      return segments;
    }

    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      if (
        w.leftPoint.length > 0 &&
        w.rightPoint.length > 0 &&
        (w.leftPoint[0] !== w.rightPoint[0] || w.leftPoint[1] !== w.rightPoint[1])
      ) {
        const points = [];
        let { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
        if (!isLoopRef.current) {
          if (i === 0) {
            lh = currentWallArray[0].lz;
          }
          if (i === currentWallArray.length - 1) {
            rh = currentWallArray[currentWallArray.length - 1].lz;
          }
        }

        const wallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].rightPoint,
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
        )
          .setZ(lh - overhangHeight)
          .sub(centerPointV3);

        const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].rightPoint,
        )
          .setZ(rh - overhangHeight)
          .sub(centerPointV3);

        const length = new Vector3(w.cx, w.cy).sub(centerPointV3.clone().setZ(0)).length();
        points.push(wallLeftPointAfterOverhang, wallRightPointAfterOverhang, zeroVector);
        points.push(
          wallLeftPointAfterOverhang.clone().add(thicknessVector),
          wallRightPointAfterOverhang.clone().add(thicknessVector),
          zeroVector.clone().add(thicknessVector),
        );
        segments.push({ points, angle: -w.relativeAngle, length });
      }
    }
    if (!isLoopRef.current) {
      const idx = wallPointsAfterOffset.length - 1;
      const leftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[idx - 1].leftPoint,
        wallPointsAfterOffset[idx - 1].rightPoint,
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
      )
        .setZ(currentWallArray[currentWallArray.length - 1].lz - overhangHeight)
        .sub(centerPointV3);
      const rightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
        wallPointsAfterOffset[0].leftPoint,
        wallPointsAfterOffset[0].rightPoint,
      )
        .setZ(currentWallArray[0].lz - overhangHeight)
        .sub(centerPointV3);

      let angle = Math.atan2(
        rightPointAfterOverhang.y - leftPointAfterOverhang.y,
        rightPointAfterOverhang.x - leftPointAfterOverhang.x,
      );
      angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

      const length = new Vector3()
        .addVectors(leftPointAfterOverhang, rightPointAfterOverhang)
        .setZ(0)
        .divideScalar(2)
        .length();

      const points = [];
      points.push(leftPointAfterOverhang, rightPointAfterOverhang, zeroVector);
      points.push(
        leftPointAfterOverhang.clone().add(thicknessVector),
        rightPointAfterOverhang.clone().add(thicknessVector),
        zeroVector.clone().add(thicknessVector),
      );
      segments.push({ points, angle: -angle, length });
    }

    return segments;
  }, [currentWallArray, updateRoofFlag, centerPoint, thickness]);

  // set position and rotation
  const foundation = getElementById(parentId);
  let rotation = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotation = foundation.rotation[2];

    const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - rotation;
    intersectionPlanePosition.set(centerPoint.x, centerPoint.y, topZ);
    intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
  }

  // update new roofId
  useEffect(() => {
    if (!isFirstMountRef.current) {
      if (currentWallArray.length >= 2 && needUpdateWallsId(currentWallArray, prevWallsIdSet)) {
        const newWallsIdAray = currentWallArray.map((v) => v.id);
        const newWallsIdSet = new Set(newWallsIdAray);
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Roof) {
              if (e.id === id) {
                (e as RoofModel).wallsId = newWallsIdAray;
              }
            } else if (e.type === ObjectType.Wall) {
              if (prevWallsIdSet.has(e.id) && !newWallsIdSet.has(e.id)) {
                const w = e as WallModel;
                w.roofId = null;
                w.leftRoofHeight = undefined;
                w.rightRoofHeight = undefined;
              }
            }
          }
        });
      }
    }
  }, [updateRoofFlag, prevWallsIdSet]);

  useEffect(() => {
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (currentWallArray.length > 1) {
        for (let i = 0; i < currentWallArray.length; i++) {
          const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === currentWallArray[i].id && e.type === ObjectType.Wall) {
                const w = e as WallModel;
                w.roofId = id;
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
                break;
              }
            }
          });
        }
        updateRooftopElements(foundation, id, roofSegments, centerPointV3, topZ, thickness);
      } else {
        removeElementById(id, false);
      }
    }
  }, [currentWallArray, updateRoofFlag]);

  const { addUndoableMove, undoMove, setOldRefData } = useElementUndoable();

  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centerPointV3, topZ, thickness);
    }
  }, [updateElementOnRoofFlag, topZ, thickness]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const checkIsFlatRoof = () => {
    if (currentWallArray.length < 2) {
      return false;
    }
    const height = currentWallArray[0].lz;

    for (const wall of currentWallArray) {
      if (Math.abs(wall.lz - height) > 0.01) {
        return false;
      }
    }

    for (const segment of roofSegments) {
      const [leftPoint, rightPoint] = segment.points;
      if (Math.abs(leftPoint.z) > 0.01 || Math.abs(rightPoint.z) > 0.01) {
        return false;
      }
    }

    return true;
  };

  const [isFlatRoof, setIsFlatRoof] = useState(checkIsFlatRoof);

  useEffect(() => {
    setIsFlatRoof(checkIsFlatRoof());
  }, [currentWallArray, topZ]);

  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);
  const [flatHeatmapTexture, setFlatHeatmapTexture] = useState<CanvasTexture | null>(null);
  const selectMe = useStore(Selector.selectMe);

  const updateSegmentVertices = useUpdateSegmentVerticesMap(id, centerPointV3, roofSegments);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      if (isFlatRoof) {
        const heatmap = getHeatmap(id);
        if (heatmap) {
          const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
          if (t) {
            // obtain the bounding rectangle
            const segmentVertices = updateSegmentVertices();
            if (segmentVertices && segmentVertices.length > 0 && foundation) {
              const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
              let minX = Number.MAX_VALUE;
              let minY = Number.MAX_VALUE;
              let maxX = -Number.MAX_VALUE;
              let maxY = -Number.MAX_VALUE;
              // the vertices are in fact already triangulated
              // the third vertex of a segment is the center of the polygon
              const vc = segmentVertices[0][2].clone().applyEuler(euler);
              for (const s of segmentVertices) {
                for (const v of s) {
                  const v2 = v.clone().applyEuler(euler);
                  if (v2.x > maxX) maxX = v2.x;
                  else if (v2.x < minX) minX = v2.x;
                  if (v2.y > maxY) maxY = v2.y;
                  else if (v2.y < minY) minY = v2.y;
                }
              }
              const dx = maxX - minX;
              const dy = maxY - minY;
              t.wrapT = t.wrapS = RepeatWrapping;
              t.offset.set(-minX / dx, -minY / dy);
              t.center.set(vc.x / dx, vc.y / dy);
              t.rotation = -foundation.rotation[2];
              t.repeat.set(1 / dx, 1 / dy);
            }
            setFlatHeatmapTexture(t);
          }
        }
      } else {
        const n = roofSegments.length;
        if (n > 0) {
          const textures = [];
          const segmentVertices = updateSegmentVertices();
          if (segmentVertices) {
            for (let i = 0; i < n; i++) {
              const heatmap = getHeatmap(id + '-' + i);
              if (heatmap) {
                const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
                if (t) {
                  textures.push(t);
                }
              }
            }
            setHeatmapTextures(textures);
          }
        }
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  const updateSegmentVerticesWithoutOverhangeMap = () => {
    const segmentVertices: Vector3[][] = [];
    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      if (
        w.leftPoint.length > 0 &&
        w.rightPoint.length > 0 &&
        (w.leftPoint[0] !== w.rightPoint[0] || w.leftPoint[1] !== w.rightPoint[1])
      ) {
        let { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
        if (!isLoopRef.current) {
          if (i === 0) {
            lh = currentWallArray[0].lz;
          }
          if (i === currentWallArray.length - 1) {
            rh = currentWallArray[currentWallArray.length - 1].lz;
          }
        }

        const wallLeftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1], lh);
        const wallRightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1], rh);
        segmentVertices.push([wallLeftPoint, wallRightPoint, centerPointV3.clone()]);
      }
    }
    if (!isLoopRef.current) {
      const firstWall = currentWallArray[0];
      const lastWall = currentWallArray[currentWallArray.length - 1];
      const leftPoint = new Vector3(lastWall.rightPoint[0], lastWall.rightPoint[1], lastWall.lz);
      const rightPoint = new Vector3(firstWall.leftPoint[0], firstWall.leftPoint[1], firstWall.lz);
      segmentVertices.push([leftPoint, rightPoint, centerPointV3.clone()]);
    }

    useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
  };

  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangeMap);

  // used for move rooftop elements between different roofs, passed to handlePointerMove in roofRenderer
  const userData: RoofSegmentGroupUserData = {
    roofId: id,
    foundation: foundation,
    centroid: centerPointV3,
    roofSegments: roofSegments,
  };

  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Pyramid Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={`Pyramid Roof Segments Group ${id}`}
        userData={userData}
        position={[centerPoint.x, centerPoint.y, topZ]}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, centerPointV3, setOldRefData);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, id);
        }}
        onPointerUp={(e) => {
          handlePointerUp(e, roofModel, undoMove, addUndoableMove);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {isFlatRoof ? (
          <FlatRoof
            id={id}
            roofSegments={roofSegments}
            thickness={thickness}
            lineWidth={lineWidth}
            lineColor={lineColor}
            sideColor={sideColor}
            color={topLayerColor}
            textureType={textureType}
            heatmap={flatHeatmapTexture}
          />
        ) : (
          <>
            {roofSegments.map((segment, index) => {
              const { points } = segment;
              if (points.length > 0) {
                const [leftPoint, rightPoint] = points;
                if (leftPoint.distanceTo(rightPoint) > 0.1) {
                  return (
                    <group name={`Roof segment ${index}`} key={index}>
                      <RoofSegment
                        id={id}
                        index={index}
                        roofType={roofType}
                        segment={segment}
                        centroid={new Vector3(centerPoint.x, centerPoint.y, topZ)}
                        thickness={thickness}
                        color={topLayerColor}
                        sideColor={sideColor}
                        texture={texture}
                        heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                      />
                    </group>
                  );
                }
              }
              return null;
            })}
            <PyramidRoofWireframe
              roofSegments={roofSegments}
              thickness={thickness}
              lineColor={lineColor}
              lineWidth={lineWidth}
            />
          </>
        )}
      </group>

      {/* ceiling */}
      {ceiling && riseInnerState > 0 && <Ceiling currWallArray={currentWallArray} />}

      {/* handle */}
      {selected && !locked && (
        <RoofHandle
          position={[centerPoint.x, centerPoint.y, topZ + thickness + 0.15]}
          onPointerDown={(e) => {
            selectMe(roofModel.id, e, ActionType.Select);
            setShowIntersectionPlane(true);
            useRefStore.getState().setEnableOrbitController(false);
            isPointerDownRef.current = true;
            oldRiseRef.current = rise;
          }}
          onPointerUp={() => {
            setShowIntersectionPlane(false);
            useRefStore.getState().setEnableOrbitController(true);
          }}
          onPointerOver={() => {
            setCommonStore((state) => {
              state.hoveredHandle = RoofHandleType.Top;
              state.selectedElementHeight = topZ + roofModel.thickness;
              state.selectedElementX = cx;
              state.selectedElementY = cy;
            });
          }}
        />
      )}

      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          name="Roof Intersection Plane"
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          rotation={intersectionPlaneRotation}
          position={intersectionPlanePosition}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current && isPointerDownRef.current && foundation) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                const newRise = Math.max(0, point.z - foundation.lz - 0.3 - highestWallHeight);
                setRiseInnerState(newRise);
                updateRooftopElements(
                  foundation,
                  id,
                  roofSegments,
                  centerPointV3,
                  newRise + highestWallHeight,
                  thickness,
                );
                // the vertical ruler needs to display the latest rise when the handle is being dragged
                useStore.getState().updateRoofRiseById(id, riseInnerState);
              }
            }
          }}
          onPointerUp={(e) => {
            useStore.getState().updateRoofRiseById(id, riseInnerState);
            addUndoableResizeRoofRise(id, oldRiseRef.current, riseInnerState);
            setShowIntersectionPlane(false);
            useRefStore.getState().setEnableOrbitController(true);
            updateRooftopElements(foundation, id, roofSegments, centerPointV3, topZ, thickness);
            isPointerDownRef.current = false;
          }}
        />
      )}
    </group>
  );
};

export default React.memo(PyramidRoof);
