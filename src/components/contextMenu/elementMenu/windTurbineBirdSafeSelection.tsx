/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { BirdSafeDesign, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';
import { WindTurbineModel } from '../../../models/WindTurbineModel';
import { DEFAULT_WIND_TURBINE_BLADE_COLOR, DEFAULT_WIND_TURBINE_STRIPE_COLOR } from '../../../constants';

const WindTurbineBirdSafeSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windTurbineActionScope);
  const setActionScope = useStore(Selector.setWindTurbineActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const windTurbine = useSelectedElement(ObjectType.WindTurbine) as WindTurbineModel | undefined;
  const [inputValue, setInputValue] = useState(windTurbine?.birdSafe ?? BirdSafeDesign.None);
  const [inputColor1, setInputColor1] = useState(windTurbine?.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR);
  const [inputColor2, setInputColor2] = useState(windTurbine?.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR);

  const lang = useLanguage();
  const { Option } = Select;

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (design: BirdSafeDesign, color1: string, color2: string) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (
              (wt.birdSafe ?? BirdSafeDesign.None) !== design ||
              (wt.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR) !== color1 ||
              (wt.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR) !== color2
            ) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (
              (wt.birdSafe ?? BirdSafeDesign.None) !== design ||
              (wt.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR) !== color1 ||
              (wt.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR) !== color2
            ) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (
              (wt.birdSafe ?? BirdSafeDesign.None) !== design ||
              (wt.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR) !== color1 ||
              (wt.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR) !== color2
            ) {
              return true;
            }
          }
        }
        break;
      default:
        if (
          (windTurbine.birdSafe ?? BirdSafeDesign.None) !== design ||
          (windTurbine.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR) !== color1 ||
          (windTurbine.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR) !== color2
        ) {
          return true;
        }
    }
    return false;
  };

  const updateById = (id: string, design: BirdSafeDesign, color1: string, color2: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = design;
          wt.bladeColor = color1;
          wt.stripeColor = color2;
          break;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, design: BirdSafeDesign, color1: string, color2: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = design;
          wt.bladeColor = color1;
          wt.stripeColor = color2;
        }
      }
    });
  };

  const updateForAll = (design: BirdSafeDesign, color1: string, color2: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = design;
          wt.bladeColor = color1;
          wt.stripeColor = color2;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string[]>, design: BirdSafeDesign, color1: string, color2: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = design;
          wt.bladeColor = color1;
          wt.stripeColor = color2;
        }
      }
    });
  };

  const setValue = (design: BirdSafeDesign, color1: string, color2: string) => {
    if (!windTurbine) return;
    if (!needChange(design, color1, color2)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, string[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const wt = elem as WindTurbineModel;
            oldValuesSelected.set(elem.id, [
              (wt.birdSafe ?? BirdSafeDesign.None).toString(),
              wt.bladeColor,
              wt.stripeColor,
            ]);
          }
        }
        const undoableChangeSelected = {
          name: 'Select Bird-Safe Design for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: [design.toString(), color1, color2],
          undo: () => {
            for (const [id, u] of undoableChangeSelected.oldValues.entries()) {
              const v = u as string[];
              updateById(id, Number(v[0]) as BirdSafeDesign, v[1], v[2]);
            }
          },
          redo: () => {
            const v = undoableChangeSelected.newValue as string[];
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string[]>,
              Number(v[0]) as BirdSafeDesign,
              v[1],
              v[2],
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, design, color1, color2);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, string[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            const wt = elem as WindTurbineModel;
            oldValuesAll.set(elem.id, [(wt.birdSafe ?? BirdSafeDesign.None).toString(), wt.bladeColor, wt.stripeColor]);
          }
        }
        const undoableChangeAll = {
          name: 'Select Bird-Safe Design for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: [design.toString(), color1, color2],
          undo: () => {
            for (const [id, u] of undoableChangeAll.oldValues.entries()) {
              const v = u as string[];
              updateById(id, Number(v[0]) as BirdSafeDesign, v[1], v[2]);
            }
          },
          redo: () => {
            const v = undoableChangeAll.newValue as string[];
            updateForAll(Number(v[0]) as BirdSafeDesign, v[1], v[2]);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(design, color1, color2);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windTurbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string[]>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              const wt = elem as WindTurbineModel;
              oldValuesAboveFoundation.set(elem.id, [
                (wt.birdSafe ?? BirdSafeDesign.None).toString(),
                wt.bladeColor,
                wt.stripeColor,
              ]);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Select Bird-Safe Design for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: [design.toString(), color1, color2],
            groupId: windTurbine.foundationId,
            undo: () => {
              for (const [id, u] of undoableChangeAboveFoundation.oldValues.entries()) {
                const v = u as string[];
                updateById(id, Number(v[0]) as BirdSafeDesign, v[1], v[2]);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                const v = undoableChangeAboveFoundation.newValue as string[];
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  Number(v[0]) as BirdSafeDesign,
                  v[1],
                  v[2],
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windTurbine.foundationId, design, color1, color2);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldDesign = wt ? wt.birdSafe ?? BirdSafeDesign.None : windTurbine.birdSafe ?? BirdSafeDesign.None;
        const oldColor1 = wt
          ? wt.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR
          : windTurbine.bladeColor ?? DEFAULT_WIND_TURBINE_BLADE_COLOR;
        const oldColor2 = wt
          ? wt.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR
          : windTurbine.stripeColor ?? DEFAULT_WIND_TURBINE_STRIPE_COLOR;
        const oldValue = [oldDesign.toString(), oldColor1, oldColor2];
        const undoableChange = {
          name: 'Select Bird-Safe Design for Wind Turbine',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: [design.toString(), color1, color2],
          changedElementId: windTurbine.id,
          changedElementType: windTurbine.type,
          undo: () => {
            const v = undoableChange.oldValue as string[];
            updateById(undoableChange.changedElementId, Number(v[0]) as BirdSafeDesign, v[1], v[2]);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, design, color1, color2);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(windTurbine.id, design, color1, color2);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.windTurbineBirdSafeDesign = design;
      state.actionState.windTurbineBladeColor = color1;
      state.actionState.windTurbineStripeColor = color2;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setValue(inputValue, inputColor1, inputColor2);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setValue(inputValue, inputColor1, inputColor2);
  };

  return (
    <Dialog
      width={600}
      title={i18n.t('windTurbineMenu.BirdSafeDesign', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={8}>
          <label>{i18n.t('word.Pattern', lang)}: </label>
          <Select
            style={{ width: '116px' }}
            value={inputValue}
            onChange={(value) => {
              if (value !== null) setInputValue(value);
            }}
          >
            <Option key={BirdSafeDesign.None} value={BirdSafeDesign.None}>
              {i18n.t('windTurbineMenu.BirdSafeNone', lang)}
            </Option>
            <Option key={BirdSafeDesign.Bicolor} value={BirdSafeDesign.Bicolor}>
              {i18n.t('windTurbineMenu.BirdSafeBicolor', lang)}
            </Option>
            <Option key={BirdSafeDesign.Striped} value={BirdSafeDesign.Striped}>
              {i18n.t('windTurbineMenu.BirdSafeStriped', lang)}
            </Option>
          </Select>
          <div style={{ marginTop: '10px' }}>
            <label>{i18n.t('word.Color', lang)} 1: </label>
            <input
              type="color"
              value={inputColor1}
              onChange={(event) => {
                setInputColor1(event.target.value);
              }}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>{i18n.t('word.Color', lang)} 2: </label>
            <input
              type="color"
              value={inputColor2}
              onChange={(event) => {
                setInputColor2(event.target.value);
              }}
            />
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('windTurbineMenu.OnlyThisWindTurbine', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windTurbineMenu.AllWindTurbinesAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('windTurbineMenu.AllSelectedWindTurbines', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('windTurbineMenu.AllWindTurbines', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindTurbineBirdSafeSelection;
