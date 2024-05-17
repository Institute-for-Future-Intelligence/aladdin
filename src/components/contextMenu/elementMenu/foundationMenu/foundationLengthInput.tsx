/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { FoundationModel } from 'src/models/FoundationModel';
import { Object3D, Vector2, Vector3 } from 'three';
import { Util } from 'src/Util';
import { UndoableSizeGroupChange } from 'src/undo/UndoableSizeGroupChange';
import { UndoableSizeChange } from 'src/undo/UndoableSizeChange';
import { GROUND_ID, ORIGIN_VECTOR2, ZERO_TOLERANCE } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { PolygonModel } from 'src/models/PolygonModel';
import { ElementModel } from 'src/models/ElementModel';
import { useRefStore } from 'src/stores/commonRef';
import { invalidate } from '@react-three/fiber';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from '../../../../hooks';

const FoundationLengthInput = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateElementCxById = useStore(Selector.updateElementCxById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLxForAll = useStore(Selector.updateElementLxForAll);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const getChildren = useStore(Selector.getChildren);
  const setElementPosition = useStore(Selector.setElementPosition);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const setCommonStore = useStore(Selector.set);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  const [inputValue, setInputValue] = useState(foundation?.lx ?? 0.1);

  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const denormalizedPosMapRef = useRef<Map<string, Vector2>>(new Map()); // not absolute position, just denormalized
  const oldChildrenVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>()); // Point2 is used to store vertices
  const newChildrenVerticesMapRef = useRef<Map<string, Point2[]>>(new Map<string, Point2[]>());
  const denormalizedVerticesMapRef = useRef<Map<string, Vector2[]>>(new Map()); // use Vector2's rotation function
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const containsAllChildren = (lx: number) => {
    if (!foundation) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            const children = getChildren(f.id);
            if (children.length > 0) {
              if (!Util.doesNewSizeContainAllChildren(f, children, lx, f.ly)) {
                return false;
              }
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Foundation) {
            const f = e as FoundationModel;
            const children = getChildren(f.id);
            if (children.length > 0) {
              if (!Util.doesNewSizeContainAllChildren(f, children, lx, f.ly)) {
                return false;
              }
            }
          }
        }
        break;
      }
      default: {
        const children = getChildren(foundation.id);
        if (children.length > 0) {
          return Util.doesNewSizeContainAllChildren(foundation, children, lx, foundation.ly);
        }
        break;
      }
    }
    return true;
  };

  const rejectChange = (lx: number) => {
    // check if the new length will still contain all children of the foundations in the selected scope
    if (!containsAllChildren(lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    if (!foundation) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (Math.abs(f.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (Math.abs(f.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(foundation?.lx - lx) > ZERO_TOLERANCE) {
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
          useRefStore.getState().contentRef?.current?.add(obj);
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

  const updateLxWithChildren = (parent: FoundationModel, value: number) => {
    // store children's relative positions
    const children = getChildren(parent.id);
    const azimuth = parent.rotation[2];
    denormalizedPosMapRef.current.clear(); // this map is for one-time use with each foundation
    denormalizedVerticesMapRef.current.clear();
    if (children.length > 0) {
      for (const c of children) {
        switch (c.type) {
          case ObjectType.Wall: {
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicTrough:
          case ObjectType.ParabolicDish:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat:
          case ObjectType.Sensor: {
            const p = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(ORIGIN_VECTOR2, azimuth);
            denormalizedPosMapRef.current.set(c.id, p);
            oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy));
            break;
          }
          case ObjectType.Polygon: {
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
          case ObjectType.Human:
          case ObjectType.Tree: {
            oldChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
            break;
          }
        }
      }
    }
    // update foundation's length
    updateElementLxById(parent.id, value);
    // update children's relative positions
    if (children.length > 0) {
      for (const c of children) {
        switch (c.type) {
          case ObjectType.Wall: {
            // TODO
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicTrough:
          case ObjectType.ParabolicDish:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat:
          case ObjectType.Sensor: {
            const p = denormalizedPosMapRef.current.get(c.id);
            if (p) {
              const relativePos = new Vector2(p.x, p.y).rotateAround(ORIGIN_VECTOR2, -azimuth);
              const newCx = relativePos.x / value;
              updateElementCxById(c.id, newCx);
              newChildrenPositionsMapRef.current.set(c.id, new Vector3(newCx, c.cy));
            }
            break;
          }
          case ObjectType.Polygon: {
            const arr = denormalizedVerticesMapRef.current.get(c.id);
            if (arr) {
              const newVertices: Point2[] = [];
              for (const v of arr) {
                const relativePos = v.rotateAround(ORIGIN_VECTOR2, -azimuth);
                const newX = relativePos.x / value;
                const newY = relativePos.y / parent.ly;
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
          case ObjectType.Human:
          case ObjectType.Tree: {
            newChildrenPositionsMapRef.current.set(c.id, new Vector3(c.cx, c.cy, c.cz));
            oldChildrenParentIdMapRef.current.set(c.id, parent.id);
            // top, north, south face
            if (
              Math.abs(c.cz - parent.lz / 2) < ZERO_TOLERANCE ||
              Math.abs(Math.abs(c.cy) - parent.ly / 2) < ZERO_TOLERANCE
            ) {
              // check fall off
              if (Math.abs(c.cx) - value / 2 > 0) {
                const contentRef = useRefStore.getState().contentRef;
                const parentObject = getObjectChildById(contentRef?.current, parent.id);
                handleDetachParent(parentObject, parent, c);
              }
            }
            // west and east face
            else if (Math.abs(Math.abs(c.cx) - parent.lx / 2) < ZERO_TOLERANCE) {
              const newCx = (c.cx > 0 ? value : -value) / 2;
              updateElementCxById(c.id, newCx);
              newChildrenPositionsMapRef.current.set(c.id, new Vector3(newCx, c.cy, c.cz));
            }
            break;
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
    const contentRef = useRefStore.getState().contentRef;
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

  const updateLxInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id)) {
          if (value !== undefined) {
            e.lx = value;
          } else {
            const lx = map.get(e.id);
            if (lx !== undefined) {
              e.lx = lx;
            }
          }
        }
      }
    });
  };

  const setLx = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    // foundation via selected element may be outdated, make sure that we get the latest
    const f = getElementById(foundation.id);
    const oldLx = f ? f.lx : foundation.lx;
    rejectedValue.current = undefined;
    rejectRef.current = rejectChange(value);
    if (rejectRef.current) {
      rejectedValue.current = value;
      setInputValue(oldLx);
    } else {
      oldChildrenPositionsMapRef.current.clear();
      newChildrenPositionsMapRef.current.clear();
      oldChildrenVerticesMapRef.current.clear();
      newChildrenVerticesMapRef.current.clear();
      switch (actionScope) {
        case Scope.AllSelectedObjectsOfThisType: {
          const oldLxsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLxsSelected.set(elem.id, elem.lx);
            }
          }
          // the following also populates the above two maps in ref
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
              updateLxWithChildren(elem as FoundationModel, value);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for Selected Foundations',
            timestamp: Date.now(),
            oldSizes: oldLxsSelected,
            newSize: value,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenVerticesMap: new Map(oldChildrenVerticesMapRef.current),
            newChildrenVerticesMap: new Map(newChildrenVerticesMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            undo: () => {
              updateLxInMap(undoableChangeAll.oldSizes as Map<string, number>);
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
              updateLxInMap(undoableChangeAll.oldSizes as Map<string, number>, undoableChangeAll.newSize as number);
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
        }
        case Scope.AllObjectsOfThisType: {
          const oldLxsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation) {
              oldLxsAll.set(elem.id, elem.lx);
            }
          }
          // the following also populates the above two maps in ref
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation) {
              updateLxWithChildren(elem as FoundationModel, value);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Foundations',
            timestamp: Date.now(),
            oldSizes: oldLxsAll,
            newSize: value,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenVerticesMap: new Map(oldChildrenVerticesMapRef.current),
            newChildrenVerticesMap: new Map(newChildrenVerticesMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldSizes.entries()) {
                updateElementLxById(id, lx as number);
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
              updateElementLxForAll(ObjectType.Foundation, undoableChangeAll.newSize as number);
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
        }
        default: {
          updateLxWithChildren(foundation, value);
          const undoableChange = {
            name: 'Set Foundation Length',
            timestamp: Date.now(),
            oldSize: oldLx,
            newSize: value,
            resizedElementId: foundation.id,
            resizedElementType: foundation.type,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            oldChildrenVerticesMap: new Map(oldChildrenVerticesMapRef.current),
            newChildrenVerticesMap: new Map(newChildrenVerticesMapRef.current),
            oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
            newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
            undo: () => {
              updateElementLxById(foundation.id, undoableChange.oldSize as number);
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
              updateElementLxById(foundation.id, undoableChange.newSize as number);
              if (undoableChange.newChildrenPositionsMap && undoableChange.newChildrenPositionsMap.size > 0) {
                for (const [id, p] of undoableChange.newChildrenPositionsMap.entries()) {
                  setElementPosition(id, p.x, p.y, p.z);
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
          break;
        }
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLx(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setLx(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('word.Length', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.1}
            max={1000}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 1000] {i18n.t('word.MeterAbbreviation', lang)}
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
          <Radio.Group
            onChange={(e) => useStore.getState().setFoundationActionScope(e.target.value)}
            value={actionScope}
          >
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('foundationMenu.OnlyThisFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('foundationMenu.AllSelectedFoundations', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('foundationMenu.AllFoundations', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
});

export default FoundationLengthInput;
