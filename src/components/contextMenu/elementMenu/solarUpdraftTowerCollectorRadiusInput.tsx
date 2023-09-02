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
import { SolarUpdraftTowerModel } from '../../../models/SolarUpdraftTowerModel';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const SolarUpdraftTowerCollectorRadiusInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  const [inputValue, setInputValue] = useState<number>(
    foundation?.solarUpdraftTower?.collectorRadius ??
      Math.max(10, 0.5 * Math.min(foundation?.lx ?? 0, foundation?.ly ?? 0)),
  );

  const lang = useLanguage();

  const updateCollectorRadiusById = (id: string, radius: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
            f.solarUpdraftTower.collectorRadius = radius;
          }
          break;
        }
      }
    });
  };

  const updateCollectorRadiusForAll = (radius: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
            f.solarUpdraftTower.collectorRadius = radius;
          }
        }
      }
    });
  };

  const needChange = (collectorRadius: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
              if (
                f.solarUpdraftTower.collectorRadius === undefined ||
                Math.abs(f.solarUpdraftTower.collectorRadius - collectorRadius) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (foundation && foundation.solarStructure === SolarStructure.UpdraftTower && foundation.solarUpdraftTower) {
          if (
            foundation.solarUpdraftTower.collectorRadius === undefined ||
            Math.abs(foundation.solarUpdraftTower.collectorRadius - collectorRadius) > ZERO_TOLERANCE
          ) {
            return true;
          }
        }
    }
    return false;
  };

  const setCollectorRadius = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            const f = elem as FoundationModel;
            if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
              oldValuesAll.set(
                elem.id,
                f.solarUpdraftTower.collectorRadius ?? Math.max(10, 0.5 * Math.min(f.lx, f.ly)),
              );
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Solar Collector Radius for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, cr] of undoableChangeAll.oldValues.entries()) {
              updateCollectorRadiusById(id, cr as number);
            }
          },
          redo: () => {
            updateCollectorRadiusForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateCollectorRadiusForAll(value);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation.solarStructure === SolarStructure.UpdraftTower && foundation.solarUpdraftTower) {
          // foundation selected element may be outdated, make sure that we get the latest
          const f = getElementById(foundation.id) as FoundationModel;
          const oldValue =
            f && f.solarUpdraftTower
              ? f.solarUpdraftTower.collectorRadius ?? Math.max(10, 0.5 * Math.min(f.lx, f.ly))
              : foundation.solarUpdraftTower.collectorRadius ??
                Math.max(10, 0.5 * Math.min(foundation.lx, foundation.ly));
          updateCollectorRadiusById(foundation.id, value);
          const undoableChange = {
            name: 'Set Solar Collector Radius on Foundation',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: foundation.id,
            changedElementType: foundation.type,
            undo: () => {
              updateCollectorRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateCollectorRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setCollectorRadius(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorRadius', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={1000}
            style={{ width: 120 }}
            step={1}
            precision={1}
            value={inputValue}
            onChange={setInputValue}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 1000] {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
        >
          <Radio.Group
            onChange={(e) => useStore.getState().setFoundationActionScope(e.target.value)}
            value={actionScope}
          >
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarUpdraftTowerCollectorRadiusInput;
