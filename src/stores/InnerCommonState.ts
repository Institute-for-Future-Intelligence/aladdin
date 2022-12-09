import { CommonStoreState } from './common';
import { ThreeEvent } from '@react-three/fiber';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from 'src/types';

export class InnerCommonState {
  static selectMe(state: CommonStoreState, id: string, e: ThreeEvent<MouseEvent>, action?: ActionType) {
    if (e.intersections.length > 0) {
      const intersectableObjects = e.intersections.filter(
        (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
      );
      if (intersectableObjects[0].object === e.eventObject) {
        for (const elem of state.elements) {
          if (elem.id === id) {
            elem.selected = true;
            state.selectedElement = elem;
            // TODO: lz is now zero for roof. So this may need to be set from elsewhere for roofs.
            state.selectedElementHeight = elem.lz;
          } else {
            elem.selected = false;
          }
        }
        state.moveHandleType = null;
        state.resizeHandleType = null;
        state.rotateHandleType = null;
        if (action) {
          switch (action) {
            case ActionType.Move:
              if (state.selectedElement?.type === ObjectType.Tree || state.selectedElement?.type === ObjectType.Human) {
                // selecting the above two types of object automatically sets them to the moving state
                state.moveHandleType = MoveHandleType.Default;
              } else {
                state.moveHandleType = e.eventObject.name as MoveHandleType;
              }
              break;
            case ActionType.Resize:
              state.resizeHandleType = e.eventObject.name as ResizeHandleType;
              break;
            case ActionType.Rotate:
              state.rotateHandleType = e.eventObject.name as RotateHandleType;
              break;
            case ActionType.Select:
              state.selectedElementAngle = e.object.parent?.rotation.z ?? 0;
              break;
          }
        }
      }
    }
  }

  static selectNone(state: CommonStoreState) {
    for (const e of state.elements) {
      e.selected = false;
    }
    state.selectedElement = null;
  }
}
