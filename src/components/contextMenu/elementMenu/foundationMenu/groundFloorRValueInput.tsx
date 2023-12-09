/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { Util } from '../../../../Util';
import { FoundationModel } from '../../../../models/FoundationModel';
import { DEFAULT_GROUND_FLOOR_R_VALUE, ZERO_TOLERANCE } from '../../../../constants';

const GroundFloorRValueInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const selectedElement = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const setActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const foundationModel = useStore((state) => {
    if (selectedElement) {
      for (const e of state.elements) {
        if (e.id === selectedElement.id) {
          return e as FoundationModel;
        }
      }
    }
    return null;
  });

  const [inputValue, setInputValue] = useState<number>(foundationModel?.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE);
  const [inputValueUS, setInputValueUS] = useState<number>(Util.toRValueInUS(inputValue));
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundationModel) {
      setInputValue(foundationModel?.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE);
    }
  }, [foundationModel?.rValue]);

  const needChange = (value: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.rValue === undefined || Math.abs(f.rValue - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (foundationModel?.rValue === undefined || Math.abs(foundationModel?.rValue - value) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as FoundationModel).rValue = value;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateById(id, value);
    }
  };

  const setValue = (value: number) => {
    if (!foundationModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number | undefined>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Foundation && !e.locked) {
              const foundation = e as FoundationModel;
              oldValuesAll.set(e.id, foundation.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE);
              foundation.rValue = value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set R-Value for All Ground Floors',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundationModel) {
          const updatedFoundation = getElementById(foundationModel.id) as FoundationModel;
          const oldValue = updatedFoundation.rValue ?? foundationModel.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE;
          const undoableChange = {
            name: 'Set Ground Floor R-Value',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: foundationModel.id,
            changedElementType: foundationModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(foundationModel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.groundFloorRValue = value;
    });
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
    setInputValue(foundationModel?.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE);
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setValue(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setValue(inputValue);
  };

  return (
    <>
      <Modal
        width={550}
        open={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.RValue', lang) + ' '}({i18n.t('word.ThermalResistance', lang)})
          </div>
        }
        footer={[
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={handleOk}>
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
          <Col className="gutter-row" span={7}>
            <InputNumber
              min={0.01}
              max={100}
              style={{ width: 120 }}
              step={0.05}
              precision={2}
              value={inputValue}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => {
                if (value === null) return;
                setInputValue(value);
                setInputValueUS(Util.toRValueInUS(value));
              }}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.01, 100]
              <br />
              {i18n.t('word.SIUnit', lang)}: m²·℃/W
            </div>
            <br />
            <InputNumber
              min={Util.toRValueInUS(0.01)}
              max={Util.toRValueInUS(100)}
              style={{ width: 120 }}
              step={0.01}
              precision={2}
              value={inputValueUS}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => {
                if (value === null) return;
                setInputValueUS(value);
                setInputValue(Util.toRValueInSI(value));
              }}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [{Util.toRValueInUS(0.01).toFixed(3)}, {Util.toRValueInUS(100).toFixed(1)}]
              <br />
              {i18n.t('word.USUnit', lang)}: h·ft²·℉/Btu
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={(e) => setActionScope(e.target.value)} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisGroundFloor', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllGroundFloors', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default GroundFloorRValueInput;
