/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { PermeableElement } from '../types';

const PermeabilityInput = ({ element }: { element: PermeableElement }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(element.airPermeability ?? 0);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(element.airPermeability ?? 0);
  }, [element.airPermeability]);

  const update = (permeability: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        (a as PermeableElement).airPermeability = permeability;
      }
    });
  };

  const confirm = () => {
    const oldValue = element.airPermeability ?? 0;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Air Permeability',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: element.id,
      changedElementType: element.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(a);
        update(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(a);
        update(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.AirPermeability', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(1))}
        precision={1}
        min={0}
        max={100}
        step={0.1}
        disabled={element.locked}
        onChange={(v) => {
          if (v !== null) setValue(v);
        }}
        onPressEnter={confirm}
        onBlur={confirm}
      />
      m³/(h·m²)
    </Space>
  );
};

export default PermeabilityInput;
