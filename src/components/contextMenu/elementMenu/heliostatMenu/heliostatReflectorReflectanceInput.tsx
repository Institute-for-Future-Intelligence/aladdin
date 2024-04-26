/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { HeliostatModel } from '../../../../models/HeliostatModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../../dialog';

const HeliostatReflectanceInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateCspReflectanceById);
  const updateAboveFoundation = useStore(Selector.updateCspReflectanceAboveFoundation);
  const updateForAll = useStore(Selector.updateCspReflectanceForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.heliostatActionScope);
  const setActionScope = useStore(Selector.setHeliostatActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const heliostat = useSelectedElement(ObjectType.Heliostat) as HeliostatModel | undefined;

  const [inputValue, setInputValue] = useState(heliostat?.reflectance ?? 0.9);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (reflectance: number) => {
    if (!heliostat) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const hs = e as HeliostatModel;
            if (Math.abs(hs.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked) {
            const hs = e as HeliostatModel;
            if (Math.abs(hs.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && e.foundationId === heliostat?.foundationId && !e.locked) {
            const hs = e as HeliostatModel;
            if (Math.abs(hs.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(heliostat?.reflectance - reflectance) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Heliostat && !e.locked && map.has(e.id)) {
          (e as HeliostatModel).reflectance = value;
        }
      }
    });
  };

  const setReflectance = (value: number) => {
    if (!heliostat) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldReflectancesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldReflectancesAll.set(elem.id, (elem as HeliostatModel).reflectance);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Reflectance for Selected Heliostats',
          timestamp: Date.now(),
          oldValues: oldReflectancesAll,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, rf as number);
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
        updateInMap(oldReflectancesAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldReflectancesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat) {
            oldReflectancesAll.set(elem.id, (elem as HeliostatModel).reflectance);
          }
        }
        const undoableChangeAll = {
          name: 'Set Reflectance for All Heliostats',
          timestamp: Date.now(),
          oldValues: oldReflectancesAll,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeAll.oldValues.entries()) {
              updateById(id, rf as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.Heliostat, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.Heliostat, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (heliostat.foundationId) {
          const oldReflectancesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Heliostat && elem.foundationId === heliostat.foundationId) {
              oldReflectancesAboveFoundation.set(elem.id, (elem as HeliostatModel).reflectance);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Reflectance for All Heliostats Above Foundation',
            timestamp: Date.now(),
            oldValues: oldReflectancesAboveFoundation,
            newValue: value,
            groupId: heliostat.foundationId,
            undo: () => {
              for (const [id, rf] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, rf as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.Heliostat,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.Heliostat, heliostat.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const h = getElementById(heliostat.id) as HeliostatModel;
        const oldReflectance = h ? h.reflectance : heliostat.reflectance;
        const undoableChange = {
          name: 'Set Heliostat Reflectance',
          timestamp: Date.now(),
          oldValue: oldReflectance,
          newValue: value,
          changedElementId: heliostat.id,
          changedElementType: heliostat.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(heliostat.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.heliostatReflectance = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setReflectance(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  if (heliostat?.type !== ObjectType.Heliostat) return null;

  return (
    <Dialog
      width={600}
      title={i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
          <InputNumber
            min={0}
            max={1}
            style={{ width: 120 }}
            precision={2}
            step={0.01}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 1]
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('heliostatMenu.OnlyThisHeliostat', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('heliostatMenu.AllHeliostatsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('heliostatMenu.AllSelectedHeliostats', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('heliostatMenu.AllHeliostats', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default HeliostatReflectanceInput;
