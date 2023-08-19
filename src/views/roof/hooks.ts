/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'src/stores/common';
import { ObjectType, RoofTexture } from 'src/types';

import RoofTextureDefault from 'src/resources/roof_edge.png';
import RoofTexture00 from 'src/resources/tiny_white_square.png';
import RoofTexture01 from 'src/resources/roof_01.png';
import RoofTexture02 from 'src/resources/roof_02.png';
import RoofTexture03 from 'src/resources/roof_03.png';
import RoofTexture04 from 'src/resources/roof_04.png';
import RoofTexture05 from 'src/resources/roof_05.png';
import RoofTexture06 from 'src/resources/roof_06.png';
import RoofTexture07 from 'src/resources/roof_07.png';
import { RepeatWrapping, TextureLoader, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { useThree } from '@react-three/fiber';
import { RoofSegmentGroupUserData, RoofSegmentProps, updateRooftopElements } from './roofRenderer';
import { RoofUtil } from './RoofUtil';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { getRoofPointsOfGambrelRoof } from './flatRoof';
import shallow from 'zustand/shallow';
import { FoundationModel } from 'src/models/FoundationModel';
import { useDataStore } from 'src/stores/commonData';
import { useLatestFoundation } from '../wall/hooks';

export type ComposedWall = {
  leftPoint: Vector3;
  rightPoint: Vector3;
  relativeAngle: number;
  lz: number;
  eavesLength: number;
  wallsId: string[];
};

export const useRoofTexture = (textureType: RoofTexture) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case RoofTexture.NoTexture:
        textureImg = RoofTexture00;
        break;
      case RoofTexture.Texture01:
        textureImg = RoofTexture01;
        break;
      case RoofTexture.Texture02:
        textureImg = RoofTexture02;
        break;
      case RoofTexture.Texture03:
        textureImg = RoofTexture03;
        break;
      case RoofTexture.Texture04:
        textureImg = RoofTexture04;
        break;
      case RoofTexture.Texture05:
        textureImg = RoofTexture05;
        break;
      case RoofTexture.Texture06:
        textureImg = RoofTexture06;
        break;
      case RoofTexture.Texture07:
        textureImg = RoofTexture07;
        break;
      default:
        textureImg = RoofTextureDefault;
    }
    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      switch (textureType) {
        case RoofTexture.NoTexture:
        case RoofTexture.Default:
          texture.repeat.set(5, 3);
          break;
        case RoofTexture.Texture01:
          texture.repeat.set(0.5, 0.25);
          break;
        case RoofTexture.Texture03:
          texture.repeat.set(0.9, 0.9);
          break;
        case RoofTexture.Texture04:
        case RoofTexture.Texture05:
        case RoofTexture.Texture06:
          texture.repeat.set(0.75, 0.75);
          break;
        default:
          texture.repeat.set(0.5, 0.5);
      }
      setTexture(texture);
      invalidate();
    });
  }, [textureType]);

  const [texture, setTexture] = useState(textureLoader);
  const { invalidate } = useThree();
  return texture;
};

export const useTransparent = (transparent?: boolean, opacity?: number) => {
  const groundImage = useStore(Selector.viewState.groundImage);
  const orthographic = useStore(Selector.viewState.orthographic);

  const _transparent = groundImage && orthographic;
  const _opacity = _transparent ? 0.25 : 1;

  return { transparent: transparent || _transparent, opacity: Math.min(opacity !== undefined ? opacity : 1, _opacity) };
};

export const useMultiCurrWallArray = (fId: string | undefined, roofId: string, wallsId: string[]) => {
  const wallsOnSameFoundation = useStore(
    (state) => state.elements.filter((e) => e.foundationId === fId && e.type === ObjectType.Wall),
    shallow,
  );

  const getWallOnSameFoundation = (id: string) => wallsOnSameFoundation.find((e) => e.id === id) as WallModel;

  const isLoopRef = useRef(false);

  const currentWallArray = useMemo(() => {
    for (const wid of wallsId) {
      let wall = getWallOnSameFoundation(wid) as WallModel;
      if (!wall) return [];

      const array = [];
      const startWall = wall;
      while (wall && (!wall.roofId || wall.roofId === roofId)) {
        array.push(wall);
        if (wall.leftJoints[0]) {
          if (wall.leftJoints[0] !== startWall.id) {
            wall = getWallOnSameFoundation(wall.leftJoints[0]) as WallModel;
          }
          // is a loop
          else {
            array.reverse();
            isLoopRef.current = true;
            return array;
          }
        } else {
          break;
        }
      }

      array.reverse();

      wall = getWallOnSameFoundation(startWall.rightJoints[0]) as WallModel;
      while (wall && (!wall.roofId || wall.roofId === roofId)) {
        array.push(wall);
        if (wall.rightJoints[0] && wall.rightJoints[0] !== startWall.id) {
          wall = getWallOnSameFoundation(wall.rightJoints[0]) as WallModel;
        } else {
          break;
        }
      }
      isLoopRef.current = false;
      if (array.length > 1) {
        return array;
      }
    }
    return [];
  }, [wallsId, wallsOnSameFoundation]);

  return { currentWallArray, isLoopRef };
};

export const useComposedWallArray = (wId: string, fId: string) => {
  const wallsOnSameFoundation = useStore(
    (state) => state.elements.filter((e) => e.foundationId === fId && e.type === ObjectType.Wall),
    shallow,
  );

  const composedWallsArray = useMemo(() => {
    const getWallOnSameFoundation = (id: string) => wallsOnSameFoundation.find((e) => e.id === id) as WallModel;

    const wallMap = new Map<string, WallModel>();
    const rotationMap = new Map<string, WallModel[]>();
    const startWall: WallModel | null = getWallOnSameFoundation(wId);
    let wall: WallModel | null = startWall;
    let count = 0;
    let isLoop = false;

    while (wall && wall.type === ObjectType.Wall && count < 100) {
      wallMap.set(wall.id, wall);
      const rotation = wall.relativeAngle.toFixed(1);
      if (rotationMap.has(rotation)) {
        rotationMap.get(rotation)?.push(wall);
      } else {
        rotationMap.set(rotation, [wall]);
      }
      if (wall.rightJoints.length !== 0) {
        wall = getWallOnSameFoundation(wall.rightJoints[0]);
        if (wall && wall.id === startWall.id) {
          isLoop = true;
          break;
        }
        count++;
      } else {
        wall = null;
      }
    }

    if (!isLoop || rotationMap.size !== 4) return null;

    const arr: ComposedWall[] = [];
    for (const [rot, walls] of rotationMap) {
      // check connection
      let count = 0;
      for (const wall of walls) {
        const lw = wallMap.get(wall.leftJoints[0]);
        const rw = wallMap.get(wall.rightJoints[0]);
        if (lw && lw.relativeAngle.toFixed(1) !== rot) {
          count++;
        }
        if (rw && rw.relativeAngle.toFixed(1) !== rot) {
          count++;
        }
        if (count > 2) break;
      }
      if (count !== 2) return null;

      let leftMostWall: WallModel | null = null;
      let rightMostWall: WallModel | null = null;
      let highestLz = 0;
      let longestEavesLength = -1;
      for (const wall of walls) {
        const lw = wallMap.get(wall.leftJoints[0]);
        const rw = wallMap.get(wall.rightJoints[0]);
        highestLz = Math.max(highestLz, wall.lz);
        longestEavesLength = Math.max(longestEavesLength, wall.eavesLength);
        if (lw && lw.relativeAngle.toFixed(1) !== rot) {
          leftMostWall = wall;
        }
        if (rw && rw.relativeAngle.toFixed(1) !== rot) {
          rightMostWall = wall;
        }
      }

      if (leftMostWall && rightMostWall && highestLz > 0 && longestEavesLength !== -1) {
        arr.push({
          leftPoint: new Vector3().fromArray(leftMostWall.leftPoint),
          rightPoint: new Vector3().fromArray(rightMostWall.rightPoint),
          relativeAngle: leftMostWall.relativeAngle,
          lz: highestLz,
          eavesLength: longestEavesLength,
          wallsId: walls.map((w) => w.id),
        });
      }
    }

    if (arr.length !== 4) return null;
    return arr;
  }, [wallsOnSameFoundation]);

  return composedWallsArray;
};

export const useComposedRoofHeight = (composedWallArray: ComposedWall[] | null, rise: number, isGabled?: boolean) => {
  const highestWallHeight = useMemo(
    () => RoofUtil.getHighestComposedWallHeight(composedWallArray, isGabled),
    [composedWallArray],
  );

  const topZ = useMemo(() => highestWallHeight + rise, [highestWallHeight, rise]); // height from top to foundation

  return { highestWallHeight, topZ };
};

export const useRoofHeight = (currentWallArray: WallModel[], rise: number, ignoreSide?: boolean) => {
  const highestWallHeight = useMemo(
    () => RoofUtil.getHighestWallHeight(currentWallArray, ignoreSide),
    [currentWallArray],
  );
  const [riseInnerState, setRiseInnerState] = useState(rise); // height from top to maxWallHeight
  const topZ = highestWallHeight + riseInnerState; // height from top to foundation
  useEffect(() => {
    if (rise !== riseInnerState) {
      setRiseInnerState(rise);
    }
  }, [rise]);

  return { highestWallHeight, topZ, riseInnerState, setRiseInnerState };
};

export const useUpdateSegmentVerticesMap = (
  roofId: string,
  centroid: Vector3,
  roofSegments: RoofSegmentProps[],
  isFlat: boolean,
  roofType: RoofType,
  mansardTop?: Vector3[],
) => {
  const runDynamicSimulation = usePrimitiveStore(Selector.runDynamicSimulation);
  const runStaticSimulation = usePrimitiveStore(Selector.runStaticSimulation);
  const runDailyThermalSimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);

  const updateSegmentVertices = () => {
    const relToFoundation = (v: Vector3) => v.clone().add(centroid);

    let vertices: Vector3[][] = [];

    // FIXME
    // In the following, the vertices are relative to the foundation only in terms of position.
    // To get the absolute coordinates, we must apply the foundation's orientation.
    if (isFlat) {
      if (roofType === RoofType.Gambrel) {
        vertices.push(getRoofPointsOfGambrelRoof(roofSegments).map(relToFoundation));
      } else {
        const points: Vector3[] = [];
        for (const segment of roofSegments) {
          points.push(segment.points[1].clone().add(centroid));
        }
        vertices.push(points);
      }
    } else {
      for (const segment of roofSegments) {
        const points = segment.points;
        // triangle segment
        if (points.length === 6) {
          vertices.push(points.slice(3).map(relToFoundation));
        }
        // quad segment
        else if (points.length === 8) {
          vertices.push(points.slice(4).map(relToFoundation));
        } else {
          throw new Error('Invalid Roof segment data');
        }
      }
      if (mansardTop) {
        vertices.push(mansardTop);
      }
    }
    useDataStore.getState().setRoofSegmentVertices(roofId, vertices);
    return vertices;
  };

  // we don't render heatmaps in yearly thermal simulations
  if (runDynamicSimulation || runStaticSimulation || runDailyThermalSimulation) {
    updateSegmentVertices();
  }

  useEffect(() => {
    updateSegmentVertices();
  }, [roofSegments]);

  return updateSegmentVertices;
};

export const useUpdateSegmentVerticesWithoutOverhangMap = (update: () => void): void => {
  const runDailyThermalSimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);
  const runYearlyThermalSimulation = usePrimitiveStore(Selector.runYearlyThermalSimulation);

  if (runDailyThermalSimulation || runYearlyThermalSimulation) {
    update();
  }
};

export const useUpdateOldRoofFiles = (roofModel: RoofModel, highestWallHeight: number) => {
  const fileChanged = useStore(Selector.fileChanged);
  useEffect(() => {
    if (
      roofModel.ceiling === undefined ||
      roofModel.rise === undefined ||
      (roofModel.roofType === RoofType.Gambrel &&
        ((roofModel as GambrelRoofModel).frontRidgePoint === undefined ||
          (roofModel as GambrelRoofModel).backRidgePoint === undefined ||
          (roofModel as GambrelRoofModel).topRidgePoint === undefined))
    ) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === roofModel.id && e.type === ObjectType.Roof) {
            const roof = e as RoofModel;
            if (roof.ceiling === undefined) {
              roof.ceiling = false;
            }
            if (roof.rise === undefined) {
              roof.rise = roof.lz - highestWallHeight;
              roof.lz = 0;
            }

            if (roof.roofType === RoofType.Gambrel) {
              const gambrelRoof = roof as GambrelRoofModel;
              if (gambrelRoof.frontRidgePoint === undefined) {
                gambrelRoof.frontRidgePoint = gambrelRoof.frontRidgeLeftPoint
                  ? [...gambrelRoof.frontRidgeLeftPoint]
                  : [0.35, 0.5];
                gambrelRoof.frontRidgeLeftPoint = undefined;
                gambrelRoof.frontRidgeRightPoint = undefined;
              }
              if (gambrelRoof.backRidgePoint === undefined) {
                gambrelRoof.backRidgePoint = gambrelRoof.backRidgeLeftPoint
                  ? [...gambrelRoof.backRidgeLeftPoint]
                  : [-0.35, 0.5];
                gambrelRoof.backRidgeLeftPoint = undefined;
                gambrelRoof.backRidgeRightPoint = undefined;
              }
              if (gambrelRoof.topRidgePoint === undefined) {
                gambrelRoof.topRidgePoint = gambrelRoof.topRidgeLeftPoint ? [...gambrelRoof.topRidgeLeftPoint] : [0, 1];
                gambrelRoof.topRidgeLeftPoint = undefined;
                gambrelRoof.topRidgeRightPoint = undefined;
              }
            }
            break;
          }
        }
      });
    }
  }, [fileChanged]);
};

export const useUpdateAfterMounted = () => {
  const [, setUpdate] = useState(false);
  useEffect(() => {
    setUpdate((b) => !b);
  }, []);
};

export const useIsFirstRender = () => {
  const isFirstRenderRef = useRef(true);
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    return true;
  }
  return false;
};

export const useUpdateRooftopElementsByContextMenuChanges = (
  foundation: FoundationModel | null,
  roofId: string,
  roofSegments: RoofSegmentProps[],
  centroid: Vector3,
  topZ: number,
  thickness: number,
  isFlatGambrel?: boolean,
) => {
  // only update by context menu changes
  useEffect(() => {
    if (useStore.getState().updateElementOnRoofFlag) {
      updateRooftopElements(foundation, roofId, roofSegments, centroid, topZ, thickness, isFlatGambrel);
      useStore.getState().setUpdateElementOnRoofFlag(false);
    }
  }, [topZ, thickness]);
};

export const useUpdateRooftopElementsByControlPoints = (
  foundation: FoundationModel | null,
  rId: string,
  segments: RoofSegmentProps[],
  centroid: Vector3,
  topZ: number,
  thickness: number,
  isFlatGambrel?: boolean,
) => {
  const isFirstRender = useIsFirstRender();
  useEffect(() => {
    if (isFirstRender) return;
    updateRooftopElements(foundation, rId, segments, centroid, topZ, thickness, isFlatGambrel);
  }, [segments]);
};

export const useUpdateRooftopElements = (
  foundation: FoundationModel | null,
  roofId: string,
  segments: RoofSegmentProps[],
  centroid: Vector3,
  topZ: number,
  thickness: number,
  isFlatGambrel?: boolean,
) => {
  useUpdateRooftopElementsByControlPoints(foundation, roofId, segments, centroid, topZ, thickness, isFlatGambrel);
  useUpdateRooftopElementsByContextMenuChanges(foundation, roofId, segments, centroid, topZ, thickness, isFlatGambrel);
};

export const useUserData = (
  roofId: string,
  foundationModel: FoundationModel,
  centroid: Vector3,
  roofSegments: RoofSegmentProps[],
) => {
  const latestFoundation = useLatestFoundation(foundationModel);

  // used for move rooftop elements between different roofs, passed to handlePointerMove in roofRenderer
  const userData: RoofSegmentGroupUserData = useMemo(
    () => ({
      roofId: roofId,
      foundation: latestFoundation,
      centroid: centroid,
      roofSegments: roofSegments,
    }),
    [roofId, centroid, roofSegments, latestFoundation],
  );

  return userData;
};
