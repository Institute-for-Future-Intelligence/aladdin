/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { useStore } from 'src/stores/common';
import { WallModel, WallFill } from 'src/models/WallModel';
import { Util } from 'src/Util';
import { Vector3 } from 'three';
import EmptyWall from './emptyWall';
import Wall from './wall';
import WallMoveHandleWarpper from './wallMoveHandleWrapper';
import WallResizeHandleWrapper from './wallResizeHandleWrapper';
import { useUpdataOldFiles } from './hooks';
import { ObjectType } from 'src/types';
import { FoundationModel } from 'src/models/FoundationModel';
import * as Selector from 'src/stores/selector';

const WallRenderer = (wallModel: WallModel) => {
  useUpdataOldFiles(wallModel);

  const { id, parentId, roofId, cx, cy, lx, ly, lz, relativeAngle, fill, selected, locked, unfilledHeight } = wallModel;

  const [hx, hz] = [lx / 2, lz / 2];

  const deletedRoofId = useStore(Selector.deletedRoofId);
  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId && e.type === ObjectType.Foundation) {
        return e as FoundationModel;
      }
    }
  });

  // roof
  useEffect(() => {
    if (deletedRoofId === roofId) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === id && e.type === ObjectType.Wall) {
            const wall = e as WallModel;
            wall.roofId = null;
            wall.leftRoofHeight = undefined;
            wall.rightRoofHeight = undefined;
            wall.centerRoofHeight = undefined;
            wall.centerLeftRoofHeight = undefined;
            wall.centerRightRoofHeight = undefined;
            break;
          }
        }
      });
    }
  }, [deletedRoofId]);

  if (!foundation) return null;

  const wallAbsPosition = Util.wallAbsolutePosition(new Vector3(cx, cy), foundation).setZ(hz + foundation.lz);
  const wallAbsAngle = foundation.rotation[2] + relativeAngle;
  const highLight = lx === 0;

  const renderWall = () => {
    if (fill === WallFill.Empty) {
      return <EmptyWall {...wallModel} />;
    }
    return <Wall wallModel={wallModel} foundationModel={foundation} />;
  };

  return (
    <group
      name={`Wall Group ${id}`}
      position={wallAbsPosition}
      rotation={[0, 0, wallAbsAngle]}
      userData={{ aabb: true }}
    >
      {renderWall()}

      {/* handles */}
      {selected && !locked && (
        <>
          {lx > 0.5 && <WallMoveHandleWarpper ply={ly} phz={hz} />}
          <WallResizeHandleWrapper
            id={id}
            parentLz={foundation.lz}
            relativeAngle={relativeAngle}
            x={hx}
            z={hz}
            unfilledHeight={unfilledHeight}
            fill={fill}
            highLight={highLight}
          />
        </>
      )}
    </group>
  );
};

export default React.memo(WallRenderer);
