import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { useStore } from 'src/stores/common';
import { Operation } from './batteryStorageConstants';
import { UndoableMove } from 'src/undo/UndoableMove';
import { ObjectType } from 'src/types';
import { UndoableResizeBatteryStorage } from 'src/undo/UndoableResize';
import { UndoableChange } from 'src/undo/UndoableChange';

export class BatteryStorageUtil {
  static addUndoable(oldElem: BatteryStorageModel, operation: Operation) {
    const newElem = useStore
      .getState()
      .elements.find((e) => e.id === oldElem.id && e.type === ObjectType.BatteryStorage) as BatteryStorageModel;
    if (!newElem) return;

    switch (operation) {
      case Operation.Move: {
        BatteryStorageUtil.addUndoableMove(oldElem, newElem);
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY:
      case Operation.ResizeZ:
      case Operation.ResizeXY: {
        BatteryStorageUtil.addUndoableResize(oldElem, newElem);
        break;
      }
      case Operation.RotateUpper:
      case Operation.RotateLower: {
        BatteryStorageUtil.addUndoableRotate(oldElem, newElem);
        break;
      }
    }
  }

  static addUndoableMove(oldElement: BatteryStorageModel, newElement: BatteryStorageModel) {
    const undoableMove = {
      name: 'Move Battery Storage',
      timestamp: Date.now(),
      movedElementId: newElement.id,
      movedElementType: newElement.type,
      oldCx: oldElement.cx,
      oldCy: oldElement.cy,
      oldCz: oldElement.cz,
      newCx: newElement.cx,
      newCy: newElement.cy,
      newCz: newElement.cz,
      oldParentId: oldElement.parentId,
      newParentId: newElement.parentId,
      oldRotation: [...oldElement.rotation],
      newRotation: [...newElement.rotation],
      undo() {
        setMove(
          undoableMove.movedElementId,
          [undoableMove.oldCx, undoableMove.oldCy, undoableMove.oldCz],
          undoableMove.oldParentId,
          undoableMove.oldRotation,
        );
      },
      redo() {
        setMove(
          undoableMove.movedElementId,
          [undoableMove.newCx, undoableMove.newCy, undoableMove.newCz],
          undoableMove.newParentId,
          undoableMove.newRotation,
        );
      },
    } as UndoableMove;

    useStore.getState().addUndoable(undoableMove);

    const setMove = (id: string, pos: number[], parentId?: string, rotation?: number[]) => {
      useStore.getState().set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el || el.type !== ObjectType.BatteryStorage) return;
        [el.cx, el.cy, el.cz] = [...pos];
        if (parentId) {
          el.parentId = parentId;
          el.foundationId = parentId;
        }
        if (rotation) {
          el.rotation = [...rotation];
        }
      });
    };
  }

  static addUndoableResize(oldElement: BatteryStorageModel, newElement: BatteryStorageModel) {
    const undoableResize = {
      name: 'Resize Battery Storage',
      timestamp: Date.now(),
      id: newElement.id,
      oldPos: [oldElement.cx, oldElement.cy, oldElement.cz],
      oldDms: [oldElement.lx, oldElement.ly, oldElement.lz],
      newPos: [newElement.cx, newElement.cy, newElement.cz],
      newDms: [newElement.lx, newElement.ly, newElement.lz],
      undo() {
        setResize(undoableResize.id, undoableResize.oldPos, undoableResize.oldDms);
      },
      redo() {
        setResize(undoableResize.id, undoableResize.newPos, undoableResize.newDms);
      },
    } as UndoableResizeBatteryStorage;
    useStore.getState().addUndoable(undoableResize);

    const setResize = (id: string, position: number[], dimension: number[]) => {
      useStore.getState().set((state) => {
        const e = state.elements.find((e) => e.id === id);
        if (e) {
          [e.cx, e.cy, e.cz] = [...position];
          [e.lx, e.ly, e.lz] = [...dimension];
        }
      });
    };
  }

  static addUndoableRotate(oldElement: BatteryStorageModel, newElement: BatteryStorageModel) {
    const undoableChange = {
      name: 'Rotate Battery Storage',
      timestamp: Date.now(),
      changedElementId: newElement.id,
      oldValue: oldElement.rotation[2],
      newValue: newElement.rotation[2],
      changedElementType: oldElement.type,
      undo: () => {
        setRotate(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        setRotate(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);

    const setRotate = (id: string, rot: number) => {
      useStore.getState().set((state) => {
        const e = state.elements.find((e) => e.id === id);
        if (!e) return;
        e.rotation[2] = rot;
      });
    };
  }
}
