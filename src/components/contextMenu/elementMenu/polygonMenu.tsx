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
import { UndoableChange } from '../../../undo/UndoableChange';
import { PolygonModel } from '../../../models/PolygonModel';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CompactPicker } from 'react-color';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import { ObjectType } from '../../../types';

export const PolygonMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updatePolygonFilledById = useStore(Selector.updatePolygonFilledById);
  const updatePolygonFillColorById = useStore(Selector.updatePolygonFillColorById);
  const updatePolygonLineColorById = useStore(Selector.updatePolygonLineColorById);
  const addUndoable = useStore(Selector.addUndoable);
  const elementsToPaste = useStore(Selector.elementsToPaste);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
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
      {editable && (
        <Menu>
          <SubMenu
            key={'polygon-line-color'}
            title={i18n.t('polygonMenu.LineColor', { lng: language })}
            style={{ paddingLeft: '24px' }}
          >
            <CompactPicker
              key={'polygon-line-color-picker'}
              color={polygon?.lineColor}
              onChangeComplete={(colorResult) => {
                if (!polygon) return;
                const oldColor = polygon.lineColor;
                const newColor = colorResult.hex;
                const undoableChange = {
                  name: 'Set Polygon Line Color',
                  timestamp: Date.now(),
                  oldValue: oldColor,
                  newValue: newColor,
                  changedElementId: polygon.id,
                  undo: () => {
                    updatePolygonLineColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
                  },
                  redo: () => {
                    updatePolygonLineColorById(undoableChange.changedElementId, undoableChange.newValue as string);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                updatePolygonLineColorById(polygon.id, newColor);
                setUpdateFlag(!updateFlag);
              }}
            />
          </SubMenu>
          {polygon?.filled && (
            <SubMenu
              key={'polygon-fill-color'}
              title={i18n.t('polygonMenu.FillColor', { lng: language })}
              style={{ paddingLeft: '24px' }}
            >
              <CompactPicker
                key={'polygon-fill-color-picker'}
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
                    changedElementId: polygon.id,
                    undo: () => {
                      updatePolygonFillColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
                    },
                    redo: () => {
                      updatePolygonFillColorById(undoableChange.changedElementId, undoableChange.newValue as string);
                    },
                  } as UndoableChange;
                  addUndoable(undoableChange);
                  updatePolygonFillColorById(polygon.id, newColor);
                  setUpdateFlag(!updateFlag);
                }}
              />
            </SubMenu>
          )}
        </Menu>
      )}
    </>
  );
};
