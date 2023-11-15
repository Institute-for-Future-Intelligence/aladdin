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
import { ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';
import { WindTurbineModel } from '../../../models/WindTurbineModel';
import { SplineCurve, Vector2 } from 'three';

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
  const [maximumChordLengthInputValue, setMaximumChordLengthInputValue] = useState(turbine?.maximumChordLength ?? 1);
  const [maximumChordRadiusInputValue, setMaximumChordRadiusInputValue] = useState(turbine?.maximumChordRadius ?? 3);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lang = useLanguage();
  const canvasWidth = 555;

  useEffect(() => {
    if (!canvasRef.current || !turbine) return;
    const ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const x0 = 20;
    const h2 = h * 0.8;
    ctx.clearRect(0, 0, w, h);

    ctx.setLineDash([]);
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    ctx.rect(0, 0, w, h);
    ctx.stroke();

    const scale = (w - x0 * 2) / turbine.bladeRadius;
    const bladeTipWidth = scale * turbine.bladeTipWidth;
    const maximumChordRadius = scale * maximumChordRadiusInputValue;
    const maximumChordLength = scale * maximumChordLengthInputValue;
    const bladeRadius = scale * turbine.bladeRadius;
    const bladeConnectorRadius =
      scale * Math.min(turbine.hubRadius * 0.5, turbine.hubRadius * 0.25 + turbine.bladeRadius * 0.01);
    const maximumChordOffset = maximumChordLength - bladeConnectorRadius;
    const bladeLength = bladeRadius - maximumChordRadius / 3;
    const points: Vector2[] = [];
    points.push(new Vector2(x0, h2 - bladeConnectorRadius));
    points.push(new Vector2(x0 + bladeRadius - bladeLength, h2 - maximumChordOffset / 2));
    points.push(new Vector2(x0 + maximumChordRadius, h2 - maximumChordOffset));
    points.push(new Vector2(x0 + bladeRadius, h2 + bladeConnectorRadius - bladeTipWidth));
    const spline = new SplineCurve(points);
    const p = spline.getPoints(50);
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) {
      ctx.lineTo(p[i].x, p[i].y);
    }
    ctx.lineTo(x0 + bladeRadius, h2 + bladeConnectorRadius - bladeTipWidth);
    ctx.lineTo(x0 + bladeRadius, h2 + bladeConnectorRadius);
    ctx.lineTo(x0, h2 + bladeConnectorRadius);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.fillStyle = 'lightgray';
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 0.5;
    // ctx.setLineDash([5, 3]);
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(x0 + maximumChordRadius, h2 - maximumChordOffset);
    ctx.lineTo(x0 + maximumChordRadius, h2);
    ctx.stroke();

    ctx.font = 'italic 10px Arial';
    ctx.fillStyle = 'dimgray';
    ctx.fillText('C', x0 + maximumChordRadius + 5, h2 - 5);
    ctx.fillText('D', x0 + maximumChordRadius / 2, h2 - 2);

    ctx.beginPath();
    ctx.moveTo(0, h2);
    ctx.lineTo(w, h2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }, [turbine?.bladeRadius, maximumChordLengthInputValue, maximumChordRadiusInputValue]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChangeChordLength = (value: number) => {
    if (!turbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordLength - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === turbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordLength - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordLength - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(turbine?.maximumChordLength - value) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateMaximumChordLengthById = (id: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordLength = value;
          break;
        }
      }
    });
  };

  const updateMaximumChordLengthAboveFoundation = (foundationId: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordLength = value;
        }
      }
    });
  };

  const updateMaximumChordLengthForAll = (value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordLength = value;
        }
      }
    });
  };

  const updateChordLengthInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.maximumChordLength = value;
        }
      }
    });
  };

  const setMaximumChordLength = (value: number) => {
    if (!turbine) return;
    if (!needChangeChordLength(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as WindTurbineModel).maximumChordLength);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Chord Length for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeSelected.oldValues.entries()) {
              updateMaximumChordLengthById(id, br as number);
            }
          },
          redo: () => {
            updateChordLengthInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateChordLengthInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            oldValuesAll.set(elem.id, (elem as WindTurbineModel).maximumChordLength);
          }
        }
        const undoableChangeAll = {
          name: 'Set Chord Length for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeAll.oldValues.entries()) {
              updateMaximumChordLengthById(id, br as number);
            }
          },
          redo: () => {
            updateMaximumChordLengthForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateMaximumChordLengthForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (turbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === turbine.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as WindTurbineModel).maximumChordLength);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Chord Length for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: turbine.foundationId,
            undo: () => {
              for (const [id, br] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateMaximumChordLengthById(id, br as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateMaximumChordLengthAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateMaximumChordLengthAboveFoundation(turbine.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(turbine.id) as WindTurbineModel;
        const oldValue = wt ? wt.maximumChordLength : turbine.maximumChordLength;
        const undoableChange = {
          name: 'Set Wind Turbine Chord Length',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: turbine.id,
          changedElementType: turbine.type,
          undo: () => {
            updateMaximumChordLengthById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateMaximumChordLengthById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateMaximumChordLengthById(turbine.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.windTurbineBladeMaximumChordLength = value;
    });
  };

  /* chord radius*/

  const needChangeChordRadius = (value: number) => {
    if (!turbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordRadius - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === turbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordRadius - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.maximumChordRadius - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(turbine?.maximumChordRadius - value) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateMaximumChordRadiusById = (id: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordRadius = value;
          break;
        }
      }
    });
  };

  const updateMaximumChordRadiusAboveFoundation = (foundationId: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordRadius = value;
        }
      }
    });
  };

  const updateMaximumChordRadiusForAll = (value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.maximumChordRadius = value;
        }
      }
    });
  };

  const updateChordRadiusInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.maximumChordRadius = value;
        }
      }
    });
  };

  const setMaximumChordRadius = (value: number) => {
    if (!turbine) return;
    if (!needChangeChordRadius(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as WindTurbineModel).maximumChordRadius);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Chord Radius for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeSelected.oldValues.entries()) {
              updateMaximumChordRadiusById(id, br as number);
            }
          },
          redo: () => {
            updateChordRadiusInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateChordRadiusInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            oldValuesAll.set(elem.id, (elem as WindTurbineModel).maximumChordRadius);
          }
        }
        const undoableChangeAll = {
          name: 'Set Chord Radius for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeAll.oldValues.entries()) {
              updateMaximumChordRadiusById(id, br as number);
            }
          },
          redo: () => {
            updateMaximumChordRadiusForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateMaximumChordRadiusForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (turbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === turbine.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as WindTurbineModel).maximumChordRadius);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Chord Radius for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: turbine.foundationId,
            undo: () => {
              for (const [id, br] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateMaximumChordRadiusById(id, br as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateMaximumChordRadiusAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateMaximumChordRadiusAboveFoundation(turbine.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(turbine.id) as WindTurbineModel;
        const oldValue = wt ? wt.maximumChordRadius : turbine.maximumChordRadius;
        const undoableChange = {
          name: 'Set Wind Turbine Chord Radius',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: turbine.id,
          changedElementType: turbine.type,
          undo: () => {
            updateMaximumChordRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateMaximumChordRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateMaximumChordRadiusById(turbine.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.windTurbineBladeMaximumChordRadius = value;
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
    setMaximumChordLength(maximumChordLengthInputValue);
    setMaximumChordRadius(maximumChordRadiusInputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setMaximumChordLength(maximumChordLengthInputValue);
    setMaximumChordRadius(maximumChordRadiusInputValue);
  };

  return (
    <Dialog
      width={600}
      title={i18n.t('windTurbineMenu.RotorBladeDesign', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row>
        <Col span={24}>
          <canvas
            ref={canvasRef}
            id="blade-design-canvas"
            width={canvasWidth}
            height={canvasWidth * 0.25}
            style={{ paddingBottom: '12px' }}
          />
        </Col>
      </Row>
      <Row gutter={6}>
        <Col className="gutter-row" span={8}>
          <Row gutter={6} style={{ paddingBottom: '8px' }}>
            <Col style={{ textAlign: 'center', fontStyle: 'italic' }}>C: </Col>
            <Col>
              <InputNumber
                min={0.5}
                max={2}
                style={{ width: '70px' }}
                step={0.1}
                precision={1}
                value={maximumChordLengthInputValue}
                onChange={(value) => {
                  if (value) setMaximumChordLengthInputValue(value);
                }}
              />
            </Col>
            <Col style={{ paddingTop: '5px', textAlign: 'left', fontSize: '11px' }}>
              [0.5, 2] {i18n.t('word.MeterAbbreviation', lang)}
            </Col>
          </Row>
          <Row gutter={6}>
            <Col style={{ textAlign: 'center', fontStyle: 'italic' }}>D:</Col>
            <Col>
              <InputNumber
                min={2}
                max={(turbine?.bladeRadius ?? 10) / 2}
                style={{ width: 70 }}
                step={0.1}
                precision={1}
                value={maximumChordRadiusInputValue}
                onChange={(value) => {
                  if (value) setMaximumChordRadiusInputValue(value);
                }}
              />
            </Col>
            <Col style={{ paddingTop: '5px', textAlign: 'left', fontSize: '11px' }}>
              [2, {(turbine?.bladeRadius ?? 10) / 2}] {i18n.t('word.MeterAbbreviation', lang)}
            </Col>
          </Row>
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

export default WindTurbineBladeDesign;
