/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Menu } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { PolygonModel } from '../../../models/PolygonModel';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import { ObjectType } from '../../../types';
import PolygonLineColorSelection from './polygonLineColorSelection';
import PolygonFillColorSelection from './polygonFillColorSelection';
import PolygonTextureSelection from './polygonTextureSelection';

export const PolygonMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updatePolygonFilledById = useStore(Selector.updatePolygonFilledById);
  const addUndoable = useStore(Selector.addUndoable);
  const elementsToPaste = useStore(Selector.elementsToPaste);

  const [lineColorDialogVisible, setLineColorDialogVisible] = useState(false);
  const [fillColorDialogVisible, setFillColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const polygon = getSelectedElement() as PolygonModel;
  const lang = { lng: language };

  const togglePolygonFilled = (e: CheckboxChangeEvent) => {
    if (polygon) {
      const undoableCheck = {
        name: 'Fill Polygon',
        timestamp: Date.now(),
        checked: !polygon.filled,
        undo: () => {
          updatePolygonFilledById(polygon.id, !undoableCheck.checked);
        },
        redo: () => {
          updatePolygonFilledById(polygon.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updatePolygonFilledById(polygon.id, e.target.checked);
    }
  };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.SolarPanel
      ) {
        return true;
      }
    }
    return false;
  };

  const editable = !polygon?.locked;

  return (
    <>
      {legalToPaste() && <Paste keyName={'polygon-paste'} />}
      <Copy keyName={'polygon-copy'} />
      {editable && <Cut keyName={'polygon-cut'} />}
      <Lock keyName={'polygon-lock'} />
      {editable && (
        <Menu.Item key={'polygon-filled'}>
          <Checkbox checked={!!polygon?.filled} onChange={togglePolygonFilled}>
            {i18n.t('polygonMenu.Filled', lang)}
          </Checkbox>
        </Menu.Item>
      )}
      <PolygonLineColorSelection
        colorDialogVisible={lineColorDialogVisible}
        setColorDialogVisible={setLineColorDialogVisible}
      />
      {editable && (
        <Menu.Item
          key={'polygon-line-color'}
          style={{ paddingLeft: '36px' }}
          onClick={() => {
            setLineColorDialogVisible(true);
          }}
        >
          {i18n.t('polygonMenu.LineColor', lang)} ...
        </Menu.Item>
      )}
      <PolygonFillColorSelection
        colorDialogVisible={fillColorDialogVisible}
        setColorDialogVisible={setFillColorDialogVisible}
      />
      {editable && (
        <Menu.Item
          key={'polygon-fill-color'}
          style={{ paddingLeft: '36px' }}
          onClick={() => {
            setFillColorDialogVisible(true);
          }}
        >
          {i18n.t('polygonMenu.FillColor', lang)} ...
        </Menu.Item>
      )}
      <PolygonTextureSelection
        textureDialogVisible={textureDialogVisible}
        setTextureDialogVisible={setTextureDialogVisible}
      />
      {editable && (
        <Menu.Item
          key={'polygon-texture'}
          style={{ paddingLeft: '36px' }}
          onClick={() => {
            setTextureDialogVisible(true);
          }}
        >
          {i18n.t('word.Texture', lang)} ...
        </Menu.Item>
      )}
    </>
  );
};
