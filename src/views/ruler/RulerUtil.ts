import { ElementModel } from 'src/models/ElementModel';
import { RulerModel, RulerSnappedHandle, RulerGroundSnapPoint, RulerVerticalSnapPoint } from 'src/models/RulerModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType } from 'src/types';
import { UndoableChangeRuler } from 'src/undo/UndoableChange';
import { Util } from 'src/Util';
import { Camera, Euler, Raycaster, Scene, Vector3 } from 'three';

export class RulerUtil {
  static GroundSnapDistance = 1;
  static VerticalSnapDistance = 0.5;

  static getGroudPointer(raycaster: Raycaster, scene: Scene, camera: Camera) {
    const pointer = useRefStore.getState().pointer;
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(scene.children);
    for (const intersection of intersections) {
      if (intersection.object.name === 'Ground') {
        return intersection.point;
      }
    }
    return null;
  }

  static getRotation(left: Vector3, right: Vector3) {
    const [dx, dy] = [right.x - left.x, right.y - left.y];
    return Math.atan2(dy, dx);
  }

  static getVerticalSnapPointsArray() {
    const snappingPoints: RulerVerticalSnapPoint[] = [{ elementId: 'Ground', z: 0 }];
    const foundationHeightMap = new Map<string, number>();
    let needCheckWall = false;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Foundation) {
        foundationHeightMap.set(e.id, e.lz);
        snappingPoints.push({ elementId: e.id, z: e.lz });
      } else if (e.type === ObjectType.Wall) {
        needCheckWall = true;
      }
    }
    if (needCheckWall) {
      for (const e of useStore.getState().elements) {
        if (e.type === ObjectType.Wall) {
          const parentId = e.parentId;
          const parentLz = foundationHeightMap.get(parentId);
          if (parentLz !== undefined) {
            snappingPoints.push({ elementId: e.id, z: e.lz + parentLz });
          }
        }
      }
    }
    return snappingPoints;
  }

  static getVerticalSnappedPoint(pz: number, snapPointsArray: RulerVerticalSnapPoint[]) {
    let snappedPoint: RulerVerticalSnapPoint | null = null;

    if (snapPointsArray.length === 0) return { z: pz, snappedPoint };

    let minDist = Infinity;
    for (const snapPoint of snapPointsArray) {
      const { elementId, z } = snapPoint;
      const distance = Math.abs(pz - z);
      if (distance < minDist && distance < RulerUtil.VerticalSnapDistance) {
        minDist = distance;
        snappedPoint = { elementId, z };
      }
    }

    if (snappedPoint) {
      return { z: snappedPoint.z, snappedPoint };
    } else {
      return { z: pz, snappedPoint };
    }
  }

  static getGroundSnapPointsArray() {
    const arr = [];
    let needCheckWall = false;
    const foundationMap = new Map<string, ElementModel>();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Foundation) {
        const center = new Vector3(e.cx, e.cy);
        const euler = new Euler(0, 0, e.rotation[2]);
        for (let i = -1; i <= 1; i += 2) {
          for (let j = -1; j <= 2; j += 2) {
            const direction = new Vector3(i, j);
            const position = new Vector3((e.lx / 2) * i, (e.ly / 2) * j).applyEuler(euler).add(center);
            arr.push({ elementId: e.id, position, direction });
          }
        }
        foundationMap.set(e.id, e);
      } else if (e.type === ObjectType.Wall) {
        needCheckWall = true;
      }
    }
    if (needCheckWall) {
      for (const e of useStore.getState().elements) {
        if (e.type === ObjectType.Wall) {
          const wall = e as WallModel;
          const foundation = foundationMap.get(wall.parentId);
          if (foundation) {
            const fCenter = new Vector3(foundation.cx, foundation.cy);
            const euler = new Euler(0, 0, foundation.rotation[2]);
            const wallLeftPoint = new Vector3().fromArray(wall.leftPoint).applyEuler(euler).add(fCenter);
            const wallRightPoint = new Vector3().fromArray(wall.rightPoint).applyEuler(euler).add(fCenter);
            arr.push({
              elementId: wall.id,
              position: wallLeftPoint,
              direction: new Vector3(-1, 0, 0),
            });
            arr.push({
              elementId: wall.id,
              position: wallRightPoint,
              direction: new Vector3(1, 0, 0),
            });
          }
        }
      }
    }
    return arr;
  }

  static getGroundSnappedPoint(p: Vector3, snapPointsArray: RulerGroundSnapPoint[]) {
    let snappedPoint: RulerGroundSnapPoint | null = null;

    if (snapPointsArray.length === 0) return { pointer: p, snappedPoint };

    let minDist = Infinity;
    for (const snapPoint of snapPointsArray) {
      const { elementId, position, direction } = snapPoint;
      const distance = p.distanceTo(position);
      if (distance < minDist && distance < RulerUtil.GroundSnapDistance) {
        minDist = distance;
        snappedPoint = { elementId, position, direction };
      }
    }

    if (snappedPoint) {
      return { pointer: snappedPoint.position, snappedPoint };
    } else {
      p.setX(Math.round(p.x * 2) / 2);
      p.setY(Math.round(p.y * 2) / 2);
      return { pointer: p, snappedPoint };
    }
  }

  static addUndoChanged(oldRuler: RulerModel, newRuler: RulerModel, operation: string) {
    if (
      Util.isIdentical(oldRuler.leftEndPoint.position, newRuler.leftEndPoint.position) &&
      Util.isIdentical(oldRuler.rightEndPoint.position, newRuler.rightEndPoint.position) &&
      Util.isEqual(oldRuler.verticalOffset, newRuler.verticalOffset)
    )
      return;

    const updateUndo = (
      id: string,
      leftPointPosition: number[],
      rightPointPosition: number[],
      verticalOffset: number,
      leftSnappedHandle?: RulerSnappedHandle,
      rightSnappedHandle?: RulerSnappedHandle,
    ) => {
      useStore.getState().set((state) => {
        const ruler = state.elements.find((e) => e.id === id && e.type === ObjectType.Ruler) as RulerModel;
        if (ruler) {
          ruler.leftEndPoint.position = [...leftPointPosition];
          ruler.rightEndPoint.position = [...rightPointPosition];
          ruler.verticalOffset = verticalOffset;
          if (leftSnappedHandle) {
            ruler.leftEndPoint.snappedHandle = {
              elementId: leftSnappedHandle.elementId,
              direction: [...leftSnappedHandle.direction],
            };
          } else {
            delete ruler.leftEndPoint.snappedHandle;
          }
          if (rightSnappedHandle) {
            ruler.rightEndPoint.snappedHandle = {
              elementId: rightSnappedHandle.elementId,
              direction: [...rightSnappedHandle.direction],
            };
          } else {
            delete ruler.rightEndPoint.snappedHandle;
          }
        }
      });
    };

    const undoable = {
      name: `${operation} Ruler`,
      timestamp: Date.now(),
      elementId: oldRuler.id,
      oldLeftPointPosition: [...oldRuler.leftEndPoint.position],
      oldRightPointPosition: [...oldRuler.rightEndPoint.position],
      newLeftPointPosition: [...newRuler.leftEndPoint.position],
      newRightPointPosition: [...newRuler.rightEndPoint.position],
      oldVerticalOffset: oldRuler.verticalOffset ?? 0,
      newVerticalOffset: newRuler.verticalOffset ?? 0,
      oldLeftSnappedHandle: oldRuler.leftEndPoint.snappedHandle
        ? {
            elementId: oldRuler.leftEndPoint.snappedHandle.elementId,
            direction: [...oldRuler.leftEndPoint.snappedHandle.direction],
          }
        : undefined,
      oldRightSnappedHandle: oldRuler.rightEndPoint.snappedHandle
        ? {
            elementId: oldRuler.rightEndPoint.snappedHandle.elementId,
            direction: [...oldRuler.rightEndPoint.snappedHandle.direction],
          }
        : undefined,
      newLeftSnappedHandle: newRuler.leftEndPoint.snappedHandle
        ? {
            elementId: newRuler.leftEndPoint.snappedHandle.elementId,
            direction: [...newRuler.leftEndPoint.snappedHandle.direction],
          }
        : undefined,
      newRightSnappedHandle: newRuler.rightEndPoint.snappedHandle
        ? {
            elementId: newRuler.rightEndPoint.snappedHandle.elementId,
            direction: [...newRuler.rightEndPoint.snappedHandle.direction],
          }
        : undefined,
      undo: () => {
        updateUndo(
          undoable.elementId,
          undoable.oldLeftPointPosition,
          undoable.oldRightPointPosition,
          undoable.oldVerticalOffset,
          undoable.oldLeftSnappedHandle,
          undoable.oldRightSnappedHandle,
        );
      },
      redo: () => {
        updateUndo(
          undoable.elementId,
          undoable.newLeftPointPosition,
          undoable.newRightPointPosition,
          undoable.newVerticalOffset,
          undoable.newLeftSnappedHandle,
          undoable.newRightSnappedHandle,
        );
      },
    } as UndoableChangeRuler;
    useStore.getState().addUndoable(undoable);
  }
}
