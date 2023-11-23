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
import { RoofModel } from '../../../models/RoofModel';
import { Util } from '../../../Util';
import { DEFAULT_CEILING_R_VALUE } from '../../../constants';

const CeilingRValueInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const selectedElement = useStore(Selector.selectedElement) as RoofModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const setActionScope = useStore(Selector.setRoofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const roofModel = useStore((state) => {
    if (selectedElement) {
      for (const e of state.elements) {
        if (e.id === selectedElement.id) {
          return e as RoofModel;
        }
      }
    }
    return null;
  });

  const [inputValue, setInputValue] = useState<number>(roofModel?.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
  const [inputValueUS, setInputValueUS] = useState<number>(Util.toRValueInUS(inputValue));
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (roofModel) {
      setInputValue(roofModel?.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
    }
  }, [roofModel?.ceilingRValue]);

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).ceilingRValue = value;
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
    if (!roofModel) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number | undefined>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Roof && !e.locked) {
              const roof = e as RoofModel;
              oldValuesAll.set(e.id, roof.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
              roof.ceilingRValue = value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set R-Value for All Ceilings',
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roofModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Roof && e.foundationId === roofModel.foundationId && !e.locked) {
                const roof = e as RoofModel;
                oldValuesAboveFoundation.set(e.id, roof.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
                roof.ceilingRValue = value;
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: 'Set R-Value for All Ceilings Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: roofModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roofModel) {
          const updatedRoof = getElementById(roofModel.id) as RoofModel;
          const oldValue = updatedRoof.ceilingRValue ?? roofModel.ceilingRValue ?? DEFAULT_CEILING_R_VALUE;
          const undoableChange = {
            name: 'Set Ceiling R-Value',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: roofModel.id,
            changedElementType: roofModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(roofModel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.roofRValue = value;
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
    setInputValue(roofModel?.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
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
            {i18n.t('roofMenu.CeilingRValue', lang) + ' '}({i18n.t('word.ThermalResistance', lang)})
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
                <Radio value={Scope.OnlyThisObject}>{i18n.t('roofMenu.OnlyThisCeiling', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('roofMenu.AllCeilingsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('roofMenu.AllCeilings', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CeilingRValueInput;
