/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { WaterHeaterModel } from 'src/models/WaterHeaterModel';

const WaterHeaterLengthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.waterHeaterActionScope);
  const setActionScope = useStore(Selector.setWaterHeaterActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const waterHeater = useSelectedElement(ObjectType.WaterHeater) as WaterHeaterModel | undefined;

  const [inputValue, setInputValue] = useState(waterHeater?.lx ?? 1);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const updateWaterHeaterLxById = (id: string, lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WaterHeater && e.id === id && !e.locked) {
          e.lx = lx;
          break;
        }
      }
    });
  };

  const updateWaterHeaterLxAboveFoundation = (foundationId: string, lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WaterHeater && e.foundationId === foundationId && !e.locked) {
          e.lx = lx;
        }
      }
    });
  };

  const updateWaterHeaterLxOnSurface = (parentId: string, normal: number[] | undefined, lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WaterHeater && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            e.lx = lx;
          }
        }
      }
    });
  };

  const updateWaterHeaterLxForAll = (lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WaterHeater && !e.locked) {
          e.lx = lx;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WaterHeater && !e.locked && map.has(e.id)) {
          e.lx = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (sp: WaterHeaterModel, lx: number) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as WaterHeaterModel;
      clone.lx = lx;
      if (parent.type === ObjectType.Roof) {
        // todo: water heater
        // return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
        return true;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: WaterHeaterModel, lx: number) => {
    // check if the new length will cause the solar panel to be out of the bound
    if (!withinParent(sp, lx)) {
      return true;
    }
    // other check?
    return false;
  };

  // FIXME: When there are multiple types of solar panels that have different dimensions,
  // this will not work properly.
  const needChange = (lx: number) => {
    if (!waterHeater) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.WaterHeater && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (Math.abs(e.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.WaterHeater && !e.locked) {
            if (Math.abs(e.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.WaterHeater && e.foundationId === waterHeater?.foundationId && !e.locked) {
            if (Math.abs(e.lx - lx) > ZERO_TOLERANCE) {
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
                e.type === ObjectType.WaterHeater &&
                e.parentId === waterHeater.parentId &&
                Util.isIdentical(e.normal, waterHeater.normal) &&
                !e.locked
              ) {
                const sp = e as WaterHeaterModel;
                if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.WaterHeater && e.parentId === waterHeater.parentId && !e.locked) {
                const sp = e as WaterHeaterModel;
                if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(waterHeater?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setLength = (value: number) => {
    if (!waterHeater) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (
            elem.type === ObjectType.WaterHeater &&
            !elem.locked &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            if (rejectChange(elem as WaterHeaterModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(waterHeater.lx);
        } else {
          const oldLengthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WaterHeater && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLengthsSelected.set(elem.id, elem.lx);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Length for Selected Water Heater',
            timestamp: Date.now(),
            oldValues: oldLengthsSelected,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeSelected.oldValues.entries()) {
                updateWaterHeaterLxById(id, lx as number);
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
          updateInMap(oldLengthsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.WaterHeater && !elem.locked) {
            if (rejectChange(elem as WaterHeaterModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(waterHeater.lx);
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WaterHeater && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLengthsAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Water Heater',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldValues.entries()) {
                updateWaterHeaterLxById(id, lx as number);
              }
            },
            redo: () => {
              updateWaterHeaterLxForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateWaterHeaterLxForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (waterHeater.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (
              elem.type === ObjectType.WaterHeater &&
              !elem.locked &&
              elem.foundationId === waterHeater.foundationId
            ) {
              if (rejectChange(elem as WaterHeaterModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(waterHeater.lx);
          } else {
            const oldLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.WaterHeater && elem.foundationId === waterHeater.foundationId) {
                oldLengthsAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Length for All Water Heater Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLengthsAboveFoundation,
              newValue: value,
              groupId: waterHeater.foundationId,
              undo: () => {
                for (const [id, lx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateWaterHeaterLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateWaterHeaterLxAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateWaterHeaterLxAboveFoundation(waterHeater.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(waterHeater);
        if (parent) {
          rejectRef.current = false;
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.WaterHeater &&
                !elem.locked &&
                elem.parentId === waterHeater.parentId &&
                Util.isIdentical(elem.normal, waterHeater.normal)
              ) {
                if (rejectChange(elem as WaterHeaterModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.WaterHeater && !elem.locked && elem.parentId === waterHeater.parentId) {
                if (rejectChange(elem as WaterHeaterModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(waterHeater.lx);
          } else {
            const oldLengthsOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.WaterHeater &&
                  elem.parentId === waterHeater.parentId &&
                  Util.isIdentical(elem.normal, waterHeater.normal)
                ) {
                  oldLengthsOnSurface.set(elem.id, elem.lx);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.WaterHeater && elem.parentId === waterHeater.parentId) {
                  oldLengthsOnSurface.set(elem.id, elem.lx);
                }
              }
            }
            const normal = isParentCuboid ? waterHeater.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Length for All Water Heater on Surface',
              timestamp: Date.now(),
              oldValues: oldLengthsOnSurface,
              newValue: value,
              groupId: waterHeater.parentId,
              normal: normal,
              undo: () => {
                for (const [id, lx] of undoableChangeOnSurface.oldValues.entries()) {
                  updateWaterHeaterLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateWaterHeaterLxOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateWaterHeaterLxOnSurface(waterHeater.parentId, normal, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(waterHeater.id);
        const oldLength = sp ? sp.lx : waterHeater.lx;
        rejectRef.current = rejectChange(waterHeater, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldLength);
        } else {
          const undoableChange = {
            name: 'Set Water Heater Length',
            timestamp: Date.now(),
            oldValue: oldLength,
            newValue: value,
            changedElementId: waterHeater.id,
            changedElementType: waterHeater.type,
            undo: () => {
              updateWaterHeaterLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateWaterHeaterLxById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateWaterHeaterLxById(waterHeater.id, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
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
    setLength(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setLength(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('word.Length', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0}
            max={100}
            step={0.1}
            style={{ width: 120 }}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('waterHeaterMenu.OnlyThisWaterHeater', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('waterHeaterMenu.AllWaterHeatersOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('waterHeaterMenu.AllWaterHeatersAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('waterHeaterMenu.AllSelectedWaterHeaters', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('waterHeaterMenu.AllWaterHeaters', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WaterHeaterLengthInput;
