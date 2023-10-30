/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { Cone, Line, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  HALF_PI_Z_EULER,
  TWO_PI,
} from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { MansardRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { ActionType, ObjectType, ResizeHandleType, RoofHandleType, RoofTexture } from 'src/types';
import { UnoableResizeMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import {
  BoxBufferGeometry,
  CanvasTexture,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Mesh,
  RepeatWrapping,
  Shape,
  Vector3,
} from 'three';
import {
  useMultiCurrWallArray,
  useRoofHeight,
  useRoofTexture,
  useTransparent,
  useUpdateOldRoofFiles,
  useUpdateRooftopElements,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
  useUserData,
} from './hooks';
import {
  addUndoableResizeRoofRise,
  areRoofsEqual,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofSegmentGroupUserData,
  RoofSegmentProps,
  RoofWireframeProps,
} from './roofRenderer';
import RoofSegment from './roofSegment';
import { RoofUtil } from './RoofUtil';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import Ceiling from './ceiling';
import FlatRoof, { TopExtrude } from './flatRoof';
import { BuildingParts, FoundationModel } from '../../models/FoundationModel';
import shallow from 'zustand/shallow';
import { WindowModel } from 'src/models/WindowModel';
import { useSelected } from '../hooks';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zVector3 = new Vector3(0, 0, 1);

const MansardRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  const wallPoints = useMemo(
    () => roofSegments.reduce((arr, segment) => arr.concat(segment.points[1]), [roofSegments[0].points[0]]),
    [roofSegments],
  );

  const ridgePoints = useMemo(
    () =>
      roofSegments.reduce((arr, segment) => arr.concat(segment.points[6].clone()), [roofSegments[0].points[7].clone()]),
    [roofSegments],
  );

  const wallLine = useMemo(
    () => <Line points={wallPoints} lineWidth={lineWidth} color={lineColor} />,
    [wallPoints, lineWidth, lineColor],
  );

  if (roofSegments.length < 2) {
    return null;
  }

  // segments array
  // [wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint,
  //  wallLeftPointAfterOverhang.add(thicknessVector),
  //  wallRightPointAfterOverhang.add(thicknessVector),
  //  ridgeRightPoint.add(thicknessVector),
  //  ridgeLeftPoint.add(thicknessVector)]

  const isFlat = Math.abs(roofSegments[0].points[0].z - roofSegments[0].points[3].z) < 0.1;

  return (
    <>
      {!isFlat && <Line points={ridgePoints} lineWidth={lineWidth} color={lineColor} />}
      {wallLine}
      <group position={[0, 0, thickness]}>{wallLine}</group>
      {roofSegments.map((segment, idx) => {
        return (
          <React.Fragment key={idx}>
            {!isFlat && (
              <Line points={[segment.points[7], segment.points[4]]} lineWidth={lineWidth} color={lineColor} />
            )}
            <Line points={[segment.points[4], segment.points[0]]} lineWidth={lineWidth} color={lineColor} />
          </React.Fragment>
        );
      })}
    </>
  );
});

interface MansardRoofProps extends BuildingParts {
  roofModel: MansardRoofModel;
}

const MansardRoof = ({ roofModel, foundationModel }: MansardRoofProps) => {
  let {
    id,
    wallsId,
    cx,
    cy,
    lz,
    textureType,
    color = 'white',
    sideColor = 'white',
    thickness = 0.2,
    locked,
    lineColor = 'black',
    lineWidth = 0.2,
    roofType,
    foundationId,
    ridgeWidth = 1,
    rise = lz,
    ceiling = false,
    // old files data
    frontRidge,
    backRidge,
  } = roofModel;

  const texture = useRoofTexture(textureType);

  const selected = useSelected(id);

  [lineColor, lineWidth] = RoofUtil.getWireframetStyle(lineColor, lineWidth, selected, locked);

  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const ray = useStore((state) => state.ray);
  const mouse = useStore((state) => state.mouse);

  const [width, setWidth] = useState(ridgeWidth);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [ridgeHandleIndex, setRidgeHandleIndex] = useState<number | null>(null);

  const oldWidth = useRef(width);
  const oldRiseRef = useRef(rise);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const isPointerDownRef = useRef(false);
  const { gl, camera } = useThree();

  const isFlat = rise < 0.01;

  const getWallPoint2 = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    const length = wallArray.length;
    for (const w of wallArray) {
      if (w.leftPoint[0] !== undefined && w.leftPoint[1] !== undefined) {
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

  const getWallPointFromHandleIdx = (idx: number) => {
    if (idx < currentWallArray.length) {
      const wall = currentWallArray[idx];
      return new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
    } else {
      const wall = currentWallArray[idx - 1];
      return new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
    }
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const updateRidge = (elemId: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Mansard) {
          (e as MansardRoofModel).ridgeWidth = val;
          break;
        }
      }
    });
  };

  const getOverhangHeight = () => {
    let height = Infinity;

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1]);
      const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1]);
      // const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
      const dLeft = RoofUtil.getDistance(leftPoint, rightPoint, ridgePoints[i].leftPoint);
      const overhangHeightLeft = Math.min(((w.eavesLength ?? 0) / dLeft) * (ridgePoints[i].leftPoint.z - w.lz), w.lz);
      const dRight = RoofUtil.getDistance(leftPoint, rightPoint, ridgePoints[i].rightPoint);
      const overhangHeightRight = Math.min(
        ((w.eavesLength ?? 0) / dRight) * (ridgePoints[i].rightPoint.z - w.lz),
        w.lz,
      );
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const addUndoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number, newVal: number) => {
    const undoable = {
      name: 'Resize Mansard Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldVal: oldVal,
      newVal: newVal,
      type: type,
      undo: () => {
        updateRidge(undoable.resizedElementId, undoable.oldVal);
      },
      redo: () => {
        updateRidge(undoable.resizedElementId, undoable.newVal);
      },
    } as UnoableResizeMansardRoofRidge;
    useStore.getState().addUndoable(undoable);
  };
  const { currentWallArray, isLoopRef } = useMultiCurrWallArray(foundationId, id, wallsId);

  const { highestWallHeight, topZ } = useRoofHeight(currentWallArray, rise);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const centroid = useMemo(() => {
    if (currentWallArray.length < 2) {
      return new Vector3();
    }
    const points = getWallPoint2(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
      return new Vector3();
    }
    return new Vector3(p.x, p.y, topZ);
  }, [currentWallArray, topZ]);

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

  const wallPointsAfterOverhang = useMemo(() => {
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

  const ridgePoints = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => {
      const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
      const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
      const leftDiff = new Vector3().subVectors(centroid, leftPoint).setZ(0).normalize().multiplyScalar(width);
      const rightDiff = new Vector3().subVectors(centroid, rightPoint).setZ(0).normalize().multiplyScalar(width);
      leftPoint.add(leftDiff).setZ(topZ);
      rightPoint.add(rightDiff).setZ(topZ);
      return { leftPoint, rightPoint };
    });
    if (!isLoopRef.current && res.length !== 0) {
      res.push({ leftPoint: res[res.length - 1].rightPoint, rightPoint: res[0].leftPoint });
    }
    return res;
  }, [currentWallArray, centroid, width]);

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
          wallPointsAfterOverhang[(i + wallPointsAfterOverhang.length - 1) % wallPointsAfterOverhang.length].leftPoint,
          wallPointsAfterOverhang[(i + wallPointsAfterOverhang.length - 1) % wallPointsAfterOverhang.length].rightPoint,
          wallPointsAfterOverhang[i].leftPoint,
          wallPointsAfterOverhang[i].rightPoint,
        )
          .setZ(lh - overhangHeight)
          .sub(centroid);

        const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOverhang[i].leftPoint,
          wallPointsAfterOverhang[i].rightPoint,
          wallPointsAfterOverhang[(i + 1) % wallPointsAfterOverhang.length].leftPoint,
          wallPointsAfterOverhang[(i + 1) % wallPointsAfterOverhang.length].rightPoint,
        )
          .setZ(rh - overhangHeight)
          .sub(centroid);

        const ridgeLeftPoint = ridgePoints[i].leftPoint.clone().sub(centroid);
        const ridgeRightPoint = ridgePoints[i].rightPoint.clone().sub(centroid);

        const length = new Vector3(w.cx, w.cy).sub(centroid.clone().setZ(0)).length();
        points.push(wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint);
        points.push(
          wallLeftPointAfterOverhang.clone().add(thicknessVector),
          wallRightPointAfterOverhang.clone().add(thicknessVector),
          ridgeRightPoint.clone().add(thicknessVector),
          ridgeLeftPoint.clone().add(thicknessVector),
        );
        segments.push({ points, angle: -w.relativeAngle, length });
      }
    }
    if (!isLoopRef.current) {
      const idx = wallPointsAfterOverhang.length - 1;
      const leftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOverhang[idx - 1].leftPoint,
        wallPointsAfterOverhang[idx - 1].rightPoint,
        wallPointsAfterOverhang[idx].leftPoint,
        wallPointsAfterOverhang[idx].rightPoint,
      )
        .setZ(currentWallArray[currentWallArray.length - 1].lz - overhangHeight)
        .sub(centroid);
      const rightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOverhang[idx].leftPoint,
        wallPointsAfterOverhang[idx].rightPoint,
        wallPointsAfterOverhang[0].leftPoint,
        wallPointsAfterOverhang[0].rightPoint,
      )
        .setZ(currentWallArray[0].lz - overhangHeight)
        .sub(centroid);

      const ridgeLeftPoint = ridgePoints[idx].leftPoint.clone().sub(centroid);
      const ridgeRightPoint = ridgePoints[idx].rightPoint.clone().sub(centroid);

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
      points.push(leftPointAfterOverhang, rightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint);
      points.push(
        leftPointAfterOverhang.clone().add(thicknessVector),
        rightPointAfterOverhang.clone().add(thicknessVector),
        ridgeRightPoint.clone().add(thicknessVector),
        ridgeLeftPoint.clone().add(thicknessVector),
      );
      segments.push({ points, angle: -angle, length });
    }
    return segments;
  }, [currentWallArray, topZ, width, thickness]);

  const topRidgeShape = useMemo(() => {
    const shape = new Shape();
    if (ridgePoints.length > 0) {
      const startPoint = ridgePoints[0].leftPoint.clone().sub(centroid);
      shape.moveTo(startPoint.x, startPoint.y);
      for (const point of ridgePoints) {
        const rightPoint = point.rightPoint.clone().sub(centroid);
        shape.lineTo(rightPoint.x, rightPoint.y);
      }
      shape.closePath();
    }
    return shape;
  }, [currentWallArray, ridgePoints]);

  const ceilingPoints = useMemo(() => {
    const points: Vector3[] = [];
    if (currentWallArray.length === 0) return points;
    points.push(new Vector3().fromArray(currentWallArray[0].leftPoint));
    for (const wall of currentWallArray) {
      points.push(new Vector3().fromArray(wall.rightPoint));
    }
    return points;
  }, [currentWallArray]);

  useEffect(() => {
    if (ridgeWidth !== width) {
      setWidth(ridgeWidth);
    }
  }, [ridgeWidth]);

  useEffect(() => {
    if (currentWallArray.length > 1) {
      if (useStore.getState().addedRoofIdSet.has(id)) {
        for (let i = 0; i < currentWallArray.length; i++) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === currentWallArray[i].id && e.type === ObjectType.Wall) {
                const w = e as WallModel;
                w.roofId = id;
                // some old files set wall's roof height, which should not
                w.leftRoofHeight = undefined;
                w.rightRoofHeight = undefined;
                break;
              }
            }
          });
        }
        useStore.getState().deleteAddedRoofId(id);
      }
    } else {
      removeElementById(id, false, false, true);
    }
  }, [currentWallArray]);

  useUpdateRooftopElements(foundationModel, id, roofSegments, centroid, topZ, thickness);

  // update old files
  useEffect(() => {
    // handle old files
    if (frontRidge !== undefined || backRidge !== undefined) {
      setCommonStore((state) => {
        for (const el of state.elements) {
          if (el.type === ObjectType.Wall) {
            const w = el as WallModel;
            if (w.roofId === id) {
              w.centerLeftRoofHeight = undefined;
              w.centerRightRoofHeight = undefined;
            }
          } else if (el.type === ObjectType.Roof && (el as RoofModel).roofType === RoofType.Mansard) {
            if (el.id === id) {
              (el as MansardRoofModel).frontRidge = undefined;
              (el as MansardRoofModel).backRidge = undefined;
            }
          }
        }
      });
    }
  }, []);

  const updateSegmentVerticesWithoutOverhangMap = () => {
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
        const ridgeLeftPoint = ridgePoints[i].leftPoint.clone();
        const ridgeRightPoint = ridgePoints[i].rightPoint.clone();

        segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeRightPoint, ridgeLeftPoint]);
      }
    }
    if (!isLoopRef.current) {
      const lastIdx = currentWallArray.length - 1;
      const firstWall = currentWallArray[0];
      const lastWall = currentWallArray[lastIdx];
      const leftPoint = new Vector3(lastWall.rightPoint[0], lastWall.rightPoint[1], lastWall.lz);
      const rightPoint = new Vector3(firstWall.leftPoint[0], firstWall.leftPoint[1], firstWall.lz);
      const ridgeLeftPoint = ridgePoints[lastIdx].leftPoint.clone();
      const ridgeRightPoint = ridgePoints[lastIdx].rightPoint.clone();
      segmentVertices.push([leftPoint, rightPoint, ridgeRightPoint, ridgeLeftPoint]);
    }
    const ridgeVertices = ridgePoints.map((ridge) => ridge.leftPoint.clone());
    segmentVertices.push(ridgeVertices);

    if (isFlat) {
      const seg: Vector3[] = [];
      for (const segment of segmentVertices.slice(0, -1)) {
        seg.push(segment[0].clone());
      }
      useDataStore.getState().setRoofSegmentVerticesWithoutOverhang(id, [seg]);
    } else {
      useDataStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
    }
  };

  const updateSegmentVertices = useUpdateSegmentVerticesMap(
    id,
    centroid,
    roofSegments,
    isFlat,
    RoofType.Mansard,
    ridgePoints.map((ridge) => ridge.leftPoint.clone().add(thicknessVector)),
  );
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangMap);

  const world = useStore.getState().world;
  const selectMe = useStore(Selector.selectMe);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);
  const [flatHeatmapTexture, setFlatHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [updateFlag, setUpdateFlag] = useState(false);

  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);

  const getRoofSegmentVerticesWithoutOverhang = useDataStore(Selector.getRoofSegmentVerticesWithoutOverhang);
  const hourlyHeatExchangeArrayMap = useDataStore.getState().hourlyHeatExchangeArrayMap;
  const topSurfaceMeshRef = useRef<Mesh>(null);
  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowLength = useRef<Vector3>();
  const heatFluxArrowEuler = useRef<Euler>();

  const { transparent, opacity } = useTransparent();

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      if (isFlat) {
        const heatmap = getHeatmap(id);
        if (heatmap) {
          const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
          if (t) {
            // obtain the bounding rectangle
            const segmentVertices = updateSegmentVertices();
            if (segmentVertices && segmentVertices.length > 0 && foundationModel) {
              const euler = new Euler(0, 0, foundationModel.rotation[2], 'ZYX');
              let minX = Number.MAX_VALUE;
              let minY = Number.MAX_VALUE;
              let maxX = -Number.MAX_VALUE;
              let maxY = -Number.MAX_VALUE;
              for (const s of segmentVertices) {
                for (const v of s) {
                  const v2 = v.clone().applyEuler(euler);
                  if (v2.x > maxX) maxX = v2.x;
                  if (v2.x < minX) minX = v2.x;
                  if (v2.y > maxY) maxY = v2.y;
                  if (v2.y < minY) minY = v2.y;
                }
              }
              const dx = maxX - minX;
              const dy = maxY - minY;
              const vcx = (minX + maxX) / 2;
              const vcy = (minY + maxY) / 2;
              const cp = new Vector3(centroid.x, centroid.y).applyEuler(euler);
              t.wrapT = t.wrapS = RepeatWrapping;
              t.repeat.set(1 / dx, 1 / dy);
              t.center.set((cp.x - vcx) / dx, (cp.y - vcy) / dy);
              t.offset.set(0.5, 0.5);
              t.rotation = -foundationModel.rotation[2];
            }
            setFlatHeatmapTexture(t);
          }
        }
      } else {
        const n = roofSegments.length + 1; // roofSegments does not include the top surface, so we add 1 here.
        const textures = [];
        for (let i = 0; i < n; i++) {
          const heatmap = getHeatmap(id + '-' + i);
          if (heatmap) {
            const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
            if (t) {
              if (i === n - 1 && foundationModel) {
                // FIXME: I have no idea why the top heatmap needs to be rotated as follows
                t.center.set(0.5, 0.5);
                t.rotation = -foundationModel.rotation[2];
              }
              textures.push(t);
            }
          }
        }
        setHeatmapTextures(textures);
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    if (topSurfaceMeshRef.current) {
      const points = topRidgeShape.extractPoints(1).shape;
      const zOffset = 0.01; // a small number to ensure the surface mesh stay atop
      const geo = topSurfaceMeshRef.current.geometry;
      const n = points.length - 1;
      if (n === 4) {
        // special case: a quad can be more efficiently represented using only two triangles
        const positions = new Float32Array(18);
        positions[0] = points[3].x;
        positions[1] = points[3].y;
        positions[2] = zOffset;
        positions[3] = points[0].x;
        positions[4] = points[0].y;
        positions[5] = zOffset;
        positions[6] = points[2].x;
        positions[7] = points[2].y;
        positions[8] = zOffset;
        positions[9] = points[2].x;
        positions[10] = points[2].y;
        positions[11] = zOffset;
        positions[12] = points[0].x;
        positions[13] = points[0].y;
        positions[14] = zOffset;
        positions[15] = points[1].x;
        positions[16] = points[1].y;
        positions[17] = zOffset;
        // don't call geo.setFromPoints. It doesn't seem to work correctly.
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        const scale = showSolarRadiationHeatmap ? 1 : 6;
        const uvs = [];
        uvs.push(0, 0);
        uvs.push(scale, 0);
        uvs.push(0, scale);
        uvs.push(0, scale);
        uvs.push(scale, 0);
        uvs.push(scale, scale);
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      } else {
        const geo = topSurfaceMeshRef.current.geometry;
        const positions = new Float32Array(n * 9);
        const scale = showSolarRadiationHeatmap ? 1 : 6;
        const uvs = [];
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        for (const p of points) {
          if (p.x > maxX) maxX = p.x;
          else if (p.x < minX) minX = p.x;
          if (p.y > maxY) maxY = p.y;
          else if (p.y < minY) minY = p.y;
        }
        const dx = maxX - minX;
        const dy = maxY - minY;
        for (let i = 0; i < n; i++) {
          const j = i * 9;
          positions[j] = points[i].x;
          positions[j + 1] = points[i].y;
          positions[j + 2] = zOffset;
          positions[j + 3] = points[i + 1].x;
          positions[j + 4] = points[i + 1].y;
          positions[j + 5] = zOffset;
          positions[j + 6] = 0;
          positions[j + 7] = 0;
          positions[j + 8] = zOffset;
          if (showSolarRadiationHeatmap) {
            uvs.push(((points[i].x - minX) / dx) * scale, ((points[i].y - minY) / dy) * scale);
            uvs.push(((points[i + 1].x - minX) / dx) * scale, ((points[i + 1].y - minY) / dy) * scale);
          } else {
            // I have no idea why the regular texture coordinates should not subtract minX and minY
            uvs.push((points[i].x / dx) * scale, (points[i].y / dy) * scale);
            uvs.push((points[i + 1].x / dx) * scale, (points[i + 1].y / dy) * scale);
          }
          uvs.push(0, 0);
        }
        // don't call geo.setFromPoints. It doesn't seem to work correctly.
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      }
    } else if (showSolarRadiationHeatmap && !updateFlag) {
      setUpdateFlag(!updateFlag);
    }
  }, [topRidgeShape, showSolarRadiationHeatmap, updateFlag]);

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    if (foundationModel && (foundationModel as FoundationModel).notBuilding) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id + '-' + roofSegments.length);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments || !segments[roofSegments.length]) return undefined;
    const s = segments[roofSegments.length].map((v) =>
      v
        .clone()
        .sub(centroid)
        .add(new Vector3(0, 0, centroid.z + thickness)),
    );
    if (!s) return undefined;
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
    const vectors: Vector3[][] = [];
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

  const userData = useUserData(id, foundationModel, centroid, roofSegments);

  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  const windows = useStore(
    (state) => state.elements.filter((e) => e.parentId === id && e.type === ObjectType.Window),
    shallow,
  ) as WindowModel[];

  const holeMeshes = useMemo(
    () =>
      windows.map((w) => {
        const dimension = new Vector3(w.lx, w.lz, w.ly * 2);
        const position = new Vector3(w.cx, w.cy, w.cz).sub(centroid);
        const rotation = new Euler().fromArray([...w.rotation, 'ZXY']);

        const holeMesh = new Mesh(new BoxBufferGeometry(dimension.x, dimension.y, dimension.z));
        holeMesh.position.copy(position);
        holeMesh.rotation.copy(rotation);
        holeMesh.updateMatrix();
        return holeMesh;
      }),
    [windows, centroid],
  );

  const noTextureAndOneColor = textureType === RoofTexture.NoTexture && color && color === sideColor;
  const castShadow = shadowEnabled && !transparent;

  return (
    <group name={`Mansard Roof Group ${id}`}>
      <group
        name={`Mansard Roof Segments Group ${id}`}
        position={[centroid.x, centroid.y, centroid.z]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, foundationModel.id, id, roofSegments, centroid);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, id);
        }}
        onPointerUp={(e) => {
          handlePointerUp(e, roofModel);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {isFlat ? (
          <FlatRoof
            id={id}
            foundationModel={foundationModel as FoundationModel}
            roofType={roofType}
            roofSegments={roofSegments}
            center={new Vector3(centroid.x, centroid.y, topZ)}
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
            {roofSegments.map((segment, index, arr) => {
              return (
                <RoofSegment
                  id={id}
                  key={index}
                  index={index}
                  foundationModel={foundationModel as FoundationModel}
                  roofType={roofType}
                  segment={segment}
                  centroid={centroid}
                  thickness={thickness}
                  color={topLayerColor}
                  sideColor={sideColor}
                  texture={texture}
                  heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                  windows={windows}
                />
              );
            })}

            {/*special case: the whole roof segment has no texture and only one color */}
            {noTextureAndOneColor && !showSolarRadiationHeatmap ? (
              <TopExtrude
                uuid={id + '-' + roofSegments.length}
                simulation={true}
                shape={topRidgeShape}
                thickness={thickness}
                holeMeshes={holeMeshes}
                castShadow={castShadow}
                receiveShadow={shadowEnabled}
              >
                <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
              </TopExtrude>
            ) : (
              <>
                {showSolarRadiationHeatmap && heatmapTextures.length === roofSegments.length + 1 && (
                  <mesh
                    uuid={id + '-' + roofSegments.length}
                    ref={topSurfaceMeshRef}
                    name={'Mansard Roof Top Surface'}
                    position={[0, 0, thickness]}
                    receiveShadow={shadowEnabled}
                  >
                    <meshBasicMaterial map={heatmapTextures[roofSegments.length]} color={'white'} side={DoubleSide} />
                  </mesh>
                )}
                <TopExtrude
                  simulation={true}
                  shape={topRidgeShape}
                  thickness={thickness}
                  holeMeshes={holeMeshes}
                  castShadow={castShadow}
                  receiveShadow={shadowEnabled}
                >
                  <meshStandardMaterial
                    map={texture}
                    color={topLayerColor}
                    transparent={transparent}
                    opacity={opacity}
                  />
                </TopExtrude>
              </>
            )}
            {/* wireframe */}
            {roofSegments.length > 0 && (
              <MansardRoofWireframe
                roofSegments={roofSegments}
                thickness={thickness}
                lineColor={lineColor}
                lineWidth={lineWidth}
              />
            )}
          </>
        )}
      </group>

      {/* ceiling */}
      {ceiling && rise > 0 && <Ceiling points={ceilingPoints} cz={currentWallArray[0].lz} />}

      {/* handles */}
      {selected && !locked && (
        <group position={[centroid.x, centroid.y, centroid.z + thickness]}>
          <RoofHandle
            position={[0, 0, 0.3]}
            onPointerDown={(e) => {
              selectMe(roofModel.id, e, ActionType.Select);
              isPointerDownRef.current = true;
              oldRiseRef.current = rise;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(centroid.x, centroid.y, topZ);
              if (foundationModel) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundationModel.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Top);
              useRefStore.getState().setEnableOrbitController(false);
              setCommonStore((state) => {
                state.resizeHandleType = ResizeHandleType.Top;
                state.selectedElementHeight = topZ + roofModel.thickness;
              });
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.Top;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = centroid.x;
                state.selectedElementY = centroid.y;
              });
            }}
          />
          {ridgePoints.map((ridge, idx) => {
            const point = ridge.leftPoint.clone().sub(centroid);
            return (
              <RoofHandle
                key={idx}
                position={[point.x, point.y, 0]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  setEnableIntersectionPlane(true);
                  intersectionPlanePosition.set(point.x, point.y, topZ + 0.15);
                  intersectionPlaneRotation.set(0, 0, 0);
                  setRoofHandleType(RoofHandleType.Ridge);
                  setRidgeHandleIndex(idx);
                  setMaxWidth(
                    currentWallArray.reduce(
                      (max, wall) =>
                        Math.min(max, new Vector3(wall.leftPoint[0], wall.leftPoint[1], topZ).distanceTo(centroid) - 1),
                      Infinity,
                    ),
                  );
                  useRefStore.getState().setEnableOrbitController(false);
                  oldWidth.current = width;
                }}
              />
            );
          })}
        </group>
      )}

      {/* intersection plane */}
      {enableIntersectionPlane && (
        <Plane
          name={'Roof Intersection Plane'}
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          position={intersectionPlanePosition}
          rotation={intersectionPlaneRotation}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current && isPointerDownRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && foundationModel) {
                const pointer = intersects[0].point;
                if (pointer.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Top: {
                    const newRise = Math.max(0, pointer.z - foundationModel.lz - 0.6 - highestWallHeight);
                    // the vertical ruler needs to display the latest rise when the handle is being dragged
                    useStore.getState().updateRoofRiseById(id, newRise, topZ + roofModel.thickness);
                    break;
                  }
                  case RoofHandleType.Ridge: {
                    if (foundationModel && ridgeHandleIndex !== null) {
                      const p = pointer
                        .clone()
                        .applyEuler(new Euler(0, 0, foundationModel.rotation[2]))
                        .sub(new Vector3(foundationModel.cx, foundationModel.cy))
                        .setZ(0);

                      const wallPoint = getWallPointFromHandleIdx(ridgeHandleIndex);
                      const d = p.distanceTo(wallPoint);
                      const dir = new Vector3().subVectors(centroid.clone().setZ(0), wallPoint);
                      const angle = p.clone().sub(wallPoint).angleTo(dir);
                      if (angle < HALF_PI) {
                        setWidth(Util.clamp(d, 0.5, maxWidth ?? dir.length() - 1));
                      } else {
                        setWidth(0.5);
                      }
                    }
                    break;
                  }
                }
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Top: {
                addUndoableResizeRoofRise(id, oldRiseRef.current, rise);
                break;
              }
              case RoofHandleType.Ridge: {
                addUndoableResizeRidge(id, roofHandleType, oldWidth.current, width);
                break;
              }
            }
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Mansard) {
                  (e as MansardRoofModel).ridgeWidth = width;
                  break;
                }
              }
            });
            isPointerDownRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            setRidgeHandleIndex(null);
            useRefStore.getState().setEnableOrbitController(true);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}

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
    </group>
  );
};

export default React.memo(MansardRoof, areRoofsEqual);
