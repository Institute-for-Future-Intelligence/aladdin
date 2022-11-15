import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { ObjectType, RoofTexture } from 'src/types';
import { UndoableMoveElementOnRoof } from 'src/undo/UndoableMove';

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
import { SensorModel } from '../../models/SensorModel';
import { LightModel } from '../../models/LightModel';
import { RoofSegmentProps } from './roofRenderer';
import { Util } from 'src/Util';

export const useElementUndoable = () => {
  const grabRef = useRef<ElementModel | null>(null);
  const oldPostionRef = useRef<number[] | null>(null);
  const oldRotationRef = useRef<number[] | null>(null);
  const oldNormalRef = useRef<number[] | null>(null);

  const addUndoableMove = (elem: SolarPanelModel | SensorModel | LightModel) => {
    if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
      const undoabeMove = {
        name: 'Move ' + elem.type + ' on Roof',
        timestamp: Date.now(),
        id: elem.id,
        oldPos: [...oldPostionRef.current],
        newPos: [elem.cx, elem.cy, elem.cz],
        oldRot: [...oldRotationRef.current],
        newRot: [...elem.rotation],
        oldNor: [...oldNormalRef.current],
        newNor: [...elem.normal],
        undo: () => {
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.oldPos];
                e.rotation = [...undoabeMove.oldRot];
                e.normal = [...undoabeMove.oldNor];
                break;
              }
            }
          });
        },
        redo: () => {
          useStore.getState().set((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.newPos];
                e.rotation = [...undoabeMove.newRot];
                e.normal = [...undoabeMove.newNor];
                break;
              }
            }
          });
        },
      } as UndoableMoveElementOnRoof;
      useStore.getState().addUndoable(undoabeMove);
    }
  };

  const undoMove = () => {
    useStore.getState().set((state) => {
      if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
        for (const e of state.elements) {
          if (e.id === grabRef.current?.id) {
            e.cx = oldPostionRef.current[0];
            e.cy = oldPostionRef.current[1];
            e.cz = oldPostionRef.current[2];
            e.rotation = [...oldRotationRef.current];
            e.normal = [...oldNormalRef.current];
            break;
          }
        }
      }
    });
  };

  const setOldRefData = (elem: ElementModel) => {
    grabRef.current = elem;
    oldPostionRef.current = [elem.cx, elem.cy, elem.cz];
    oldRotationRef.current = [...elem.rotation];
    oldNormalRef.current = [...elem.normal];
  };

  return { grabRef, addUndoableMove, undoMove, setOldRefData };
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
          texture.repeat.set(4, 4);
          break;
        case RoofTexture.Texture01:
          texture.repeat.set(0.5, 0.5);
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

  return { transparent: transparent || _transparent, opacity: Math.min(opacity ?? 1, _opacity) };
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

  const wallsOnFoundation = useStore((state) => {
    return state.elements.filter((el) => el.type === ObjectType.Wall && el.foundationId === fId);
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
  }, [wallsId, JSON.stringify(wallsOnFoundation)]);

  return { currentWallArray, isLoopRef };
};

export const useRoofHeight = (lz: number, initalMinHeight: number) => {
  const [h, setH] = useState(lz);

  const minHeight = useRef(initalMinHeight);
  const setMinHeight = (val: number) => {
    minHeight.current = val;
  };

  const relHeight = useRef(lz - minHeight.current);
  const setRelHeight = (val: number) => {
    relHeight.current = val;
  };

  return { h, setH, minHeight, setMinHeight, relHeight, setRelHeight };
};

export const useUpdateSegmentVerticesMap = (
  roofId: string,
  centroid: Vector3,
  roofSegments: RoofSegmentProps[],
  mansardTop?: Vector3[],
) => {
  const fileChanged = useStore(Selector.fileChanged);
  const done = useRef(false);

  const update = (roofSegments: RoofSegmentProps[], centroid: Vector3, mansardTop?: Vector3[]) => {
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
      vertices.push(mansardTop.map(relToFoundation));
    }
    useStore.getState().set((state) => {
      state.roofSegmentVerticesMap.set(roofId, vertices);
    });
  };

  const debouncedUpdate = useCallback(Util.debounce(update), []);

  useEffect(() => {
    if (roofSegments.length > 0) {
      update(roofSegments, centroid, mansardTop);
      done.current = true;
    }
  }, [fileChanged]);

  useEffect(() => {
    if (roofSegments.length > 0 && !done.current) {
      debouncedUpdate(roofSegments, centroid, mansardTop);
      done.current = false;
    }
  }, [roofSegments, centroid, mansardTop]);
};
