/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { GROUND_ID } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType } from 'src/types';
import GroupMaster from './groupMaster';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { WallModel } from 'src/models/WallModel';
import { RoofModel } from 'src/models/RoofModel';
import { Vector3 } from 'three';
import { GroupableModel, isGroupable } from 'src/models/Groupable';

const isBaseElement = (e: ElementModel) => {
  return e.parentId === GROUND_ID && (e.type === ObjectType.Foundation || e.type === ObjectType.Cuboid);
};

const GroupMasterController = React.memo(() => {
  useStore(Selector.groupActionUpdateFlag);
  const selectedElementIdSet = useStore(Selector.selectedElementIdSet);
  const selectedBaseElements = getSelectedBaseElements();

  if (selectedBaseElements.length === 0) return null;

  const { allBaseElements, allBaseElementsVerticesMap, cuboidParentIdMap } = getElementsData();

  const groupIdSet = new Set<string>(selectedBaseElements.map((e) => e.id));
  const groupElements = [...selectedBaseElements];

  for (const selectedBase of selectedBaseElements) {
    if (selectedBase.enableGroupMaster) {
      checkOverlapWithOtherBases(selectedBase);
    }
  }

  const { position, dimension, rotation, childCuboidIdSet } = getGroupedBasesData();

  function getSelectedBaseElements() {
    const baseIdSet = new Set<string>();
    for (const e of useStore.getState().elements) {
      if (selectedElementIdSet.has(e.id)) {
        if (e.parentId === GROUND_ID && isGroupable(e)) {
          baseIdSet.add(e.id);
        } else if (e.foundationId) {
          baseIdSet.add(e.foundationId);
        }
      }
    }
    if (baseIdSet.size === 0) return [] as GroupableModel[];
    return useStore.getState().elements.filter((e) => baseIdSet.has(e.id)) as GroupableModel[];
  }

  function getElementsData() {
    const allBaseElements: ElementModel[] = [];
    const allBaseElementsVerticesMap = new Map<string, Point2[]>();
    const cuboidParentIdMap = new Map<string, string>();

    for (const e of useStore.getState().elements) {
      if (isBaseElement(e)) {
        const vertices = Util.fetchFoundationVertexCoordinates(e);
        allBaseElements.push(e);
        allBaseElementsVerticesMap.set(e.id, vertices);
      }
      if (e.type === ObjectType.Cuboid && e.parentId !== GROUND_ID) {
        cuboidParentIdMap.set(e.id, e.parentId);
      }
    }
    return { allBaseElements, allBaseElementsVerticesMap, cuboidParentIdMap };
  }

  function checkOverlapWithOtherBases(curr: GroupableModel) {
    for (const baseElement of allBaseElements) {
      if (
        !groupIdSet.has(baseElement.id) &&
        Util.areBasesOverlapped(curr.id, baseElement.id, allBaseElementsVerticesMap)
      ) {
        groupIdSet.add(baseElement.id);
        groupElements.push(baseElement);
        if ((baseElement as GroupableModel).enableGroupMaster) {
          checkOverlapWithOtherBases(baseElement);
        }
      }
    }
  }

  function getGroupedBasesData() {
    const groupElementsVertices = groupElements.map((e) => Util.fetchFoundationVertexCoordinates(e)).flat();
    const childCuboidIdSet = new Set<string>();

    const bound = Util.calculatePolygonBounds(groupElementsVertices);
    let maxChildHeight = 1;
    let maxBaseZ = 1;
    const map = new Map<string, number>(); // roofId -> maxWallHeight
    for (const elem of useStore.getState().elements) {
      // children
      if (elem.foundationId && groupIdSet.has(elem.foundationId)) {
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
      else if (elem.type === ObjectType.Cuboid && groupIdSet.has(getCuboidParentId(elem.id))) {
        const { topZ } = Util.getWorldDataById(elem.id);
        maxBaseZ = Math.max(maxBaseZ, topZ);
        if (elem.parentId !== GROUND_ID) {
          childCuboidIdSet.add(elem.id);
        }
      }
    }
    const position = new Vector3(bound.x + bound.width / 2, bound.y + bound.height / 2);
    let dimension = [bound.width, bound.height, Math.max(maxChildHeight, maxBaseZ)];
    let rotation = 0;
    if (groupElements.length === 1 && childCuboidIdSet.size === 0) {
      const e = groupElements[0];
      rotation = e.rotation[2];
      dimension = [e.lx, e.ly, Math.max(maxChildHeight, maxBaseZ)];
    }
    return { position, dimension, rotation, childCuboidIdSet };
  }

  function getCuboidParentId(id: string): string {
    const pId = cuboidParentIdMap.get(id);
    if (!pId) return id;
    return getCuboidParentId(pId);
  }

  return (
    <GroupMaster
      groupedElementsIdSet={groupIdSet}
      childCuboidSet={childCuboidIdSet}
      initialPosition={position.toArray()}
      initialDimension={dimension}
      initialRotation={rotation}
    />
  );
});

const GroupMasterWrapper = React.memo(() => {
  const enableGroupAction = useStore(Selector.groupActionMode);
  if (!enableGroupAction) return null;
  return <GroupMasterController />;
});

export default GroupMasterWrapper;
