/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';

const SolarWaterHeaterRelativeAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateRelativeAzimuthById = useStore(Selector.updateSolarCollectorRelativeAzimuthById);
  const updateRelativeAzimuthOnSurface = useStore(Selector.updateSolarCollectorRelativeAzimuthOnSurface);
  const updateRelativeAzimuthAboveFoundation = useStore(Selector.updateSolarCollectorRelativeAzimuthAboveFoundation);
  const updateRelativeAzimuthForAll = useStore(Selector.updateSolarCollectorRelativeAzimuthForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarWaterHeaterActionScope);
  const setActionScope = useStore(Selector.setSolarWaterHeaterActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const waterHeater = useSelectedElement(ObjectType.SolarWaterHeater) as SolarWaterHeaterModel | undefined;

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  // unfortunately, the variable should not be named as relativeAzimuth. Instead, it should have been named as
  // relativeRotationAngle. Keep this in mind that relativeAzimuth is NOT really azimuth.
  const [inputValue, setInputValue] = useState(waterHeater ? -waterHeater.relativeAzimuth : 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (sp: SolarWaterHeaterModel, azimuth: number) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // azimuth should not be changed for solar panels on a vertical side of a cuboid
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarWaterHeaterModel;
      clone.relativeAzimuth = -azimuth;
      if (parent.type === ObjectType.Roof) {
        // todo: water heater
        // return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
        return true;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarWaterHeaterModel, azimuth: number) => {
    // check if the new relative azimuth will cause the solar panel to be out of the bound
    if (!withinParent(sp, azimuth)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (azimuth: number) => {
    if (!waterHeater) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.SolarWaterHeater &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const sp = e as SolarWaterHeaterModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && !e.locked) {
            const sp = e as SolarWaterHeaterModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarWaterHeater && e.foundationId === waterHeater?.foundationId && !e.locked) {
            const sp = e as SolarWaterHeaterModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (waterHeater?.parentId) {
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
                  // azimuth change is only allowed for the top surface of a cuboid
                  const sp = e as SolarWaterHeaterModel;
                  if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            } else {
              // azimuth change is only allowed on top of a foundation or a roof
              for (const e of elements) {
                if (e.type === ObjectType.SolarWaterHeater && e.parentId === waterHeater.parentId && !e.locked) {
                  const sp = e as SolarWaterHeaterModel;
                  if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(-waterHeater?.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarWaterHeater && !e.locked && map.has(e.id)) {
          const sp = e as SolarWaterHeaterModel;
          sp.relativeAzimuth = value;
        }
      }
    });
  };

  const setRelativeAzimuth = (value: number) => {
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
          setInputValue(-waterHeater.relativeAzimuth);
        } else {
          const oldRelativeAzimuthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarWaterHeater && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldRelativeAzimuthsSelected.set(elem.id, -(elem as SolarWaterHeaterModel).relativeAzimuth);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Relative Azimuth for Selected Water Heater',
            timestamp: Date.now(),
            oldValues: oldRelativeAzimuthsSelected,
            newValue: value,
            undo: () => {
              for (const [id, ra] of undoableChangeSelected.oldValues.entries()) {
                updateRelativeAzimuthById(id, -(ra as number));
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
          updateInMap(oldRelativeAzimuthsSelected, -value);
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
          setInputValue(-waterHeater.relativeAzimuth);
        } else {
          const oldRelativeAzimuthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarWaterHeater) {
              oldRelativeAzimuthsAll.set(elem.id, -(elem as SolarWaterHeaterModel).relativeAzimuth);
            }
          }
          const undoableChangeAll = {
            name: 'Set Relative Azimuth for All Water Heater',
            timestamp: Date.now(),
            oldValues: oldRelativeAzimuthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ra] of undoableChangeAll.oldValues.entries()) {
                updateRelativeAzimuthById(id, -(ra as number));
              }
            },
            redo: () => {
              updateRelativeAzimuthForAll(ObjectType.SolarWaterHeater, -(undoableChangeAll.newValue as number));
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateRelativeAzimuthForAll(ObjectType.SolarWaterHeater, -value);
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
            setInputValue(-waterHeater.relativeAzimuth);
          } else {
            const oldRelativeAzimuthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarWaterHeater && elem.foundationId === waterHeater.foundationId) {
                oldRelativeAzimuthsAboveFoundation.set(elem.id, -(elem as SolarWaterHeaterModel).relativeAzimuth);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Relative Azimuth for All Water Heater Above Foundation',
              timestamp: Date.now(),
              oldValues: oldRelativeAzimuthsAboveFoundation,
              newValue: value,
              groupId: waterHeater.foundationId,
              undo: () => {
                for (const [id, ra] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateRelativeAzimuthById(id, -(ra as number));
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateRelativeAzimuthAboveFoundation(
                    ObjectType.SolarWaterHeater,
                    undoableChangeAboveFoundation.groupId,
                    -(undoableChangeAboveFoundation.newValue as number),
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateRelativeAzimuthAboveFoundation(ObjectType.SolarWaterHeater, waterHeater.foundationId, -value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        if (waterHeater.parentId) {
          const parent = getParent(waterHeater);
          if (parent) {
            rejectRef.current = false;
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarWaterHeater &&
                  !elem.locked &&
                  elem.parentId === waterHeater.parentId &&
                  Util.isIdentical(elem.normal, waterHeater.normal)
                ) {
                  if (rejectChange(elem as SolarWaterHeaterModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            } else {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarWaterHeater &&
                  !elem.locked &&
                  elem.parentId === waterHeater.parentId
                ) {
                  if (rejectChange(elem as SolarWaterHeaterModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            }
            if (rejectRef.current) {
              rejectedValue.current = value;
              setInputValue(-waterHeater.relativeAzimuth);
            } else {
              const oldRelativeAzimuthsOnSurface = new Map<string, number>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarWaterHeater &&
                    elem.parentId === waterHeater.parentId &&
                    Util.isIdentical(elem.normal, waterHeater.normal)
                  ) {
                    oldRelativeAzimuthsOnSurface.set(elem.id, -(elem as SolarWaterHeaterModel).relativeAzimuth);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarWaterHeater && elem.parentId === waterHeater.parentId) {
                    oldRelativeAzimuthsOnSurface.set(elem.id, -(elem as SolarWaterHeaterModel).relativeAzimuth);
                  }
                }
              }
              const normal = isParentCuboid ? waterHeater.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Relative Azimuth for All Water Heater on Surface',
                timestamp: Date.now(),
                oldValues: oldRelativeAzimuthsOnSurface,
                newValue: value,
                groupId: waterHeater.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, ra] of undoableChangeOnSurface.oldValues.entries()) {
                    updateRelativeAzimuthById(id, -(ra as number));
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateRelativeAzimuthOnSurface(
                      ObjectType.SolarWaterHeater,
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      -(undoableChangeOnSurface.newValue as number),
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateRelativeAzimuthOnSurface(ObjectType.SolarWaterHeater, waterHeater.parentId, normal, -value);
              setApplyCount(applyCount + 1);
            }
          }
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(waterHeater.id) as SolarWaterHeaterModel;
        const oldRelativeAzimuth = sp ? -sp.relativeAzimuth : -waterHeater.relativeAzimuth;
        rejectRef.current = rejectChange(waterHeater, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldRelativeAzimuth);
        } else {
          const undoableChange = {
            name: 'Set Solar Panel Array Relative Azimuth',
            timestamp: Date.now(),
            oldValue: oldRelativeAzimuth,
            newValue: value,
            changedElementId: waterHeater.id,
            changedElementType: waterHeater.type,
            undo: () => {
              updateRelativeAzimuthById(undoableChange.changedElementId, -(undoableChange.oldValue as number));
            },
            redo: () => {
              updateRelativeAzimuthById(undoableChange.changedElementId, -(undoableChange.newValue as number));
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateRelativeAzimuthById(waterHeater.id, -value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarWaterHeaterRelativeAzimuth = -value;
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
    setRelativeAzimuth(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setRelativeAzimuth(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + Util.toDegrees(rejectedValue.current).toFixed(1) + '°)' : null)
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('solarCollectorMenu.RelativeAzimuth', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            precision={2}
            step={1}
            // make sure that we round up the number as toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-180°, 180°]
            <br />
            {i18n.t('message.AzimuthOfNorthIsZero', lang)}
            <br />
            {i18n.t('message.CounterclockwiseAzimuthIsPositive', lang)}
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={18}
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

export default SolarWaterHeaterRelativeAzimuthInput;
