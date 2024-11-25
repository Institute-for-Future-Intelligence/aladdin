/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const RoofSideColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;

  const [selectedSideColor, setSelectedSideColor] = useState<string>(roof?.sideColor ?? '#ffffff');

  const lang = useLanguage();

  const updateSideColorById = (id: string, sideColor: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as RoofModel).sideColor = sideColor;
          }
          break;
        }
      }
    });
  };

  const updateSideColorInMap = (map: Map<string, string>, sideColor: string) => {
    for (const id of map.keys()) {
      updateSideColorById(id, sideColor as string);
    }
  };

  const undoSideColorInMap = (map: Map<string, string>) => {
    for (const [id, color] of map.entries()) {
      updateSideColorById(id, color as string);
    }
  };

  const needChange = (value: string) => {
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            value !== (e as RoofModel).sideColor &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).sideColor && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).sideColor &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.sideColor) {
          return true;
        }
        break;
    }
    return false;
  };

  const setSideColor = (value: string) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldColorsSelected.set(e.id, (e as RoofModel).sideColor ?? '#ffffff');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Side Color for Selected Roofs',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            undoSideColorInMap(undoableChangeSelected.oldValues as Map<string, string>);
          },
          redo: () => {
            updateSideColorInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateSideColorInMap(oldColorsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked) {
            oldColorsAll.set(e.id, (e as RoofModel).sideColor ?? '#ffffff');
          }
        }
        const undoableChangeAll = {
          name: 'Set Side Color for All Roofs',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            undoSideColorInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateSideColorInMap(
              undoableChangeAll.oldValues as Map<string, string>,
              undoableChangeAll.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSideColorInMap(oldColorsAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roof.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Roof && e.foundationId === roof.foundationId && !roof.locked) {
              oldColorsAboveFoundation.set(e.id, (e as RoofModel).sideColor ?? '#ffffff');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Side Color for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
            undo: () => {
              undoSideColorInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSideColorInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSideColorInMap(oldColorsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldColor = (updatedRoof ? updatedRoof.sideColor : roof.sideColor) ?? '#ffffff';
          const undoableChange = {
            name: 'Set Side Color of Selected Roof',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateSideColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateSideColorById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSideColorById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.roofSideColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setSideColor(selectedSideColor);
  };

  return (
    <Dialog width={640} title={i18n.t('roofMenu.RoofSideColor', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={11}>
          <CompactPicker
            color={selectedSideColor ?? roof?.sideColor ?? '#ffffff'}
            onChangeComplete={(colorResult) => {
              setSelectedSideColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={13}
        >
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('roofMenu.OnlyThisRoof', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('roofMenu.AllSelectedRoofs', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('roofMenu.AllRoofs', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofSideColorSelection;
