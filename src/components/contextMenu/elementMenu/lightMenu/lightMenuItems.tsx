/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, InputNumber, Space } from 'antd';
import { MenuItem } from '../../menuItems';
import { LightModel } from 'src/models/LightModel';
import { useLanguage } from 'src/views/hooks';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ObjectType } from 'src/types';
import { UndoableChange } from 'src/undo/UndoableChange';
import { CompactPicker } from 'react-color';

interface LightMenutItemProps {
  light: LightModel;
  children?: React.ReactNode;
}

export const LightInsideCheckbox = ({ light }: LightMenutItemProps) => {
  const lang = useLanguage();
  const updateLightInsideById = useStore.getState().updateInsideLightById;

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Inside Light',
      timestamp: Date.now(),
      checked: checked,
      undo: () => {
        updateLightInsideById(light.id, !undoableCheck.checked);
      },
      redo: () => {
        updateLightInsideById(light.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateLightInsideById(light.id, checked);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!light.inside} onChange={handleChange}>
        {i18n.t('lightMenu.Inside', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const LightIntensityInput = ({ light }: LightMenutItemProps) => {
  const lang = useLanguage();

  const inputIntensity = light.intensity ?? 3;

  const updateLightIntensityById = (id: string, intensity: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Light && e.id === id) {
          (e as LightModel).intensity = intensity;
          break;
        }
      }
    });
  };

  const setIntensity = (value: number | null) => {
    if (value === null || value === inputIntensity) return;
    const undoableChange = {
      name: 'Set Light Intensity',
      timestamp: Date.now(),
      oldValue: inputIntensity,
      newValue: value,
      changedElementId: light.id,
      undo: () => {
        updateLightIntensityById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateLightIntensityById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateLightIntensityById(light.id, value);
    useStore.getState().set((state) => {
      state.actionState.lightIntensity = value;
    });
  };

  return (
    <MenuItem stayAfterClick>
      <Space style={{ width: '80px' }}>{i18n.t('lightMenu.Intensity', lang)}:</Space>
      <InputNumber min={0.1} max={10} step={0.1} precision={1} value={inputIntensity} onChange={setIntensity} />
    </MenuItem>
  );
};

export const LightDistanceInput = ({ light }: LightMenutItemProps) => {
  const lang = useLanguage();

  const inputDistance = light.distance ?? 5;

  const updateLightDistanceById = (id: string, distance: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Light && e.id === id) {
          (e as LightModel).distance = distance;
          break;
        }
      }
    });
  };

  const setDistance = (value: number | null) => {
    if (value === null || value === inputDistance) return;
    const undoableChange = {
      name: 'Set Light Distance',
      timestamp: Date.now(),
      oldValue: inputDistance,
      newValue: value,
      changedElementId: light.id,
      undo: () => {
        updateLightDistanceById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateLightDistanceById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateLightDistanceById(light.id, value);
    useStore.getState().set((state) => {
      state.actionState.lightDistance = value;
    });
  };

  return (
    <MenuItem stayAfterClick>
      <Space style={{ width: '80px' }}>{i18n.t('lightMenu.MaximumDistance', lang)}:</Space>
      <InputNumber min={1} max={10} step={1} precision={1} value={inputDistance} onChange={setDistance} />
    </MenuItem>
  );
};

export const LightColorPicker = ({ light }: LightMenutItemProps) => {
  const inputColor = light.color ?? '#ffff99';

  const updateLightColorById = (id: string, color: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Light && e.id === id) {
          (e as LightModel).color = color;
          break;
        }
      }
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <CompactPicker
        color={inputColor}
        onChangeComplete={(colorResult) => {
          const oldColor = light.color;
          const newColor = colorResult.hex;
          const undoableChange = {
            name: 'Set Light Color',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: newColor,
            undo: () => {
              updateLightColorById(light.id, undoableChange.oldValue as string);
            },
            redo: () => {
              updateLightColorById(light.id, undoableChange.newValue as string);
            },
          } as UndoableChange;
          useStore.getState().addUndoable(undoableChange);
          updateLightColorById(light.id, newColor);
          useStore.getState().set((state) => {
            state.actionState.lightColor = newColor;
          });
        }}
      />
    </MenuItem>
  );
};
