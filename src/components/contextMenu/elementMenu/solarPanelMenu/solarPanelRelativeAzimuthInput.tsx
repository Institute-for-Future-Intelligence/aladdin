/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ElementState, ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from '../../../../constants';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const SolarPanelRelativeAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateRelativeAzimuthById = useStore(Selector.updateSolarCollectorRelativeAzimuthById);
  const updateRelativeAzimuthOnSurface = useStore(Selector.updateSolarCollectorRelativeAzimuthOnSurface);
  const updateRelativeAzimuthAboveFoundation = useStore(Selector.updateSolarCollectorRelativeAzimuthAboveFoundation);
  const updateRelativeAzimuthForAll = useStore(Selector.updateSolarCollectorRelativeAzimuthForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  // unfortunately, the variable should not be named as relativeAzimuth. Instead, it should have been named as
  // relativeRotationAngle. Keep this in mind that relativeAzimuth is NOT really azimuth.
  const [inputValue, setInputValue] = useState(solarPanel ? -solarPanel.relativeAzimuth : 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (sp: SolarPanelModel, azimuth: number) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // azimuth should not be changed for solar panels on a vertical side of a cuboid
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.relativeAzimuth = -azimuth;
      if (parent.type === ObjectType.Roof) {
        return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, azimuth: number) => {
    // check if the new relative azimuth will cause the solar panel to be out of the bound
    if (!withinParent(sp, azimuth)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (azimuth: number) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.SolarPanel &&
            !e.locked &&
            (e as SolarPanelModel).parentType !== ObjectType.Wall &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const sp = e as SolarPanelModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && (e as SolarPanelModel).parentType !== ObjectType.Wall) {
            const sp = e as SolarPanelModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.SolarPanel &&
            e.foundationId === solarPanel?.foundationId &&
            !e.locked &&
            (e as SolarPanelModel).parentType !== ObjectType.Wall
          ) {
            const sp = e as SolarPanelModel;
            if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel?.parentId) {
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
                  // azimuth change is only allowed for the top surface of a cuboid
                  const sp = e as SolarPanelModel;
                  if (Math.abs(-sp.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            } else {
              // azimuth change is only allowed on top of a foundation or a roof
              for (const e of elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                  const sp = e as SolarPanelModel;
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
        if (Math.abs(-solarPanel?.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
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
          sp.relativeAzimuth = value;
        }
      }
    });
  };

  const setRelativeAzimuth = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (
            elem.type === ObjectType.SolarPanel &&
            (elem as SolarPanelModel).parentType !== ObjectType.Wall &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(-solarPanel.relativeAzimuth);
        } else {
          const oldRelativeAzimuthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarPanel &&
              (elem as SolarPanelModel).parentType !== ObjectType.Wall &&
              useStore.getState().selectedElementIdSet.has(elem.id)
            ) {
              oldRelativeAzimuthsSelected.set(elem.id, -(elem as SolarPanelModel).relativeAzimuth);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Relative Azimuth for Selected Solar Panel Arrays',
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
          if (elem.type === ObjectType.SolarPanel && (elem as SolarPanelModel).parentType !== ObjectType.Wall) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(-solarPanel.relativeAzimuth);
        } else {
          const oldRelativeAzimuthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && (elem as SolarPanelModel).parentType !== ObjectType.Wall) {
              oldRelativeAzimuthsAll.set(elem.id, -(elem as SolarPanelModel).relativeAzimuth);
            }
          }
          const undoableChangeAll = {
            name: 'Set Relative Azimuth for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldRelativeAzimuthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ra] of undoableChangeAll.oldValues.entries()) {
                updateRelativeAzimuthById(id, -(ra as number));
              }
            },
            redo: () => {
              updateRelativeAzimuthForAll(ObjectType.SolarPanel, -(undoableChangeAll.newValue as number));
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateRelativeAzimuthForAll(ObjectType.SolarPanel, -value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarPanel &&
              elem.foundationId === solarPanel.foundationId &&
              (elem as SolarPanelModel).parentType !== ObjectType.Wall
            ) {
              if (rejectChange(elem as SolarPanelModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(-solarPanel.relativeAzimuth);
          } else {
            const oldRelativeAzimuthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.foundationId === solarPanel.foundationId &&
                (elem as SolarPanelModel).parentType !== ObjectType.Wall
              ) {
                oldRelativeAzimuthsAboveFoundation.set(elem.id, -(elem as SolarPanelModel).relativeAzimuth);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Relative Azimuth for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldRelativeAzimuthsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, ra] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateRelativeAzimuthById(id, -(ra as number));
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateRelativeAzimuthAboveFoundation(
                    ObjectType.SolarPanel,
                    undoableChangeAboveFoundation.groupId,
                    -(undoableChangeAboveFoundation.newValue as number),
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateRelativeAzimuthAboveFoundation(ObjectType.SolarPanel, solarPanel.foundationId, -value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        if (solarPanel.parentId) {
          const parent = getParent(solarPanel);
          if (parent) {
            rejectRef.current = false;
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  if (rejectChange(elem as SolarPanelModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  if (rejectChange(elem as SolarPanelModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            }
            if (rejectRef.current) {
              rejectedValue.current = value;
              setInputValue(-solarPanel.relativeAzimuth);
            } else {
              const oldRelativeAzimuthsOnSurface = new Map<string, number>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarPanel &&
                    elem.parentId === solarPanel.parentId &&
                    Util.isIdentical(elem.normal, solarPanel.normal)
                  ) {
                    oldRelativeAzimuthsOnSurface.set(elem.id, -(elem as SolarPanelModel).relativeAzimuth);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                    oldRelativeAzimuthsOnSurface.set(elem.id, -(elem as SolarPanelModel).relativeAzimuth);
                  }
                }
              }
              const normal = isParentCuboid ? solarPanel.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Relative Azimuth for All Solar Panel Arrays on Surface',
                timestamp: Date.now(),
                oldValues: oldRelativeAzimuthsOnSurface,
                newValue: value,
                groupId: solarPanel.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, ra] of undoableChangeOnSurface.oldValues.entries()) {
                    updateRelativeAzimuthById(id, -(ra as number));
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateRelativeAzimuthOnSurface(
                      ObjectType.SolarPanel,
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      -(undoableChangeOnSurface.newValue as number),
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateRelativeAzimuthOnSurface(ObjectType.SolarPanel, solarPanel.parentId, normal, -value);
              setApplyCount(applyCount + 1);
            }
          }
        }
        break;
      }
      default: {
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldRelativeAzimuth = sp ? -sp.relativeAzimuth : -solarPanel.relativeAzimuth;
        rejectRef.current = rejectChange(solarPanel, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldRelativeAzimuth);
        } else {
          const undoableChange = {
            name: 'Set Solar Panel Array Relative Azimuth',
            timestamp: Date.now(),
            oldValue: oldRelativeAzimuth,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateRelativeAzimuthById(undoableChange.changedElementId, -(undoableChange.oldValue as number));
            },
            redo: () => {
              updateRelativeAzimuthById(undoableChange.changedElementId, -(undoableChange.newValue as number));
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateRelativeAzimuthById(solarPanel.id, -value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelRelativeAzimuth = -value;
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

export default SolarPanelRelativeAzimuthInput;
