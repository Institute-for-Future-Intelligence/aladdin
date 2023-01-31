/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../../../models/ElementModel';
import { useEffect, useState } from 'react';
import { UndoableChange } from '../../../undo/UndoableChange';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const useLabel = (element: ElementModel) => {
  const [labelText, setLabelText] = useState<string>(element?.label ?? '');
  useEffect(() => {
    if (element?.label) {
      setLabelText(element.label);
    }
  }, [element?.id]);
  return { labelText, setLabelText };
};

export const useLabelShow = (element: ElementModel) => {
  const addUndoable = useStore(Selector.addUndoable);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);

  return () => {
    if (element) {
      const undoableCheck = {
        name: 'Show Label for ' + element.type,
        timestamp: Date.now(),
        checked: !element.showLabel,
        selectedElementId: element.id,
        selectedElementType: element.type,
        undo: () => {
          updateElementShowLabelById(element.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(element.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(element.id, !element.showLabel);
    }
  };
};

export const useLabelText = (element: ElementModel, labelText: string) => {
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const addUndoable = useStore(Selector.addUndoable);

  return () => {
    if (element) {
      const oldLabel = element.label;
      const undoableChange = {
        name: 'Set Label for ' + element.type,
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: element.id,
        changedElementType: element.type,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(element.id, labelText);
    }
  };
};

export const useLabelSize = (element: ElementModel) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateLabelSize = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element.id) {
          e.labelSize = value;
          break;
        }
      }
    });
  };

  return (value: number) => {
    const oldSize = element.labelSize ?? 0.2;
    const newSize = value;
    const undoableChange = {
      name: 'Set Label Size for ' + element.type,
      timestamp: Date.now(),
      oldValue: oldSize,
      newValue: newSize,
      undo: () => {
        updateLabelSize(undoableChange.oldValue as number);
      },
      redo: () => {
        updateLabelSize(undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateLabelSize(newSize);
  };
};

export const useLabelHeight = (element: ElementModel) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateLabelHeight = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element.id) {
          e.labelHeight = value;
          break;
        }
      }
    });
  };

  return (value: number) => {
    const oldHeight = element.labelHeight ?? element.lz / 2 + 0.2;
    const newHeight = value;
    const undoableChange = {
      name: 'Set Label Height for ' + element.type,
      timestamp: Date.now(),
      oldValue: oldHeight,
      newValue: newHeight,
      undo: () => {
        updateLabelHeight(undoableChange.oldValue as number);
      },
      redo: () => {
        updateLabelHeight(undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateLabelHeight(newHeight);
  };
};
