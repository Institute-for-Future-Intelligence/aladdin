/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { WallModel, WallFill } from 'src/models/WallModel';
import EmptyWall from './emptyWall';
import Wall from './wall';
import WallMoveHandleWrapper from './wallMoveHandleWrapper';
import WallResizeHandleWrapper from './wallResizeHandleWrapper';
import { FoundationModel } from 'src/models/FoundationModel';
import { useSelected } from '../../hooks';
import SolarPanelWrapper from '../solarPanel/solarPanelWrapper';
import { ObjectType } from 'src/types';
import BatteryStorageWrapper from '../batteryStorage';

interface WallRendererProps {
  wallModel: WallModel;
  foundationModel: FoundationModel;
}

export const WALL_GROUP_NAME = 'Wall_Group';

const WallRenderer = ({ wallModel, foundationModel }: WallRendererProps) => {
  const {
    id,
    roofId,
    cx,
    cy,
    lx,
    ly,
    lz,
    relativeAngle,
    fill,
    locked,
    leftUnfilledHeight,
    rightUnfilledHeight,
    leftTopPartialHeight,
    rightTopPartialHeight,
    leftJoints,
    rightJoints,
    parentId,
  } = wallModel;

  const selected = useSelected(id);

  const [hx, hz] = [lx / 2, lz / 2];

  const isPartial = fill === WallFill.Partial;
  const leftRoofHeight = leftJoints.length > 0 ? wallModel.leftRoofHeight : lz;
  const rightRoofHeight = rightJoints.length > 0 ? wallModel.rightRoofHeight : lz;
  const wallLeftHeight = leftRoofHeight ?? lz;
  const wallRightHeight = rightRoofHeight ?? lz;
  const realWallLeftHeight = isPartial ? Math.min(wallLeftHeight, leftTopPartialHeight) : wallLeftHeight;
  const realWallRightHeight = isPartial ? Math.min(wallRightHeight, rightTopPartialHeight) : wallRightHeight;
  const highLight = lx === 0;

  const renderWall = () => {
    if (fill === WallFill.Empty) {
      return <EmptyWall {...wallModel} />;
    }
    return <Wall wallModel={wallModel} foundationModel={foundationModel} />;
  };

  return (
    <group
      name={`${WALL_GROUP_NAME} ${id}`}
      position={[cx, cy, hz]}
      rotation={[0, 0, relativeAngle]}
      userData={{ aabb: true, id: id, fId: parentId }}
    >
      <SolarPanelWrapper
        parentId={id}
        foundationId={parentId}
        wrapperType={ObjectType.Wall}
        plx={lx}
        ply={ly}
        plz={lz}
      />

      <BatteryStorageWrapper parentId={id} foundationId={parentId} parentLx={lx} parentLz={lz} />

      {renderWall()}

      {/* handles */}
      {selected && !locked && (
        <>
          {lx > 0.5 && <WallMoveHandleWrapper ply={ly} phz={hz} />}
          <WallResizeHandleWrapper
            id={id}
            parentLz={foundationModel.lz}
            roofId={roofId}
            absAngle={relativeAngle + foundationModel.rotation[2]}
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

const areEqual = (prev: WallRendererProps, curr: WallRendererProps) => prev.wallModel === curr.wallModel;

export default React.memo(WallRenderer, areEqual);
