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
import { WallTexture } from '../types';
import { WallModel } from '../models/WallModel';
import WallTextureSelect from '../components/contextMenu/elementMenu/wallMenu/wallTextureSelect';

const WallTextureInput = ({ wall }: { wall: WallModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (texture: WallTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === wall.id) {
          (e as WallModel).textureType = texture;
          break;
        }
      }
    });
  };

  const setTexture = (texture: WallTexture) => {
    const oldValue = wall.textureType;
    const newValue = texture;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Wall Texture',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: wall.id,
      changedElementType: wall.type,
      undo: () => {
        update(undoableChange.oldValue as WallTexture);
      },
      redo: () => {
        update(undoableChange.newValue as WallTexture);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Texture', lang)} : </span>
      <WallTextureSelect texture={wall.textureType} setTexture={setTexture} height={16} />
    </Space>
  );
};

export default WallTextureInput;
