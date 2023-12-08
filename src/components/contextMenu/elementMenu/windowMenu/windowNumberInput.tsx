/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WindowModel } from 'src/models/WindowModel';
import { WindowDataType } from './windowMenu';
import Dialog from '../../dialog';

import { useLanguage } from 'src/views/hooks';

export interface WindowNumberInputProps {
  windowModel: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  setDialogVisible: (b: boolean) => void;
  unit?: string;
  note?: string;
  digit?: number;
}

const WindowNumberInput = ({
  windowModel,
  dataType,
  attributeKey,
  range,
  step,
  unit,
  note,
  digit,
  setDialogVisible,
}: WindowNumberInputProps) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);
  const getParent = useStore(Selector.getParent);

  const currentValue = useMemo(() => {
    const v = windowModel[attributeKey] as number;
    const parent = getParent(windowModel);
    if (parent) {
      // roof windows have absolute size
      if (windowModel.parentType !== ObjectType.Roof) {
        if (attributeKey === 'lx') return v * parent.lx;
        if (attributeKey === 'lz') return v * parent.lz;
      }
    }
    if (attributeKey === 'sillWidth' && v === undefined) return 0.2;
    return v;
  }, [attributeKey, windowModel]);

  const [inputValue, setInputValue] = useState<number>(currentValue);

  const lang = useLanguage();

  const setAttribute = (window: WindowModel, attributeKey: keyof WindowModel, value: number) => {
    const parent = getParent(window);
    if (parent && (attributeKey === 'lx' || attributeKey === 'lz')) {
      if (window.parentType === ObjectType.Roof) {
        // width and height are absolute when the parent is a roof
        (window[attributeKey] as number) = value;
      } else {
        // width and height are relative to the parent when it is not a roof
        (window[attributeKey] as number) = value / parent[attributeKey];
      }
    } else {
      (window[attributeKey] as number) = value;
    }
  };

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Window) {
            setAttribute(e as WindowModel, attributeKey, value);
          }
          break;
        }
      }
    });
  };

  const updateOnSameWall = (wallId: string | undefined, value: number) => {
    if (!wallId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.parentId === wallId) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string | undefined, value: number) => {
    if (!foundationId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.foundationId === foundationId) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const updateForAll = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && map.has(e.id)) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const needChange = (value: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const w = e as WindowModel;
            const parent = getParent(w);
            if (parent && w.parentType !== ObjectType.Roof) {
              // on a wall
              if (attributeKey === 'lx') {
                if (value !== w[attributeKey] * parent.lx) return true;
              } else if (attributeKey === 'lz') {
                if (value !== w[attributeKey] * parent.lz) return true;
              } else {
                if (value !== w[attributeKey]) return true;
              }
            } else {
              if (value !== w[attributeKey]) return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            const w = e as WindowModel;
            const parent = getParent(w);
            if (parent && w.parentType !== ObjectType.Roof) {
              // on a wall
              if (attributeKey === 'lx') {
                if (value !== w[attributeKey] * parent.lx) return true;
              } else if (attributeKey === 'lz') {
                if (value !== w[attributeKey] * parent.lz) return true;
              } else {
                if (value !== w[attributeKey]) return true;
              }
            } else {
              if (value !== w[attributeKey]) return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !e.locked) {
            const w = e as WindowModel;
            const parent = getParent(w);
            if (parent && w.parentType !== ObjectType.Roof) {
              // on a wall
              if (attributeKey === 'lx') {
                if (value !== w[attributeKey] * parent.lx) return true;
              } else if (attributeKey === 'lz') {
                if (value !== w[attributeKey] * parent.lz) return true;
              } else {
                if (value !== w[attributeKey]) return true;
              }
            } else {
              if (value !== w[attributeKey]) return true;
            }
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
            const w = e as WindowModel;
            const parent = getParent(w);
            if (parent && w.parentType !== ObjectType.Roof) {
              // on a wall
              if (attributeKey === 'lx') {
                if (value !== w[attributeKey] * parent.lx) return true;
              } else if (attributeKey === 'lz') {
                if (value !== w[attributeKey] * parent.lz) return true;
              } else {
                if (value !== w[attributeKey]) return true;
              }
            } else {
              if (value !== w[attributeKey]) return true;
            }
          }
        }
        break;
      default:
        const parent = getParent(windowModel);
        if (parent && windowModel.parentType !== ObjectType.Roof) {
          // on a wall
          if (attributeKey === 'lx') {
            if (value !== windowModel[attributeKey] * parent.lx) return true;
          } else if (attributeKey === 'lz') {
            if (value !== windowModel[attributeKey] * parent.lz) return true;
          } else {
            if (value !== windowModel[attributeKey]) return true;
          }
        } else {
          if (value !== windowModel[attributeKey]) return true;
        }
        break;
    }
    return false;
  };

  const updateValue = (value: number) => {
    if (!windowModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const window = e as WindowModel;
            const parent = getParent(window);
            let oldValue = window[attributeKey] as number;
            if (parent && window.parentType !== ObjectType.Roof) {
              if (attributeKey === 'lx') {
                oldValue *= parent.lx;
              } else if (attributeKey === 'lz') {
                oldValue *= parent.lz;
              }
            }
            oldValuesSelected.set(e.id, oldValue);
          }
        }
        const undoableChangeSelected = {
          name: `Set ${dataType} for Selected Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeSelected.oldValues as Map<string, number>);
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
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            const window = e as WindowModel;
            const parent = getParent(window);
            let oldValue = window[attributeKey] as number;
            if (parent && window.parentType !== ObjectType.Roof) {
              if (attributeKey === 'lx') {
                oldValue *= parent.lx;
              } else if (attributeKey === 'lz') {
                oldValue *= parent.lz;
              }
            }
            oldValuesAll.set(e.id, oldValue);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !e.locked) {
              const window = e as WindowModel;
              const parent = getParent(window);
              let oldValue = window[attributeKey] as number;
              if (parent && window.parentType !== ObjectType.Roof) {
                if (attributeKey === 'lx') {
                  oldValue *= parent.lx;
                } else if (attributeKey === 'lz') {
                  oldValue *= parent.lz;
                }
              }
              oldValuesAboveFoundation.set(e.id, oldValue);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateAboveFoundation(windowModel.foundationId, undoableChangeAboveFoundation.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windowModel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (windowModel.parentId) {
          const oldValuesOnSameWall = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              const window = e as WindowModel;
              const parent = getParent(window);
              let oldValue = window[attributeKey] as number;
              if (parent && window.parentType !== ObjectType.Roof) {
                if (attributeKey === 'lx') {
                  oldValue *= parent.lx;
                } else if (attributeKey === 'lz') {
                  oldValue *= parent.lz;
                }
              }
              oldValuesOnSameWall.set(e.id, oldValue);
            }
          }
          const undoableChangeOnSameParent = {
            name: `Set ${dataType} for All Windows On the Same Parent`,
            timestamp: Date.now(),
            oldValues: oldValuesOnSameWall,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameParent.oldValues as Map<string, number>);
            },
            redo: () => {
              updateOnSameWall(windowModel.parentId, undoableChangeOnSameParent.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameParent);
          updateOnSameWall(windowModel.parentId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowModel) {
          let oldValue = windowModel[attributeKey] as number;
          const parent = getParent(windowModel);
          if (parent && windowModel.parentType !== ObjectType.Roof) {
            if (attributeKey === 'lx') {
              oldValue *= parent.lx;
            } else if (attributeKey === 'lz') {
              oldValue *= parent.lz;
            }
          }
          const undoableChange = {
            name: `Set Window ${dataType}`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: windowModel.id,
            changedElementType: windowModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowModel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      switch (dataType) {
        case WindowDataType.Width:
          state.actionState.windowWidth = value;
          break;
        case WindowDataType.Height:
          state.actionState.windowHeight = value;
          break;
        case WindowDataType.Opacity:
          state.actionState.windowOpacity = value;
          break;
        case WindowDataType.FrameWidth:
          state.actionState.windowFrameWidth = value;
          break;
        case WindowDataType.SillWidth:
          state.actionState.windowSillWidth = value;
          break;
        case WindowDataType.HorizontalMullionSpacing:
          state.actionState.windowHorizontalMullionSpacing = value;
          break;
        case WindowDataType.VerticalMullionSpacing:
          state.actionState.windowVerticalMullionSpacing = value;
          break;
        case WindowDataType.MullionWidth:
          state.actionState.windowMullionWidth = value;
          break;
      }
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateValue(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t(`windowMenu.${dataType}`, lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={range[0]}
            max={range[1]}
            style={{ width: 120 }}
            step={step}
            precision={2}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [{range[0].toFixed(range[0] === 0 ? 0 : digit ?? 0)},{' '}
            {range[1].toFixed(digit ?? 0)}] {unit} <br />
            <br /> {note}
          </div>
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {unit}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWindowActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('windowMenu.OnlyThisWindow', lang)}</Radio>
              <Radio value={Scope.OnlyThisSide}>{i18n.t('windowMenu.AllWindowsOnSurface', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windowMenu.AllWindowsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('windowMenu.AllSelectedWindows', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('windowMenu.AllWindows', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindowNumberInput;
