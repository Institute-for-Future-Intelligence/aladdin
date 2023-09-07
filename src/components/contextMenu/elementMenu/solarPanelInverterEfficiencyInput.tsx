/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { ZERO_TOLERANCE } from '../../../constants';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const SolarPanelInverterEfficiencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const solarPanel = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.SolarPanel),
  ) as SolarPanelModel;

  const [inputValue, setInputValue] = useState(solarPanel?.inverterEfficiency ?? 0.95);

  const lang = useLanguage();

  const updateInverterEfficiencyById = (id: string, efficiency: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          (e as SolarPanelModel).inverterEfficiency = efficiency;
          break;
        }
      }
    });
  };

  const updateInverterEfficiencyAboveFoundation = (foundationId: string, efficiency: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          (e as SolarPanelModel).inverterEfficiency = efficiency;
        }
      }
    });
  };

  const updateInverterEfficiencyOnSurface = (parentId: string, normal: number[] | undefined, efficiency: number) => {
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
            (e as SolarPanelModel).inverterEfficiency = efficiency;
          }
        }
      }
    });
  };

  const updateInverterEfficiencyForAll = (efficiency: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          (e as SolarPanelModel).inverterEfficiency = efficiency;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (efficiency: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs((sp.inverterEfficiency ?? 0.95) - efficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs((sp.inverterEfficiency ?? 0.95) - efficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
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
                if (Math.abs((sp.inverterEfficiency ?? 0.95) - efficiency) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (Math.abs((sp.inverterEfficiency ?? 0.95) - efficiency) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs((solarPanel?.inverterEfficiency ?? 0.95) - efficiency) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setInverterEfficiency = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldValuesAll.set(elem.id, (elem as SolarPanelModel).inverterEfficiency ?? 0.95);
          }
        }
        const undoableChangeAll = {
          name: 'Set Inverter Efficiency for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, efficiency] of undoableChangeAll.oldValues.entries()) {
              updateInverterEfficiencyById(id, efficiency as number);
            }
          },
          redo: () => {
            updateInverterEfficiencyForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInverterEfficiencyForAll(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as SolarPanelModel).inverterEfficiency ?? 0.95);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Inverter Efficiency for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, efficiency] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateInverterEfficiencyById(id, efficiency as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateInverterEfficiencyAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateInverterEfficiencyAboveFoundation(solarPanel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
        if (parent) {
          const oldValuesOnSurface = new Map<string, number>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldValuesOnSurface.set(elem.id, (elem as SolarPanelModel).inverterEfficiency ?? 0.95);
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldValuesOnSurface.set(elem.id, (elem as SolarPanelModel).inverterEfficiency ?? 0.95);
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Inverter Efficiency for All Solar Panel Arrays on Surface',
            timestamp: Date.now(),
            oldValues: oldValuesOnSurface,
            newValue: value,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, efficiency] of undoableChangeOnSurface.oldValues.entries()) {
                updateInverterEfficiencyById(id, efficiency as number);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateInverterEfficiencyOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateInverterEfficiencyOnSurface(solarPanel.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id);
        const oldValue = sp
          ? (sp as SolarPanelModel).inverterEfficiency ?? 0.95
          : solarPanel.inverterEfficiency ?? 0.95;
        const undoableChange = {
          name: 'Set Solar Panel Array Inverter Efficiency',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateInverterEfficiencyById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateInverterEfficiencyById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateInverterEfficiencyById(solarPanel.id, value);
        setApplyCount(applyCount + 1);
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setInverterEfficiency(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('solarPanelMenu.InverterEfficiency', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.5}
            max={1}
            step={0.01}
            style={{ width: 120 }}
            precision={2}
            value={inputValue}
            onChange={setInputValue}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            [0.5, 1.0]
            <br />
            {i18n.t('solarPanelMenu.InverterEfficiencyExplained', lang)}
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPanelInverterEfficiencyInput;
