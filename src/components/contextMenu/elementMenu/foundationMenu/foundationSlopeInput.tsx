/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../../models/FoundationModel';
import { Util } from '../../../../Util';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const FoundationSlopeInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  const [inputValue, setInputValue] = useState(foundation ? foundation.slope ?? 0.2 : 0.2);

  const lang = useLanguage();

  const needChange = (slope: number) => {
    if (!foundation) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (f.slope === undefined || Math.abs(f.slope - slope) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.slope === undefined || Math.abs(f.slope - slope) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        const f = foundation as FoundationModel;
        if (f.slope === undefined || Math.abs(f.slope - slope) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id) && e.type === ObjectType.Foundation) {
          if (value !== undefined) {
            (e as FoundationModel).slope = value;
          } else {
            const val = map.get(e.id) ?? 0;
            (e as FoundationModel).slope = val;
          }
        }

        if (map.has(e.parentId)) {
          const f = state.elements.find(
            (el) => el.id === e.parentId && el.type === ObjectType.Foundation,
          ) as FoundationModel;
          if (f && f.enableSlope) {
            switch (e.type) {
              case ObjectType.BatteryStorage:
              case ObjectType.SolarPanel: {
                if (value !== undefined) {
                  e.cz = f.lz / 2 + Util.getZOnSlope(f.lx, value, e.cx);
                } else {
                  const val = map.get(e.parentId) ?? 0;
                  e.cz = f.lz / 2 + Util.getZOnSlope(f.lx, val, e.cx);
                }
                break;
              }
            }
          }
        }
      }
    });
  };

  const updateSlope = (id: string, val: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Foundation) {
          (e as FoundationModel).slope = val;
        }
        if (e.parentId === id && foundation) {
          switch (e.type) {
            case ObjectType.BatteryStorage:
            case ObjectType.SolarPanel: {
              e.cz = foundation.lz / 2 + Util.getZOnSlope(foundation.lx, val, e.cx);
              break;
            }
          }
        }
      }
      state.actionState.foundationSlope = val;
    });
  };

  const update = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldVal = new Map<string, number>();
        for (const elem of elements) {
          if (
            elem.type === ObjectType.Foundation &&
            useStore.getState().selectedElementIdSet.has(elem.id) &&
            !elem.locked
          ) {
            oldVal.set(elem.id, (elem as FoundationModel).slope ?? 0);
          }
        }
        const undoableChange = {
          name: 'Set Slope for All Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldVal,
          newValue: value,
          undo: () => {
            updateInMap(undoableChange.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChange.oldValues as Map<string, number>, undoableChange.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChange);
        updateInMap(oldVal, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldVal = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation && !elem.locked) {
            oldVal.set(elem.id, (elem as FoundationModel).slope ?? 0);
          }
        }
        const undoableChange = {
          name: 'Set Slope for All Foundations',
          timestamp: Date.now(),
          oldValues: oldVal,
          newValue: value,
          undo: () => {
            updateInMap(undoableChange.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChange.oldValues as Map<string, number>, undoableChange.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChange);
        updateInMap(oldVal, value);
        setApplyCount(applyCount + 1);
        break;
      }
      default: {
        // foundation via selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id);
        const oldSlope = f ? (f as FoundationModel).slope : foundation.slope;
        const undoableChange = {
          name: 'Set Foundation Slope',
          timestamp: Date.now(),
          oldValue: oldSlope,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateSlope(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateSlope(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSlope(foundation.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    update(inputValue);
  };

  return (
    <Dialog width={500} title={i18n.t('foundationMenu.SlopeAngle', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={0}
            max={45}
            style={{ width: 120 }}
            step={1}
            precision={1}
            // make sure that we round up the number as toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(1))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', paddingRight: '6px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0°, 45°]
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group
            onChange={(e) => useStore.getState().setFoundationActionScope(e.target.value)}
            value={actionScope}
          >
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('foundationMenu.OnlyThisFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('foundationMenu.AllSelectedFoundations', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('foundationMenu.AllFoundations', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FoundationSlopeInput;
