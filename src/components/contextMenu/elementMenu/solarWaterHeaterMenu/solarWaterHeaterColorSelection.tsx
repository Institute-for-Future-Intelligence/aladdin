/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { CompactPicker } from 'react-color';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';

const SolarWaterHeaterColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const waterHeater = useSelectedElement(ObjectType.SolarWaterHeater) as SolarWaterHeaterModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(waterHeater?.color ?? 'grey');

  const lang = useLanguage();

  const updateById = (id: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && e.id === id && !e.locked) {
          e.color = color;
          break;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && e.foundationId === foundationId && !e.locked) {
          e.color = color;
        }
      }
    });
  };

  const updateOnSurface = (parentId: string, normal: number[] | undefined, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            e.color = color;
          }
        }
      }
    });
  };

  const updateForAll = (color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
          e.color = color;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked && map.has(e.id)) {
          e.color = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    if (!waterHeater) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (
            e.type === ObjectType.SolarWaterHeater &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            if (e.color !== color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
            if (e.color !== color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && e.foundationId === waterHeater?.foundationId && !e.locked) {
            if (e.color !== color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(waterHeater);
        if (parent) {
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const e of elements) {
              if (
                e.type === ObjectType.SolarWaterHeater &&
                e.parentId === waterHeater.parentId &&
                Util.isIdentical(e.normal, waterHeater.normal) &&
                !e.locked
              ) {
                if (e.color !== color) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarWaterHeater && e.parentId === waterHeater.parentId && !e.locked) {
                if (e.color !== color) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (waterHeater?.color !== color) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!waterHeater) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of elements) {
          if (
            elem.type === ObjectType.SolarWaterHeater &&
            useStore.getState().selectedElementIdSet.has(elem.id) &&
            !elem.locked
          ) {
            oldColorsSelected.set(elem.id, elem.color ?? 'grey');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Solar Water Heaters',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            for (const [id, fc] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, fc as string);
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
        updateInMap(oldColorsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldFrameColorsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarWaterHeater && !elem.locked) {
            oldFrameColorsAll.set(elem.id, elem.color ?? 'grey');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Solar Water Heaters',
          timestamp: Date.now(),
          oldValues: oldFrameColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, fc] of undoableChangeAll.oldValues.entries()) {
              updateById(id, fc as string);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (waterHeater.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarWaterHeater &&
              !elem.locked &&
              elem.foundationId === waterHeater.foundationId
            ) {
              oldColorsAboveFoundation.set(elem.id, elem.color ?? 'grey');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Color for All Water Heaters Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: waterHeater.foundationId,
            undo: () => {
              for (const [id, fc] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, fc as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(waterHeater.foundationId, value as string);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(waterHeater);
        if (parent) {
          const oldFrameColorsOnSurface = new Map<string, string>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarWaterHeater &&
                !elem.locked &&
                elem.parentId === waterHeater.parentId &&
                Util.isIdentical(elem.normal, waterHeater.normal)
              ) {
                oldFrameColorsOnSurface.set(elem.id, elem.color ?? 'grey');
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarWaterHeater && !elem.locked && elem.parentId === waterHeater.parentId) {
                oldFrameColorsOnSurface.set(elem.id, elem.color ?? 'grey');
              }
            }
          }
          const normal = isParentCuboid ? waterHeater.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Color for All Water Heaters on Surface',
            timestamp: Date.now(),
            oldValues: oldFrameColorsOnSurface,
            newValue: value,
            groupId: waterHeater.parentId,
            normal: normal,
            undo: () => {
              for (const [id, fc] of undoableChangeOnSurface.oldValues.entries()) {
                updateById(id, fc as string);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateOnSurface(waterHeater.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const oldColor = waterHeater ? waterHeater.color : 'grey';
        const undoableChange = {
          name: 'Set Color of Selected Water Heater',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: waterHeater.id,
          changedElementType: waterHeater.type,
          undo: () => {
            updateById(waterHeater.id, undoableChange.oldValue as string);
          },
          redo: () => {
            updateById(waterHeater.id, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(waterHeater.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarWaterHeaterColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setColor(selectedColor);
  };

  return (
    <Dialog width={680} title={i18n.t('word.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={10}>
          <CompactPicker
            color={selectedColor ?? waterHeater?.color ?? 'grey'}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={14}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('solarWaterHeaterMenu.OnlyThisSolarWaterHeater', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('solarWaterHeaterMenu.AllSolarWaterHeatersOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarWaterHeaterMenu.AllSolarWaterHeatersAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('solarWaterHeaterMenu.AllSelectedSolarWaterHeaters', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('solarWaterHeaterMenu.AllSolarWaterHeaters', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarWaterHeaterColorSelection;
