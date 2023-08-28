/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PyramidRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { CanvasTexture, Euler, Mesh, Raycaster, RepeatWrapping, Vector2, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { Line, Plane } from '@react-three/drei';
import { HALF_PI, HALF_PI_Z_EULER, TWO_PI } from 'src/constants';
import { useRefStore } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { ActionType, ObjectType, ResizeHandleType, RoofHandleType, RoofTexture } from 'src/types';
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
import { RoofUtil } from './RoofUtil';
import {
  useIsFirstRender,
  useMultiCurrWallArray,
  useRoofHeight,
  useRoofTexture,
  useUpdateOldRoofFiles,
  useUpdateRooftopElements,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
  useUserData,
} from './hooks';
import RoofSegment from './roofSegment';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import Ceiling from './ceiling';
import FlatRoof from './flatRoof';
import { BuildingParts, FoundationModel } from '../../models/FoundationModel';
import shallow from 'zustand/shallow';
import { WindowModel } from 'src/models/WindowModel';
import { useSelected } from '../hooks';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector = new Vector3();
const zVector3 = new Vector3(0, 0, 1);

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

interface PyramidRoofProps extends BuildingParts {
  roofModel: PyramidRoofModel;
}

const PyramidRoof = ({ roofModel, foundationModel }: PyramidRoofProps) => {
  let {
    cx,
    cy,
    lz,
    id,
    wallsId,
    textureType,
    color = 'white',
    sideColor = 'white',
    thickness = 0.2,
    locked,
    lineWidth = 0.2,
    lineColor = 'black',
    roofType,
    foundationId,
    rise = lz,
    ceiling = false,
  } = roofModel;

  const texture = useRoofTexture(textureType);

  const selected = useSelected(id);

  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);

  const { camera, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const intersectionPlaneRef = useRef<Mesh>(null);
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

  const { currentWallArray, isLoopRef } = useMultiCurrWallArray(foundationId, id, wallsId);

  const { highestWallHeight, topZ } = useRoofHeight(currentWallArray, rise);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

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
  }, [currentWallArray, centerPoint, thickness]);

  const ceilingPoints = useMemo(() => {
    const points: Vector3[] = [];
    if (currentWallArray.length === 0) return points;
    points.push(new Vector3().fromArray(currentWallArray[0].leftPoint));
    for (const wall of currentWallArray) {
      points.push(new Vector3().fromArray(wall.rightPoint));
    }
    return points;
  }, [currentWallArray]);

  // set position and rotation
  let rotation = 0;
  if (foundationModel) {
    cx = foundationModel.cx;
    cy = foundationModel.cy;
    rotation = foundationModel.rotation[2];

    const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - rotation;
    intersectionPlanePosition.set(centerPoint.x, centerPoint.y, topZ);
    intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
  }

  const isFirstRender = useIsFirstRender();

  useEffect(() => {
    if (isFirstRender) return;
    const addIdRoofId = useStore.getState().addedRoofId;
    if (addIdRoofId && addIdRoofId === id) {
      if (currentWallArray.length >= 2 && needUpdateWallsId(currentWallArray, prevWallsIdSet)) {
        const newWallsIdArray = currentWallArray.map((v) => v.id);
        const newWallsIdSet = new Set(newWallsIdArray);
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Roof) {
              if (e.id === id) {
                (e as RoofModel).wallsId = newWallsIdArray;
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
  }, [prevWallsIdSet]);

  // update wall's roofId when adding new roof
  useEffect(() => {
    if (currentWallArray.length > 1) {
      const addedRoofId = useStore.getState().addedRoofId;
      if (addedRoofId && addedRoofId === id) {
        // update walls
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
        useStore.getState().setAddedRoofId(null);
      }
    } else {
      removeElementById(id, false, false, true);
    }
  }, [currentWallArray]);

  useUpdateRooftopElements(foundationModel, id, roofSegments, centerPointV3, topZ, thickness);

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

  const updateSegmentVertices = useUpdateSegmentVerticesMap(
    id,
    centerPointV3,
    roofSegments,
    isFlatRoof,
    RoofType.Pyramid,
  );

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      if (isFlatRoof) {
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
              t.wrapT = t.wrapS = RepeatWrapping;
              t.offset.set(-minX / dx, -minY / dy);
              t.center.set(vcx / dx, vcy / dy);
              t.rotation = -foundationModel.rotation[2];
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

    if (isFlatRoof) {
      const seg: Vector3[] = [];
      for (const segment of segmentVertices) {
        seg.push(segment[0].clone());
      }
      useDataStore.getState().setRoofSegmentVerticesWithoutOverhang(id, [seg]);
    } else {
      useDataStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
    }
  };

  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangMap);

  const windows = useStore(
    (state) => state.elements.filter((e) => e.parentId === id && e.type === ObjectType.Window),
    shallow,
  ) as WindowModel[];

  const userData = useUserData(id, foundationModel, centerPointV3, roofSegments);

  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  return (
    <group name={`Pyramid Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={`Pyramid Roof Segments Group ${id}`}
        userData={userData}
        position={[centerPoint.x, centerPoint.y, topZ]}
        onPointerDown={(e) => {
          handlePointerDown(e, foundationModel.id, id, roofSegments, centerPointV3);
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
        {isFlatRoof ? (
          <FlatRoof
            id={id}
            foundationModel={foundationModel as FoundationModel}
            roofType={roofType}
            roofSegments={roofSegments}
            center={centerPointV3}
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
                        foundationModel={foundationModel as FoundationModel}
                        roofType={roofType}
                        segment={segment}
                        centroid={centerPointV3}
                        thickness={thickness}
                        color={topLayerColor}
                        sideColor={sideColor}
                        texture={texture}
                        heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                        windows={windows}
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
      {ceiling && rise > 0 && <Ceiling points={ceilingPoints} cz={currentWallArray[0].lz} />}

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
            setCommonStore((state) => {
              state.resizeHandleType = ResizeHandleType.Top;
              state.selectedElementHeight = topZ + roofModel.thickness;
            });
          }}
          onPointerUp={() => {
            setShowIntersectionPlane(false);
            useRefStore.getState().setEnableOrbitController(true);
          }}
          onPointerOver={() => {
            setCommonStore((state) => {
              state.hoveredHandle = RoofHandleType.Top;
              state.selectedElementHeight = topZ + roofModel.thickness;
              state.selectedElementX = centerPoint.x;
              state.selectedElementY = centerPoint.y;
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
            if (intersectionPlaneRef.current && isPointerDownRef.current && foundationModel) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                const newRise = Math.max(0, point.z - foundationModel.lz - 0.3 - highestWallHeight);
                // the vertical ruler needs to display the latest rise when the handle is being dragged
                useStore.getState().updateRoofRiseById(id, newRise, topZ + roofModel.thickness);
              }
            }
          }}
          onPointerUp={(e) => {
            addUndoableResizeRoofRise(id, oldRiseRef.current, rise);
            setShowIntersectionPlane(false);
            useRefStore.getState().setEnableOrbitController(true);
            isPointerDownRef.current = false;
          }}
        />
      )}
    </group>
  );
};

export default React.memo(PyramidRoof, areRoofsEqual);
