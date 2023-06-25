/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';
import { HeliostatModel } from '../../../models/HeliostatModel';

const HeliostatPoleRadiusInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updatePoleRadiusById = useStore(Selector.updateSolarCollectorPoleRadiusById);
  const updatePoleRadiusAboveFoundation = useStore(Selector.updateSolarCollectorPoleRadiusAboveFoundation);
  const updatePoleRadiusForAll = useStore(Selector.updateSolarCollectorPoleRadiusForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.heliostatActionScope);
  const setActionScope = useStore(Selector.setHeliostatActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const heliostat = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Heliostat),
  ) as HeliostatModel;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputPoleRadiusRef = useRef<number>(heliostat?.poleRadius ?? 0.1);

  const lang = { lng: language };

  useEffect(() => {
    if (heliostat) {
      inputPoleRadiusRef.current = heliostat.poleRadius;
    }
  }, [heliostat]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (poleRadius: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked) {
            const hs = e as HeliostatModel;
            if (Math.abs(hs.poleRadius - poleRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && e.foundationId === heliostat?.foundationId && !e.locked) {
            const hs = e as HeliostatModel;
            if (Math.abs(hs.poleRadius - poleRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(heliostat);
        if (parent) {
          for (const e of elements) {
            if (e.type === ObjectType.Heliostat && e.parentId === heliostat.parentId && !e.locked) {
              const hs = e as HeliostatModel;
              if (Math.abs(hs.poleRadius - poleRadius) > ZERO_TOLERANCE) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(heliostat?.poleRadius - poleRadius) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setPoleRadius = (value: number) => {
    if (!heliostat) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat) {
            oldValuesAll.set(elem.id, (elem as HeliostatModel).poleRadius);
          }
        }
        const undoableChangeAll = {
          name: 'Set Pole Radius for All Heliostats',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
              updatePoleRadiusById(id, ph as number);
            }
          },
          redo: () => {
            updatePoleRadiusForAll(ObjectType.Heliostat, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updatePoleRadiusForAll(ObjectType.Heliostat, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (heliostat.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Heliostat && elem.foundationId === heliostat.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as HeliostatModel).poleRadius);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Pole Radius for All Heliostats Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: heliostat.foundationId,
            undo: () => {
              for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                updatePoleRadiusById(id, ph as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updatePoleRadiusAboveFoundation(
                  ObjectType.Heliostat,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updatePoleRadiusAboveFoundation(ObjectType.Heliostat, heliostat.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const h = getElementById(heliostat.id) as HeliostatModel;
        const oldPoleRadius = h ? h.poleRadius : heliostat.poleRadius;
        const undoableChange = {
          name: 'Set Heliostat Pole Radius',
          timestamp: Date.now(),
          oldValue: oldPoleRadius,
          newValue: value,
          changedElementId: heliostat.id,
          changedElementType: heliostat.type,
          undo: () => {
            updatePoleRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updatePoleRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updatePoleRadiusById(heliostat.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.heliostatPoleRadius = value;
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
    inputPoleRadiusRef.current = heliostat.poleRadius;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setPoleRadius(inputPoleRadiusRef.current);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return heliostat?.type === ObjectType.Heliostat ? (
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
            {i18n.t('solarCollectorMenu.PoleRadius', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setPoleRadius(inputPoleRadiusRef.current);
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
              min={0.1}
              max={1}
              style={{ width: 120 }}
              step={0.1}
              precision={2}
              value={inputPoleRadiusRef.current}
              onChange={(value) => {
                inputPoleRadiusRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, 1] {i18n.t('word.MeterAbbreviation', lang)}
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
                <Radio value={Scope.OnlyThisObject}>{i18n.t('heliostatMenu.OnlyThisHeliostat', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('heliostatMenu.AllHeliostatsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('heliostatMenu.AllHeliostats', lang)}</Radio>
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

export default HeliostatPoleRadiusInput;
