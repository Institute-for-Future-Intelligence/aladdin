/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../../../models/ElementModel';
import { useEffect, useState } from 'react';
import { UndoableChange } from '../../../undo/UndoableChange';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from 'src/types';
import { ColorResult } from 'react-color';

export const useLabel = (element: ElementModel | undefined) => {
  const [labelText, setLabelText] = useState<string>(element?.label ?? '');
  useEffect(() => {
    if (element?.label) {
      setLabelText(element.label);
    } else {
      setLabelText('');
    }
  }, [element?.id]);
  return { labelText, setLabelText };
};

export const useLabelShow = (element: ElementModel | undefined) => {
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

export const useLabelText = (element: ElementModel | undefined, labelText: string) => {
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const addUndoable = useStore(Selector.addUndoable);

  return () => {
    if (element) {
      const oldLabel = element.label;
      if (oldLabel === labelText) return;
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

export const useLabelFontSize = (element: ElementModel | undefined) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateFontSize = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element?.id) {
          e.labelFontSize = value;
          break;
        }
      }
    });
  };

  return (value: number) => {
    if (element) {
      const oldSize = element.labelFontSize ?? 20;
      const newSize = value;
      const undoableChange = {
        name: 'Set Label Font Size for ' + element.type,
        timestamp: Date.now(),
        oldValue: oldSize,
        newValue: newSize,
        undo: () => {
          updateFontSize(undoableChange.oldValue as number);
        },
        redo: () => {
          updateFontSize(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateFontSize(newSize);
    }
  };
};

export const useLabelSize = (element: ElementModel | undefined) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateLabelSize = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element?.id) {
          e.labelSize = value;
          break;
        }
      }
    });
  };

  return (value: number) => {
    if (element) {
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
    }
  };
};

export const useLabelColor = (element: ElementModel | undefined) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateLabelColor = (value: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element?.id) {
          e.labelColor = value;
          break;
        }
      }
    });
  };

  return (value: string) => {
    if (element) {
      const oldColor = element.labelColor ?? 'white';
      const newColor = value;
      const undoableChange = {
        name: 'Set Label Color for ' + element.type,
        timestamp: Date.now(),
        oldValue: oldColor,
        newValue: newColor,
        undo: () => {
          updateLabelColor(undoableChange.oldValue as string);
        },
        redo: () => {
          updateLabelColor(undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateLabelColor(newColor as string);
    }
  };
};

export const useLabelHeight = (element: ElementModel | undefined) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const updateLabelHeight = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === element?.id) {
          e.labelHeight = value;
          break;
        }
      }
    });
  };

  return (value: number) => {
    if (element) {
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
    }
  };
};

export const useSelectedElement = (objectType?: ObjectType) => {
  return useStore((state) => {
    if (!state.selectedElement) return;
    const el = state.elements.find((e) => e.id === state.selectedElement?.id);
    if (!el || !objectType) return el;
    if (el.type === objectType) return el;
  });
};

export const useColorPicker = (color: string) => {
  const [selectedColor, setSelectedColor] = useState<string>(color);
  const onColorChange = (colorResult: ColorResult) => {
    setSelectedColor(colorResult.hex);
  };
  return [selectedColor, onColorChange] as [string, (colorResult: ColorResult) => void];
};
