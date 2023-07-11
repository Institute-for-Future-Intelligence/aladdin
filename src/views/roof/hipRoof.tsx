/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import { Line, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { HipRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { ActionType, ObjectType, ResizeHandleType, RoofHandleType, RoofTexture } from 'src/types';
import { UndoableResizeHipRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, RepeatWrapping, Vector2, Vector3 } from 'three';
import {
  ComposedWall,
  useComposedWallArray,
  useCurrWallArray,
  useIsFirstMount,
  useComposedRoofHeight,
  useRoofHeight,
  useRoofTexture,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
} from './hooks';
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
import RoofSegment from './roofSegment';
import { RoofUtil } from './RoofUtil';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import Ceiling from './ceiling';
import FlatRoof from './flatRoof';
import { FoundationModel } from '../../models/FoundationModel';

const HipRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
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

  const isFlat = Math.abs(roofSegments[0].points[0].z) < 0.015;
  const leftRidge = roofSegments[0].points[3].clone().add(thicknessVector);
  const rightRidge = roofSegments[0].points[2].clone().add(thicknessVector);
  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      {periphery}
      {!isFlat && <Line points={[leftRidge, rightRidge]} lineWidth={lineWidth} color={lineColor} />}
      <group position={[0, 0, thickness]}>
        {periphery}
        {roofSegments.map((segment, idx) => {
          const [leftRoof, rightRoof, rightRidge, leftRidge] = segment.points;
          const points = [leftRoof.clone().sub(thicknessVector), leftRoof];
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zVector3 = new Vector3(0, 0, 1);

const HipRoof = (roofModel: HipRoofModel) => {
  let {
    id,
    parentId,
    cx,
    cy,
    cz,
    lz,
    wallsId,
    leftRidgeLength,
    rightRidgeLength,
    selected,
    textureType,
    color = 'white',
    sideColor = 'white',
    thickness,
    locked,
    lineColor = 'black',
    lineWidth = 0.2,
    roofType,
    rise = lz,
    ceiling = false,
  } = roofModel;
  // color = '#fb9e00';

  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  // set position and rotation
  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId && e.type === ObjectType.Foundation) {
        return e;
      }
    }
    return null;
  });
  let rotation = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotation = foundation.rotation[2];
  }

  const composedWalls = useComposedWallArray(wallsId[0], parentId);
  const texture = useRoofTexture(textureType);

  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);
  const [leftRidgeLengthCurr, setLeftRidgeLengthCurr] = useState(leftRidgeLength);
  const [rightRidgeLengthCurr, setRightRidgeLengthCurr] = useState(rightRidgeLength);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useComposedRoofHeight(composedWalls, rise);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const isPointerDownRef = useRef(false);
  const oldRiseRef = useRef(rise);

  const isFirstMount = useIsFirstMount();

  const isFlat = riseInnerState < 0.01;

  useEffect(() => {
    if (!isFirstMount) {
      setLeftRidgeLengthCurr(leftRidgeLength);
    }
  }, [leftRidgeLength, isFirstMount]);

  useEffect(() => {
    if (!isFirstMount) {
      setRightRidgeLengthCurr(rightRidgeLength);
    }
  }, [rightRidgeLength, isFirstMount]);

  useEffect(() => {
    if (!isFirstMount) {
      updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
    }
  }, [updateElementOnRoofFlag, topZ, thickness, isFirstMount]);

  const setHipRoofRidgeLength = (elemId: string, leftRidge: number, rightRidge: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Hip) {
          (e as HipRoofModel).leftRidgeLength = leftRidge;
          (e as HipRoofModel).rightRidgeLength = rightRidge;
          state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
          break;
        }
      }
    });
  };

  const handleUndoableResizeRidgeLength = (
    elemId: string,
    oldLeft: number,
    oldRight: number,
    newLeft: number,
    newRight: number,
  ) => {
    const undoable = {
      name: 'Resize Hip Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldLeftRidgeLength: oldLeft,
      oldRightRidgeLength: oldRight,
      newLeftRidgeLength: newLeft,
      newRightRidgeLength: newRight,
      undo: () => {
        setHipRoofRidgeLength(undoable.resizedElementId, undoable.oldLeftRidgeLength, undoable.oldRightRidgeLength);
      },
      redo: () => {
        setHipRoofRidgeLength(undoable.resizedElementId, undoable.newLeftRidgeLength, undoable.newRightRidgeLength);
      },
    } as UndoableResizeHipRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const getWallsPoint2 = (wallArray: ComposedWall[]) => {
    const arr: Point2[] = [];
    for (const w of wallArray) {
      arr.push({ x: w.leftPoint.x, y: w.leftPoint.y });
    }
    return arr;
  };

  const centroid2D = useMemo(() => {
    if (composedWalls === null) return new Vector2();

    const points = getWallsPoint2(composedWalls);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector2(p.x, p.y);
  }, [composedWalls]);

  const ridgeLeftPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, topZ);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(-leftRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, topZ, leftRidgeLengthCurr]);

  const ridgeRightPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, topZ);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(rightRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, topZ, rightRidgeLengthCurr]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(centroid2D.x, centroid2D.y, topZ);
  }, [centroid2D, topZ]);

  const makeSegment = (vector: Vector3[], p1: Vector3, p2: Vector3, p3: Vector3, p4?: Vector3) => {
    vector.push(p1, p2, p3);
    if (p4) {
      vector.push(p4);
    }
    vector.push(p1.clone().add(thicknessVector), p2.clone().add(thicknessVector), p3.clone().add(thicknessVector));
    if (p4) {
      vector.push(p4.clone().add(thicknessVector));
    }
  };

  const getOverhangHeight = () => {
    if (composedWalls === null) return 0;

    const wallPoints = composedWalls.map((w) => w.leftPoint);
    const ridges = [ridgeLeftPoint, ridgeRightPoint, ridgeRightPoint, ridgeLeftPoint];

    let height = Infinity;

    for (let i = 0; i < 4; i++) {
      const w = composedWalls[i];
      const dLeft = RoofUtil.getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[i]);
      const overhangHeightLeft = Math.min(((w.eavesLength ?? 0) / dLeft) * (ridges[i].z - w.lz), w.lz);
      const dRight = RoofUtil.getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[(i + 1) % 4]);
      const overhangHeightRight = Math.min(((w.eavesLength ?? 0) / dRight) * (ridges[(i + 1) % 4].z - w.lz), w.lz);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const overhangs = useMemo(() => {
    if (composedWalls === null) return [] as Vector3[];
    return composedWalls.map((wall) => RoofUtil.getComposedWallNormal(wall).multiplyScalar(wall.eavesLength));
  }, [composedWalls]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const wallPointsAfterOffset = useMemo(() => {
    if (composedWalls === null) return null;
    return composedWalls.map((wall, idx) => ({
      leftPoint: wall.leftPoint.clone().add(overhangs[idx]),
      rightPoint: wall.rightPoint.clone().add(overhangs[idx]),
    }));
  }, [composedWalls, overhangs]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];
    if (composedWalls === null || wallPointsAfterOffset === null) return segments;

    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < 4; i++) {
      const points: Vector3[] = [];
      const wall = composedWalls[i];
      const { lh, rh } = RoofUtil.getComposedWallHeight(composedWalls, i);

      const wallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[(i + 3) % 4].leftPoint,
        wallPointsAfterOffset[(i + 3) % 4].rightPoint,
        wallPointsAfterOffset[i].leftPoint,
        wallPointsAfterOffset[i].rightPoint,
      )
        .setZ(lh - overhangHeight)
        .sub(ridgeMidPoint);

      const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[i].leftPoint,
        wallPointsAfterOffset[i].rightPoint,
        wallPointsAfterOffset[(i + 1) % 4].leftPoint,
        wallPointsAfterOffset[(i + 1) % 4].rightPoint,
      )
        .setZ(rh - overhangHeight)
        .sub(ridgeMidPoint);

      const wallCenter = new Vector3().addVectors(wall.leftPoint, wall.rightPoint).divideScalar(2);
      const ridgeLeft = ridgeLeftPoint.clone().sub(ridgeMidPoint);
      const ridgeRight = ridgeRightPoint.clone().sub(ridgeMidPoint);
      let length = 0;
      switch (i) {
        case 0:
          length = wallCenter.clone().sub(ridgeMidPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight, ridgeLeft);
          break;
        case 1:
          length = wallCenter.clone().sub(ridgeRightPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight);
          break;
        case 2:
          length = wallCenter.clone().sub(ridgeMidPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft, ridgeRight);
          break;
        case 3:
          length = wallCenter.clone().sub(ridgeLeftPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft);
          break;
      }
      segments.push({ points, angle: -wall.relativeAngle, length });
    }
    return segments;
  }, [composedWalls, ridgeLeftPoint, ridgeRightPoint, topZ, thickness]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  useEffect(() => {
    if (!isFirstMount || useStore.getState().addedRoofId === id) {
      if (composedWalls === null) {
        removeElementById(id, false, false);
      } else {
        for (let i = 0; i < composedWalls.length; i++) {
          const wallsIdSet = new Set(composedWalls[i].wallsId);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall && wallsIdSet.has(e.id)) {
                (e as WallModel).roofId = id;
              }
            }
          });
        }
        updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
      }
    }
  }, [composedWalls, isFirstMount]);

  const updateSegmentVerticesWithoutOverhangMap = () => {
    if (!composedWalls) return;

    const segmentVertices: Vector3[][] = [];
    for (let i = 0; i < 4; i++) {
      const wall = composedWalls[i];
      const { lh, rh } = RoofUtil.getComposedWallHeight(composedWalls, i);

      const wallLeftPoint = wall.leftPoint.clone().setZ(lh);
      const wallRightPoint = wall.rightPoint.clone().setZ(rh);
      const ridgeLPoint = ridgeLeftPoint.clone();
      const ridgeRPoint = ridgeRightPoint.clone();

      switch (i) {
        case 0:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeRPoint, ridgeLPoint]);
          break;
        case 1:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeRPoint]);
          break;
        case 2:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeLPoint, ridgeRPoint]);
          break;
        case 3:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeLPoint]);
          break;
      }
    }
    if (isFlat) {
      const seg: Vector3[] = [];
      for (const segment of segmentVertices) {
        seg.push(segment[0].clone());
      }
      useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, [seg]);
    } else {
      useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
    }
  };

  const updateSegmentVertices = useUpdateSegmentVerticesMap(
    id,
    new Vector3(centroid2D.x, centroid2D.y, topZ),
    roofSegments,
    isFlat,
    RoofType.Hip,
  );
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangMap);

  const selectMe = useStore(Selector.selectMe);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [flatHeatmapTexture, setFlatHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      if (riseInnerState > 0) {
        const n = roofSegments.length;
        if (n > 0) {
          const textures = [];
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
      } else {
        // flat roof
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
              t.rotation = -foundation.rotation[2];
              t.repeat.set(1 / dx, 1 / dy);
            }
            setFlatHeatmapTexture(t);
          }
        }
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  // used for move rooftop elements between different roofs, passed to handlePointerMove in roofRenderer
  const userData: RoofSegmentGroupUserData = {
    roofId: id,
    foundation: foundation,
    centroid: ridgeMidPoint,
    roofSegments: roofSegments,
  };
  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  if (composedWalls === null) return null;

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Hip Roof Group ${id}`}>
      {/* roof segment group */}
      <group
        name={`Hip Roof Segments Group ${id}`}
        position={[centroid2D.x, centroid2D.y, topZ]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, ridgeMidPoint);
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
            foundationModel={foundation as FoundationModel}
            roofType={roofType}
            roofSegments={roofSegments}
            center={new Vector3(centroid2D.x, centroid2D.y, topZ)}
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
                // Roof segment idx is important for calculate normal
                <RoofSegment
                  id={id}
                  key={index}
                  index={index}
                  foundationModel={foundation as FoundationModel}
                  roofType={roofType}
                  segment={segment}
                  centroid={new Vector3(centroid2D.x, centroid2D.y, topZ)}
                  thickness={thickness}
                  color={topLayerColor}
                  sideColor={sideColor}
                  texture={texture}
                  heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                />
              );
            })}
            <HipRoofWireframe
              roofSegments={roofSegments}
              thickness={thickness}
              lineColor={lineColor}
              lineWidth={lineWidth}
            />
          </>
        )}
      </group>

      {/* ceiling */}
      {/* {ceiling && riseInnerState > 0 && <Ceiling currWallArray={currentWallArray} />} */}

      {/* handles */}
      {selected && !locked && (
        <group position={[0, 0, thickness + 0.15]}>
          {/* left handle */}
          <RoofHandle
            position={[ridgeLeftPoint.x, ridgeLeftPoint.y, ridgeLeftPoint.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPoint.x, ridgeLeftPoint.y, topZ);
              if (foundation && composedWalls[0]) {
                const dir = useStore.getState().cameraDirection;
                const rX = Math.atan2(dir.z, dir.y);
                const rZ = composedWalls[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI - rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useRefStore.getState().setEnableOrbitController(false);
            }}
          />
          {/* mid handle */}
          <RoofHandle
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z]}
            onPointerDown={(e) => {
              selectMe(roofModel.id, e, ActionType.Select);
              isPointerDownRef.current = true;
              oldRiseRef.current = rise;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, topZ);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useRefStore.getState().setEnableOrbitController(false);
              setCommonStore((state) => {
                state.resizeHandleType = ResizeHandleType.Top;
                state.selectedElementHeight = topZ + roofModel.thickness;
              });
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.Mid;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = centroid2D.x;
                state.selectedElementY = centroid2D.y;
              });
            }}
          />
          {/* right handle */}
          <RoofHandle
            position={[ridgeRightPoint.x, ridgeRightPoint.y, ridgeRightPoint.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPoint.x, ridgeRightPoint.y, topZ);
              if (foundation && composedWalls[0]) {
                const dir = useStore.getState().cameraDirection;
                const rX = Math.atan2(dir.z, dir.y);
                const rZ = composedWalls[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI - rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useRefStore.getState().setEnableOrbitController(false);
            }}
          />
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
              if (intersects[0] && foundation) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                const composedWall = composedWalls[0];
                const length = new Vector3().subVectors(composedWall.rightPoint, composedWall.leftPoint).length();
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(foundation.cx, foundation.cy, foundation.cz))
                      .applyEuler(new Euler(0, 0, -foundation.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;
                    setLeftRidgeLengthCurr(Util.clamp(-d, -rightRidgeLengthCurr + 0.1, length / 2 - 0.01));
                    break;
                  }
                  case RoofHandleType.Right: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(foundation.cx, foundation.cy, foundation.cz))
                      .applyEuler(new Euler(0, 0, -foundation.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;

                    setRightRidgeLengthCurr(Util.clamp(d, -leftRidgeLengthCurr + 0.1, length / 2 - 0.01));
                    break;
                  }
                  case RoofHandleType.Mid: {
                    const newRise = Math.max(0, point.z - foundation.lz - 0.3 - highestWallHeight);
                    setRiseInnerState(newRise);
                    // the vertical ruler needs to display the latest rise when the handle is being dragged
                    useStore.getState().updateRoofRiseById(id, riseInnerState, topZ + roofModel.thickness);
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Mid: {
                addUndoableResizeRoofRise(id, oldRiseRef.current, riseInnerState);
                break;
              }
              case RoofHandleType.Left:
              case RoofHandleType.Right: {
                handleUndoableResizeRidgeLength(
                  id,
                  leftRidgeLength,
                  rightRidgeLength,
                  leftRidgeLengthCurr,
                  rightRidgeLengthCurr,
                );
              }
            }
            isPointerDownRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useRefStore.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Hip) {
                  const r = e as HipRoofModel;
                  r.leftRidgeLength = leftRidgeLengthCurr;
                  r.rightRidgeLength = rightRidgeLengthCurr;
                  r.rise = riseInnerState;
                  state.actionState.roofRise = riseInnerState;
                  break;
                }
              }
            });
            updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(HipRoof);
