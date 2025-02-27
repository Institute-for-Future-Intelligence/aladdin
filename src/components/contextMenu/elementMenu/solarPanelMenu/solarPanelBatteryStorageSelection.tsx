/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';

const SolarPanelBatteryStorageSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement() as SolarPanelModel | undefined;

  const getOptions = () => {
    const options: { value: string; label: string }[] = [{ value: 'None', label: 'None' }];

    let idx = 1;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.BatteryStorage) {
        const label = idx + ' - ' + ((e as BatteryStorageModel).editableId ?? e.id.slice(0, 4));
        idx++;
        options.push({ value: e.id, label: label });
      }
    }
    return options;
  };

  const options = getOptions();

  const initSelection = () => {
    if (!solarPanel) return 'None';
    const batteryId = solarPanel.batteryStorageId;
    if (!batteryId) return 'None';
    const option = options.find((option) => option.value === batteryId);
    if (!option) return 'None';
    return option.value;
  };

  const [selected, setSelected] = useState<string>(initSelection());

  const lang = useLanguage();

  const updateBatterySelectionById = (id: string, selection: string | null | undefined) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.batteryStorageId = selection;
          break;
        }
      }
    });
  };

  const updateSolarPanelAboveFoundation = (foundationId: string, batteryStorageId: string | null) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.batteryStorageId = batteryStorageId;
        }
      }
    });
  };

  const updateSolarPanelOnSurface = (parentId: string, normal: number[] | undefined, selection: string | null) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            const sp = e as SolarPanelModel;
            sp.batteryStorageId = selection;
          }
        }
      }
    });
  };

  const updateSolarPanelBatterySelectionForAll = (selection: string | null) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.batteryStorageId = selection;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string | null | undefined>, value: string | null) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          sp.batteryStorageId = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (selection: string | null) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (sp.batteryStorageId !== selection) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.batteryStorageId !== selection) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.batteryStorageId !== selection) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const e of elements) {
              if (
                e.type === ObjectType.SolarPanel &&
                e.parentId === solarPanel.parentId &&
                Util.isIdentical(e.normal, solarPanel.normal) &&
                !e.locked
              ) {
                const sp = e as SolarPanelModel;
                if (sp.batteryStorageId !== selection) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (sp.batteryStorageId !== selection) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (solarPanel?.batteryStorageId !== selection) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setSelection = (selection: string | null) => {
    if (!solarPanel) return;
    if (!needChange(selection)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldSelections = new Map<string, string | null | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldSelections.set(elem.id, (elem as SolarPanelModel).batteryStorageId);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Battery Stroage ID for Selected Solar Panels',
          timestamp: Date.now(),
          oldValues: oldSelections,
          newValue: selection,
          undo: () => {
            for (const [id, batteryStorageId] of undoableChangeSelected.oldValues.entries()) {
              updateBatterySelectionById(id, batteryStorageId as string);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string | null | undefined>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldSelections, selection);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldSelectionsAll = new Map<string, string | null | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldSelectionsAll.set(elem.id, (elem as SolarPanelModel).batteryStorageId);
          }
        }
        const undoableChangeAll = {
          name: 'Set Battery Storage ID for All Solar Panels',
          timestamp: Date.now(),
          oldValues: oldSelectionsAll,
          newValue: selection,
          undo: () => {
            for (const [id, batteryStorageId] of undoableChangeAll.oldValues.entries()) {
              updateBatterySelectionById(id, batteryStorageId as string);
            }
          },
          redo: () => {
            updateSolarPanelBatterySelectionForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelBatterySelectionForAll(selection);
        setApplyCount(applyCount + 1);

        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (solarPanel.foundationId) {
          const oldSelectionsAboveFoundation = new Map<string, string | null | undefined>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldSelectionsAboveFoundation.set(elem.id, (elem as SolarPanelModel).batteryStorageId);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Battery Storage ID for All Solar Panels Above Foundation',
            timestamp: Date.now(),
            oldValues: oldSelectionsAboveFoundation,
            newValue: selection,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, batteryStorageId] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateBatterySelectionById(id, batteryStorageId as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelAboveFoundation(solarPanel.foundationId, selection);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const oldSelectionsOnSurface = new Map<string, string | null | undefined>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldSelectionsOnSurface.set(elem.id, (elem as SolarPanelModel).batteryStorageId);
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldSelectionsOnSurface.set(elem.id, (elem as SolarPanelModel).batteryStorageId);
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Battery Storage ID for All Solar Panels on Surface',
            timestamp: Date.now(),
            oldValues: oldSelectionsOnSurface,
            newValue: selection,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, batteryStorageId] of undoableChangeOnSurface.oldValues.entries()) {
                updateBatterySelectionById(id, batteryStorageId as string);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateSolarPanelOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateSolarPanelOnSurface(solarPanel.parentId, normal, selection);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const undoableChange = {
          name: 'Set Battery Storage ID of Selected Solar Panel',
          timestamp: Date.now(),
          oldValue: solarPanel.batteryStorageId,
          newValue: selection,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateBatterySelectionById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateBatterySelectionById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateBatterySelectionById(solarPanel.id, selection);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelBatteryStorageId = selection;
    });
  };

  const close = () => {
    if (!solarPanel) return;
    // setSelected(solarPanel.batteryStorageId ?? null);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setSelection(selected === 'None' ? null : selected);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setSelection(selected === 'None' ? null : selected);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('solarPanelMenu.BatteryStorageSelection', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={8}>
          <Select
            style={{ width: '150px' }}
            value={selected}
            onChange={(value) => setSelected(value)}
            options={getOptions()}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSelectedSolarPanels', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSolarPanels', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPanelBatteryStorageSelection;
