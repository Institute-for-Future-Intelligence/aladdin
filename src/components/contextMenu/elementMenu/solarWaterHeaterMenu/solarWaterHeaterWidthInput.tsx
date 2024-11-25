/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';

const SolarWaterHeaterWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const waterHeater = useSelectedElement(ObjectType.SolarWaterHeater) as SolarWaterHeaterModel | undefined;

  const [minValue, setMinValue] = useState(0);
  const [inputValue, setInputValue] = useState(waterHeater?.ly ?? 1);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  useEffect(() => {
    if (waterHeater) {
      setMinValue(Number((waterHeater.lz - 0.3).toFixed(2)));
    }
  }, [waterHeater]);

  const updateWaterHeaterLyById = (id: string, ly: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && e.id === id && !e.locked) {
          e.ly = ly;
          break;
        }
      }
    });
  };

  const updateWaterHeaterLyAboveFoundation = (foundationId: string, ly: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && e.foundationId === foundationId && !e.locked) {
          e.ly = ly;
        }
      }
    });
  };

  const updateWaterHeaterLyOnSurface = (parentId: string, normal: number[] | undefined, ly: number) => {
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
            e.ly = ly;
          }
        }
      }
    });
  };

  const updateWaterHeaterLyForAll = (ly: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
          e.ly = ly;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked && map.has(e.id)) {
          e.ly = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (sp: SolarWaterHeaterModel, ly: number) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarWaterHeaterModel;
      clone.ly = ly;
      if (parent.type === ObjectType.Roof) {
        // todo: water heater
        // return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
        return true;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarWaterHeaterModel, ly: number) => {
    // check if the new length will cause the solar panel to be out of the bound
    if (!withinParent(sp, ly)) {
      return true;
    }
    // other check?
    return false;
  };

  // FIXME: When there are multiple types of solar panels that have different dimensions,
  // this will not work properly.
  const needChange = (ly: number) => {
    if (!waterHeater) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (
            e.type === ObjectType.SolarWaterHeater &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            if (Math.abs(e.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
            if (Math.abs(e.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && e.foundationId === waterHeater?.foundationId && !e.locked) {
            if (Math.abs(e.ly - ly) > ZERO_TOLERANCE) {
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
                const sp = e as SolarWaterHeaterModel;
                if (Math.abs(sp.ly - ly) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarWaterHeater && e.parentId === waterHeater.parentId && !e.locked) {
                const sp = e as SolarWaterHeaterModel;
                if (Math.abs(sp.ly - ly) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(waterHeater?.ly - ly) > ZERO_TOLERANCE) {
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
            elem.type === ObjectType.SolarWaterHeater &&
            !elem.locked &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            if (rejectChange(elem as SolarWaterHeaterModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(waterHeater.ly);
        } else {
          const oldWidthSelected = new Map<string, number>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarWaterHeater &&
              !elem.locked &&
              useStore.getState().selectedElementIdSet.has(elem.id)
            ) {
              oldWidthSelected.set(elem.id, elem.ly);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Width for Selected Water Heater',
            timestamp: Date.now(),
            oldValues: oldWidthSelected,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeSelected.oldValues.entries()) {
                updateWaterHeaterLyById(id, ly as number);
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
          updateInMap(oldWidthSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarWaterHeater && !elem.locked) {
            if (rejectChange(elem as SolarWaterHeaterModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(waterHeater.ly);
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarWaterHeater && !elem.locked) {
              oldLengthsAll.set(elem.id, elem.ly);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Water Heater',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeAll.oldValues.entries()) {
                updateWaterHeaterLyById(id, ly as number);
              }
            },
            redo: () => {
              updateWaterHeaterLyForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateWaterHeaterLyForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (waterHeater.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarWaterHeater &&
              !elem.locked &&
              elem.foundationId === waterHeater.foundationId
            ) {
              if (rejectChange(elem as SolarWaterHeaterModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(waterHeater.ly);
          } else {
            const oldWidthAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarWaterHeater &&
                !elem.locked &&
                elem.foundationId === waterHeater.foundationId
              ) {
                oldWidthAboveFoundation.set(elem.id, elem.ly);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Width for All Water Heater Above Foundation',
              timestamp: Date.now(),
              oldValues: oldWidthAboveFoundation,
              newValue: value,
              groupId: waterHeater.foundationId,
              undo: () => {
                for (const [id, lx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateWaterHeaterLyById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateWaterHeaterLyAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateWaterHeaterLyAboveFoundation(waterHeater.foundationId, value);
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
                elem.type === ObjectType.SolarWaterHeater &&
                elem.parentId === waterHeater.parentId &&
                Util.isIdentical(elem.normal, waterHeater.normal) &&
                !elem.locked
              ) {
                if (rejectChange(elem as SolarWaterHeaterModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarWaterHeater && elem.parentId === waterHeater.parentId && !elem.locked) {
                if (rejectChange(elem as SolarWaterHeaterModel, value)) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(waterHeater.ly);
          } else {
            const oldWidthOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarWaterHeater &&
                  elem.parentId === waterHeater.parentId &&
                  Util.isIdentical(elem.normal, waterHeater.normal) &&
                  !elem.locked
                ) {
                  oldWidthOnSurface.set(elem.id, elem.ly);
                }
              }
            } else {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarWaterHeater &&
                  elem.parentId === waterHeater.parentId &&
                  !elem.locked
                ) {
                  oldWidthOnSurface.set(elem.id, elem.ly);
                }
              }
            }
            const normal = isParentCuboid ? waterHeater.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Width for All Water Heater on Surface',
              timestamp: Date.now(),
              oldValues: oldWidthOnSurface,
              newValue: value,
              groupId: waterHeater.parentId,
              normal: normal,
              undo: () => {
                for (const [id, lx] of undoableChangeOnSurface.oldValues.entries()) {
                  updateWaterHeaterLyById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateWaterHeaterLyOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateWaterHeaterLyOnSurface(waterHeater.parentId, normal, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(waterHeater.id);
        const oldLength = sp ? sp.ly : waterHeater.ly;
        rejectRef.current = rejectChange(waterHeater, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldLength);
        } else {
          const undoableChange = {
            name: 'Set Water Heater Width',
            timestamp: Date.now(),
            oldValue: oldLength,
            newValue: value,
            changedElementId: waterHeater.id,
            changedElementType: waterHeater.type,
            undo: () => {
              updateWaterHeaterLyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateWaterHeaterLyById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateWaterHeaterLyById(waterHeater.id, value);
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

  console.log('min', minValue);
  return (
    <Dialog
      width={550}
      title={i18n.t('word.Width', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={minValue}
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

export default SolarWaterHeaterWidthInput;
