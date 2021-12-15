/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { PolygonModel } from '../../../models/PolygonModel';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CompactPicker } from 'react-color';
import { Copy, Cut } from '../menuItems';

export const PolygonMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updatePolygonFilledById = useStore(Selector.updatePolygonFilledById);
  const updatePolygonFillColorById = useStore(Selector.updatePolygonFillColorById);
  const addUndoable = useStore(Selector.addUndoable);

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

  return (
    <>
      <Copy keyName={'polygon-copy'} />
      <Cut keyName={'polygon-cut'} />
      <Menu.Item key={'polygon-filled'}>
        <Checkbox checked={!!polygon?.filled} onChange={togglePolygonFilled}>
          {i18n.t('polygonMenu.Filled', lang)}
        </Checkbox>
      </Menu.Item>
      <SubMenu key={'polygon-color'} title={i18n.t('word.Color', { lng: language })} style={{ paddingLeft: '24px' }}>
        <CompactPicker
          color={polygon?.color}
          onChangeComplete={(colorResult) => {
            if (!polygon) return;
            const oldColor = polygon.color;
            const newColor = colorResult.hex;
            const undoableChange = {
              name: 'Set Polygon Fill Color',
              timestamp: Date.now(),
              oldValue: oldColor,
              newValue: newColor,
              undo: () => {
                updatePolygonFillColorById(polygon.id, undoableChange.oldValue as string);
              },
              redo: () => {
                updatePolygonFillColorById(polygon.id, undoableChange.newValue as string);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updatePolygonFillColorById(polygon.id, newColor);
          }}
        />
      </SubMenu>
    </>
  );
};
