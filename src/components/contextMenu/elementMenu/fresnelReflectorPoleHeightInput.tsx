/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FresnelReflectorModel } from '../../../models/FresnelReflectorModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';

const FresnelReflectorPoleHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updatePoleHeightById = useStore(Selector.updateSolarCollectorPoleHeightById);
  const updatePoleHeightAboveFoundation = useStore(Selector.updateSolarCollectorPoleHeightAboveFoundation);
  const updatePoleHeightForAll = useStore(Selector.updateSolarCollectorPoleHeightForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const fresnelReflector = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.FresnelReflector),
  ) as FresnelReflectorModel;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  const inputPoleHeightRef = useRef<number>(fresnelReflector?.poleHeight ?? 1);

  const lang = { lng: language };

  useEffect(() => {
    if (fresnelReflector) {
      inputPoleHeightRef.current = fresnelReflector.poleHeight;
    }
  }, [fresnelReflector]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (poleHeight: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            e.foundationId === fresnelReflector?.foundationId &&
            !e.locked
          ) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(fresnelReflector);
        if (parent) {
          for (const e of elements) {
            if (e.type === ObjectType.FresnelReflector && e.parentId === fresnelReflector.parentId && !e.locked) {
              const fr = e as FresnelReflectorModel;
              if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(fresnelReflector?.poleHeight - poleHeight) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setPoleHeight = (value: number) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as FresnelReflectorModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputPoleHeightRef.current = fresnelReflector.poleHeight;
        } else {
          const oldPoleHeightsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector) {
              oldPoleHeightsAll.set(elem.id, (elem as FresnelReflectorModel).poleHeight);
            }
          }
          const undoableChangeAll = {
            name: 'Set Pole Height for All Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldPoleHeightsAll,
            newValue: value,
            undo: () => {
              for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
                updatePoleHeightById(id, ph as number);
              }
            },
            redo: () => {
              updatePoleHeightForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updatePoleHeightForAll(ObjectType.FresnelReflector, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (fresnelReflector.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              if (0.5 * elem.ly * Math.abs(Math.sin((elem as FresnelReflectorModel).tiltAngle)) > value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            inputPoleHeightRef.current = fresnelReflector.poleHeight;
          } else {
            const oldPoleHeightsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
                oldPoleHeightsAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).poleHeight);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Pole Height for All Fresnel Reflectors Above Foundation',
              timestamp: Date.now(),
              oldValues: oldPoleHeightsAboveFoundation,
              newValue: value,
              groupId: fresnelReflector.foundationId,
              undo: () => {
                for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updatePoleHeightById(id, ph as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updatePoleHeightAboveFoundation(
                    ObjectType.FresnelReflector,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updatePoleHeightAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldPoleHeight = f ? f.poleHeight : fresnelReflector.poleHeight;
        rejectRef.current = 0.5 * fresnelReflector.lx * Math.abs(Math.sin(fresnelReflector.tiltAngle)) > value;
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputPoleHeightRef.current = oldPoleHeight;
        } else {
          const undoableChange = {
            name: 'Set Fresnel Reflector Pole Height',
            timestamp: Date.now(),
            oldValue: oldPoleHeight,
            newValue: value,
            changedElementId: fresnelReflector.id,
            changedElementType: fresnelReflector.type,
            undo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updatePoleHeightById(fresnelReflector.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.fresnelReflectorPoleHeight = value;
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
    inputPoleHeightRef.current = fresnelReflector.poleHeight;
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setPoleHeight(inputPoleHeightRef.current);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  return fresnelReflector?.type === ObjectType.FresnelReflector ? (
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
            {i18n.t('solarCollectorMenu.ExtraPoleHeightInAdditionToHalfWidth', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('message.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(1) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setPoleHeight(inputPoleHeightRef.current);
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
              min={0}
              max={5}
              style={{ width: 120 }}
              step={0.1}
              precision={2}
              value={inputPoleHeightRef.current}
              onChange={(value) => {
                inputPoleHeightRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 5] {i18n.t('word.MeterAbbreviation', lang)}
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
                <Radio value={Scope.OnlyThisObject}>
                  {i18n.t('fresnelReflectorMenu.OnlyThisFresnelReflector', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('fresnelReflectorMenu.AllFresnelReflectorsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>
                  {i18n.t('fresnelReflectorMenu.AllFresnelReflectors', lang)}
                </Radio>
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

export default FresnelReflectorPoleHeightInput;
