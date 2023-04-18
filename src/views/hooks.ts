import React, { useEffect, useRef, useState } from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { GroupableModel, isGroupable } from 'src/models/Groupable';
import { Point2 } from 'src/models/Point2';
import { RoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Util } from 'src/Util';
import { Vector2, Vector3 } from 'three';
import * as Selector from '../stores/selector';

export const useGroupMaster = (elementModel: GroupableModel, groupMasterId: string | null) => {
  const { id, cx, cy, lx, ly, lz, selected, enableGroupMaster } = elementModel;

  const buildingResizerUpdateFlag = useStore(Selector.groupActionUpdateFlag);
  const baseGroupSetRef = useRef<Set<string>>(new Set());
  const baseVerticesRef = useRef<Point2[]>([]);
  const childCuboidSetRef = useRef<Set<string>>(new Set());

  const [groupMasterDimension, setGroupMasterDimension] = useState<number[] | null>(null);
  const [groupMasterPosition, setGroupMasterPosition] = useState<number[]>([cx, cy, lz / 2]);
  const [groupMasterRotation, setGroupMasterRotation] = useState<number>(0);

  const isCuboid = elementModel.type === ObjectType.Cuboid;

  useEffect(() => {
    if (groupMasterId === id) {
      baseGroupSetRef.current.clear();
      childCuboidSetRef.current.clear();
      baseVerticesRef.current = [];

      setbaseVertices(elementModel);
      if (elementModel.enableGroupMaster) {
        checkOverlapWithAllBases(elementModel);
        if (baseGroupSetRef.current.size > 1) {
          setGroupedBasesData();
        } else {
          setSingleBaseData();
        }
      } else {
        setSingleBaseData();
      }
    } else {
      setGroupMasterPosition([cx, cy, 0]);
      setGroupMasterDimension(null);
      setGroupMasterRotation(0);
    }
  }, [groupMasterId, buildingResizerUpdateFlag, enableGroupMaster]);

  const setbaseVertices = (base: ElementModel) => {
    const hx = base.lx / 2;
    const hy = base.ly / 2;
    const zero = new Vector2();
    const { pos, rot } = Util.getWorldDataById(base.id);
    const center = new Vector2(pos.x, pos.y);
    const v1 = new Vector2(hx, hy);
    const v2 = new Vector2(-hx, hy);
    const v3 = new Vector2(hx, -hy);
    const v4 = new Vector2(-hx, -hy);
    const arr = [v1, v2, v3, v4].map((v) => {
      v.rotateAround(zero, rot).add(center);
      return { x: v.x, y: v.y } as Point2;
    });
    baseGroupSetRef.current.add(base.id);
    baseVerticesRef.current.push(...arr);
  };

  const setAllChildBases = (el: ElementModel) => {
    baseGroupSetRef.current.add(el.id);
    childCuboidSetRef.current.add(el.id);
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Cuboid && !e.locked && e.parentId === el.id) {
        setAllChildBases(e);
      }
    }
  };

  const checkOverlapWithAllBases = (base: ElementModel) => {
    for (const el of useStore.getState().elements) {
      if (isGroupable(el) && !el.locked && !baseGroupSetRef.current.has(el.id)) {
        const isUnlockedChild = Util.isChild(base.id, el.id, true);

        if (isUnlockedChild) {
          setAllChildBases(el);
        } else if (Util.areTwoBasesOverlapped(el, base)) {
          setbaseVertices(el);
          checkOverlapWithAllBases(el);
        }
      }
    }
  };

  const setSingleBaseData = () => {
    let maxHeight = isCuboid ? 0 : 3;
    let maxTopZ = maxHeight;
    const map = new Map<string, number>(); // roofId -> maxWallHeight
    // we can use one loop to get maxWallHeight, because roof is always after wall?
    for (const elem of useStore.getState().elements) {
      if (elem.foundationId === elementModel?.id) {
        if (elem.type === ObjectType.Wall) {
          const wall = elem as WallModel;
          maxHeight = Math.max(maxHeight, wall.lz);
          if (wall.roofId) {
            const maxWallHeight = map.get(wall.roofId) ?? 0;
            if (maxWallHeight < wall.lz) {
              map.set(wall.roofId, wall.lz);
            }
          }
        } else if (elem.type === ObjectType.Roof) {
          maxHeight = Math.max(maxHeight, (elem as RoofModel).rise + (map.get(elem.id) ?? 0));
        }
      } else if (elem.type === ObjectType.Cuboid && Util.isChild(elementModel.id, elem.id, true)) {
        setbaseVertices(elem);
        childCuboidSetRef.current.add(elem.id);
        const { topZ } = Util.getWorldDataById(elem.id);
        maxTopZ = Math.max(maxTopZ, topZ);
      }
    }

    if (baseGroupSetRef.current.size > 1) {
      const bound = Util.calculatePolygonBounds(baseVerticesRef.current);
      const { pos: parentWorldPos, topZ: parentTopZ } = Util.getWorldDataById(elementModel.parentId);
      const boundCenterWorldPos = new Vector3(bound.x + bound.width / 2, bound.y + bound.height / 2);
      const relativePosition = new Vector3().subVectors(boundCenterWorldPos, parentWorldPos).setZ(0);
      setGroupMasterDimension([bound.width, bound.height, maxTopZ - parentTopZ]);
      setGroupMasterPosition(relativePosition.toArray());
      setGroupMasterRotation(0);
    } else {
      setGroupMasterPosition([cx, cy, 0]);
      setGroupMasterRotation(elementModel?.rotation[2]);
      setGroupMasterDimension([lx, ly, maxHeight + lz]);
    }
  };

  const setGroupedBasesData = () => {
    const bound = Util.calculatePolygonBounds(baseVerticesRef.current);
    let maxChildHeight = isCuboid ? 0 : 1;
    let maxBaseZ = lz;
    const map = new Map<string, number>(); // roofId -> maxWallHeight
    for (const elem of useStore.getState().elements) {
      // childs
      if (elem.foundationId && baseGroupSetRef.current.has(elem.foundationId)) {
        if (elem.type === ObjectType.Wall) {
          const wall = elem as WallModel;
          maxChildHeight = Math.max(maxChildHeight, wall.lz);
          if (wall.roofId) {
            const maxWallHeight = map.get(wall.roofId) ?? 0;
            if (maxWallHeight < wall.lz) {
              map.set(wall.roofId, wall.lz);
            }
          }
        } else if (elem.type === ObjectType.Roof) {
          maxChildHeight = Math.max(maxChildHeight, (elem as RoofModel).rise + (map.get(elem.id) ?? 0));
        }
      }
      // cuboids
      else if (elem.type === ObjectType.Cuboid && baseGroupSetRef.current.has(elem.id)) {
        const { topZ } = Util.getWorldDataById(elem.id);
        maxBaseZ = Math.max(maxBaseZ, topZ);
      }
    }
    const { pos: parentWorldPos, topZ: parentTopZ } = Util.getWorldDataById(elementModel.parentId);
    const boundCenterWorldPos = new Vector3(bound.x + bound.width / 2, bound.y + bound.height / 2);
    const relativePosition = new Vector3().subVectors(boundCenterWorldPos, parentWorldPos).setZ(0);
    setGroupMasterDimension([bound.width, bound.height, Math.max(maxChildHeight, maxBaseZ)]);
    setGroupMasterPosition(relativePosition.toArray());
    setGroupMasterRotation(0);
  };

  const baseGroupSet = baseGroupSetRef.current;
  const childCuboidSet = childCuboidSetRef.current;
  return { baseGroupSet, childCuboidSet, groupMasterDimension, groupMasterPosition, groupMasterRotation };
};
