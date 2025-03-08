/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Input, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import { ElementModel } from '../models/ElementModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';

const LabelInput = ({ element }: { element: ElementModel }) => {
  const [text, setText] = useState<string>(element.label ?? '');
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const addUndoable = useStore(Selector.addUndoable);

  useEffect(() => {
    setText(element.label ?? '');
  }, [element.label]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const confirm = () => {
    const oldLabel = element.label;
    if (text === oldLabel) return;
    const undoableChange = {
      name: 'Set Label for ' + element.type,
      timestamp: Date.now(),
      oldValue: oldLabel,
      newValue: text,
      changedElementId: element.id,
      changedElementType: element.type,
      undo: () => {
        setText(undoableChange.oldValue as string);
        updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
      },
      redo: () => {
        setText(undoableChange.newValue as string);
        updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateElementLabelById(element.id, text);
  };

  return (
    <Space>
      <span>{t('labelSubMenu.Label', lang)} : </span>
      <Input
        value={text}
        disabled={element.locked}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onPressEnter={confirm}
        onBlur={confirm}
      />
    </Space>
  );
};

export default LabelInput;
