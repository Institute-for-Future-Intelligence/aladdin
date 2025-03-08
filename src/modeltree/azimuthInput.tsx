/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import { ElementModel } from '../models/ElementModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { Util } from '../Util';
import { ZERO_TOLERANCE } from '../constants';

const AzimuthInput = ({ element, relative }: { element: ElementModel; relative?: boolean }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [degree, setDegree] = useState<number>(Util.toDegrees(element.rotation[2]));

  useEffect(() => {
    setDegree(Util.toDegrees(element.rotation[2]));
  }, [element.rotation[2]]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (radianValue: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        a.rotation[2] = radianValue;
      }
    });
  };

  const confirm = () => {
    const radianValue = Util.toRadians(degree);
    const oldValue = element.rotation[2];
    if (Math.abs(radianValue - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Azimuth for ' + element.type,
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: radianValue,
      changedElementId: element.id,
      changedElementType: element.type,
      undo: () => {
        const rad = undoableChange.oldValue as number;
        setDegree(Util.toDegrees(rad));
        update(rad);
      },
      redo: () => {
        const rad = undoableChange.newValue as number;
        setDegree(Util.toDegrees(rad));
        update(rad);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(radianValue);
  };

  return (
    <Space>
      <span>{t(relative ? 'solarCollectorMenu.RelativeAzimuth' : 'word.Azimuth', lang)} : </span>
      <InputNumber
        value={parseFloat(degree.toFixed(2))}
        precision={2}
        step={1}
        min={-180}
        max={180}
        formatter={(value) => `${value}°`}
        disabled={element.locked}
        onChange={(value) => {
          if (value !== null) setDegree(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default AzimuthInput;
