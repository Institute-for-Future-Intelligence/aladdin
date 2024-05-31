/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space, Switch } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { FresnelReflectorModel } from '../../../../models/FresnelReflectorModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { Util } from 'src/Util';
import { SolarCollector } from 'src/models/SolarCollector';

const FresnelReflectorDrawSunBeamSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const updateAboveFoundation = useStore(Selector.updateSolarCollectorDrawSunBeamAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarCollectorDrawSunBeamForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [sunBeam, setSunBeam] = useState<boolean>(!!fresnelReflector?.drawSunBeam);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (drawSunBeam: boolean) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const fr = e as FresnelReflectorModel;
            if (fr.drawSunBeam !== drawSunBeam) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const fr = e as FresnelReflectorModel;
            if (fr.drawSunBeam !== drawSunBeam) {
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
            if (fr.drawSunBeam !== drawSunBeam) {
              return true;
            }
          }
        }
        break;
      default:
        if (fresnelReflector?.drawSunBeam !== drawSunBeam) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, boolean>, value: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (!Util.isSolarCollectorType(e.type)) continue;
        if (!e.locked && e.type === ObjectType.FresnelReflector && map.has(e.id)) {
          (e as SolarCollector).drawSunBeam = value;
        }
      }
    });
  };

  const setDrawSunBeam = (value: boolean) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, boolean>();
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as FresnelReflectorModel).drawSunBeam);
          }
        }
        const undoableChangeSelected = {
          name: 'Draw Sun Beam for Selected Fresnel Reflectors',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, sb] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, sb as boolean);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, boolean>,
              undoableChangeSelected.newValue as boolean,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, boolean>();
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            oldValuesAll.set(elem.id, (elem as FresnelReflectorModel).drawSunBeam);
          }
        }
        const undoableChangeAll = {
          name: 'Draw Sun Beam for All Fresnel Reflectors',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, sb] of undoableChangeAll.oldValues.entries()) {
              updateById(id, sb as boolean);
            }
          },
          redo: () => {
            updateForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as boolean);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.FresnelReflector, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (fresnelReflector.foundationId) {
          const oldValuesAboveFoundation = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).drawSunBeam);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Draw Sun Beam for All Fresnel Reflectors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: fresnelReflector.foundationId,
            undo: () => {
              for (const [id, sb] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, sb as boolean);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.FresnelReflector,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as boolean,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldValue = f ? f.drawSunBeam : fresnelReflector.drawSunBeam;
        const undoableChange = {
          name: 'Draw Sun Beam for Fresnel Reflector',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: fresnelReflector.id,
          changedElementType: fresnelReflector.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as boolean);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as boolean);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(fresnelReflector.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setDrawSunBeam(sunBeam);
  };

  if (fresnelReflector?.type !== ObjectType.FresnelReflector) return null;

  return (
    <Dialog width={500} title={i18n.t('solarCollectorMenu.DrawSunBeam', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={4}>
          <Switch
            checked={sunBeam}
            onChange={(checked) => {
              setSunBeam(checked);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={20}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('fresnelReflectorMenu.OnlyThisFresnelReflector', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectorsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllSelectedFresnelReflectors', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FresnelReflectorDrawSunBeamSelection;
