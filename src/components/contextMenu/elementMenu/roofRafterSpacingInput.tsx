/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Row, InputNumber, Radio, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const RoofRafterSpacingInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;
  const [input, setInput] = useState<number>(roof?.rafterSpacing ?? 1);

  const lang = useLanguage();

  const updateRoofRafterSpacingById = (id: string, length: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).rafterSpacing = length;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateRoofRafterSpacingById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateRoofRafterSpacingById(id, value);
    }
  };

  const needChange = (value: number) => {
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).rafterSpacing && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).rafterSpacing &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.rafterSpacing) {
          return true;
        }
        break;
    }
    return false;
  };

  const setRafterSpacing = (value: number) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldSpacingAll = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked) {
            oldSpacingAll.set(e.id, (e as RoofModel).rafterSpacing ?? 1);
            updateRoofRafterSpacingById(e.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Rafter Spacing for All Roofs',
          timestamp: Date.now(),
          oldValues: oldSpacingAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roof.foundationId) {
          const oldSpacingAboveFoundation = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Roof && e.foundationId === roof.foundationId && !e.locked) {
              oldSpacingAboveFoundation.set(e.id, (e as RoofModel).rafterSpacing ?? 1);
              updateRoofRafterSpacingById(e.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Rafter Spacing for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldSpacingAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldSpacing = updatedRoof.rafterSpacing ?? roof.rafterSpacing ?? 1;
          const undoableChange = {
            name: 'Set Roof Rafter Spacing',
            timestamp: Date.now(),
            oldValue: oldSpacing,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateRoofRafterSpacingById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateRoofRafterSpacingById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateRoofRafterSpacingById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setRafterSpacing(input);
  };

  return (
    <Dialog width={550} title={i18n.t('roofMenu.RafterSpacing', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.1}
            max={100}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={input}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => setInput(value)}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 100] {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('roofMenu.OnlyThisRoof', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('roofMenu.AllRoofs', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofRafterSpacingInput;
