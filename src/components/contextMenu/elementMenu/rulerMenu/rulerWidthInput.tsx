/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RulerModel } from 'src/models/RulerModel';
import { ZERO_TOLERANCE } from 'src/constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const RulerWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.rulerActionScope);
  const setActionScope = useStore(Selector.setRulerActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const ruler = useSelectedElement(ObjectType.Ruler) as RulerModel | undefined;

  const [inputValue, setInputValue] = useState<number>(ruler?.ly ?? 1);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (ly: number) => {
    if (!ruler) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Ruler && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (Math.abs(e.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.Ruler && !e.locked) {
            if (Math.abs(e.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(ruler?.ly - ly) > ZERO_TOLERANCE) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Ruler && map.has(e.id)) {
          if (value !== undefined) {
            e.ly = value;
          } else {
            const val = map.get(e.id);
            if (val !== undefined) {
              e.ly = val;
            }
          }
        }
      }
    });
  };

  const updateLzById = (id: string, val: number) => {
    useStore.getState().set((state) => {
      const bs = state.elements.find((e) => e.id === id);
      if (bs) {
        bs.ly = val;
      }
    });
  };

  const setLy = (value: number) => {
    if (!ruler) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldLzSelected = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Ruler && !elem.locked && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldLzSelected.set(elem.id, elem.ly);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Ly for Selected Rulers',
          timestamp: Date.now(),
          oldValues: oldLzSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldLzSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldLzAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Ruler && !elem.locked) {
            oldLzAll.set(elem.id, elem.ly);
          }
        }
        const undoableChangeAll = {
          name: 'Set Ly for All Rulers',
          timestamp: Date.now(),
          oldValues: oldLzAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldLzAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      default: {
        const undoableChange = {
          name: 'Set Ruler Ly',
          timestamp: Date.now(),
          oldValue: ruler.ly,
          newValue: value,
          changedElementId: ruler.id,
          changedElementType: ruler.type,
          undo: () => {
            updateLzById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateLzById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateLzById(ruler.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    useStore.getState().set((state) => {
      state.actionState.rulerHeight = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setLy(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Width', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={0.5}
            max={2}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 2] {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
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

export default RulerWidthInput;
