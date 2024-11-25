/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const SolarPanelPoleSpacingInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;
  const [inputValue, setInputValue] = useState(solarPanel?.poleSpacing ?? 0);

  const lang = useLanguage();

  const updateSolarPanelPoleSpacingById = (id: string, poleSpacing: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.poleSpacing = poleSpacing;
          break;
        }
      }
    });
  };

  const updateSolarPanelPoleSpacingAboveFoundation = (foundationId: string, poleSpacing: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.poleSpacing = poleSpacing;
        }
      }
    });
  };

  const updateSolarPanelPoleSpacingOnSurface = (
    parentId: string,
    normal: number[] | undefined,
    poleSpacing: number,
  ) => {
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
            sp.poleSpacing = poleSpacing;
          }
        }
      }
    });
  };

  const updateSolarPanelPoleSpacingForAll = (poleSpacing: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.poleSpacing = poleSpacing;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          sp.poleSpacing = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (poleSpacing: number) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
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
            if (Math.abs(sp.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
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
            if (Math.abs(sp.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
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
                if (Math.abs(sp.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (Math.abs(sp.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(solarPanel?.poleSpacing - poleSpacing) > ZERO_TOLERANCE) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setPoleSpacing = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldPoleSpacingsSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldPoleSpacingsSelected.set(elem.id, (elem as SolarPanelModel).poleSpacing);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Pole Spacing for Selected Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldPoleSpacingsSelected,
          newValue: value,
          undo: () => {
            for (const [id, ps] of undoableChangeSelected.oldValues.entries()) {
              updateSolarPanelPoleSpacingById(id, ps as number);
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
        updateInMap(oldPoleSpacingsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldPoleSpacingsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldPoleSpacingsAll.set(elem.id, (elem as SolarPanelModel).poleSpacing);
          }
        }
        const undoableChangeAll = {
          name: 'Set Pole Spacing for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldPoleSpacingsAll,
          newValue: value,
          undo: () => {
            for (const [id, ps] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelPoleSpacingById(id, ps as number);
            }
          },
          redo: () => {
            updateSolarPanelPoleSpacingForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelPoleSpacingForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (solarPanel.foundationId) {
          const oldPoleSpacingsAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldPoleSpacingsAboveFoundation.set(elem.id, (elem as SolarPanelModel).poleSpacing);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Pole Spacing for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldPoleSpacingsAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, ps] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelPoleSpacingById(id, ps as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelPoleSpacingAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelPoleSpacingAboveFoundation(solarPanel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(solarPanel);
        if (parent) {
          const oldPoleSpacingsOnSurface = new Map<string, number>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldPoleSpacingsOnSurface.set(elem.id, (elem as SolarPanelModel).poleSpacing);
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldPoleSpacingsOnSurface.set(elem.id, (elem as SolarPanelModel).poleSpacing);
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Pole Spacing for All Solar Panel Arrays on Surface',
            timestamp: Date.now(),
            oldValues: oldPoleSpacingsOnSurface,
            newValue: value,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, ps] of undoableChangeOnSurface.oldValues.entries()) {
                updateSolarPanelPoleSpacingById(id, ps as number);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateSolarPanelPoleSpacingOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateSolarPanelPoleSpacingOnSurface(solarPanel.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldPoleSpacing = sp ? sp.poleSpacing : solarPanel.poleSpacing;
        const undoableChange = {
          name: 'Set Solar Panel Array Pole Spacing',
          timestamp: Date.now(),
          oldValue: oldPoleSpacing,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateSolarPanelPoleSpacingById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateSolarPanelPoleSpacingById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSolarPanelPoleSpacingById(solarPanel.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelPoleSpacing = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setPoleSpacing(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <Dialog width={550} title={i18n.t('solarPanelMenu.PoleSpacing', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={1}
            max={10}
            step={1}
            style={{ width: 120 }}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 10] {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
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

export default SolarPanelPoleSpacingInput;
