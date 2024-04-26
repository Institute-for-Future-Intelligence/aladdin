/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { HeliostatModel } from '../../../../models/HeliostatModel';
import { ObjectType, Scope, SolarStructure } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../../models/FoundationModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';

const { Option } = Select;

const HeliostatTowerSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarReceiverById);
  const updateAboveFoundation = useStore(Selector.updateSolarReceiverAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarReceiverForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.heliostatActionScope);
  const setActionScope = useStore(Selector.setHeliostatActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const heliostat = useSelectedElement(ObjectType.Heliostat) as HeliostatModel | undefined;

  const [selectedTowerId, setSelectedTowerId] = useState<string>(heliostat?.towerId ?? 'None');

  const lang = useLanguage();

  const towers = useMemo(() => {
    const towerIds: string[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.FocusTower) {
          towerIds.push(f.id);
        }
      }
    }
    return towerIds;
  }, [elements]);

  useEffect(() => {
    setSelectedTowerId('None');
    if (heliostat) {
      if (heliostat.towerId) {
        setSelectedTowerId(heliostat.towerId);
      } else {
        const parent = getElementById(heliostat.parentId);
        if (parent) {
          if (
            parent.type === ObjectType.Foundation &&
            (parent as FoundationModel).solarStructure === SolarStructure.FocusTower
          ) {
            setSelectedTowerId(parent.id);
          }
        }
      }
    }
  }, [heliostat]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (towerId: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const hs = e as HeliostatModel;
            if (hs.towerId !== towerId) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.towerId !== towerId) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && e.foundationId === heliostat?.foundationId && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.towerId !== towerId) {
              return true;
            }
          }
        }
        break;
      default:
        if (heliostat?.towerId !== towerId) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Heliostat && !e.locked && map.has(e.id)) {
          (e as HeliostatModel).towerId = value;
        }
      }
    });
  };

  const setTowerId = (value: string) => {
    if (!heliostat) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as HeliostatModel).towerId);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Tower for Selected Heliostats',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ti] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, ti as string);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat) {
            oldValuesAll.set(elem.id, (elem as HeliostatModel).towerId);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tower for All Heliostats',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ti] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ti as string);
            }
          },
          redo: () => {
            updateForAll(ObjectType.Heliostat, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.Heliostat, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (heliostat.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Heliostat && elem.foundationId === heliostat.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as HeliostatModel).towerId);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tower for All Heliostats Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: heliostat.foundationId,
            undo: () => {
              for (const [id, ti] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ti as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.Heliostat,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
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
        const oldValue = h ? h.towerId : heliostat.towerId;
        const undoableChange = {
          name: 'Set Tower for Heliostat',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: heliostat.id,
          changedElementType: heliostat.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(heliostat.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.heliostatTower = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    if (selectedTowerId) {
      setTowerId(selectedTowerId);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  if (heliostat?.type !== ObjectType.Heliostat) return null;

  return (
    <Dialog
      width={600}
      title={i18n.t('heliostatMenu.SelectTowerToReflectSunlightTo', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={8}>
          <Select style={{ width: '120px' }} value={selectedTowerId} onChange={setSelectedTowerId}>
            {towers.map((s, i) => {
              return (
                <Option key={i} value={s}>
                  {i18n.t('heliostatMenu.Tower', lang) + ' ' + (i + 1)}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
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

export default HeliostatTowerSelection;
