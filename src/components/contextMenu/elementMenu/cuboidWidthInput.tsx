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
import { CuboidModel } from 'src/models/CuboidModel';
import { GROUND_ID, ORIGIN_VECTOR2, UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from 'src/constants';
import { Util } from 'src/Util';
import { UndoableSizeGroupChange } from 'src/undo/UndoableSizeGroupChange';
import { UndoableSizeChange } from 'src/undo/UndoableSizeChange';
import { Object3D, Vector2, Vector3 } from 'three';
import { PolygonModel } from 'src/models/PolygonModel';
import { Point2 } from 'src/models/Point2';
import { useStoreRef } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import { invalidate } from '@react-three/fiber';

const CuboidWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getChildren = useStore(Selector.getChildren);
  const setElementPosition = useStore(Selector.setElementPosition);
  const updateElementCyById = useStore(Selector.updateElementCyById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const updateElementLyForAll = useStore(Selector.updateElementLyForAll);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const cuboid = useStore(Selector.selectedElement) as CuboidModel;
  const addUndoable = useStore(Selector.addUndoable);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);
  const setCommonStore = useStore(Selector.set);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);

  const inputLyRef = useRef<number>(cuboid?.ly ?? 0);
  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const denormalizedPositionMapRef = useRef<Map<string, Vector2>>(new Map()); // not absolute position, just denormalized
  const oldChildrenVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>()); // Point2 is used to store vertices
  const newChildrenVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const denormalizedVerticesMapRef = useRef<Map<string, Vector2[]>>(new Map()); // use Vector2's rotation function
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (cuboid) {
      inputLyRef.current = cuboid.ly;
    }
  }, [cuboid]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const containsAllChildren = (ly: number) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid) {
            const c = e as CuboidModel;
            const children = getChildren(c.id);
            if (children.length > 0) {
              if (!Util.doesNewSizeContainAllChildren(c, children, c.lx, ly)) {
                return false;
              }
            }
          }
        }
        break;
      default:
        const children = getChildren(cuboid.id);
        if (children.length > 0) {
          return Util.doesNewSizeContainAllChildren(cuboid, children, cuboid.lx, ly);
        }
    }
    return true;
  };

  const rejectChange = (ly: number) => {
    // check if the new width will still contain all children of the cuboids in the selected scope
    if (!containsAllChildren(ly)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (ly: number) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs(c.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(cuboid?.ly - ly) > ZERO_TOLERANCE) {
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
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === curr.id) {
            e.parentId = GROUND_ID;
            const absPos = new Vector2(e.cx, e.cy)
              .rotateAround(ORIGIN_VECTOR2, parent.rotation[2])
              .add(new Vector2(parent.cx, parent.cy));
            e.cx = absPos.x;
            e.cy = absPos.y;
            e.cz = 0;
            newChildrenPositionsMapRef.current.set(e.id, new Vector3(absPos.x, absPos.y, 0));
            newChildrenParentIdMapRef.current.set(e.id, GROUND_ID);
            break;
          }
        }
      });
    }
  };

  const updateLyWithChildren = (parent: CuboidModel, value: number) => {
    // store children's relative positions
    const children = getChildren(parent.id);
    const azimuth = parent.rotation[2];
    denormalizedPositionMapRef.current.clear(); // this map is for one-time use with each foundation
    denormalizedVerticesMapRef.current.clear();
    if (children.length > 0) {
      for (const c of children) {
        if (Util.isIdentical(c.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
          // top face
          switch (c.type) {
            case ObjectType.SolarPanel:
            case ObjectType.Sensor:
              const p = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(ORIGIN_VECTOR2, azimuth);
              denormalizedPositionMapRef.current.set(c.id, p);
              oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy));
              break;
            case ObjectType.Polygon:
              const polygon = c as PolygonModel;
              const arr: Vector2[] = [];
              for (const v of polygon.vertices) {
                arr.push(new Vector2(v.x * parent.lx, v.y * parent.ly).rotateAround(ORIGIN_VECTOR2, azimuth));
              }
              denormalizedVerticesMapRef.current.set(c.id, arr);
              oldChildrenVerticesMapRef.current.set(
                c.id,
                polygon.vertices.map((v) => ({ ...v })),
              );
              break;
          }
        }
        if (Util.isPlantOrHuman(c)) {
          oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
        }
      }
    }
    // update cuboid width
    updateElementLyById(parent.id, value);
    // update children's relative positions
    if (children.length > 0) {
      for (const c of children) {
        if (Util.isIdentical(c.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
          // top face
          switch (c.type) {
            case ObjectType.SolarPanel:
            case ObjectType.Sensor:
              const p = denormalizedPositionMapRef.current.get(c.id);
              if (p) {
                const relativePos = new Vector2(p.x, p.y).rotateAround(ORIGIN_VECTOR2, -azimuth);
                const newCy = relativePos.y / value;
                updateElementCyById(c.id, newCy);
                newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, newCy));
              }
              break;
            case ObjectType.Polygon:
              const arr = denormalizedVerticesMapRef.current.get(c.id);
              if (arr) {
                const newVertices: Point2[] = [];
                for (const v of arr) {
                  const relativePos = v.rotateAround(ORIGIN_VECTOR2, -azimuth);
                  const newX = relativePos.x / parent.lx;
                  const newY = relativePos.y / value;
                  newVertices.push({ x: newX, y: newY } as Point2);
                }
                updatePolygonVerticesById(c.id, newVertices);
                newChildrenVerticesMapRef.current.set(
                  c.id,
                  newVertices.map((v) => ({ ...v })),
                );
              }
              break;
          }
        }
        if (Util.isPlantOrHuman(c)) {
          newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
          oldChildrenParentIdMapRef.current.set(c.id, parent.id);
          // top, north, south face
          if (
            Math.abs(c.cz - parent.lz / 2) < ZERO_TOLERANCE ||
            Math.abs(Math.abs(c.cx) - parent.lx / 2) < ZERO_TOLERANCE
          ) {
            // check fall off
            if (Math.abs(c.cy) - value / 2 > 0) {
              const contentRef = useStoreRef.getState().contentRef;
              const parentObject = getObjectChildById(contentRef?.current, parent.id);
              handleDetachParent(parentObject, parent, c);
            }
          }
          // north and south face
          else if (Math.abs(Math.abs(c.cy) - parent.ly / 2) < ZERO_TOLERANCE) {
            const newCy = (c.cy > 0 ? value : -value) / 2;
            updateElementCyById(c.id, newCy);
            newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cz, newCy, c.cz));
          }
        }
      }
    }
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

  const setLy = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    // cuboid via selected element may be outdated, make sure that we get the latest
    const c = getElementById(cuboid.id);
    const oldLy = c ? c.ly : cuboid.ly;
    rejectedValue.current = undefined;
    rejectRef.current = rejectChange(value);
    if (rejectRef.current) {
      rejectedValue.current = value;
      inputLyRef.current = oldLy;
    } else {
      oldChildrenPositionsMapRef.current.clear();
      newChildrenPositionsMapRef.current.clear();
      oldChildrenVerticesMapRef.current.clear();
      newChildrenVerticesMapRef.current.clear();
      switch (cuboidActionScope) {
        case Scope.AllObjectsOfThisType:
          const oldLysAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Cuboid) {
              oldLysAll.set(elem.id, elem.ly);
            }
          }
          // the following also populates the above two maps in ref
          for (const elem of elements) {
            if (elem.type === ObjectType.Cuboid) {
              updateLyWithChildren(elem as CuboidModel, value);
            }
          }
          const undoableChangeAll = {
            name: 'Set Width for All Cuboids',
            timestamp: Date.now(),
            oldSizes: oldLysAll,
            newSize: value,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenVerticesMap: new Map(oldChildrenVerticesMapRef.current),
            newChildrenVerticesMap: new Map(newChildrenVerticesMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            undo: () => {
              for (const [id, ly] of undoableChangeAll.oldSizes.entries()) {
                updateElementLyById(id, ly as number);
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
              if (undoableChangeAll.oldChildrenVerticesMap && undoableChangeAll.oldChildrenVerticesMap.size > 0) {
                for (const [id, vs] of undoableChangeAll.oldChildrenVerticesMap.entries()) {
                  updatePolygonVerticesById(id, vs);
                }
              }
            },
            redo: () => {
              updateElementLyForAll(ObjectType.Cuboid, undoableChangeAll.newSize as number);
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
              if (undoableChangeAll.newChildrenVerticesMap && undoableChangeAll.newChildrenVerticesMap.size > 0) {
                for (const [id, vs] of undoableChangeAll.newChildrenVerticesMap.entries()) {
                  updatePolygonVerticesById(id, vs);
                }
              }
            },
          } as UndoableSizeGroupChange;
          addUndoable(undoableChangeAll);
          setApplyCount(applyCount + 1);
          break;
        default:
          updateLyWithChildren(cuboid, value);
          const undoableChange = {
            name: 'Set Cuboid Width',
            timestamp: Date.now(),
            oldSize: oldLy,
            newSize: value,
            resizedElementId: cuboid.id,
            resizedElementType: cuboid.type,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenVerticesMap: new Map(oldChildrenVerticesMapRef.current),
            newChildrenVerticesMap: new Map(newChildrenVerticesMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            undo: () => {
              updateElementLyById(cuboid.id, undoableChange.oldSize as number);
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
              if (undoableChange.oldChildrenVerticesMap && undoableChange.oldChildrenVerticesMap.size > 0) {
                for (const [id, vs] of undoableChange.oldChildrenVerticesMap.entries()) {
                  updatePolygonVerticesById(id, vs);
                }
              }
            },
            redo: () => {
              updateElementLyById(cuboid.id, undoableChange.newSize as number);
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
              if (undoableChange.newChildrenVerticesMap && undoableChange.newChildrenVerticesMap.size > 0) {
                for (const [id, vs] of undoableChange.newChildrenVerticesMap.entries()) {
                  updatePolygonVerticesById(id, vs);
                }
              }
            },
          } as UndoableSizeChange;
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
    inputLyRef.current = cuboid?.ly;
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLy(inputLyRef.current);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  return (
    <>
      <Modal
        width={550}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Width', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('message.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLy(inputLyRef.current);
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
              max={500}
              style={{ width: 120 }}
              step={0.5}
              precision={2}
              value={inputLyRef.current}
              onChange={(value) => {
                inputLyRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, 500] {i18n.t('word.MeterAbbreviation', lang)}
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
            <Radio.Group onChange={onScopeChange} value={cuboidActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.OnlyThisCuboid', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllCuboids', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CuboidWidthInput;
