/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from '../stores/common';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Vector3 } from 'three';
import { UndoableMove } from '../undo/UndoableMove';
import { PolygonModel } from '../models/PolygonModel';
import { Point2 } from '../models/Point2';
import { ThreeEvent } from '@react-three/fiber';

export class SharedUtil {
  static WALL_OUTSIDE_SURFACE_MESH_NAME = 'Wall Outside Surface';

  static getIntersectionObjects(e: ThreeEvent<PointerEvent>) {
    return e.intersections.filter(
      (i) =>
        i.eventObject.name.includes('Cuboid') ||
        i.eventObject.name === 'Foundation' ||
        i.eventObject.name.includes('Roof') ||
        i.eventObject.name.includes(SharedUtil.WALL_OUTSIDE_SURFACE_MESH_NAME),
    );
  }

  static addUndoableMove(ableToChangeParent = true) {
    const oldElement = useStore.getState().selectedElement;
    if (!oldElement) return;
    const newElement = useStore.getState().getElementById(oldElement.id);
    let oldParentId = usePrimitiveStore.getState().oldParentId;
    let oldFoundationId = usePrimitiveStore.getState().oldFoundationId;
    if (!newElement) return;
    if (ableToChangeParent) {
      if (!oldParentId || !oldFoundationId) return;
    } else {
      oldParentId = newElement.parentId;
      oldFoundationId = newElement.foundationId;
    }

    const isSolarPanel = oldElement.type === ObjectType.SolarPanel;
    const isPolygon = oldElement.type === ObjectType.Polygon;
    const undoableMove = {
      name: 'Move',
      timestamp: Date.now(),
      movedElementId: newElement.id,
      movedElementType: newElement.type,
      oldCx: oldElement.cx,
      oldCy: oldElement.cy,
      oldCz: oldElement.cz,
      newCx: newElement.cx,
      newCy: newElement.cy,
      newCz: newElement.cz,
      oldParentType: isSolarPanel ? (oldElement as SolarPanelModel).parentType : undefined,
      newParentType: isSolarPanel ? (newElement as SolarPanelModel).parentType : undefined,
      oldParentId: oldParentId,
      newParentId: newElement.parentId,
      oldFoundationId: oldFoundationId,
      newFoundationId: newElement.foundationId,
      oldNormal: new Vector3().fromArray(oldElement.normal),
      newNormal: new Vector3().fromArray(newElement.normal),
      oldRotation: [...oldElement.rotation],
      newRotation: [...newElement.rotation],
      undo() {
        setUndoRedoMove(
          this.movedElementId,
          [this.oldCx, this.oldCy, this.oldCz],
          this.oldParentId,
          this.newParentId,
          this.oldFoundationId,
          this.oldParentType,
          this.oldRotation,
          this.oldNormal,
          isPolygon ? (oldElement as PolygonModel).vertices : undefined,
        );
      },
      redo() {
        setUndoRedoMove(
          this.movedElementId,
          [this.newCx, this.newCy, this.newCz],
          this.newParentId,
          this.oldParentId,
          this.newFoundationId,
          this.newParentType,
          this.newRotation,
          this.newNormal,
          isPolygon ? (newElement as PolygonModel).vertices : undefined,
        );
      },
    } as UndoableMove;
    useStore.getState().addUndoable(undoableMove);

    const setUndoRedoMove = (
      id: string,
      pos: number[],
      oldParentId?: string,
      newParentId?: string,
      foundationId?: string | null,
      parentType?: ObjectType,
      rotation?: number[],
      normal?: Vector3,
      vertices?: Point2[],
    ) => {
      useStore.getState().set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el) return;
        if (el.type === ObjectType.Polygon) {
          if (vertices) {
            const pg = el as PolygonModel;
            pg.vertices = [...vertices];
          }
        } else {
          [el.cx, el.cy, el.cz] = [...pos];
        }
        if (oldParentId && newParentId && foundationId) {
          el.parentId = oldParentId;
          el.foundationId = foundationId;

          if (parentType && el.type === ObjectType.SolarPanel) {
            (el as SolarPanelModel).parentType = parentType;
          }
          if (rotation) {
            el.rotation = [...rotation];
          }
          if (normal) {
            el.normal = [normal.x, normal.y, normal.z];
          }

          // keep abs size
          if (el.type === ObjectType.Window) {
            const oldParent = state.elements.find((e) => e.id === oldParentId);
            const newParent = state.elements.find((e) => e.id === newParentId);
            if (!oldParent || !newParent) return;
            const absLx = el.lx * newParent.lx;
            const absLz = el.lz * newParent.lz;
            el.lx = absLx / oldParent.lx;
            el.lz = absLz / oldParent.lz;
          }
        }
      });
    };
  }

  static undoInvalidOperation() {
    useStore.getState().set((state) => {
      if (!state.selectedElement) return;
      for (let i = 0; i < state.elements.length; i++) {
        const element = state.elements[i];
        if (element.id === state.selectedElement?.id) {
          const oldElement = state.selectedElement;
          const oldParentId = usePrimitiveStore.getState().oldParentId;
          const oldFoundationId = usePrimitiveStore.getState().oldFoundationId;
          if (oldParentId) {
            oldElement.parentId = oldParentId;
          }
          if (oldFoundationId) {
            oldElement.foundationId = oldFoundationId;
          }
          state.elements[i] = oldElement;
          break;
        }
      }
    });
  }
}
