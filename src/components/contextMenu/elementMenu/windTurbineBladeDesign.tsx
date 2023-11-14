/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { HALF_PI, ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';
import { WindTurbineModel } from '../../../models/WindTurbineModel';
import { Shape, SplineCurve, Vector2 } from 'three';

const WindTurbineBladeDesign = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windTurbineActionScope);
  const setActionScope = useStore(Selector.setWindTurbineActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const turbine = useSelectedElement(ObjectType.WindTurbine) as WindTurbineModel | undefined;
  const [inputValue, setInputValue] = useState(turbine?.bladeRadius ?? 0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();
  const canvasWidth = 505;

  useEffect(() => {
    if (!canvasRef.current || !turbine) return;
    const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const x0 = 20;
    const h2 = h / 2;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2;
    ctx.rect(0, 0, w, h);
    ctx.stroke();

    const scale = (w - x0 * 2) / turbine.bladeRadius;
    const bladeTipWidth = 0.2;
    const hubRadius = 0.75;
    const maximumChordR = scale * (turbine.maximumChordRadius ?? hubRadius + turbine.bladeRadius * 0.25);
    const maximumChordL = scale * (turbine.maximumChordLength ?? hubRadius * turbine.bladeRadius * 0.1);
    const bladeRadius = scale * turbine.bladeRadius;
    const tipWidth = scale * bladeTipWidth;
    const bladeConnectorRadius = scale * Math.min(hubRadius * 0.5, hubRadius * 0.25 + turbine.bladeRadius * 0.01);
    const points: Vector2[] = [];
    points.push(new Vector2(x0, h2 - bladeConnectorRadius));
    points.push(new Vector2(x0 + maximumChordR / 3, h2 - maximumChordL / 2));
    points.push(new Vector2(x0 + maximumChordR, h2 - maximumChordL));
    points.push(new Vector2(x0 + bladeRadius, h2 + bladeConnectorRadius - tipWidth));
    const spline = new SplineCurve(points);
    const p = spline.getPoints(50);
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) {
      ctx.lineTo(p[i].x, p[i].y);
    }
    ctx.lineTo(x0 + bladeRadius, h2 + bladeConnectorRadius - tipWidth);
    ctx.lineTo(x0 + bladeRadius, h2 + bladeConnectorRadius);
    ctx.lineTo(x0, h2 + bladeConnectorRadius);
    ctx.closePath();
    ctx.fillStyle = 'lightgray';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(0, h2);
    ctx.lineTo(w, h2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }, [turbine?.bladeRadius]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (bladeRadius: number) => {
    if (!turbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.bladeRadius - bladeRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === turbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.bladeRadius - bladeRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.bladeRadius - bladeRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(turbine?.bladeRadius - bladeRadius) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateBladeRadiusById = (id: string, br: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.bladeRadius = br;
          wt.lx = wt.ly = br * 2;
          wt.lz = wt.towerHeight + br;
          break;
        }
      }
    });
  };

  const updateBladeRadiusAboveFoundation = (foundationId: string, br: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.bladeRadius = br;
          wt.lx = wt.ly = br * 2;
          wt.lz = wt.towerHeight + br;
        }
      }
    });
  };

  const updateBladeRadiusForAll = (br: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.bladeRadius = br;
          wt.lx = wt.ly = br * 2;
          wt.lz = wt.towerHeight + br;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.bladeRadius = value;
          wt.lx = wt.ly = value * 2;
          wt.lz = wt.towerHeight + value;
        }
      }
    });
  };

  const setBladeRadius = (value: number) => {
    if (!turbine) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const wt = elem as WindTurbineModel;
            if (wt.towerHeight < value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(turbine.bladeRadius);
        } else {
          const oldValuesSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldValuesSelected.set(elem.id, (elem as WindTurbineModel).bladeRadius);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Blade Radius for Selected Wind Turbines',
            timestamp: Date.now(),
            oldValues: oldValuesSelected,
            newValue: value,
            undo: () => {
              for (const [id, br] of undoableChangeSelected.oldValues.entries()) {
                updateBladeRadiusById(id, br as number);
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
          updateInMap(oldValuesSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            const wt = elem as WindTurbineModel;
            if (wt.towerHeight < value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(turbine.bladeRadius);
        } else {
          const oldValuesAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine) {
              oldValuesAll.set(elem.id, (elem as WindTurbineModel).bladeRadius);
            }
          }
          const undoableChangeAll = {
            name: 'Set Blade Radius for All Wind Turbines',
            timestamp: Date.now(),
            oldValues: oldValuesAll,
            newValue: value,
            undo: () => {
              for (const [id, br] of undoableChangeAll.oldValues.entries()) {
                updateBladeRadiusById(id, br as number);
              }
            },
            redo: () => {
              updateBladeRadiusForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateBladeRadiusForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (turbine.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === turbine.foundationId) {
              const wt = elem as WindTurbineModel;
              if (wt.towerHeight < value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(turbine.bladeRadius);
          } else {
            const oldValuesAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.WindTurbine && elem.foundationId === turbine.foundationId) {
                oldValuesAboveFoundation.set(elem.id, (elem as WindTurbineModel).bladeRadius);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Blade Radius for All Wind Turbines Above Foundation',
              timestamp: Date.now(),
              oldValues: oldValuesAboveFoundation,
              newValue: value,
              groupId: turbine.foundationId,
              undo: () => {
                for (const [id, br] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateBladeRadiusById(id, br as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateBladeRadiusAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateBladeRadiusAboveFoundation(turbine.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(turbine.id) as WindTurbineModel;
        const oldValue = wt ? wt.bladeRadius : turbine.bladeRadius;
        rejectRef.current = turbine.towerHeight < value;
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldValue);
        } else {
          const undoableChange = {
            name: 'Set Wind Turbine Blade Radius',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: turbine.id,
            changedElementType: turbine.type,
            undo: () => {
              updateBladeRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateBladeRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateBladeRadiusById(turbine.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.windTurbineTowerHeight = value;
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
    setBladeRadius(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setBladeRadius(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.RotorBladeDesign', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row>
        <Col span={24}>
          <canvas ref={canvasRef} id="blade-design-canvas" width={canvasWidth} height={canvasWidth * 0.25}></canvas>
        </Col>
      </Row>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={100}
            style={{ width: 120 }}
            step={0.1}
            precision={1}
            // formatter={(value) => `${value} ` + i18n.t('word.MeterAbbreviation', lang)}
            // parser={value => Number(value?.replace(i18n.t('word.MeterAbbreviation', lang), ''))}
            value={inputValue}
            onChange={(value) => {
              if (value) setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 100] {i18n.t('word.MeterAbbreviation', lang)}
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

export default WindTurbineBladeDesign;
