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
import { RoofSegmentProps } from './roofRenderer';
import { RoofUtil } from './RoofUtil';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { usePrimitiveStore } from '../../stores/commonPrimitive';

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

export const useCurrWallArray = (frontWallId: string) => {
  const getElementById = useStore.getState().getElementById;

  const getWallsId = () => {
    const frontWall = getElementById(frontWallId) as WallModel;
    if (frontWall) {
      const leftWall = getElementById(frontWall.leftJoints[0]) as WallModel;
      const rightWall = getElementById(frontWall.rightJoints[0]) as WallModel;
      if (leftWall && rightWall) {
        const backWall = getElementById(leftWall.leftJoints[0]) as WallModel;
        const checkWall = getElementById(rightWall.rightJoints[0]) as WallModel;
        if (backWall && checkWall && backWall.id === checkWall.id) {
          return [frontWall.id, rightWall.id, backWall.id, leftWall.id];
        }
      }
    }
    return [frontWallId];
  };

  const wallsId = getWallsId();

  const frontWall = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === wallsId[0] && e.type === ObjectType.Wall) {
        return e as WallModel;
      }
    }
  });
  const rightWall = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === wallsId[1] && e.type === ObjectType.Wall) {
        return e as WallModel;
      }
    }
  });
  const backWall = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === wallsId[2] && e.type === ObjectType.Wall) {
        return e as WallModel;
      }
    }
  });
  const leftWall = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === wallsId[3] && e.type === ObjectType.Wall) {
        return e as WallModel;
      }
    }
  });

  const currentWallArray = useMemo(() => {
    if (frontWall && rightWall && backWall && leftWall) {
      return [frontWall, rightWall, backWall, leftWall];
    }
    return [] as WallModel[];
  }, [frontWall, rightWall, backWall, leftWall]);
  return currentWallArray;
};

export const useMultiCurrWallArray = (fId: string | undefined, roofId: string, wallsId: string[]) => {
  const getElementById = useStore.getState().getElementById;

  const isLoopRef = useRef(false);

  const elementsTriggerChange = useStore((state) => {
    return JSON.stringify(
      state.elements
        .filter((e) => (e.type === ObjectType.Wall && e.foundationId === fId) || e.id === fId)
        .map((w) => [w.cx, w.cy, w.cz, w.lx, w.ly, w.lz, (w as WallModel).eavesLength]),
    );
  });

  const currentWallArray = useMemo(() => {
    for (const wid of wallsId) {
      let wall = getElementById(wid) as WallModel;
      if (!wall) return [];

      const array = [];
      const startWall = wall;
      while (wall && (!wall.roofId || wall.roofId === roofId)) {
        array.push(wall);
        if (wall.leftJoints[0]) {
          if (wall.leftJoints[0] !== startWall.id) {
            wall = getElementById(wall.leftJoints[0]) as WallModel;
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

      wall = getElementById(startWall.rightJoints[0]) as WallModel;
      while (wall && (!wall.roofId || wall.roofId === roofId)) {
        array.push(wall);
        if (wall.rightJoints[0] && wall.rightJoints[0] !== startWall.id) {
          wall = getElementById(wall.rightJoints[0]) as WallModel;
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
  }, [wallsId, elementsTriggerChange]);

  return { currentWallArray, isLoopRef };
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
  mansardTop?: Vector3[],
) => {
  const runDynamicSimulation = usePrimitiveStore(Selector.runDynamicSimulation);
  const runStaticSimulation = usePrimitiveStore(Selector.runStaticSimulation);
  const runDailyThermalSimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);

  const updateSegmentVertices = () => {
    const relToFoundation = (v: Vector3) => v.clone().add(centroid);
    const vertices = roofSegments.map((segment) => {
      const points = segment.points;
      // triangle segment
      if (points.length === 6) {
        return points.slice(3).map(relToFoundation);
      }
      // quad segment
      else if (points.length === 8) {
        return points.slice(4).map(relToFoundation);
      } else {
        throw new Error('Invalid Roof segment data');
      }
    });
    if (mansardTop) {
      vertices.push(mansardTop);
    }
    useStore.getState().set((state) => {
      state.roofSegmentVerticesMap.set(roofId, vertices);
    });

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
