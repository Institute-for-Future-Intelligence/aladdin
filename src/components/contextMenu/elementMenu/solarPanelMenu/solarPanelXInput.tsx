/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';

const SolarPanelXInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getParent = useStore(Selector.getParent);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarCollectorXById);
  const updateAboveFoundation = useStore(Selector.updateSolarCollectorXAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarCollectorXForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;
  const [inputValue, setInputValue] = useState(solarPanel?.cx ?? 0);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (cx: number) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.cx - cx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.cx - cx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.cx - cx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(solarPanel?.cx - cx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          sp.cx = value;
        }
      }
    });
  };

  const withinParent = (cx: number, lx: number, px: number) => {
    return cx + (0.5 * lx) / px < 0.5 && cx - (0.5 * lx) / px > -0.5;
  };

  const setCx = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    const parent = getParent(solarPanel);
    if (!parent) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (!withinParent(value, solarPanel.lx, parent.lx)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.cx);
        } else {
          const oldValuesSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldValuesSelected.set(elem.id, elem.cx);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Center X for Selected Solar Panel',
            timestamp: Date.now(),
            oldValues: oldValuesSelected,
            newValue: value,
            undo: () => {
              for (const [id, cx] of undoableChangeSelected.oldValues.entries()) {
                updateById(id, cx as number);
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
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            if (!withinParent(value, solarPanel.lx, parent.lx)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.cx);
        } else {
          const oldValuesAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldValuesAll.set(elem.id, elem.cx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Center X for All Solar Panels',
            timestamp: Date.now(),
            oldValues: oldValuesAll,
            newValue: value,
            undo: () => {
              for (const [id, cx] of undoableChangeAll.oldValues.entries()) {
                updateById(id, cx as number);
              }
            },
            redo: () => {
              updateForAll(ObjectType.SolarPanel, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateForAll(ObjectType.SolarPanel, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              if (!withinParent(value, solarPanel.lx, parent.lx)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(solarPanel.cx);
          } else {
            const oldValuesAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldValuesAboveFoundation.set(elem.id, elem.cx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Center X for All Solar Panels Above Foundation',
              timestamp: Date.now(),
              oldValues: oldValuesAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, cx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateById(id, cx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateAboveFoundation(
                    ObjectType.SolarPanel,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateAboveFoundation(ObjectType.SolarPanel, solarPanel.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldValue = sp ? sp.cx : solarPanel.cx;
        rejectRef.current = !withinParent(value, solarPanel.lx, parent.lx);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldValue);
        } else {
          const undoableChange = {
            name: 'Set Solar Panel Center X',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(solarPanel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelCx = value;
    });
  };

  const close = () => {
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setCx(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setCx(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('solarCollectorMenu.RelativeXCoordinateOfCenter', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={-0.5}
            max={0.5}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-0.5, 0.5]
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
                {i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}
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

export default SolarPanelXInput;
