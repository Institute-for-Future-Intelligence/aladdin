import React, { useMemo } from 'react';
import { Extrude, Line } from '@react-three/drei';
import { HALF_PI, ZERO_TOLERANCE } from 'src/constants';
import { ParapetArgs } from 'src/models/WallModel';
import { ActionType, ObjectType, WallTexture } from 'src/types';
import { Euler, Shape, Vector3 } from 'three';
import { useWallTexture } from './hooks';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from 'src/stores/common';

export const DEFAULT_PARAPET_SETTINGS: ParapetArgs = {
  display: false,
  color: 'white',
  textureType: WallTexture.NoTexture,
  parapetHeight: 1,
  copingsWidth: 0.5,
  copingsHeight: 0.1,
};

export interface WallData {
  id: string;
  parentId: string;
  cx: number;
  cy: number;
  hx: number;
  hy: number;
  angle: number;
  selected: boolean;
}

export interface WallPointData {
  leftPoint: number[];
  rightPoint: number[];
  ly: number;
  copingsWidth: number;
}

export interface ParapetProps {
  args: ParapetArgs;
  wallData: WallData;
  parapetZ: number;
  currWallPointData: WallPointData;
  leftWallPointData: WallPointData | null;
  rightWallPointData: WallPointData | null;
}

type WallPoints = {
  leftPoint: Vector3;
  rightPoint: Vector3;
};

type CopingsPoints = {
  innerPoints: WallPoints;
  outerPoints: WallPoints;
};

const Parapet = ({
  args,
  wallData,
  parapetZ,
  currWallPointData,
  leftWallPointData,
  rightWallPointData,
}: ParapetProps) => {
  const { display, color, textureType, parapetHeight, copingsWidth, copingsHeight } = args;
  const { id, cx, cy, hx, hy, angle } = wallData;
  const bodyHeight = parapetHeight - copingsHeight;

  const texture = useWallTexture(textureType);

  const copingsPoints = useMemo(() => {
    const outerLeft = new Vector3(-hx, hy - copingsWidth / 2);
    const outerRight = new Vector3(hx, hy - copingsWidth / 2);
    const innerRight = new Vector3(hx, hy + copingsWidth / 2);
    const innerLeft = new Vector3(-hx, hy + copingsWidth / 2);

    const points = [outerLeft, outerRight, innerRight, innerLeft];

    if (rightWallPointData || leftWallPointData) {
      const currWallCopingsPoints = getCopingsPoints(currWallPointData);

      if (rightWallPointData && isSamePoint(currWallPointData.rightPoint, rightWallPointData.leftPoint)) {
        const copingsInterSectionPoints = getCopingsIntersectionPoints(currWallCopingsPoints, rightWallPointData);
        if (copingsInterSectionPoints) {
          outerRight.copy(copingsInterSectionPoints.outerIntersection);
          innerRight.copy(copingsInterSectionPoints.innerIntersection);
        }
      }
      if (leftWallPointData && isSamePoint(currWallPointData.leftPoint, leftWallPointData.rightPoint)) {
        const copingsInterSectionPoints = getCopingsIntersectionPoints(currWallCopingsPoints, leftWallPointData);
        if (copingsInterSectionPoints) {
          outerLeft.copy(copingsInterSectionPoints.outerIntersection);
          innerLeft.copy(copingsInterSectionPoints.innerIntersection);
        }
      }
    }

    return points;
  }, [hx, hy, copingsWidth, currWallPointData, leftWallPointData, rightWallPointData]);

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
  }, [hx, hy, currWallPointData, leftWallPointData, rightWallPointData]);

  const copingsShape = useMemo(() => {
    const shape = new Shape();
    if (copingsWidth === 0) return shape;
    const [outerLeft, outerRight, innerRight, innerLeft] = copingsPoints;
    shape.moveTo(outerLeft.x, outerLeft.y);
    shape.lineTo(outerRight.x, outerRight.y);
    shape.lineTo(innerRight.x, innerRight.y);
    shape.lineTo(innerLeft.x, innerLeft.y);
    shape.closePath();
    return shape;
  }, [copingsWidth, copingsPoints]);

  const copingsWireframePoints = useMemo(() => {
    return copingsPoints.map((v) => v.toArray() as [number, number, number]);
  }, [copingsPoints]);

  const bodyHorizontalWireframePoints = useMemo(() => [new Vector3(-hx, 0, 0), new Vector3(hx, 0, 0)], [hx]);
  const bodyVerticalWireframePoints = useMemo(() => [new Vector3(), new Vector3(0, 0, bodyHeight)], [bodyHeight]);

  function getCopingsIntersectionPoints(currCopingsPoints: CopingsPoints, sideWallPointData: WallPointData) {
    const sideWallCopingsPoints = getCopingsPoints(sideWallPointData);

    const outerIntersection = getIntersectionPoint(
      currCopingsPoints.outerPoints.leftPoint,
      currCopingsPoints.outerPoints.rightPoint,
      sideWallCopingsPoints.outerPoints.leftPoint,
      sideWallCopingsPoints.outerPoints.rightPoint,
    );
    if (!outerIntersection) return null;

    const innerIntersection = getIntersectionPoint(
      currCopingsPoints.innerPoints.leftPoint,
      currCopingsPoints.innerPoints.rightPoint,
      sideWallCopingsPoints.innerPoints.leftPoint,
      sideWallCopingsPoints.innerPoints.rightPoint,
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

  function isAllowedToSelectMe() {
    if (
      useStore.getState().moveHandleType ||
      useStore.getState().resizeHandleType ||
      useStore.getState().isAddingElement()
    ) {
      return false;
    }
    return true;
  }

  function handleParapetPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 2 && e.intersections.length > 0 && e.intersections[0].eventObject === e.eventObject) {
      if (isAllowedToSelectMe()) {
        useStore.getState().selectMe(id, e, ActionType.Select, true);
      }
    }
  }

  function handleParapetContextMenu(e: ThreeEvent<MouseEvent>) {
    useStore.getState().selectMe(id, e, ActionType.ContextMenu, true);
    useStore.getState().set((state) => {
      if (e.intersections.length > 0 && e.intersections[0].eventObject === e.eventObject) {
        state.contextMenuObjectType = ObjectType.Wall;
      }
    });
  }

  if (!display) return null;

  return (
    <group
      name={'Wall Parapet Group'}
      position={[0, 0, parapetZ]}
      onContextMenu={handleParapetContextMenu}
      onPointerDown={handleParapetPointerDown}
    >
      {/* body */}
      <Extrude name={'Body Extrude Mesh'} args={[bodyShape, { steps: 1, depth: bodyHeight, bevelEnabled: false }]}>
        <meshStandardMaterial color={color} map={texture} />
      </Extrude>

      {/* body wireframe */}
      <Line position={[hx, 0, 0]} points={bodyVerticalWireframePoints} color={'black'} lineWidth={0.2} />
      <Line position={[-hx, 0, 0]} points={bodyVerticalWireframePoints} color={'black'} lineWidth={0.2} />
      <Line position={[0, 0, bodyHeight]} points={bodyHorizontalWireframePoints} color={'black'} lineWidth={0.2} />

      {/* copings */}
      <Extrude
        name={'Copings Extrude Mesh'}
        position={[0, 0, bodyHeight]}
        args={[copingsShape, { steps: 1, depth: copingsHeight, bevelEnabled: false }]}
      >
        <meshStandardMaterial color={color} />
      </Extrude>

      {/* copings wireframe */}
      <Line
        position={[0, 0, bodyHeight + copingsHeight]}
        points={copingsWireframePoints}
        color={'black'}
        lineWidth={0.2}
      />
      <Line position={[0, 0, bodyHeight]} points={copingsWireframePoints} color={'black'} lineWidth={0.2} />
    </group>
  );
};

function getCopingsPoints(wallPointData: WallPointData): CopingsPoints {
  const innerOffset = (wallPointData.ly + wallPointData.copingsWidth) / 2;
  const outerOffset = (wallPointData.ly - wallPointData.copingsWidth) / 2;
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
