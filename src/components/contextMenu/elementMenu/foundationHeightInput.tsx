/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { GROUND_ID, ORIGIN_VECTOR2, ZERO_TOLERANCE } from 'src/constants';
import { Object3D, Vector2, Vector3 } from 'three';
import { ElementModel } from 'src/models/ElementModel';
import { useStoreRef } from 'src/stores/commonRef';
import { invalidate } from '@react-three/fiber';

const FoundationHeightInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const updateElementCzById = useStore(Selector.updateElementCzById);
  const updateElementLzForAll = useStore(Selector.updateElementLzForAll);
  const updateElementCzForAll = useStore(Selector.updateElementCzForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);
  const setCommonStore = useStore(Selector.set);
  const setElementPosition = useStore(Selector.setElementPosition);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const foundation = getSelectedElement() as FoundationModel;
  const [inputLz, setInputLz] = useState<number>(foundation?.lz ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputLz(foundation.lz);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const updateLzAndCz = (id: string, value: number) => {
    updateElementLzById(id, value);
    updateElementCzById(id, value / 2);
  };

  const needChange = (lz: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (Math.abs(f.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(foundation?.lz - lz) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const getObjectChildById = (object: Object3D | null | undefined, id: string) => {
    if (object === null || object === undefined) return null;
    for (const obj of object.children) {
      if (obj.name.includes(`${id}`)) {
        return obj;
      }
    }
    return null;
  };

  const handleDetachParent = (parentObject: Object3D | null, parent: ElementModel, curr: ElementModel) => {
    if (parentObject) {
      for (const obj of parentObject.children) {
        if (obj.name.includes(`${curr.id}`)) {
          useStoreRef.getState().contentRef?.current?.add(obj);
          break;
        }
      }
      curr.parentId = GROUND_ID;
      const absPos = new Vector2(curr.cx, curr.cy)
        .rotateAround(ORIGIN_VECTOR2, -parent.rotation[2])
        .add(new Vector2(parent.cx, parent.cy));
      curr.cx = absPos.x;
      curr.cy = absPos.y;
      curr.cz = 0;
      newChildrenPositionsMapRef.current.set(curr.id, new Vector3(absPos.x, absPos.y, 0));
      newChildrenParentIdMapRef.current.set(curr.id, GROUND_ID);
    }
  };

  const updateCzOfChildren = (parent: ElementModel, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === parent.id) {
          oldChildrenParentIdMapRef.current.set(e.id, parent.id);
          oldChildrenPositionsMapRef.current.set(e.id, new Vector3(e.cx, e.cy, e.cz));
          if (e.type === ObjectType.Human || e.type === ObjectType.Tree) {
            // top face
            if (Math.abs(e.cz - parent.lz / 2) < ZERO_TOLERANCE) {
              e.cz = value / 2;
              newChildrenPositionsMapRef.current.set(e.id, new Vector3(e.cx, e.cy, value / 2));
            }
            // side faces
            else {
              // check fall off
              const newRelZ = e.cz + parent.cz - value / 2;
              if (Math.abs(newRelZ) > value / 2) {
                const contentRef = useStoreRef.getState().contentRef;
                const parentObject = getObjectChildById(contentRef?.current, parent.id);
                handleDetachParent(parentObject, parent, e);
              } else {
                e.cz = newRelZ;
                newChildrenPositionsMapRef.current.set(e.id, new Vector3(e.cx, e.cy, newRelZ));
              }
            }
          }
        }
      }
    });
  };

  const attachToObjectGroup = (
    attachParentId: string | null | undefined,
    currParentId: string | null | undefined,
    currId: string,
  ) => {
    if (!attachParentId || !currParentId) return;
    const contentRef = useStoreRef.getState().contentRef;
    const currParentObj = getObjectChildById(contentRef?.current, currParentId);
    const currObj = getObjectChildById(currParentId === GROUND_ID ? contentRef?.current : currParentObj, currId);
    if (currObj && contentRef?.current) {
      if (attachParentId === GROUND_ID) {
        contentRef.current.add(currObj);
      } else {
        const attachParentObj = getObjectChildById(contentRef.current, attachParentId);
        attachParentObj?.add(currObj);
      }
      invalidate();
    }
  };

  const setParentIdById = (parentId: string | null | undefined, elementId: string) => {
    if (!parentId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elementId) {
          e.parentId = parentId;
          break;
        }
      }
    });
  };

  const setLz = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldLzsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldLzsAll.set(elem.id, elem.lz);
          }
        }
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            updateCzOfChildren(elem, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Height for All Foundations',
          timestamp: Date.now(),
          oldValues: oldLzsAll,
          newValue: value,
          oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
          newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
          oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
          newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
          undo: () => {
            for (const [id, lz] of undoableChangeAll.oldValues.entries()) {
              updateLzAndCz(id, lz as number);
            }
            if (undoableChangeAll.oldChildrenPositionsMap && undoableChangeAll.oldChildrenPositionsMap.size > 0) {
              for (const [id, ps] of undoableChangeAll.oldChildrenPositionsMap.entries()) {
                setElementPosition(id, ps.x, ps.y, ps.z);
                const oldParentId = undoableChangeAll.oldChildrenParentIdMap?.get(id);
                const newParentId = undoableChangeAll.newChildrenParentIdMap?.get(id);
                if (oldParentId && newParentId && oldParentId !== newParentId) {
                  attachToObjectGroup(oldParentId, newParentId, id);
                  setParentIdById(oldParentId, id);
                }
              }
            }
          },
          redo: () => {
            const newCz = undoableChangeAll.newValue as number;
            updateElementLzForAll(ObjectType.Foundation, newCz);
            updateElementCzForAll(ObjectType.Foundation, newCz / 2);
            if (undoableChangeAll.newChildrenPositionsMap && undoableChangeAll.newChildrenPositionsMap.size > 0) {
              for (const [id, ps] of undoableChangeAll.newChildrenPositionsMap.entries()) {
                setElementPosition(id, ps.x, ps.y, ps.z);
                const oldParentId = undoableChangeAll.oldChildrenParentIdMap?.get(id);
                const newParentId = undoableChangeAll.newChildrenParentIdMap?.get(id);
                if (oldParentId && newParentId && oldParentId !== newParentId) {
                  attachToObjectGroup(newParentId, oldParentId, id);
                  setParentIdById(newParentId, id);
                }
              }
            }
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementLzForAll(ObjectType.Foundation, value);
        updateElementCzForAll(ObjectType.Foundation, value / 2);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation) {
          const oldLz = foundation.lz;
          updateCzOfChildren(foundation, value);
          updateLzAndCz(foundation.id, value);
          const undoableChange = {
            name: 'Set Foundation Width',
            timestamp: Date.now(),
            oldValue: oldLz,
            newValue: value,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            changedElementId: foundation.id,
            undo: () => {
              updateLzAndCz(undoableChange.changedElementId, undoableChange.oldValue as number);
              if (undoableChange.oldChildrenPositionsMap && undoableChange.oldChildrenPositionsMap.size > 0) {
                for (const [id, ps] of undoableChange.oldChildrenPositionsMap.entries()) {
                  setElementPosition(id, ps.x, ps.y, ps.z);
                  const oldParentId = undoableChange.oldChildrenParentIdMap?.get(id);
                  const newParentId = undoableChange.newChildrenParentIdMap?.get(id);
                  if (oldParentId && newParentId && oldParentId !== newParentId) {
                    attachToObjectGroup(oldParentId, newParentId, id);
                    setParentIdById(oldParentId, id);
                  }
                }
              }
            },
            redo: () => {
              updateLzAndCz(undoableChange.changedElementId, undoableChange.newValue as number);
              if (undoableChange.newChildrenPositionsMap && undoableChange.newChildrenPositionsMap.size > 0) {
                for (const [id, ps] of undoableChange.newChildrenPositionsMap.entries()) {
                  setElementPosition(id, ps.x, ps.y, ps.z);
                  const oldParentId = undoableChange.oldChildrenParentIdMap?.get(id);
                  const newParentId = undoableChange.newChildrenParentIdMap?.get(id);
                  if (oldParentId && newParentId && oldParentId !== newParentId) {
                    attachToObjectGroup(newParentId, oldParentId, id);
                    setParentIdById(newParentId, id);
                  }
                }
              }
            },
          } as UndoableChange;
          addUndoable(undoableChange);
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
    setInputLz(foundation?.lz);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLz(inputLz);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={550}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Height', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLz(inputLz);
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
              max={10}
              style={{ width: 120 }}
              step={0.1}
              precision={1}
              value={inputLz}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInputLz(value)}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, 10] {i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationHeightInput;
