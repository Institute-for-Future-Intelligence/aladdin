/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space, Switch } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { HeliostatModel } from '../../../../models/HeliostatModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';

const HeliostatDrawSunBeamSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const updateAboveFoundation = useStore(Selector.updateSolarCollectorDrawSunBeamAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarCollectorDrawSunBeamForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.heliostatActionScope);
  const setActionScope = useStore(Selector.setHeliostatActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const heliostat = useSelectedElement(ObjectType.Heliostat) as HeliostatModel | undefined;

  const [sunBeam, setSunBeam] = useState<boolean>(!!heliostat?.drawSunBeam);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (drawSunBeam: boolean) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const hs = e as HeliostatModel;
            if (hs.drawSunBeam !== drawSunBeam) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.drawSunBeam !== drawSunBeam) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && e.foundationId === heliostat?.foundationId && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.drawSunBeam !== drawSunBeam) {
              return true;
            }
          }
        }
        break;
      default:
        if (heliostat?.drawSunBeam !== drawSunBeam) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, boolean>, value: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Heliostat && !e.locked && map.has(e.id)) {
          (e as HeliostatModel).drawSunBeam = value;
        }
      }
    });
  };

  const setDrawSunBeam = (value: boolean) => {
    if (!heliostat) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, boolean>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as HeliostatModel).drawSunBeam);
          }
        }
        const undoableChangeSelected = {
          name: 'Draw Sun Beam for Selected Heliostats',
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
          if (elem.type === ObjectType.Heliostat) {
            oldValuesAll.set(elem.id, (elem as HeliostatModel).drawSunBeam);
          }
        }
        const undoableChangeAll = {
          name: 'Draw Sun Beam for All Heliostats',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, sb] of undoableChangeAll.oldValues.entries()) {
              updateById(id, sb as boolean);
            }
          },
          redo: () => {
            updateForAll(ObjectType.Heliostat, undoableChangeAll.newValue as boolean);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.Heliostat, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (heliostat.foundationId) {
          const oldValuesAboveFoundation = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Heliostat && elem.foundationId === heliostat.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as HeliostatModel).drawSunBeam);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Draw Sun Beam for All Heliostats Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: heliostat.foundationId,
            undo: () => {
              for (const [id, sb] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, sb as boolean);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.Heliostat,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as boolean,
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
        const oldValue = h ? h.drawSunBeam : heliostat.drawSunBeam;
        const undoableChange = {
          name: 'Draw Sun Beam for Heliostat',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: heliostat.id,
          changedElementType: heliostat.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as boolean);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as boolean);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(heliostat.id, value);
        setApplyCount(applyCount + 1);
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setDrawSunBeam(sunBeam);
  };

  if (heliostat?.type !== ObjectType.Heliostat) return null;

  return (
    <Dialog width={500} title={i18n.t('solarCollectorMenu.DrawSunBeam', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={4}>
          <Switch checked={sunBeam} onChange={setSunBeam} />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={20}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('heliostatMenu.OnlyThisHeliostat', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('heliostatMenu.AllHeliostatsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('heliostatMenu.AllSelectedHeliostats', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('heliostatMenu.AllHeliostats', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default HeliostatDrawSunBeamSelection;
