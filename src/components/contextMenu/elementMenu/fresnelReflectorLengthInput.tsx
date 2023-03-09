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
import { Util } from '../../../Util';

// for Fresnel reflectors, since the default alignment is north-south, ly is always much larger than lx.
// to agree with the convention, we call ly length and lx width, reversed from most other elements in Aladdin.

const FresnelReflectorLengthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLyById = useStore(Selector.updateElementLyById);
  const updateLyAboveFoundation = useStore(Selector.updateElementLyAboveFoundation);
  const updateLyForAll = useStore(Selector.updateElementLyForAll);
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
  const inputLengthRef = useRef<number>(fresnelReflector?.ly ?? 9);

  const lang = { lng: language };

  useEffect(() => {
    if (fresnelReflector) {
      inputLengthRef.current = fresnelReflector.ly;
    }
  }, [fresnelReflector]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (reflector: FresnelReflectorModel, ly: number) => {
    const parent = getParent(reflector);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(reflector)) as FresnelReflectorModel;
      clone.ly = ly;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (reflector: FresnelReflectorModel, ly: number) => {
    // check if the new length will cause the Fresnel reflector to be out of the bound
    if (!withinParent(reflector, ly)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (ly: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.ly - ly) > ZERO_TOLERANCE) {
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
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(fresnelReflector?.ly - ly) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setLength = (value: number) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            if (rejectChange(elem as FresnelReflectorModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputLengthRef.current = fresnelReflector.ly;
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector) {
              oldLengthsAll.set(elem.id, elem.ly);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeAll.oldValues.entries()) {
                updateLyById(id, ly as number);
              }
            },
            redo: () => {
              updateLyForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLyForAll(ObjectType.FresnelReflector, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (fresnelReflector.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              if (rejectChange(elem as FresnelReflectorModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            inputLengthRef.current = fresnelReflector.ly;
          } else {
            const oldLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
                oldLengthsAboveFoundation.set(elem.id, elem.ly);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Length for All Fresnel Reflectors Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLengthsAboveFoundation,
              newValue: value,
              groupId: fresnelReflector.foundationId,
              undo: () => {
                for (const [id, ly] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLyById(id, ly as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLyAboveFoundation(
                    ObjectType.FresnelReflector,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLyAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldLength = f ? f.ly : fresnelReflector.ly;
        rejectRef.current = rejectChange(fresnelReflector, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputLengthRef.current = oldLength;
        } else {
          const undoableChange = {
            name: 'Set Fresnel Reflector Length',
            timestamp: Date.now(),
            oldValue: oldLength,
            newValue: value,
            changedElementId: fresnelReflector.id,
            changedElementType: fresnelReflector.type,
            undo: () => {
              updateLyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLyById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLyById(fresnelReflector.id, value);
          setApplyCount(applyCount + 1);
        }
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
    inputLengthRef.current = fresnelReflector.ly;
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLength(inputLengthRef.current);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const modularize = (value: number) => {
    let length = value ?? 1;
    const n = Math.max(1, Math.ceil((length - fresnelReflector.moduleLength / 2) / fresnelReflector.moduleLength));
    length = n * fresnelReflector.moduleLength;
    return length;
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
            {i18n.t('word.Length', lang)}
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
              setLength(inputLengthRef.current);
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
              min={fresnelReflector.moduleLength}
              max={200 * fresnelReflector.moduleLength}
              step={fresnelReflector.moduleLength}
              style={{ width: 120 }}
              precision={2}
              value={inputLengthRef.current}
              onChange={(value) => {
                inputLengthRef.current = modularize(value);
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('fresnelReflectorMenu.ModuleLength', lang) +
                ': ' +
                fresnelReflector.moduleLength.toFixed(1) +
                ' ' +
                i18n.t('word.MeterAbbreviation', lang)}
              <br />
              {Math.round(inputLengthRef.current / fresnelReflector.moduleLength) +
                ' ' +
                i18n.t('fresnelReflectorMenu.ModulesLong', lang)}
              <br />
              {i18n.t('word.Maximum', lang)}: 200 {i18n.t('fresnelReflectorMenu.Modules', lang)}
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

export default FresnelReflectorLengthInput;
