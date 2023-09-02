/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import RoofTextureDefaultIcon from 'src/resources/roof_edge_menu.png';
import RoofTexture01Icon from 'src/resources/roof_01_menu.png';
import RoofTexture02Icon from 'src/resources/roof_02_menu.png';
import RoofTexture03Icon from 'src/resources/roof_03_menu.png';
import RoofTexture04Icon from 'src/resources/roof_04_menu.png';
import RoofTexture05Icon from 'src/resources/roof_05_menu.png';
import RoofTexture06Icon from 'src/resources/roof_06_menu.png';
import RoofTexture07Icon from 'src/resources/roof_07_menu.png';

import React, { useState } from 'react';
import { Col, Radio, Row, Select, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, RoofTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const RoofTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<RoofTexture>(roof?.textureType ?? RoofTexture.Default);

  const lang = useLanguage();
  const { Option } = Select;

  const updateTextureById = (id: string, textureType: RoofTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as RoofModel).textureType = textureType;
          }
          break;
        }
      }
    });
  };

  const updateTextureInMap = (map: Map<string, RoofTexture>, textureType: RoofTexture) => {
    for (const id of map.keys()) {
      updateTextureById(id, textureType);
    }
  };

  const undoTextureInMap = (map: Map<string, RoofTexture>) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, texture);
    }
  };

  const needChange = (value: RoofTexture) => {
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).textureType && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.textureType) {
          return true;
        }
        break;
    }
    return false;
  };

  const setTexture = (value: RoofTexture) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTexturesAll = new Map<string, RoofTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Roof && !elem.locked) {
            oldTexturesAll.set(elem.id, (elem as RoofModel).textureType ?? RoofTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Roofs',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeAll.oldValues as Map<string, RoofTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeAll.oldValues as Map<string, RoofTexture>,
              undoableChangeAll.newValue as RoofTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTextureInMap(oldTexturesAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roof.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, RoofTexture>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Roof && elem.foundationId === roof.foundationId && !elem.locked) {
              oldTexturesAboveFoundation.set(elem.id, (elem as RoofModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
            undo: () => {
              undoTextureInMap(undoableChangeAboveFoundation.oldValues as Map<string, RoofTexture>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTextureInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, RoofTexture>,
                  undoableChangeAboveFoundation.newValue as RoofTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTextureInMap(oldTexturesAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldTexture = updatedRoof ? updatedRoof.textureType : roof.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Roof',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.oldValue as RoofTexture);
            },
            redo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.newValue as RoofTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTextureById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.roofTexture = value;
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
            <Option key={RoofTexture.NoTexture} value={RoofTexture.NoTexture}>
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

            <Option key={RoofTexture.Default} value={RoofTexture.Default}>
              <img
                alt={RoofTexture.Default}
                src={RoofTextureDefaultIcon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.TextureDefault', lang)}
            </Option>

            <Option key={RoofTexture.Texture01} value={RoofTexture.Texture01}>
              <img
                alt={RoofTexture.Texture01}
                src={RoofTexture01Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture01', lang)}
            </Option>

            <Option key={RoofTexture.Texture02} value={RoofTexture.Texture02}>
              <img
                alt={RoofTexture.Texture02}
                src={RoofTexture02Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture02', lang)}
            </Option>

            <Option key={RoofTexture.Texture03} value={RoofTexture.Texture03}>
              <img
                alt={RoofTexture.Texture03}
                src={RoofTexture03Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture03', lang)}
            </Option>

            <Option key={RoofTexture.Texture04} value={RoofTexture.Texture04}>
              <img
                alt={RoofTexture.Texture04}
                src={RoofTexture04Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture04', lang)}
            </Option>

            <Option key={RoofTexture.Texture05} value={RoofTexture.Texture05}>
              <img
                alt={RoofTexture.Texture05}
                src={RoofTexture05Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture05', lang)}
            </Option>

            <Option key={RoofTexture.Texture06} value={RoofTexture.Texture06}>
              <img
                alt={RoofTexture.Texture06}
                src={RoofTexture06Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture06', lang)}
            </Option>

            <Option key={RoofTexture.Texture07} value={RoofTexture.Texture07}>
              <img
                alt={RoofTexture.Texture07}
                src={RoofTexture07Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('roofMenu.Texture07', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
        >
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('roofMenu.OnlyThisRoof', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('roofMenu.AllRoofs', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofTextureSelection;
