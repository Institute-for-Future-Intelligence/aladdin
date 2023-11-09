/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
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
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const SolarPanelTiltAngleInput = ({
  setDialogVisible,
  isOnWall,
}: {
  setDialogVisible: (b: boolean) => void;
  isOnWall?: boolean;
}) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;
  const tiltAngle = solarPanel?.tiltAngle ?? 0;

  const [inputValue, setInputValue] = useState(isOnWall ? -tiltAngle : tiltAngle);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const updateSolarPanelTiltAngleAboveFoundation = (foundationId: string, tiltAngle: number, isReverse: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          if (sp.parentType === ObjectType.Wall) {
            sp.tiltAngle = Math.min(0, isReverse ? -tiltAngle : tiltAngle);
          } else {
            sp.tiltAngle = tiltAngle;
          }
        }
      }
    });
  };

  const updateSolarPanelTiltAngleOnSurface = (parentId: string, normal: number[] | undefined, tiltAngle: number) => {
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
            sp.tiltAngle = tiltAngle;
          }
        }
      }
    });
  };

  const updateSolarPanelTiltAngleForAll = (tiltAngle: number, isReverse: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          if (sp.parentType === ObjectType.Wall) {
            sp.tiltAngle = Math.min(0, isReverse ? -tiltAngle : tiltAngle);
          } else {
            sp.tiltAngle = tiltAngle;
          }
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number, isReverse: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          if (sp.parentType === ObjectType.Wall) {
            sp.tiltAngle = Math.min(0, isReverse ? -value : value);
          } else {
            sp.tiltAngle = value;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (tiltAngle: number) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
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
                // tilt is only allowed for the top surface of a cuboid
                const sp = e as SolarPanelModel;
                if (Math.abs(sp.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (Math.abs(sp.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(solarPanel?.tiltAngle - tiltAngle) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setTiltAngle = (value: number) => {
    if (isOnWall) {
      value = -value;
    }
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
            if (0.5 * elem.ly * Math.abs(Math.sin(value)) > (elem as SolarPanelModel).poleHeight) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.tiltAngle);
        } else {
          const oldTiltAnglesSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldTiltAnglesSelected.set(elem.id, (elem as SolarPanelModel).tiltAngle);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Tilt Angle for Selected Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldTiltAnglesSelected,
            newValue: value,
            undo: () => {
              for (const [id, ta] of undoableChangeSelected.oldValues.entries()) {
                updateSolarPanelTiltAngleById(id, ta as number);
              }
            },
            redo: () => {
              updateInMap(
                undoableChangeSelected.oldValues as Map<string, number>,
                undoableChangeSelected.newValue as number,
                !isOnWall,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeSelected);
          updateInMap(oldTiltAnglesSelected, value, !isOnWall);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && (elem as SolarPanelModel).parentType !== ObjectType.Wall) {
            if (0.5 * elem.ly * Math.abs(Math.sin(value)) > (elem as SolarPanelModel).poleHeight) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.tiltAngle);
        } else {
          const oldTiltAnglesAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldTiltAnglesAll.set(elem.id, (elem as SolarPanelModel).tiltAngle);
            }
          }
          const undoableChangeAll = {
            name: 'Set Tilt Angle for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldTiltAnglesAll,
            newValue: value,
            undo: () => {
              for (const [id, ta] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelTiltAngleById(id, ta as number);
              }
            },
            redo: () => {
              updateSolarPanelTiltAngleForAll(undoableChangeAll.newValue as number, !isOnWall);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelTiltAngleForAll(value, !isOnWall);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (
              elem.type === ObjectType.SolarPanel &&
              elem.foundationId === solarPanel.foundationId &&
              (elem as SolarPanelModel).parentType !== ObjectType.Wall
            ) {
              if (0.5 * elem.ly * Math.abs(Math.sin(value)) > (elem as SolarPanelModel).poleHeight) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(solarPanel.tiltAngle);
          } else {
            const oldTiltAnglesAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldTiltAnglesAboveFoundation.set(elem.id, (elem as SolarPanelModel).tiltAngle);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Tilt Angle for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldTiltAnglesAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, ta] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelTiltAngleById(id, ta as number);
                }
                if (undoableChangeAboveFoundation.oldValues.size % 2 === 0) {
                  useStore.getState().set((state) => {});
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelTiltAngleAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                    !isOnWall,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelTiltAngleAboveFoundation(solarPanel.foundationId, value, !isOnWall);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
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
                // tilt is only allowed for the top surface of a cuboid
                if (0.5 * elem.ly * Math.abs(Math.sin(value)) > (elem as SolarPanelModel).poleHeight) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          } else if (solarPanel.parentType === ObjectType.Wall) {
            rejectRef.current = false;
          } else {
            // tilt is only allowed on top of a foundation or a roof
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                if (0.5 * elem.ly * Math.abs(Math.sin(value)) > (elem as SolarPanelModel).poleHeight) {
                  rejectRef.current = true;
                  break;
                }
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(solarPanel.tiltAngle);
          } else {
            const oldTiltAnglesOnSurface = new Map<string, number>();
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldTiltAnglesOnSurface.set(elem.id, (elem as SolarPanelModel).tiltAngle);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldTiltAnglesOnSurface.set(elem.id, (elem as SolarPanelModel).tiltAngle);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Tilt Angle for All Solar Panel Arrays on Surface',
              timestamp: Date.now(),
              oldValues: oldTiltAnglesOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, ta] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelTiltAngleById(id, ta as number);
                }
                if (undoableChangeOnSurface.oldValues.size % 2 === 0) {
                  useStore.getState().set((state) => {});
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelTiltAngleOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelTiltAngleOnSurface(solarPanel.parentId, normal, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldTiltAngle = sp ? sp.tiltAngle : solarPanel.tiltAngle;
        rejectRef.current = 0.5 * solarPanel.ly * Math.abs(Math.sin(value)) > solarPanel.poleHeight;
        if (solarPanel.parentType === ObjectType.Wall) {
          rejectRef.current = false;
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldTiltAngle);
        } else {
          const undoableChange = {
            name: 'Set Solar Panel Array Tilt Angle',
            timestamp: Date.now(),
            oldValue: oldTiltAngle,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateSolarPanelTiltAngleById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSolarPanelTiltAngleById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSolarPanelTiltAngleById(solarPanel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.solarPanelTiltAngle = value;
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
    setTiltAngle(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setTiltAngle(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + Util.toDegrees(rejectedValue.current).toFixed(1) + '°)' : null)
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('solarPanelMenu.TiltAngle', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={isOnWall ? 0 : -90}
            max={90}
            style={{ width: 120 }}
            precision={2}
            // make sure that we round up the number as toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            step={1}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [{isOnWall ? '0°' : '-90°'}, 90°]
            <br />
            {i18n.t('solarPanelMenu.SouthFacingIsPositive', lang)}
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={18}
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
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('solarPanelMenu.AllSelectedSolarPanels', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPanelTiltAngleInput;
