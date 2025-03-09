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
import { PolygonTexture } from '../types';
import { PolygonModel } from '../models/PolygonModel';
import PolygonTextureSelect from '../components/contextMenu/elementMenu/polygonMenu/polygonTextureSelect';

const PolygonTextureInput = ({ polygon }: { polygon: PolygonModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (texture: PolygonTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === polygon.id) {
          (e as PolygonModel).textureType = texture;
          break;
        }
      }
    });
  };

  const setTexture = (texture: PolygonTexture) => {
    const oldValue = polygon.textureType;
    const newValue = texture;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Polygon Texture',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: polygon.id,
      changedElementType: polygon.type,
      undo: () => {
        update(undoableChange.oldValue as PolygonTexture);
      },
      redo: () => {
        update(undoableChange.newValue as PolygonTexture);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Texture', lang)} : </span>
      <PolygonTextureSelect texture={polygon.textureType} setTexture={setTexture} height={16} />
    </Space>
  );
};

export default PolygonTextureInput;
