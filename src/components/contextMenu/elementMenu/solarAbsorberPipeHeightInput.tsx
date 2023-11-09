/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, SolarStructure } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { ZERO_TOLERANCE } from 'src/constants';
import { SolarAbsorberPipeModel } from '../../../models/SolarAbsorberPipeModel';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const SolarAbsorberPipeHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;
  const absorberPipe = foundation?.solarAbsorberPipe;

  const [inputValue, setInputValue] = useState(absorberPipe?.absorberHeight ?? 10);

  const lang = useLanguage();

  const updateById = (id: string, height: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusPipe) {
            if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
            f.solarAbsorberPipe.absorberHeight = height;
          }
          break;
        }
      }
    });
  };

  const updateForAll = (height: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusPipe) {
            if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
            f.solarAbsorberPipe.absorberHeight = height;
          }
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked && map.has(e.id)) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusPipe) {
            if (!f.solarAbsorberPipe) f.solarAbsorberPipe = {} as SolarAbsorberPipeModel;
            f.solarAbsorberPipe.absorberHeight = value;
          }
        }
      }
    });
  };

  const needChange = (absorberHeight: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.FocusPipe && f.solarAbsorberPipe) {
              if (
                f.solarAbsorberPipe.absorberHeight === undefined ||
                Math.abs(f.solarAbsorberPipe.absorberHeight - absorberHeight) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.FocusPipe && f.solarAbsorberPipe) {
              if (
                f.solarAbsorberPipe.absorberHeight === undefined ||
                Math.abs(f.solarAbsorberPipe.absorberHeight - absorberHeight) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (
          absorberPipe?.absorberHeight === undefined ||
          Math.abs(absorberPipe?.absorberHeight - absorberHeight) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const setAbsorberHeight = (value: number) => {
    if (!foundation || !absorberPipe) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const f = elem as FoundationModel;
            if (f.solarAbsorberPipe) {
              oldValuesSelected.set(elem.id, f.solarAbsorberPipe.absorberHeight ?? 10);
            }
          }
        }
        const undoableChangeSelected = {
          name: 'Set Absorber Height for Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ah] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, ah as number);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            const f = elem as FoundationModel;
            if (f.solarAbsorberPipe) {
              oldValuesAll.set(elem.id, f.solarAbsorberPipe.absorberHeight ?? 10);
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Absorber Height for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ah] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ah as number);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      default:
        // foundation selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id) as FoundationModel;
        const oldValue =
          f && f.solarAbsorberPipe ? f.solarAbsorberPipe.absorberHeight ?? 10 : absorberPipe.absorberHeight ?? 10;
        updateById(foundation.id, value);
        const undoableChange = {
          name: 'Set Absorber Height on Foundation',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setApplyCount(applyCount + 1);
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setAbsorberHeight(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('solarAbsorberPipeMenu.AbsorberHeight', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={50}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 50] {i18n.t('word.MeterAbbreviation', lang)}
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

export default SolarAbsorberPipeHeightInput;
