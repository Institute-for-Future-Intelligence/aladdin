/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FresnelReflectorModel } from '../../../models/FresnelReflectorModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const FresnelReflectorReflectanceInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateCspReflectanceById);
  const updateAboveFoundation = useStore(Selector.updateCspReflectanceAboveFoundation);
  const updateForAll = useStore(Selector.updateCspReflectanceForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [inputValue, setInputValue] = useState(fresnelReflector?.reflectance ?? 0.9);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (reflectance: number) => {
    if (!fresnelReflector) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            e.foundationId === fresnelReflector?.foundationId &&
            !e.locked
          ) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(fresnelReflector?.reflectance - reflectance) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setReflectance = (value: number) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldReflectancesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            oldReflectancesAll.set(elem.id, (elem as FresnelReflectorModel).reflectance);
          }
        }
        const undoableChangeAll = {
          name: 'Set Reflectance for All Fresnel Reflectors',
          timestamp: Date.now(),
          oldValues: oldReflectancesAll,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeAll.oldValues.entries()) {
              updateById(id, rf as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.FresnelReflector, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (fresnelReflector.foundationId) {
          const oldReflectancesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              oldReflectancesAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).reflectance);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Reflectance for All Fresnel Reflectors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldReflectancesAboveFoundation,
            newValue: value,
            groupId: fresnelReflector.foundationId,
            undo: () => {
              for (const [id, rf] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, rf as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.FresnelReflector,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldReflectance = f ? f.reflectance : fresnelReflector.reflectance;
        const undoableChange = {
          name: 'Set Fresnel Reflector Reflectance',
          timestamp: Date.now(),
          oldValue: oldReflectance,
          newValue: value,
          changedElementId: fresnelReflector.id,
          changedElementType: fresnelReflector.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(fresnelReflector.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.fresnelReflectorReflectance = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setReflectance(inputValue);
  };

  if (fresnelReflector?.type !== ObjectType.FresnelReflector) return null;

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
            value={inputValue}
            step={0.01}
            onChange={setInputValue}
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
              <Radio value={Scope.OnlyThisObject}>
                {i18n.t('fresnelReflectorMenu.OnlyThisFresnelReflector', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectorsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FresnelReflectorReflectanceInput;
