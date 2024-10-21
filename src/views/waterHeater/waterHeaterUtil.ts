import { WaterHeaterModel } from 'src/models/WaterHeaterModel';
import { Operation } from '../solarPanel/refSolarPanel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableMove } from 'src/undo/UndoableMove';
import { Vector3 } from 'three';
import { UndoableResizeWaterHeaterHeight, UnoableResizeSolarPanel } from 'src/undo/UndoableResize';
import { UndoableChange } from 'src/undo/UndoableChange';

export class WaterHeaterUtil {
  static addUndoable(oldElement: WaterHeaterModel | undefined, operation: Operation) {
    if (!oldElement) return;

    switch (operation) {
      case Operation.Move: {
        WaterHeaterUtil.addUndoableMove(oldElement);
        break;
      }
      case Operation.ResizeX: {
        WaterHeaterUtil.addUndoableResizeX(oldElement);
        break;
      }
      case Operation.ResizeHeight: {
        WaterHeaterUtil.addUndoablResizeHeight(oldElement);
        break;
      }
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        WaterHeaterUtil.addUndoableRotate(oldElement);
        break;
      }
    }
  }

  static addUndoableMove(oldElement: WaterHeaterModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.WaterHeater) as WaterHeaterModel;
    if (!newElement) return;

    const undoableMove = {
      name: 'Move Water Heater',
      timestamp: Date.now(),
      movedElementId: newElement.id,
      movedElementType: newElement.type,
      oldCx: oldElement.cx,
      oldCy: oldElement.cy,
      oldCz: oldElement.cz,
      newCx: newElement.cx,
      newCy: newElement.cy,
      newCz: newElement.cz,
      oldParentType: oldElement.parentType,
      newParentType: newElement.parentType,
      oldParentId: oldElement.parentId,
      newParentId: newElement.parentId,
      oldFoundationId: oldElement.foundationId,
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
          this.oldFoundationId,
          this.oldParentType,
          this.oldRotation,
          this.oldNormal,
        );
      },
      redo() {
        setUndoRedoMove(
          this.movedElementId,
          [this.newCx, this.newCy, this.newCz],
          this.newParentId,
          this.newFoundationId,
          this.newParentType,
          this.newRotation,
          this.newNormal,
        );
      },
    } as UndoableMove;
    useStore.getState().addUndoable(undoableMove);

    const setUndoRedoMove = (
      id: string,
      pos: number[],
      parentId?: string,
      foundationId?: string | null,
      parentType?: ObjectType,
      rotation?: number[],
      normal?: Vector3,
    ) => {
      useStore.getState().set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el || el.type !== ObjectType.WaterHeater) return;
        [el.cx, el.cy, el.cz] = [...pos];
        if (parentId) {
          el.parentId = parentId;
        }
        if (foundationId) {
          el.foundationId = foundationId;
        }
        if (parentType) {
          (el as WaterHeaterModel).parentType = parentType;
        }
        if (rotation) {
          el.rotation = [...rotation];
        }
        if (normal) {
          el.normal = [normal.x, normal.y, normal.z];
        }
      });
    };
  }

  static addUndoableResizeX(oldElement: WaterHeaterModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.WaterHeater) as WaterHeaterModel;
    if (!newElement) return;

    const undoableResize = {
      name: 'Resize Water Heater X',
      timestamp: Date.now(),
      id: newElement.id,
      oldPos: [oldElement.cx, oldElement.cy, oldElement.cz],
      oldDms: [oldElement.lx, oldElement.ly, oldElement.lz],
      oldRot: [...oldElement.rotation],
      oldNor: [...oldElement.normal],
      newPos: [newElement.cx, newElement.cy, newElement.cz],
      newDms: [newElement.lx, newElement.ly, newElement.lz],
      newRot: [...newElement.rotation],
      newNor: [...newElement.normal],
      undo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              [e.cx, e.cy, e.cz] = [...undoableResize.oldPos];
              [e.lx, e.ly, e.lz] = [...undoableResize.oldDms];
              e.normal = [...undoableResize.oldNor];
              e.rotation = [...undoableResize.oldRot];
              break;
            }
          }
        });
      },
      redo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              [e.cx, e.cy, e.cz] = [...undoableResize.newPos];
              [e.lx, e.ly, e.lz] = [...undoableResize.newDms];
              e.normal = [...undoableResize.newNor];
              e.rotation = [...undoableResize.newRot];
              break;
            }
          }
        });
      },
    } as UnoableResizeSolarPanel;
    useStore.getState().addUndoable(undoableResize);
  }

  static addUndoablResizeHeight(oldElement: WaterHeaterModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.WaterHeater) as WaterHeaterModel;
    if (!newElement) return;

    const undoableResize = {
      name: 'Resize Water Heater Height',
      timestamp: Date.now(),
      id: newElement.id,
      oldHeight: oldElement.lz,
      newHeight: newElement.lz,
      undo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              e.lz = undoableResize.oldHeight;
              break;
            }
          }
        });
      },
      redo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              e.lz = undoableResize.newHeight;
              break;
            }
          }
        });
      },
    } as UndoableResizeWaterHeaterHeight;
    useStore.getState().addUndoable(undoableResize);
  }

  static addUndoableRotate(oldElement: WaterHeaterModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.WaterHeater) as WaterHeaterModel;
    if (!newElement) return;

    const undoableChange = {
      name: 'Rotate Water Heater',
      timestamp: Date.now(),
      changedElementId: newElement.id,
      oldValue: oldElement.relativeAzimuth,
      newValue: newElement.relativeAzimuth,
      changedElementType: ObjectType.WaterHeater,
      undo: () => {
        setState(undoableChange.oldValue as number);
      },
      redo: () => {
        setState(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);

    const setState = (auzimuth: number) => {
      useStore.getState().set((state) => {
        const sp = state.elements.find(
          (e) => e.id === undoableChange.changedElementId && e.type === ObjectType.WaterHeater,
        );
        if (!sp) return;
        (sp as WaterHeaterModel).relativeAzimuth = auzimuth;
      });
    };
  }
}
