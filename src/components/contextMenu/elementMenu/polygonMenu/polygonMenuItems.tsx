/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { PolygonModel } from 'src/models/PolygonModel';
import { MenuItem } from '../../menuItems';
import { Checkbox, Input, InputNumber, Space } from 'antd';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ObjectType } from 'src/types';
import { useStore } from 'src/stores/common';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import React, { useState } from 'react';
import { UndoableChange } from 'src/undo/UndoableChange';
import { LabelAddonBefore } from '../../labelSubmenuItems';

interface PolygonMenuItemProps {
  polygon: PolygonModel;
  forModelTree?: boolean;
}

export const PolygonFillCheckbox = ({ polygon, forModelTree }: PolygonMenuItemProps) => {
  const lang = useLanguage();

  const updateFilledById = (id: string, filled: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).filled = filled;
          break;
        }
      }
    });
  };

  const toggleFilled = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Fill Polygon',
      timestamp: Date.now(),
      checked: !polygon.filled,
      selectedElementId: polygon.id,
      selectedElementType: ObjectType.Polygon,
      undo: () => {
        updateFilledById(polygon.id, !undoableCheck.checked);
      },
      redo: () => {
        updateFilledById(polygon.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateFilledById(polygon.id, e.target.checked);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('polygonMenu.Filled', lang)}</span>:
      <Checkbox style={{ width: '100%' }} checked={polygon.filled} onChange={toggleFilled} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={polygon.filled} onChange={toggleFilled}>
        {i18n.t('polygonMenu.Filled', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const PolygonShinyCheckbox = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();

  const updateShininessById = (id: string, shininess: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).shininess = shininess;
          break;
        }
      }
    });
  };

  const toggleShiny = (e: CheckboxChangeEvent) => {
    const shininess = 100;
    const undoableCheck = {
      name: 'Shiny Polygon',
      timestamp: Date.now(),
      checked: (polygon?.shininess ?? 0) > 0,
      selectedElementId: polygon.id,
      selectedElementType: ObjectType.Polygon,
      undo: () => {
        updateShininessById(polygon.id, undoableCheck.checked ? 0 : shininess);
      },
      redo: () => {
        updateShininessById(polygon.id, undoableCheck.checked ? shininess : 0);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateShininessById(polygon.id, e.target.checked ? shininess : 0);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!polygon.shininess} onChange={toggleShiny}>
        {i18n.t('polygonMenu.Shiny', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const PolygonOutlineCheckbox = ({ polygon, forModelTree }: PolygonMenuItemProps) => {
  const lang = useLanguage();

  const updateOutlineById = (id: string, outline: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).noOutline = !outline;
          break;
        }
      }
    });
  };

  const toggleOutline = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Toggle Outline for Polygon',
      timestamp: Date.now(),
      checked: polygon.noOutline,
      selectedElementId: polygon.id,
      selectedElementType: ObjectType.Polygon,
      undo: () => {
        updateOutlineById(polygon.id, !undoableCheck.checked);
      },
      redo: () => {
        updateOutlineById(polygon.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateOutlineById(polygon.id, e.target.checked);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('polygonMenu.Outline', lang)}</span>:
      <Checkbox style={{ width: '100%' }} checked={!polygon.noOutline} onChange={toggleOutline} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!polygon.noOutline} onChange={toggleOutline}>
        {i18n.t('polygonMenu.Outline', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const PolygonText = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textContent, setTextContent] = useState<string>(polygon?.text ?? '');

  const updateTextById = (id: string, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).text = value;
          }
          break;
        }
      }
    });
  };

  const changeText = () => {
    const undoableChange = {
      name: 'Set Text for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.text ?? '',
      newValue: textContent,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateTextById(polygon.id, undoableChange.oldValue as string);
      },
      redo: () => {
        updateTextById(polygon.id, undoableChange.newValue as string);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateTextById(polygon.id, textContent);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={<LabelAddonBefore width={'120px'}>{i18n.t('word.Text', lang)}:</LabelAddonBefore>}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        onPressEnter={changeText}
        onBlur={changeText}
      />
    </MenuItem>
  );
};

export const PolygonFontSize = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textSize, setTextSize] = useState<number>(polygon?.fontSize ?? 1);

  const updateFontSizeById = (id: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontSize = value;
          }
          break;
        }
      }
    });
  };

  const changeFontSize = () => {
    const undoableChange = {
      name: 'Set Font Size for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontSize ?? 1,
      newValue: textSize,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontSizeById(polygon.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateFontSizeById(polygon.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontSizeById(polygon.id, textSize);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<LabelAddonBefore width={'120px'}>{i18n.t('word.FontSize', lang)}:</LabelAddonBefore>}
        min={0.1}
        max={5}
        step={0.01}
        precision={2}
        value={textSize}
        onChange={(value) => setTextSize(value!)}
        onPressEnter={changeFontSize}
        onBlur={changeFontSize}
      />
    </MenuItem>
  );
};

export const PolygonFontColor = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textColor, setTextColor] = useState<string>(polygon?.fontColor ?? 'black');

  const updateFontColorById = (id: string, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontColor = value;
          }
          break;
        }
      }
    });
  };

  const changeFontColor = () => {
    const undoableChange = {
      name: 'Set Font Color for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontColor ?? 'black',
      newValue: textColor,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontColorById(polygon.id, undoableChange.oldValue as string);
      },
      redo: () => {
        updateFontColorById(polygon.id, undoableChange.newValue as string);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontColorById(polygon.id, textColor);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={<LabelAddonBefore width={'120px'}>{i18n.t('word.FontColor', lang)}:</LabelAddonBefore>}
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
        onPressEnter={changeFontColor}
        onBlur={changeFontColor}
      />
    </MenuItem>
  );
};

export const PolygonFontOutlineColor = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textOutlineColor, setTextOutlineColor] = useState<string>(polygon?.fontOutlineColor ?? 'white');

  const updateFontOutlineColorById = (id: string, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontOutlineColor = value;
          }
          break;
        }
      }
    });
  };

  const changeFontOutlineColor = () => {
    const undoableChange = {
      name: 'Set Font Outline Color for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontOutlineColor ?? 'white',
      newValue: textOutlineColor,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontOutlineColorById(polygon.id, undoableChange.oldValue as string);
      },
      redo: () => {
        updateFontOutlineColorById(polygon.id, undoableChange.newValue as string);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontOutlineColorById(polygon.id, textOutlineColor);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={
          <LabelAddonBefore width={'120px'}>{i18n.t('polygonMenu.FontOutlineColor', lang)}:</LabelAddonBefore>
        }
        value={textOutlineColor}
        onChange={(e) => setTextOutlineColor(e.target.value)}
        onPressEnter={changeFontOutlineColor}
        onBlur={changeFontOutlineColor}
      />
    </MenuItem>
  );
};

export const PolygonFontOutlineWidth = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textOutlineWidth, setTextOutlineWidth] = useState<number>(polygon?.fontOutlineWidth ?? 0);

  const updateFontOutlineWidthById = (id: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontOutlineWidth = value;
          }
          break;
        }
      }
    });
  };

  const changeFontOutlineWidth = () => {
    const undoableChange = {
      name: 'Set Font Outline Width for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontOutlineWidth ?? 0,
      newValue: textOutlineWidth,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontOutlineWidthById(polygon.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateFontOutlineWidthById(polygon.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontOutlineWidthById(polygon.id, textOutlineWidth);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={
          <LabelAddonBefore width={'120px'}>{i18n.t('polygonMenu.FontOutlineWidth', lang)}:</LabelAddonBefore>
        }
        min={0}
        max={1}
        step={0.01}
        precision={2}
        value={textOutlineWidth}
        onChange={(value) => setTextOutlineWidth(value!)}
        onPressEnter={changeFontOutlineWidth}
        onBlur={changeFontOutlineWidth}
      />
    </MenuItem>
  );
};

export const PolygonFontStrokeColor = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textStrokeColor, setTextStrokeColor] = useState<string>(polygon?.fontStrokeColor ?? 'black');

  const updateFontStrokeColorById = (id: string, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontStrokeColor = value;
          }
          break;
        }
      }
    });
  };

  const changeFontStrokeColor = () => {
    const undoableChange = {
      name: 'Set Font Stroke Color for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontStrokeColor ?? 'black',
      newValue: textStrokeColor,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontStrokeColorById(polygon.id, undoableChange.oldValue as string);
      },
      redo: () => {
        updateFontStrokeColorById(polygon.id, undoableChange.newValue as string);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontStrokeColorById(polygon.id, textStrokeColor);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Input
        addonBefore={
          <LabelAddonBefore width={'120px'}>{i18n.t('polygonMenu.FontStrokeColor', lang)}:</LabelAddonBefore>
        }
        value={textStrokeColor}
        onChange={(e) => setTextStrokeColor(e.target.value)}
        onPressEnter={changeFontStrokeColor}
        onBlur={changeFontStrokeColor}
      />
    </MenuItem>
  );
};

export const PolygonFontStrokeWidth = ({ polygon }: PolygonMenuItemProps) => {
  const lang = useLanguage();
  const [textStrokeWidth, setTextStrokeWidth] = useState<number>(polygon?.fontStrokeWidth ?? 0);

  const updateFontStrokeWidthById = (id: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Polygon) {
            (e as PolygonModel).fontStrokeWidth = value;
          }
          break;
        }
      }
    });
  };

  const changeFontStrokeWidth = () => {
    const undoableChange = {
      name: 'Set Font Stroke Width for Polygon',
      timestamp: Date.now(),
      oldValue: polygon.fontStrokeWidth ?? 0,
      newValue: textStrokeWidth,
      changedElementId: polygon.id,
      changedElementType: ObjectType.Polygon,
      undo: () => {
        updateFontStrokeWidthById(polygon.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateFontStrokeWidthById(polygon.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFontStrokeWidthById(polygon.id, textStrokeWidth);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={
          <LabelAddonBefore width={'120px'}>{i18n.t('polygonMenu.FontStrokeWidth', lang)}:</LabelAddonBefore>
        }
        min={0}
        max={1}
        step={0.01}
        precision={2}
        value={textStrokeWidth}
        onChange={(value) => setTextStrokeWidth(value!)}
        onPressEnter={changeFontStrokeWidth}
        onBlur={changeFontStrokeWidth}
      />
    </MenuItem>
  );
};
