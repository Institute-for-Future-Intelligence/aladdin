/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';
import { Util } from '../../../Util';
import { ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const FoundationAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateElementRotationById = useStore(Selector.updateElementRotationById);
  const updateElementRotationForAll = useStore(Selector.updateElementRotationForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  const [inputValue, setInputValue] = useState(foundation ? -foundation?.rotation[2] ?? 0 : 0);

  const lang = useLanguage();

  const needChange = (azimuth: number) => {
    if (!foundation) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (Math.abs(-f.rotation[2] - azimuth) > ZERO_TOLERANCE) {
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
            if (Math.abs(-f.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(-foundation?.rotation[2] - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id)) {
          if (value !== undefined) {
            e.rotation[2] = value;
          } else {
            const rot = map.get(e.id);
            if (rot !== undefined) {
              e.rotation[2] = -rot;
            }
          }
        }
      }
    });
  };

  const updateAzimuth = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldAzimuthsSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldAzimuthsSelected.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldAzimuthsSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, -undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldAzimuthsSelected, -value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType:
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldAzimuthsAll.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Foundations',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          undo: () => {
            for (const [id, az] of undoableChangeAll.oldValues.entries()) {
              updateElementRotationById(id, 0, 0, -(az as number));
            }
          },
          redo: () => {
            updateElementRotationForAll(ObjectType.Foundation, 0, 0, -(undoableChangeAll.newValue as number));
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementRotationForAll(ObjectType.Foundation, 0, 0, -value);
        setApplyCount(applyCount + 1);
        break;
      default:
        // foundation via selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id);
        const oldAzimuth = f ? -f.rotation[2] : -foundation.rotation[2];
        const undoableChange = {
          name: 'Set Foundation Azimuth',
          timestamp: Date.now(),
          oldValue: oldAzimuth,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.oldValue as number));
          },
          redo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.newValue as number));
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementRotationById(foundation.id, 0, 0, -value);
        setApplyCount(applyCount + 1);
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateAzimuth(inputValue);
  };

  return (
    <Dialog width={500} title={i18n.t('word.Azimuth', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            // make sure that we round up the number as toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', paddingRight: '6px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-180°, 180°]
            <br />
            {i18n.t('message.AzimuthOfNorthIsZero', lang)}
            <br />
            {i18n.t('message.CounterclockwiseAzimuthIsPositive', lang)}
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
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

export default FoundationAzimuthInput;
