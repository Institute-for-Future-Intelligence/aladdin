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
import { ProtractorModel } from 'src/models/ProtractorModel';
import { DEFAULT_PROTRACTOR_TICK_MARK_COLOR } from 'src/constants';

const ProtractorTickMarkColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const actionScope = useStore(Selector.protractorActionScope);
  const setActionScope = useStore(Selector.setProtractorActionScope);

  const protractor = useSelectedElement(ObjectType.Protractor) as ProtractorModel | undefined;

  const [selectedColor, setSelectedColor] = useState(protractor?.tickMarkColor ?? DEFAULT_PROTRACTOR_TICK_MARK_COLOR);

  const lang = useLanguage();

  const updateTickMarkColorById = (id: string, color: string) => {
    useStore.getState().set((state) => {
      const r = state.elements.find((e) => e.id === id && e.type === ObjectType.Protractor) as ProtractorModel;
      if (r) {
        r.tickMarkColor = color;
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Protractor && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (color !== (e as ProtractorModel).tickMarkColor) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Protractor && !e.locked) {
            if (color !== (e as ProtractorModel).tickMarkColor) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== protractor?.tickMarkColor) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value?: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Protractor && map.has(e.id)) {
          if (value !== undefined) {
            (e as ProtractorModel).tickMarkColor = value;
          } else {
            const color = map.get(e.id);
            if (color !== undefined) {
              (e as ProtractorModel).tickMarkColor = color;
            }
          }
        }
      }
    });
  };

  const updateColor = (value: string) => {
    if (!protractor) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (
            elem.type === ObjectType.Protractor &&
            useStore.getState().selectedElementIdSet.has(elem.id) &&
            !elem.locked
          ) {
            oldColorsSelected.set(elem.id, elem.color ?? DEFAULT_PROTRACTOR_TICK_MARK_COLOR);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Tick Mark Color for Selected Protractors',
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
          if (elem.type === ObjectType.Protractor && !elem.locked) {
            oldColorsAll.set(elem.id, (elem as ProtractorModel).tickMarkColor ?? DEFAULT_PROTRACTOR_TICK_MARK_COLOR);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tick Mark Color for All Protractors',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(undoableChangeAll.oldValues as Map<string, string>, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      default: {
        const f = getElementById(protractor.id);
        const oldColor = f ? (f as ProtractorModel).tickMarkColor : protractor.tickMarkColor;
        const undoableChange = {
          name: 'Set Tick Mark Color of Selected Protractors',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: protractor.id,
          changedElementType: protractor.type,
          undo: () => {
            updateTickMarkColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateTickMarkColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateTickMarkColorById(protractor.id, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
    }
    useStore.getState().set((state) => {
      state.actionState.protractorTickMarkColor = value;
    });
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  const close = () => {
    setDialogVisible(false);
  };

  return (
    <Dialog width={680} title={i18n.t('rulerMenu.TickMarkColor', lang)} onApply={apply} onClose={close}>
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
                {i18n.t('protractorMenu.OnlyThisProtractor', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('protractorMenu.AllSelectedProtractors', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('protractorMenu.AllProtractors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default ProtractorTickMarkColorSelection;
