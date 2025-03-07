/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Input, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { ElementModel } from '../models/ElementModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';

const LabelInput = ({ element }: { element: ElementModel }) => {
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  return (
    <Space>
      <span>{t('labelSubMenu.Label', lang)} : </span>
      <Input
        value={element.label}
        disabled={element.locked}
        onChange={(e) => {
          const oldLabel = element.label;
          const undoableChange = {
            name: 'Set Label for ' + element.type,
            timestamp: Date.now(),
            oldValue: oldLabel,
            newValue: e.target.value,
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
          updateElementLabelById(element.id, e.target.value);
        }}
      />
    </Space>
  );
};

export default LabelInput;
