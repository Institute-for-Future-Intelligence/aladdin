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
import { RoofTexture } from '../types';
import { RoofModel } from '../models/RoofModel';
import RoofTextureSelect from '../components/contextMenu/elementMenu/roofMenu/roofTextureSelect';

const RoofTextureInput = ({ roof }: { roof: RoofModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (texture: RoofTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === roof.id) {
          (e as RoofModel).textureType = texture;
          break;
        }
      }
    });
  };

  const setTexture = (texture: RoofTexture) => {
    const oldValue = roof.textureType;
    const newValue = texture;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Roof Texture',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: roof.id,
      changedElementType: roof.type,
      undo: () => {
        update(undoableChange.oldValue as RoofTexture);
      },
      redo: () => {
        update(undoableChange.newValue as RoofTexture);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Texture', lang)} : </span>
      <RoofTextureSelect texture={roof.textureType} setTexture={setTexture} height={16} />
    </Space>
  );
};

export default RoofTextureInput;
