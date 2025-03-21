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
import { PolygonModel } from '../models/PolygonModel';
import { CuboidModel } from '../models/CuboidModel';

const TransparencyInput = ({ cuboid }: { cuboid: CuboidModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(cuboid.transparency ?? 0);

  useEffect(() => {
    setValue(cuboid.transparency ?? 0);
  }, [cuboid.transparency]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === cuboid.id);
      if (a) {
        (a as CuboidModel).transparency = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = cuboid.transparency ?? 0;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Transparency for ' + cuboid.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: cuboid.id,
      changedElementType: cuboid.type,
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
      <span>{t('word.Transparency', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        min={0}
        max={1}
        step={0.01}
        disabled={cuboid.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default TransparencyInput;
