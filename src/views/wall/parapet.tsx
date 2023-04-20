import React, { useMemo } from 'react';
import { Extrude } from '@react-three/drei';
import { HALF_PI, ZERO_TOLERANCE } from 'src/constants';
import { ParapetArgs } from 'src/models/WallModel';
import { WallTexture } from 'src/types';
import { Euler, Shape, Vector3 } from 'three';
import { useWallTexture } from './hooks';

export const DEFAULT_PARAPET_SETTINGS: ParapetArgs = {
  display: false,
  color: 'white',
  textureType: WallTexture.NoTexture,
  parapetHeight: 1,
  copingWidth: 0.5,
  copingHeight: 0.1,
};

export interface WallData {
  cx: number;
  cy: number;
  hx: number;
  hy: number;
  hz: number;
  angle: number;
}

export interface WallPointData {
  leftPoint: number[];
  rightPoint: number[];
  ly: number;
  copingWidth: number;
}

export interface ParapetProps {
  args: ParapetArgs;
  wallData: WallData;
  currWallPointData: WallPointData;
  leftWallPointData: WallPointData | null;
  rightWallPointData: WallPointData | null;
}

type WallPoints = {
  leftPoint: Vector3;
  rightPoint: Vector3;
};

type CopingPoints = {
  innerPoints: WallPoints;
  outerPoints: WallPoints;
};

const Parapet = ({ args, wallData, currWallPointData, leftWallPointData, rightWallPointData }: ParapetProps) => {
  const { display, color, textureType, parapetHeight, copingWidth, copingHeight } = args;
  const { cx, cy, hx, hy, hz, angle } = wallData;

  const texture = useWallTexture(textureType);

  const bodyShape = useMemo(() => {
    const shape = new Shape();

    const leftPoint = new Vector3(-hx, hy * 2);
    const rightPoint = new Vector3(hx, hy * 2);

    if (rightWallPointData || leftWallPointData) {
      const currWallInnerPoint = getWallPointsAfterOffset(currWallPointData, currWallPointData.ly);

      if (rightWallPointData && isSamePoint(currWallPointData.rightPoint, rightWallPointData.leftPoint)) {
        const rel = getBodyRelativeIntersectionPoint(currWallInnerPoint, rightWallPointData);
        rel && rightPoint.copy(rel);
      }
      if (leftWallPointData && isSamePoint(currWallPointData.leftPoint, leftWallPointData.rightPoint)) {
        const rel = getBodyRelativeIntersectionPoint(currWallInnerPoint, leftWallPointData);
        rel && leftPoint.copy(rel);
      }
    }

    shape.moveTo(-hx, 0);
    shape.lineTo(hx, 0);
    shape.lineTo(rightPoint.x, rightPoint.y);
    shape.lineTo(leftPoint.x, leftPoint.y);
    shape.closePath();
    return shape;
  }, [hx, currWallPointData, leftWallPointData, rightWallPointData]);

  const copingShape = useMemo(() => {
    const shape = new Shape();

    const outerLeft = new Vector3(-hx, hy - copingWidth / 2);
    const outerRight = new Vector3(hx, hy - copingWidth / 2);
    const innerRight = new Vector3(hx, hy + copingWidth / 2);
    const innerLeft = new Vector3(-hx, hy + copingWidth / 2);

    if (rightWallPointData || leftWallPointData) {
      const currWallCopingPoints = getCopingPoints(currWallPointData);

      if (rightWallPointData && isSamePoint(currWallPointData.rightPoint, rightWallPointData.leftPoint)) {
        const copingInterSectionPoints = getCopingIntersectionPoints(currWallCopingPoints, rightWallPointData);
        if (copingInterSectionPoints) {
          outerRight.copy(copingInterSectionPoints.outerIntersection);
          innerRight.copy(copingInterSectionPoints.innerIntersection);
        }
      }
      if (leftWallPointData && isSamePoint(currWallPointData.leftPoint, leftWallPointData.rightPoint)) {
        const copingInterSectionPoints = getCopingIntersectionPoints(currWallCopingPoints, leftWallPointData);
        if (copingInterSectionPoints) {
          outerLeft.copy(copingInterSectionPoints.outerIntersection);
          innerLeft.copy(copingInterSectionPoints.innerIntersection);
        }
      }
    }

    shape.moveTo(outerLeft.x, outerLeft.y);
    shape.lineTo(outerRight.x, outerRight.y);
    shape.lineTo(innerRight.x, innerRight.y);
    shape.lineTo(innerLeft.x, innerLeft.y);
    shape.closePath();
    return shape;
  }, [hy, copingWidth, currWallPointData, leftWallPointData, rightWallPointData]);

  function getCopingIntersectionPoints(currCopingPoints: CopingPoints, sideWallPointData: WallPointData) {
    const sideWallCopingPoints = getCopingPoints(sideWallPointData);

    const outerIntersection = getIntersectionPoint(
      currCopingPoints.outerPoints.leftPoint,
      currCopingPoints.outerPoints.rightPoint,
      sideWallCopingPoints.outerPoints.leftPoint,
      sideWallCopingPoints.outerPoints.rightPoint,
    );
    if (!outerIntersection) return null;

    const innerIntersection = getIntersectionPoint(
      currCopingPoints.innerPoints.leftPoint,
      currCopingPoints.innerPoints.rightPoint,
      sideWallCopingPoints.innerPoints.leftPoint,
      sideWallCopingPoints.innerPoints.rightPoint,
    );
    if (!innerIntersection) return null;

    return {
      innerIntersection: new Vector3()
        .subVectors(innerIntersection, new Vector3(cx, cy))
        .applyEuler(new Euler(0, 0, -angle)),
      outerIntersection: new Vector3()
        .subVectors(outerIntersection, new Vector3(cx, cy))
        .applyEuler(new Euler(0, 0, -angle)),
    };
  }

  function getBodyRelativeIntersectionPoint(currPoints: WallPoints, sideWallPointData: WallPointData) {
    const sideWallPoints = getWallPointsAfterOffset(sideWallPointData, sideWallPointData.ly);
    const intersection = getIntersectionPoint(
      currPoints.leftPoint,
      currPoints.rightPoint,
      sideWallPoints.leftPoint,
      sideWallPoints.rightPoint,
    );
    if (!intersection) return null;
    return new Vector3().subVectors(intersection, new Vector3(cx, cy)).applyEuler(new Euler(0, 0, -angle));
  }

  if (!display) return null;

  return (
    <group name={'Parapet Group'} position={[0, 0, hz]}>
      {/* body */}
      <Extrude args={[bodyShape, { steps: 1, depth: parapetHeight, bevelEnabled: false }]}>
        <meshStandardMaterial color={color} map={texture} />
      </Extrude>

      {/* top coping */}
      <Extrude
        position={[0, 0, parapetHeight]}
        args={[copingShape, { steps: 1, depth: copingHeight, bevelEnabled: false }]}
      >
        <meshStandardMaterial color={color} />
      </Extrude>
    </group>
  );
};

function getCopingPoints(wallPointData: WallPointData): CopingPoints {
  const innerOffset = (wallPointData.ly + wallPointData.copingWidth) / 2;
  const outerOffset = (wallPointData.ly - wallPointData.copingWidth) / 2;
  return {
    innerPoints: getWallPointsAfterOffset(wallPointData, innerOffset),
    outerPoints: getWallPointsAfterOffset(wallPointData, outerOffset),
  };
}

function getWallPointsAfterOffset(wallPointData: WallPointData, y: number) {
  const { leftPoint, rightPoint } = wallPointData;
  const leftPointV3 = new Vector3().fromArray(leftPoint);
  const rightPointV3 = new Vector3().fromArray(rightPoint);
  const normal = new Vector3().subVectors(rightPointV3, leftPointV3).applyEuler(new Euler(0, 0, HALF_PI)).normalize();
  const offset = normal.clone().multiplyScalar(y);
  return {
    leftPoint: leftPointV3.clone().add(offset),
    rightPoint: rightPointV3.clone().add(offset),
  };
}

function isSamePoint(u: number[], v: number[]) {
  return Math.abs(u[0] - v[0]) < ZERO_TOLERANCE && Math.abs(u[1] - v[1]) < ZERO_TOLERANCE;
}

function getIntersectionPoint(v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3) {
  if (Math.abs(v1.x - v2.x) < 0.001 && Math.abs(v3.x - v4.x) < 0.001) {
    return null;
  }
  const k1 = (v2.y - v1.y) / (v2.x - v1.x);
  const k2 = (v4.y - v3.y) / (v4.x - v3.x);
  if (Math.abs(k1 - k2) < 0.001) {
    return null;
  }
  const x = [v1.x, v2.x, v3.x, v4.x];
  const y = [v1.y, v2.y, v3.y, v4.y];
  const x0 =
    ((x[2] - x[3]) * (x[1] * y[0] - x[0] * y[1]) - (x[0] - x[1]) * (x[3] * y[2] - x[2] * y[3])) /
    ((x[2] - x[3]) * (y[0] - y[1]) - (x[0] - x[1]) * (y[2] - y[3]));
  const y0 =
    ((y[2] - y[3]) * (y[1] * x[0] - y[0] * x[1]) - (y[0] - y[1]) * (y[3] * x[2] - y[2] * x[3])) /
    ((y[2] - y[3]) * (x[0] - x[1]) - (y[0] - y[1]) * (x[2] - x[3]));
  if (!Number.isFinite(x0) || !Number.isFinite(y0)) {
    return null;
  }
  return new Vector3(x0, y0);
}

export default React.memo(Parapet);
