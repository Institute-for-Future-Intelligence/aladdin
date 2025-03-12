/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { FoundationTexture } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import FoundationTextureSelect from '../components/contextMenu/elementMenu/foundationMenu/foundationTextureSelect';

const FoundationTextureInput = ({ foundation }: { foundation: FoundationModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (texture: FoundationTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === foundation.id) {
          (e as FoundationModel).textureType = texture;
          break;
        }
      }
    });
  };

  const setTexture = (texture: FoundationTexture) => {
    const oldValue = foundation.textureType;
    const newValue = texture;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Foundation Texture',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: foundation.id,
      changedElementType: foundation.type,
      undo: () => {
        update(undoableChange.oldValue as FoundationTexture);
      },
      redo: () => {
        update(undoableChange.newValue as FoundationTexture);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Texture', lang)} : </span>
      <FoundationTextureSelect
        texture={foundation.textureType ?? FoundationTexture.NoTexture}
        setTexture={setTexture}
        height={16}
      />
    </Space>
  );
};

export default FoundationTextureInput;
