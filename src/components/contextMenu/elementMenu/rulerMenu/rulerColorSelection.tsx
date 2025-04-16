/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { CompactPicker } from 'react-color';
import { RulerModel } from 'src/models/RulerModel';

const RulerColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementColorForAll = useStore(Selector.updateElementColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const actionScope = useStore(Selector.rulerActionScope);
  const setActionScope = useStore(Selector.setRulerActionScope);

  const ruler = useSelectedElement(ObjectType.Ruler) as RulerModel | undefined;

  const [selectedColor, setSelectedColor] = useState(ruler?.color ?? '#D3D3D3');

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Ruler && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Ruler && !e.locked) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== ruler?.color) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value?: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Ruler && map.has(e.id)) {
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
    if (!ruler) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Ruler && useStore.getState().selectedElementIdSet.has(elem.id) && !elem.locked) {
            oldColorsSelected.set(elem.id, elem.color ?? '#D3D3D3');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Rulers',
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
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Ruler && !elem.locked) {
            oldColorsAll.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Rulers',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateElementColorForAll(ObjectType.Ruler, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementColorForAll(ObjectType.Ruler, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      default: {
        const f = getElementById(ruler.id);
        const oldColor = f ? f.color : ruler.color;
        const undoableChange = {
          name: 'Set Color of Selected Ruler',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: ruler.id,
          changedElementType: ruler.type,
          undo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementColorById(ruler.id, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
    }
    useStore.getState().set((state) => {
      state.actionState.rulerColor = value;
    });
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  const close = () => {
    setDialogVisible(false);
  };

  return (
    <Dialog width={680} title={i18n.t('word.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={10}>
          <CompactPicker
            color={selectedColor}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={14}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('rulerMenu.OnlyThisRuler', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('rulerMenu.AllSelectedRulers', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('rulerMenu.AllRulers', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RulerColorSelection;
