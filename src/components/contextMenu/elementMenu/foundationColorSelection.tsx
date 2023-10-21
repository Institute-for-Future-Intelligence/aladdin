/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';
import { CompactPicker } from 'react-color';

const FoundationColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementColorForAll = useStore(Selector.updateElementColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  const [selectedColor, setSelectedColor] = useState(foundation?.color ?? '#808080');

  const lang = useLanguage();

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (color !== f.color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (color !== f.color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== foundation?.color) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value?: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && map.has(e.id)) {
          if (value !== undefined) {
            e.color = value;
          } else {
            const color = map.get(e.id);
            if (color !== undefined) {
              e.color = color;
            }
          }
        }
      }
    });
  };

  const updateColor = (value: string) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldColorsSelected.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldColorsSelected, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Foundation) {
            oldColorsAll.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Foundations',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateElementColorById(id, color as string);
            }
          },
          redo: () => {
            updateElementColorForAll(ObjectType.Foundation, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementColorForAll(ObjectType.Foundation, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      default:
        // foundation via selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id);
        const oldColor = f ? f.color : foundation.color;
        const undoableChange = {
          name: 'Set Color of Selected Foundation',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementColorById(foundation.id, value);
        setApplyCount(useStore.getState().applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.foundationColor = value;
    });
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  const close = () => {
    setDialogVisible(false);
  };

  return (
    <Dialog width={600} title={i18n.t('word.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={12}>
          <CompactPicker
            color={selectedColor}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={12}
        >
          <Radio.Group
            onChange={(e) => useStore.getState().setFoundationActionScope(e.target.value)}
            value={actionScope}
          >
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('foundationMenu.AllSelectedFoundations', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FoundationColorSelection;
