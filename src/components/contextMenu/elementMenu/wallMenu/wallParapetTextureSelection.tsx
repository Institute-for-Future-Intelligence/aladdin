/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import WallTextureDefaultIcon from 'src/resources/wall_edge.png';
import WallTexture01Icon from 'src/resources/wall_01_menu.png';
import WallTexture02Icon from 'src/resources/wall_02_menu.png';
import WallTexture03Icon from 'src/resources/wall_03_menu.png';
import WallTexture04Icon from 'src/resources/wall_04_menu.png';
import WallTexture05Icon from 'src/resources/wall_05_menu.png';
import WallTexture06Icon from 'src/resources/wall_06_menu.png';
import WallTexture07Icon from 'src/resources/wall_07_menu.png';
import WallTexture08Icon from 'src/resources/wall_08_menu.png';
import WallTexture09Icon from 'src/resources/wall_09_menu.png';
import WallTexture10Icon from 'src/resources/wall_10_menu.png';

import React, { useState } from 'react';
import { Col, Radio, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, WallTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WallModel } from 'src/models/WallModel';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const WallParapetTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const wall = useSelectedElement(ObjectType.Wall) as WallModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<WallTexture>(wall?.parapet.textureType ?? WallTexture.Default);

  const lang = useLanguage();
  const { Option } = Select;

  const updateById = (id: string, texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
          (e as WallModel).parapet.textureType = texture;
          break;
        }
      }
    });
  };

  const updateConnectedWalls = (texture: WallTexture) => {
    if (!wall) return;
    const connectedWalls = Util.getAllConnectedWalls(wall);
    if (connectedWalls.length === 0) return;
    setCommonStore((state) => {
      for (const w of connectedWalls) {
        if (!w.locked) {
          for (const e of state.elements) {
            if (e.id === w.id && e.type === ObjectType.Wall) {
              (e as WallModel).parapet.textureType = texture;
            }
          }
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
          (e as WallModel).parapet.textureType = texture;
        }
      }
    });
  };

  const updateForAll = (texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).parapet.textureType = texture;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, WallTexture>, texture: WallTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked && map.has(e.id)) {
          (e as WallModel).parapet.textureType = texture;
        }
      }
    });
  };

  const needChange = (value: WallTexture) => {
    if (!wall) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            value !== (e as WallModel).parapet.textureType &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== (e as WallModel).parapet.textureType && !e.locked) {
            return true;
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            e.foundationId === wall.foundationId &&
            value !== (e as WallModel).parapet.textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      }
      case Scope.AllConnectedObjects: {
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e.parapet.textureType && !e.locked) {
            return true;
          }
        }
        break;
      }
      default: {
        if (value !== wall?.parapet.textureType) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const updateTexture = (value: WallTexture) => {
    if (!wall) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, WallTexture>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldTexturesSelected.set(e.id, (e as WallModel).parapet.textureType ?? WallTexture.Default);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Parapet Texture for Selected Walls',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, texture as WallTexture);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, WallTexture>,
              undoableChangeSelected.newValue as WallTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, WallTexture>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked) {
            oldTexturesAll.set(e.id, (e as WallModel).parapet.textureType ?? WallTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Parapet Texture for All Walls',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeAll.oldValues.entries()) {
              updateById(id, texture as WallTexture);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as WallTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, WallTexture>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId && !e.locked) {
              oldTexturesAboveFoundation.set(e.id, (e as WallModel).parapet.textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Parapet Texture for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, wt] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, wt as WallTexture);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as WallTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(wall.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllConnectedObjects:
        if (wall) {
          const connectedWalls = Util.getAllConnectedWalls(wall);
          const oldValuesConnectedWalls = new Map<string, WallTexture>();
          for (const e of connectedWalls) {
            oldValuesConnectedWalls.set(e.id, e.parapet.textureType);
          }
          const undoableChangeConnectedWalls = {
            name: `Set Parapet Texture for All Connected Walls`,
            timestamp: Date.now(),
            oldValues: oldValuesConnectedWalls,
            newValue: value,
            undo: () => {
              for (const [id, wh] of undoableChangeConnectedWalls.oldValues.entries()) {
                updateById(id, wh as WallTexture);
              }
            },
            redo: () => {
              updateConnectedWalls(undoableChangeConnectedWalls.newValue as WallTexture);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeConnectedWalls);
          updateConnectedWalls(value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldTexture = updatedWall?.parapet.textureType ?? wall.parapet.textureType;
          const undoableChange = {
            name: 'Set Parapet Texture of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as WallTexture);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as WallTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(wall.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.wallParapet.textureType = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateTexture(selectedTexture);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Texture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={9}>
          <Select style={{ width: '150px' }} value={selectedTexture} onChange={setSelectedTexture}>
            <Option key={WallTexture.NoTexture} value={WallTexture.NoTexture}>
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

            <Option key={WallTexture.Default} value={WallTexture.Default}>
              <img
                alt={WallTexture.Default}
                src={WallTextureDefaultIcon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.TextureDefault', lang)}
            </Option>

            <Option key={WallTexture.Texture01} value={WallTexture.Texture01}>
              <img
                alt={WallTexture.Texture01}
                src={WallTexture01Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture01', lang)}
            </Option>

            <Option key={WallTexture.Texture02} value={WallTexture.Texture02}>
              <img
                alt={WallTexture.Texture02}
                src={WallTexture02Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture02', lang)}
            </Option>

            <Option key={WallTexture.Texture03} value={WallTexture.Texture03}>
              <img
                alt={WallTexture.Texture03}
                src={WallTexture03Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture03', lang)}
            </Option>

            <Option key={WallTexture.Texture04} value={WallTexture.Texture04}>
              <img
                alt={WallTexture.Texture04}
                src={WallTexture04Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture04', lang)}
            </Option>

            <Option key={WallTexture.Texture05} value={WallTexture.Texture05}>
              <img
                alt={WallTexture.Texture05}
                src={WallTexture05Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture05', lang)}
            </Option>

            <Option key={WallTexture.Texture06} value={WallTexture.Texture06}>
              <img
                alt={WallTexture.Texture06}
                src={WallTexture06Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture06', lang)}
            </Option>

            <Option key={WallTexture.Texture07} value={WallTexture.Texture07}>
              <img
                alt={WallTexture.Texture07}
                src={WallTexture07Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture07', lang)}
            </Option>

            <Option key={WallTexture.Texture08} value={WallTexture.Texture08}>
              <img
                alt={WallTexture.Texture08}
                src={WallTexture08Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture08', lang)}
            </Option>

            <Option key={WallTexture.Texture09} value={WallTexture.Texture09}>
              <img
                alt={WallTexture.Texture09}
                src={WallTexture09Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture09', lang)}
            </Option>

            <Option key={WallTexture.Texture10} value={WallTexture.Texture10}>
              <img
                alt={WallTexture.Texture10}
                src={WallTexture10Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('wallMenu.Texture10', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWallActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('wallMenu.OnlyThisWall', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllConnectedObjects}>
                {i18n.t('wallMenu.AllConnectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('wallMenu.AllSelectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('wallMenu.AllWalls', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WallParapetTextureSelection;
