/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Plane } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import { HALF_PI } from 'src/constants';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { ActionType, ObjectType } from 'src/types';
import { DoubleSide } from 'three';

const EmptyWall = (wallModel: WallModel) => {
  const { lx, lz, parentId, id } = wallModel;

  const checkIfCanSelectMe = (e: ThreeEvent<PointerEvent>) => {
    return !(
      e.button === 2 ||
      useStore.getState().moveHandleType ||
      useStore.getState().resizeHandleType ||
      useStore.getState().objectTypeToAdd !== ObjectType.None ||
      useStore.getState().isAddingElement()
    );
  };

  const handleWallBodyPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (useStore.getState().groupActionMode) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          e.selected = e.id === parentId;
        }
        state.elementGroupId = parentId;
      });
      e.stopPropagation();
    } else {
      if (checkIfCanSelectMe(e)) {
        useStore.getState().set((state) => {
          state.contextMenuObjectType = null;
        });
        useStore.getState().selectMe(id, e, ActionType.Select);
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    useStore.getState().selectMe(id, e, ActionType.Select);
    useStore.getState().set((state) => {
      if (e.intersections.length > 0 && e.intersections[0].object === e.eventObject) {
        state.contextMenuObjectType = ObjectType.Wall;
      }
    });
  };

  return (
    <Plane
      args={[lx, lz]}
      rotation={[HALF_PI, 0, 0]}
      visible={false}
      onPointerDown={handleWallBodyPointerDown}
      onContextMenu={handleContextMenu}
    >
      <meshBasicMaterial side={DoubleSide} />
    </Plane>
  );
};

export default React.memo(EmptyWall);
