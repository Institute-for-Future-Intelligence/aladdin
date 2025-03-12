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
import { DoorTexture } from '../types';
import { DoorModel } from '../models/DoorModel';
import DoorTextureSelect from '../components/contextMenu/elementMenu/doorMenu/doorTextureSelect';

const DoorTextureInput = ({ door }: { door: DoorModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (texture: DoorTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === door.id) {
          (e as DoorModel).textureType = texture;
          break;
        }
      }
    });
  };

  const setTexture = (texture: DoorTexture) => {
    const oldValue = door.textureType;
    const newValue = texture;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Door Texture',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: door.id,
      changedElementType: door.type,
      undo: () => {
        update(undoableChange.oldValue as DoorTexture);
      },
      redo: () => {
        update(undoableChange.newValue as DoorTexture);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Texture', lang)} : </span>
      <DoorTextureSelect texture={door.textureType} setTexture={setTexture} height={16} />
    </Space>
  );
};

export default DoorTextureInput;
