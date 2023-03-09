/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ParabolicDishModel } from '../../../models/ParabolicDishModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';
import { Util } from '../../../Util';

const ParabolicDishDiameterInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLxById = useStore(Selector.updateElementLxById);
  const updateLyById = useStore(Selector.updateElementLyById);
  const updateLxAboveFoundation = useStore(Selector.updateElementLxAboveFoundation);
  const updateLyAboveFoundation = useStore(Selector.updateElementLyAboveFoundation);
  const updateLxForAll = useStore(Selector.updateElementLxForAll);
  const updateLyForAll = useStore(Selector.updateElementLyForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const parabolicDish = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.ParabolicDish),
  ) as ParabolicDishModel;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  const inputDiameterRef = useRef<number>(parabolicDish?.lx ?? 2);

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicDish) {
      inputDiameterRef.current = parabolicDish.lx;
    }
  }, [parabolicDish]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (dish: ParabolicDishModel, lx: number) => {
    const parent = getParent(dish);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(dish)) as ParabolicDishModel;
      clone.lx = lx;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (dish: ParabolicDishModel, lx: number) => {
    // check if the new diameter will cause the parabolic dish to be out of the bound
    if (!withinParent(dish, lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const dish = e as ParabolicDishModel;
            if (Math.abs(dish.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const dish = e as ParabolicDishModel;
            if (Math.abs(dish.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setDiameter = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            if (rejectChange(elem as ParabolicDishModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputDiameterRef.current = parabolicDish.lx;
        } else {
          const oldDiametersAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish) {
              oldDiametersAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Diameter for All Parabolic Dishes',
            timestamp: Date.now(),
            oldValues: oldDiametersAll,
            newValue: value,
            undo: () => {
              for (const [id, di] of undoableChangeAll.oldValues.entries()) {
                // both lx and ly can represent the diameter
                updateLxById(id, di as number);
                updateLyById(id, di as number);
              }
            },
            redo: () => {
              updateLxForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
              updateLyForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLxForAll(ObjectType.ParabolicDish, value);
          updateLyForAll(ObjectType.ParabolicDish, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              if (rejectChange(elem as ParabolicDishModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            inputDiameterRef.current = parabolicDish.lx;
          } else {
            const oldDiametersAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
                oldDiametersAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Diameter for All Parabolic Dishes Above Foundation',
              timestamp: Date.now(),
              oldValues: oldDiametersAboveFoundation,
              newValue: value,
              groupId: parabolicDish.foundationId,
              undo: () => {
                for (const [id, di] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLxById(id, di as number);
                  updateLyById(id, di as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLxAboveFoundation(
                    ObjectType.ParabolicDish,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                  updateLyAboveFoundation(
                    ObjectType.ParabolicDish,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLxAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
            updateLyAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldDiameter = p ? p.lx : parabolicDish.lx;
        rejectRef.current = rejectChange(parabolicDish, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputDiameterRef.current = oldDiameter;
        } else {
          const undoableChange = {
            name: 'Set Parabolic Dish Diameter',
            timestamp: Date.now(),
            oldValue: oldDiameter,
            newValue: value,
            changedElementId: parabolicDish.id,
            changedElementType: parabolicDish.type,
            undo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
              updateLyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.newValue as number);
              updateLyById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLxById(parabolicDish.id, value);
          updateLyById(parabolicDish.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishRimDiameter = value;
    });
    setUpdateFlag(!updateFlag);
  };

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const close = () => {
    inputDiameterRef.current = parabolicDish.lx;
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setDiameter(inputDiameterRef.current);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  // for some reason, we have to confirm the type first. otherwise, other popup menus may invoke this
  return parabolicDish?.type === ObjectType.ParabolicDish ? (
    <>
      <Modal
        width={600}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('parabolicDishMenu.RimDiameter', lang)}
            <span style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('message.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </span>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setDiameter(inputDiameterRef.current);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={close}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={1}
              max={10}
              step={0.5}
              precision={2}
              style={{ width: 120 }}
              value={inputDiameterRef.current}
              onChange={(value) => {
                inputDiameterRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.MinimumValue', lang)}: 1 {i18n.t('word.MeterAbbreviation', lang)}
              <br />
              {i18n.t('word.MaximumValue', lang)}: 10 {i18n.t('word.MeterAbbreviation', lang)}
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
                <Radio value={Scope.OnlyThisObject}>{i18n.t('parabolicDishMenu.OnlyThisParabolicDish', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('parabolicDishMenu.AllParabolicDishesAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('parabolicDishMenu.AllParabolicDishes', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  ) : (
    <></>
  );
};

export default ParabolicDishDiameterInput;
