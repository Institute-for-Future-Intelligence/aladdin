/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CuboidModel } from 'src/models/CuboidModel';
import { GROUND_ID, ORIGIN_VECTOR2, ZERO_TOLERANCE } from 'src/constants';
import { useRefStore } from 'src/stores/commonRef';
import { Object3D, Vector2, Vector3 } from 'three';
import { ElementModel } from 'src/models/ElementModel';
import { invalidate } from '@react-three/fiber';
import { Util } from '../../../Util';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const CuboidHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getParent = useStore(Selector.getParent);
  const getElementById = useStore(Selector.getElementById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const updateElementCzById = useStore(Selector.updateElementCzById);
  const updateElementLzForAll = useStore(Selector.updateElementLzForAll);
  const updateElementCzForAll = useStore(Selector.updateElementCzForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.cuboidActionScope);
  const setActionScope = useStore(Selector.setCuboidActionScope);
  const setElementPosition = useStore(Selector.setElementPosition);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const cuboid = useSelectedElement(ObjectType.Cuboid) as CuboidModel | undefined;

  const [inputValue, setInputValue] = useState<number>(cuboid?.lz ?? 0);
  const oldChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const newChildrenParentIdMapRef = useRef<Map<string, string>>(new Map<string, string>());
  const oldChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector3>>(new Map<string, Vector3>());

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const updateLzAndCz = (id: string, value: number) => {
    updateElementLzById(id, value);
    updateElementCzById(id, value / 2);
  };

  const updateLzAndCzOnSurface = (value: number) => {
    if (!cuboid) return;
    const parent = getParent(cuboid);
    if (parent) {
      for (const e of elements) {
        if (e.type === ObjectType.Cuboid && !e.locked && e.parentId === parent.id) {
          updateElementLzById(e.id, value);
          updateElementCzById(e.id, value / 2);
        }
      }
    }
  };

  const updateLzAndCzAboveBase = (value: number) => {
    if (!cuboid) return;
    const baseId = Util.getBaseId(cuboid.id);
    if (baseId) {
      for (const e of elements) {
        if (e.type === ObjectType.Cuboid && !e.locked && Util.getBaseId(e.id) === baseId) {
          updateElementLzById(e.id, value);
          updateElementCzById(e.id, value / 2);
        }
      }
    }
  };

  const needChange = (lz: number) => {
    if (!cuboid) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const c = e as CuboidModel;
            if (Math.abs(c.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs(c.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        const baseId = Util.getBaseId(cuboid?.id);
        if (baseId && baseId !== GROUND_ID) {
          for (const e of elements) {
            if (e.type === ObjectType.Cuboid && e.parentId && e.parentId !== GROUND_ID && !e.locked) {
              const c = e as CuboidModel;
              if (baseId === Util.getBaseId(c.id)) {
                if (Math.abs(c.lz - lz) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        for (const e of elements) {
          if (
            e.type === ObjectType.Cuboid &&
            e.parentId !== GROUND_ID &&
            e.parentId === cuboid?.parentId &&
            !e.locked
          ) {
            const c = e as CuboidModel;
            if (Math.abs(c.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(cuboid?.lz - lz) > ZERO_TOLERANCE) {
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
          if (Util.isPlantOrHuman(e)) {
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
                const contentRef = useRefStore.getState().contentRef;
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

  const updateLzAndCzInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id)) {
          if (value !== undefined) {
            e.lz = value;
            e.cz = value / 2;
          } else {
            const lz = map.get(e.id);
            if (lz !== undefined) {
              e.lz = lz;
              e.cz = lz / 2;
            }
          }
        }
      }
    });
  };

  const setLz = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldLzsSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldLzsSelected.set(elem.id, elem.lz);
            updateCzOfChildren(elem, value);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Height for Selected Cuboids',
          timestamp: Date.now(),
          oldValues: oldLzsSelected,
          newValue: value,
          oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
          newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
          oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
          newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
          undo: () => {
            updateLzAndCzInMap(undoableChangeSelected.oldValues as Map<string, number>);
            if (
              undoableChangeSelected.oldChildrenPositionsMap &&
              undoableChangeSelected.oldChildrenPositionsMap.size > 0
            ) {
              for (const [id, ps] of undoableChangeSelected.oldChildrenPositionsMap.entries()) {
                setElementPosition(id, ps.x, ps.y, ps.z);
                const oldParentId = undoableChangeSelected.oldChildrenParentIdMap?.get(id);
                const newParentId = undoableChangeSelected.newChildrenParentIdMap?.get(id);
                if (oldParentId && newParentId && oldParentId !== newParentId) {
                  attachToObjectGroup(oldParentId, newParentId, id);
                  setParentIdById(oldParentId, id);
                }
              }
            }
          },
          redo: () => {
            const newCz = undoableChangeSelected.newValue as number;
            updateLzAndCzInMap(undoableChangeSelected.oldValues as Map<string, number>, newCz);
            if (
              undoableChangeSelected.newChildrenPositionsMap &&
              undoableChangeSelected.newChildrenPositionsMap.size > 0
            ) {
              for (const [id, ps] of undoableChangeSelected.newChildrenPositionsMap.entries()) {
                setElementPosition(id, ps.x, ps.y, ps.z);
                const oldParentId = undoableChangeSelected.oldChildrenParentIdMap?.get(id);
                const newParentId = undoableChangeSelected.newChildrenParentIdMap?.get(id);
                if (oldParentId && newParentId && oldParentId !== newParentId) {
                  attachToObjectGroup(newParentId, oldParentId, id);
                  setParentIdById(newParentId, id);
                }
              }
            }
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateLzAndCzInMap(oldLzsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldLzsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            oldLzsAll.set(elem.id, elem.lz);
            updateCzOfChildren(elem, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Height for All Cuboids',
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
            updateElementLzForAll(ObjectType.Cuboid, newCz);
            updateElementCzForAll(ObjectType.Cuboid, newCz / 2);
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
        updateElementLzForAll(ObjectType.Cuboid, value);
        updateElementCzForAll(ObjectType.Cuboid, value / 2);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        const oldLzsAll = new Map<string, number>();
        const baseId = Util.getBaseId(cuboid.id);
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && Util.getBaseId(elem.id) === baseId) {
            oldLzsAll.set(elem.id, elem.lz);
            updateCzOfChildren(elem, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Height for All Cuboids Above Same Base',
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
            updateLzAndCzAboveBase(newCz);
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
        updateLzAndCzAboveBase(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const oldLzsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && elem.parentId === cuboid.parentId) {
            oldLzsAll.set(elem.id, elem.lz);
            updateCzOfChildren(elem, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Height for All Cuboids on Same Surface',
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
            updateLzAndCzOnSurface(newCz);
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
        updateLzAndCzOnSurface(value);
        setApplyCount(applyCount + 1);
        break;
      }
      default:
        // cuboid via selected element may be outdated, make sure that we get the latest
        const c = getElementById(cuboid.id);
        const oldLz = c ? c.lz : cuboid.lz;
        updateCzOfChildren(cuboid, value);
        updateLzAndCz(cuboid.id, value);
        const undoableChange = {
          name: 'Set Cuboid Width',
          timestamp: Date.now(),
          oldValue: oldLz,
          newValue: value,
          oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
          newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
          oldChildrenParentIdMap: new Map(oldChildrenParentIdMapRef.current),
          newChildrenParentIdMap: new Map(newChildrenParentIdMapRef.current),
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
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
    setCommonStore((state) => {
      state.actionState.cuboidHeight = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setLz(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Height', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.1}
            max={1000}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            value={inputValue}
            onChange={setInputValue}
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
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.OnlyThisCuboid', lang)}</Radio>
              {cuboid?.parentId !== GROUND_ID && (
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('cuboidMenu.AllCuboidsOnSameSurface', lang)}
                </Radio>
              )}
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('cuboidMenu.AllCuboidsAboveSameBase', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('cuboidMenu.AllSelectedCuboids', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllCuboids', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default CuboidHeightInput;
