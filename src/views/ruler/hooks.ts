import { useRef } from 'react';
import { FoundationModel } from 'src/models/FoundationModel';
import { RulerEndPoint } from 'src/models/RulerModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Euler, Vector3 } from 'three';
import { shallow } from 'zustand/shallow';

export const useRulerGroundEndPointPosition = (endPoint: RulerEndPoint) => {
  const endPointPosition = useStore((state) => {
    if (!endPoint.snappedHandle) return endPoint.position;

    const { elementId, direction } = endPoint.snappedHandle;
    const element = state.elements.find((e) => e.id === elementId);
    if (element) {
      switch (element.type) {
        case ObjectType.Foundation: {
          const center = new Vector3(element.cx, element.cy);
          const euler = new Euler(0, 0, element.rotation[2]);
          const position = new Vector3((element.lx / 2) * direction[0], (element.ly / 2) * direction[1])
            .applyEuler(euler)
            .add(center);
          return position.toArray();
        }
        case ObjectType.Wall: {
          const wall = element as WallModel;
          const foundation = state.elements.find(
            (e) => e.id === wall.parentId && e.type === ObjectType.Foundation,
          ) as FoundationModel;
          if (foundation) {
            const fCenter = new Vector3(foundation.cx, foundation.cy);
            const euler = new Euler(0, 0, foundation.rotation[2]);
            const position = new Vector3()
              .fromArray(direction[0] < 0 ? wall.leftPoint : wall.rightPoint)
              .applyEuler(euler)
              .add(fCenter);
            return position.toArray();
          }
        }
      }
    }

    return endPoint.position;
  }, shallow);

  const posRef = useRef(endPointPosition);
  posRef.current = endPointPosition;

  return posRef;
};

export const useRulerVerticalPosition = (endPoint: RulerEndPoint, verticalOffset: number) => {
  const endPointPosition = useStore((state) => {
    if (!endPoint.snappedHandle) return Math.max(verticalOffset, endPoint.position[2]);

    const { elementId } = endPoint.snappedHandle;
    const element = state.elements.find((e) => e.id === elementId);
    if (element) {
      switch (element.type) {
        case ObjectType.Foundation: {
          return Math.max(verticalOffset, element.lz);
        }
        case ObjectType.Wall: {
          const wall = element as WallModel;
          const foundation = state.elements.find(
            (e) => e.id === wall.parentId && e.type === ObjectType.Foundation,
          ) as FoundationModel;
          if (foundation) {
            return Math.max(verticalOffset, foundation.lz + wall.lz);
          }
        }
      }
    }

    return Math.max(verticalOffset, endPoint.position[2]);
  }, shallow);

  const posRef = useRef(endPointPosition);
  posRef.current = endPointPosition;

  return posRef;
};
