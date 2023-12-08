/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { SolarPanelModel } from '../../../../models/SolarPanelModel';
import { ElementState, ObjectType, Orientation, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from '../../../../constants';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';

const SolarPanelLengthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getPvModule = useStore(Selector.getPvModule);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const [inputValue, setInputValue] = useState(
    solarPanel?.orientation === Orientation.portrait ? solarPanel?.lx ?? 1 : solarPanel?.ly ?? 2,
  );

  const [dx, setDx] = useState<number>(0);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  useEffect(() => {
    if (solarPanel) {
      const pvModel = getPvModule(solarPanel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');
      setDx(solarPanel.orientation === Orientation.portrait ? pvModel.width : pvModel.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanel]);

  const updateSolarPanelLxById = (id: string, lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          const sp = e as SolarPanelModel;
          const pv = state.getPvModule(sp.pvModelName);
          e.lx = Util.panelizeLx(sp, pv, lx);
          break;
        }
      }
    });
  };

  const updateSolarPanelLxAboveFoundation = (foundationId: string, lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          const pv = state.getPvModule(sp.pvModelName);
          e.lx = Util.panelizeLx(sp, pv, lx);
        }
      }
    });
  };

  const updateSolarPanelLxOnSurface = (parentId: string, normal: number[] | undefined, lx: number) => {
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
            const pv = state.getPvModule(sp.pvModelName);
            e.lx = Util.panelizeLx(sp, pv, lx);
          }
        }
      }
    });
  };

  const updateSolarPanelLxForAll = (lx: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          const pv = state.getPvModule(sp.pvModelName);
          e.lx = Util.panelizeLx(sp, pv, lx);
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          const sp = e as SolarPanelModel;
          const pv = state.getPvModule(sp.pvModelName);
          e.lx = Util.panelizeLx(sp, pv, value);
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (sp: SolarPanelModel, lx: number) => {
    const parent = getParent(sp);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.lx = lx;
      if (parent.type === ObjectType.Wall) {
        // maybe outside bound or overlap with others
        return Util.checkElementOnWallState(clone, parent) === ElementState.Valid;
      }
      if (parent.type === ObjectType.Roof) {
        return Util.checkElementOnRoofState(clone, parent as RoofModel) === ElementState.Valid;
      }
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, lx: number) => {
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
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
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
                if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(solarPanel?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setLength = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.lx);
        } else {
          const oldLengthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLengthsSelected.set(elem.id, elem.lx);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Length for Selected Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldLengthsSelected,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeSelected.oldValues.entries()) {
                updateSolarPanelLxById(id, lx as number);
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
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(solarPanel.lx);
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLengthsAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelLxById(id, lx as number);
              }
            },
            redo: () => {
              updateSolarPanelLxForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelLxForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              if (rejectChange(elem as SolarPanelModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(solarPanel.lx);
          } else {
            const oldLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldLengthsAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Length for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLengthsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, lx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelLxAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelLxAboveFoundation(solarPanel.foundationId, value);
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
            setInputValue(solarPanel.lx);
          } else {
            const oldLengthsOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldLengthsOnSurface.set(elem.id, elem.lx);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldLengthsOnSurface.set(elem.id, elem.lx);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Length for All Solar Panel Arrays on Surface',
              timestamp: Date.now(),
              oldValues: oldLengthsOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, lx] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelLxOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelLxOnSurface(solarPanel.parentId, normal, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id);
        const oldLength = sp ? sp.lx : solarPanel.lx;
        rejectRef.current = rejectChange(solarPanel, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldLength);
        } else {
          const undoableChange = {
            name: 'Set Solar Panel Array Length',
            timestamp: Date.now(),
            oldValue: oldLength,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateSolarPanelLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSolarPanelLxById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSolarPanelLxById(solarPanel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const panelize = (value: number) => {
    let w = value ?? 1;
    const n = Math.max(1, Math.ceil((w - dx / 2) / dx));
    w = n * dx;
    return w;
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
            min={dx}
            max={100 * dx}
            step={dx}
            style={{ width: 120 }}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(panelize(value));
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {Math.round(inputValue / dx) + ' ' + i18n.t('solarPanelMenu.PanelsWide', lang)}
            <br />
            {i18n.t('word.MaximumNumber', lang)}: 100 {i18n.t('solarPanelMenu.Panels', lang)}
          </div>
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

export default SolarPanelLengthInput;
