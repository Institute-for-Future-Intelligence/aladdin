/*
 * @Copyright 2024-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { CuboidModel } from '../../../../models/CuboidModel';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const CuboidTransparencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.cuboidActionScope);
  const setActionScope = useStore(Selector.setCuboidActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const cuboid = useSelectedElement(ObjectType.Cuboid) as CuboidModel | undefined;
  const [inputValue, setInputValue] = useState<number>(cuboid?.transparency ?? 0);

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
          (e as CuboidModel).transparency = value;
          break;
        }
      }
    });
  };

  const updateOnSurface = (value: number) => {
    for (const e of elements) {
      if (e.type === ObjectType.Cuboid && !e.locked && e.parentId === cuboid?.parentId) {
        updateById(e.id, value);
      }
    }
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && map.has(e.id)) {
          if (value !== undefined) {
            (e as CuboidModel).transparency = value;
          } else {
            const v = map.get(e.id);
            if (v !== undefined) {
              (e as CuboidModel).transparency = v;
            }
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (value: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const c = e as CuboidModel;
            if (Math.abs((c.transparency ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && e.parentId === cuboid?.parentId && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs((c.transparency ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs((c.transparency ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        // should list here, so it doesn't go to default, but ignore
        break;
      default:
        if (Math.abs((cuboid?.transparency ?? 0) - value) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setTransparency = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (
            elem.type === ObjectType.Cuboid &&
            !elem.locked &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            oldValuesSelected.set(elem.id, (elem as CuboidModel).transparency ?? 0);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Transparency for Selected Cuboids',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              -undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && elem.parentId === cuboid.parentId && !elem.locked) {
            oldValuesAll.set(elem.id, (elem as CuboidModel).transparency ?? 0);
          }
        }
        const undoableChangeAll = {
          name: 'Set Transparency for All Cuboids on Surface',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, tp] of undoableChangeAll.oldValues.entries()) {
              updateById(id, tp as number);
            }
          },
          redo: () => {
            updateOnSurface(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateOnSurface(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && !elem.locked) {
            oldValuesAll.set(elem.id, (elem as CuboidModel).transparency ?? 0);
          }
        }
        const undoableChangeAll = {
          name: 'Set Transparency for All Cuboids',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, -undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldValuesAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        // should list here, so it doesn't go to default, but ignore
        break;
      default: {
        // cuboid via selected element may be outdated, make sure that we get the latest
        const c = getElementById(cuboid.id) as CuboidModel;
        const oldValue = c ? c.transparency : cuboid.transparency;
        const undoableChange = {
          name: 'Set Cuboid Transparency',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(cuboid.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setTransparency(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Transparency', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={0}
            max={1}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', paddingRight: '6px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 1]
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('cuboidMenu.OnlyThisCuboid', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('cuboidMenu.AllCuboidsOnSameSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('cuboidMenu.AllSelectedCuboids', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('cuboidMenu.AllCuboids', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default CuboidTransparencyInput;
