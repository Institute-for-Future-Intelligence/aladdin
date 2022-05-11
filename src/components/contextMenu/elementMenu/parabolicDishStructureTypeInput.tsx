/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ParabolicDishModel } from '../../../models/ParabolicDishModel';
import { ObjectType, ParabolicDishStructureType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';

const ParabolicDishStructureTypeInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateParabolicDishStructureTypeById);
  const updateAboveFoundation = useStore(Selector.updateParabolicDishStructureTypeAboveFoundation);
  const updateForAll = useStore(Selector.updateParabolicDishStructureTypeForAll);
  const parabolicDish = useStore(Selector.selectedElement) as ParabolicDishModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputStructureType, setInputStructureType] = useState<number>(
    parabolicDish?.structureType ?? ParabolicDishStructureType.CentralPole,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };
  const { Option } = Select;

  useEffect(() => {
    if (parabolicDish) {
      setInputStructureType(parabolicDish.structureType);
    }
  }, [parabolicDish]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (structureType: ParabolicDishStructureType) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pd = e as ParabolicDishModel;
            if (pd.structureType !== structureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pd = e as ParabolicDishModel;
            if (pd.structureType !== structureType) {
              return true;
            }
          }
        }
        break;
      default:
        if (parabolicDish?.structureType !== structureType) {
          return true;
        }
    }
    return false;
  };

  const setStructureType = (type: ParabolicDishStructureType) => {
    if (!parabolicDish) return;
    if (!needChange(type)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldStructureTypesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            oldStructureTypesAll.set(elem.id, (elem as ParabolicDishModel).structureType);
          }
        }
        const undoableChangeAll = {
          name: 'Set Structure Type for All Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldStructureTypesAll,
          newValue: type,
          undo: () => {
            for (const [id, st] of undoableChangeAll.oldValues.entries()) {
              updateById(id, st as ParabolicDishStructureType);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as ParabolicDishStructureType);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(type);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          const oldStructureTypesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              oldStructureTypesAboveFoundation.set(elem.id, (elem as ParabolicDishModel).structureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Structure Type for All Parabolic Dishes Above Foundation',
            timestamp: Date.now(),
            oldValues: oldStructureTypesAboveFoundation,
            newValue: type,
            groupId: parabolicDish.foundationId,
            undo: () => {
              for (const [id, st] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, st as ParabolicDishStructureType);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as ParabolicDishStructureType,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(parabolicDish.foundationId, type);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldStructureType = p ? p.structureType : parabolicDish.structureType;
        const undoableChange = {
          name: 'Set Parabolic Dish Structure Type',
          timestamp: Date.now(),
          oldValue: oldStructureType,
          newValue: type,
          changedElementId: parabolicDish.id,
          changedElementType: parabolicDish.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as ParabolicDishStructureType);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as ParabolicDishStructureType);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(parabolicDish.id, type);
        setApplyCount(applyCount + 1);
    }
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
    setInputStructureType(parabolicDish.structureType);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setStructureType(inputStructureType);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return parabolicDish?.type === ObjectType.ParabolicDish ? (
    <>
      <Modal
        width={640}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('parabolicDishMenu.ReceiverStructure', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setStructureType(inputStructureType);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok} ref={okButtonRef}>
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
          <Col className="gutter-row" span={8}>
            <Select value={inputStructureType} onChange={(value) => setInputStructureType(value)}>
              <Option key={ParabolicDishStructureType.CentralPole} value={ParabolicDishStructureType.CentralPole}>
                {i18n.t('parabolicDishMenu.CentralPole', lang)}
              </Option>
              <Option
                key={ParabolicDishStructureType.CentralPoleWithTripod}
                value={ParabolicDishStructureType.CentralPoleWithTripod}
              >
                {i18n.t('parabolicDishMenu.CentralPoleWithTripod', lang)}
              </Option>
              <Option key={ParabolicDishStructureType.Quadrupod} value={ParabolicDishStructureType.Quadrupod}>
                {i18n.t('parabolicDishMenu.Quadrupod', lang)}
              </Option>
            </Select>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
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

export default ParabolicDishStructureTypeInput;
