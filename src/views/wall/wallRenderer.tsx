/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { useStore } from 'src/stores/common';
import { WallModel, WallFill } from 'src/models/WallModel';
import { Util } from 'src/Util';
import { Vector3 } from 'three';
import EmptyWall from './emptyWall';
import Wall from './wall';
import WallMoveHandleWrapper from './wallMoveHandleWrapper';
import WallResizeHandleWrapper from './wallResizeHandleWrapper';
import { useUpdateOldFiles } from './hooks';
import { ObjectType } from 'src/types';
import { FoundationModel } from 'src/models/FoundationModel';

const WallRenderer = (wallModel: WallModel) => {
  useUpdateOldFiles(wallModel);

  const {
    id,
    parentId,
    roofId,
    cx,
    cy,
    lx,
    ly,
    lz,
    relativeAngle,
    fill,
    selected,
    locked,
    leftUnfilledHeight,
    rightUnfilledHeight,
    leftTopPartialHeight,
    rightTopPartialHeight,
    leftJoints,
    rightJoints,
  } = wallModel;

  const [hx, hz] = [lx / 2, lz / 2];

  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId && e.type === ObjectType.Foundation) {
        return e as FoundationModel;
      }
    }
  });

  if (!foundation) return null;

  const isPartial = fill === WallFill.Partial;
  const leftRoofHeight = leftJoints.length > 0 ? wallModel.leftRoofHeight : lz;
  const rightRoofHeight = rightJoints.length > 0 ? wallModel.rightRoofHeight : lz;
  const wallLeftHeight = leftRoofHeight ?? lz;
  const wallRightHeight = rightRoofHeight ?? lz;
  const realWallLeftHeight = isPartial ? Math.min(wallLeftHeight, leftTopPartialHeight) : wallLeftHeight;
  const realWallRightHeight = isPartial ? Math.min(wallRightHeight, rightTopPartialHeight) : wallRightHeight;

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
          {lx > 0.5 && <WallMoveHandleWrapper ply={ly} phz={hz} />}
          <WallResizeHandleWrapper
            id={id}
            parentLz={foundation.lz}
            roofId={roofId}
            absAngle={relativeAngle + foundation.rotation[2]}
            x={hx}
            z={hz}
            leftUnfilledHeight={leftUnfilledHeight}
            rightUnfilledHeight={rightUnfilledHeight}
            leftTopPartialResizeHandleHeight={realWallLeftHeight}
            rightTopPartialResizeHandleHeight={realWallRightHeight}
            fill={fill}
            wallLeftHeight={wallLeftHeight}
            wallRightHeight={wallRightHeight}
            highLight={highLight}
            leftJoints={leftJoints}
            rightJoints={rightJoints}
          />
        </>
      )}
    </group>
  );
};

export default React.memo(WallRenderer);
