/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import DoorTextureDefaultIcon from 'src/resources/door_edge.png';
import DoorTexture01Icon from 'src/resources/door_01.png';
import DoorTexture02Icon from 'src/resources/door_02.png';
import DoorTexture03Icon from 'src/resources/door_03.png';
import DoorTexture04Icon from 'src/resources/door_04.png';
import DoorTexture05Icon from 'src/resources/door_05.png';
import DoorTexture06Icon from 'src/resources/door_06.png';
import DoorTexture07Icon from 'src/resources/door_07.png';
import DoorTexture08Icon from 'src/resources/door_08.png';
import DoorTexture09Icon from 'src/resources/door_09.png';
import DoorTexture10Icon from 'src/resources/door_10.png';
import DoorTexture11Icon from 'src/resources/door_11.png';
import DoorTexture12Icon from 'src/resources/door_12.png';
import DoorTexture13Icon from 'src/resources/door_13.png';
import DoorTexture14Icon from 'src/resources/door_14.png';
import DoorTexture15Icon from 'src/resources/door_15.png';
import DoorTexture16Icon from 'src/resources/door_16.png';
import DoorTexture17Icon from 'src/resources/door_17.png';

import React, { useState } from 'react';
import { Col, Radio, Row, Select, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, DoorTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { DoorModel } from 'src/models/DoorModel';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const DoorTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<DoorTexture>(door?.textureType ?? DoorTexture.Default);

  const lang = useLanguage();
  const { Option } = Select;

  const updateTextureById = (id: string, textureType: DoorTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as DoorModel).textureType = textureType;
          }
          break;
        }
      }
    });
  };

  const updateTextureInMap = (map: Map<string, DoorTexture>, textureType: DoorTexture) => {
    for (const id of map.keys()) {
      updateTextureById(id, textureType);
    }
  };

  const undoTextureInMap = (map: Map<string, DoorTexture>) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, texture);
    }
  };

  const needChange = (value: DoorTexture) => {
    if (!door) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            value !== (e as DoorModel).textureType &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && value !== (e as DoorModel).textureType && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.foundationId === door.foundationId &&
            value !== (e as DoorModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.parentId === door.parentId &&
            value !== (e as DoorModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== door?.textureType) {
          return true;
        }
        break;
    }
    return false;
  };

  const setTexture = (value: DoorTexture) => {
    if (!door) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, DoorTexture>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldTexturesSelected.set(elem.id, (elem as DoorModel).textureType ?? DoorTexture.Default);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Doors',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeSelected.oldValues as Map<string, DoorTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeSelected.oldValues as Map<string, DoorTexture>,
              undoableChangeSelected.newValue as DoorTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateTextureInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, DoorTexture>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked) {
            oldTexturesAll.set(elem.id, (elem as DoorModel).textureType ?? DoorTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Doors',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeAll.oldValues as Map<string, DoorTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeAll.oldValues as Map<string, DoorTexture>,
              undoableChangeAll.newValue as DoorTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTextureInMap(oldTexturesAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (door.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, DoorTexture>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.foundationId === door.foundationId && !elem.locked) {
              oldTexturesAboveFoundation.set(elem.id, (elem as DoorModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: door.foundationId,
            undo: () => {
              undoTextureInMap(undoableChangeAboveFoundation.oldValues as Map<string, DoorTexture>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTextureInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, DoorTexture>,
                  undoableChangeAboveFoundation.newValue as DoorTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTextureInMap(oldTexturesAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (door.parentId) {
          const oldTexturesOnSameWall = new Map<string, DoorTexture>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.parentId === door.parentId && !elem.locked) {
              oldTexturesOnSameWall.set(elem.id, (elem as DoorModel).textureType);
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Texture for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldTexturesOnSameWall,
            newValue: value,
            groupId: door.parentId,
            undo: () => {
              undoTextureInMap(undoableChangeOnSameWall.oldValues as Map<string, DoorTexture>);
            },
            redo: () => {
              if (undoableChangeOnSameWall.groupId) {
                updateTextureInMap(
                  undoableChangeOnSameWall.oldValues as Map<string, DoorTexture>,
                  undoableChangeOnSameWall.newValue as DoorTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateTextureInMap(oldTexturesOnSameWall, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (door) {
          const updatedDoor = getElementById(door.id) as DoorModel;
          const oldTexture = updatedDoor ? updatedDoor.textureType : door.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Door',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: door.id,
            changedElementType: door.type,
            undo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.oldValue as DoorTexture);
            },
            redo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.newValue as DoorTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTextureById(door.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.doorTexture = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setTexture(selectedTexture);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Texture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={9}>
          <Select style={{ width: '150px' }} value={selectedTexture} onChange={(value) => setSelectedTexture(value)}>
            <Option key={DoorTexture.NoTexture} value={DoorTexture.NoTexture}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '12px',
                  width: '32px',
                  height: '20px',
                  border: '1px dashed dimGray',
                }}
              >
                {' '}
              </div>
              {i18n.t('shared.NoTexture', lang)}
            </Option>

            <Option key={DoorTexture.Default} value={DoorTexture.Default}>
              <img
                alt={DoorTexture.Default}
                src={DoorTextureDefaultIcon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.TextureDefault', lang)}
            </Option>

            <Option key={DoorTexture.Texture01} value={DoorTexture.Texture01}>
              <img
                alt={DoorTexture.Texture01}
                src={DoorTexture01Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture01', lang)}
            </Option>

            <Option key={DoorTexture.Texture02} value={DoorTexture.Texture02}>
              <img
                alt={DoorTexture.Texture02}
                src={DoorTexture02Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture02', lang)}
            </Option>

            <Option key={DoorTexture.Texture03} value={DoorTexture.Texture03}>
              <img
                alt={DoorTexture.Texture03}
                src={DoorTexture03Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture03', lang)}
            </Option>

            <Option key={DoorTexture.Texture04} value={DoorTexture.Texture04}>
              <img
                alt={DoorTexture.Texture04}
                src={DoorTexture04Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture04', lang)}
            </Option>

            <Option key={DoorTexture.Texture05} value={DoorTexture.Texture05}>
              <img
                alt={DoorTexture.Texture05}
                src={DoorTexture05Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture05', lang)}
            </Option>

            <Option key={DoorTexture.Texture06} value={DoorTexture.Texture06}>
              <img
                alt={DoorTexture.Texture06}
                src={DoorTexture06Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture06', lang)}
            </Option>

            <Option key={DoorTexture.Texture07} value={DoorTexture.Texture07}>
              <img
                alt={DoorTexture.Texture07}
                src={DoorTexture07Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture07', lang)}
            </Option>

            <Option key={DoorTexture.Texture08} value={DoorTexture.Texture08}>
              <img
                alt={DoorTexture.Texture08}
                src={DoorTexture08Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture08', lang)}
            </Option>

            <Option key={DoorTexture.Texture09} value={DoorTexture.Texture09}>
              <img
                alt={DoorTexture.Texture09}
                src={DoorTexture09Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture09', lang)}
            </Option>

            <Option key={DoorTexture.Texture10} value={DoorTexture.Texture10}>
              <img
                alt={DoorTexture.Texture10}
                src={DoorTexture10Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture10', lang)}
            </Option>

            <Option key={DoorTexture.Texture11} value={DoorTexture.Texture11}>
              <img
                alt={DoorTexture.Texture11}
                src={DoorTexture11Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture11', lang)}
            </Option>

            <Option key={DoorTexture.Texture12} value={DoorTexture.Texture12}>
              <img
                alt={DoorTexture.Texture12}
                src={DoorTexture12Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture12', lang)}
            </Option>

            <Option key={DoorTexture.Texture13} value={DoorTexture.Texture13}>
              <img
                alt={DoorTexture.Texture13}
                src={DoorTexture13Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture13', lang)}
            </Option>

            <Option key={DoorTexture.Texture14} value={DoorTexture.Texture14}>
              <img
                alt={DoorTexture.Texture14}
                src={DoorTexture14Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture14', lang)}
            </Option>

            <Option key={DoorTexture.Texture15} value={DoorTexture.Texture15}>
              <img
                alt={DoorTexture.Texture15}
                src={DoorTexture15Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture15', lang)}
            </Option>

            <Option key={DoorTexture.Texture16} value={DoorTexture.Texture16}>
              <img
                alt={DoorTexture.Texture16}
                src={DoorTexture16Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture16', lang)}
            </Option>

            <Option key={DoorTexture.Texture17} value={DoorTexture.Texture17}>
              <img
                alt={DoorTexture.Texture17}
                src={DoorTexture17Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('doorMenu.Texture17', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
        >
          <Radio.Group onChange={(e) => useStore.getState().setDoorActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('doorMenu.OnlyThisDoor', lang)}</Radio>
              <Radio value={Scope.OnlyThisSide}>{i18n.t('doorMenu.AllDoorsOnWall', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('doorMenu.AllSelectedDoors', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('doorMenu.AllDoors', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default DoorTextureSelection;
