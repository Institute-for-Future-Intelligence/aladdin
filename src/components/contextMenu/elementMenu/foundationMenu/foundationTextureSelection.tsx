/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import Foundation_Texture_01_Menu from '../../../../resources/foundation_01_menu.png';
import Foundation_Texture_02_Menu from '../../../../resources/foundation_02_menu.png';
import Foundation_Texture_03_Menu from '../../../../resources/foundation_03_menu.png';
import Foundation_Texture_04_Menu from '../../../../resources/foundation_04_menu.png';
import Foundation_Texture_05_Menu from '../../../../resources/foundation_05_menu.png';
import Foundation_Texture_06_Menu from '../../../../resources/foundation_06_menu.png';
import Foundation_Texture_07_Menu from '../../../../resources/foundation_07_menu.png';

import React, { useState } from 'react';
import { Col, Radio, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { FoundationTexture, ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../../models/FoundationModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';

const FoundationTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState(foundation?.textureType ?? FoundationTexture.NoTexture);

  const lang = useLanguage();
  const { Option } = Select;

  const updateFoundationTextureById = (id: string, texture: FoundationTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          (e as FoundationModel).textureType = texture;
          break;
        }
      }
    });
  };

  const updateFoundationTextureForAll = (texture: FoundationTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked) {
          (e as FoundationModel).textureType = texture;
        }
      }
    });
  };

  const needChange = (texture: FoundationTexture) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (texture !== f.textureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (texture !== f.textureType) {
              return true;
            }
          }
        }
        break;
      default:
        if (texture !== foundation?.textureType) {
          return true;
        }
    }
    return false;
  };

  const updateTextureInMap = (map: Map<string, FoundationTexture>, value?: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && map.has(e.id)) {
          if (value !== undefined) {
            (e as FoundationModel).textureType = value as FoundationTexture;
          } else {
            const texture = map.get(e.id);
            if (texture !== undefined) {
              (e as FoundationModel).textureType = texture as FoundationTexture;
            }
          }
        }
      }
    });
  };

  const updateTexture = (value: FoundationTexture) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, FoundationTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldTexturesSelected.set(elem.id, (elem as FoundationModel).textureType ?? FoundationTexture.NoTexture);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            updateTextureInMap(undoableChangeAll.oldValues as Map<string, FoundationTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeAll.oldValues as Map<string, FoundationTexture>,
              undoableChangeAll.newValue as FoundationTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTextureInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, FoundationTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldTexturesAll.set(elem.id, (elem as FoundationModel).textureType ?? FoundationTexture.NoTexture);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Foundations',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeAll.oldValues.entries()) {
              updateFoundationTextureById(id, texture as FoundationTexture);
            }
          },
          redo: () => {
            updateFoundationTextureForAll(undoableChangeAll.newValue as FoundationTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateFoundationTextureForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      default: {
        // foundation via selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id) as FoundationModel;
        const oldTexture = f ? f.textureType : foundation.textureType;
        const undoableChange = {
          name: 'Set Texture of Selected Foundation',
          timestamp: Date.now(),
          oldValue: oldTexture,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateFoundationTextureById(undoableChange.changedElementId, undoableChange.oldValue as FoundationTexture);
          },
          redo: () => {
            updateFoundationTextureById(undoableChange.changedElementId, undoableChange.newValue as FoundationTexture);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateFoundationTextureById(foundation.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.foundationTexture = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateTexture(selectedTexture);
  };

  return (
    <Dialog width={500} title={i18n.t('word.Texture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={10}>
          <Select style={{ width: '150px' }} value={selectedTexture} onChange={setSelectedTexture}>
            <Option key={FoundationTexture.NoTexture} value={FoundationTexture.NoTexture}>
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

            <Option key={FoundationTexture.Texture01} value={FoundationTexture.Texture01}>
              <img
                alt={FoundationTexture.Texture01}
                src={Foundation_Texture_01_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture01', lang)}
            </Option>

            <Option key={FoundationTexture.Texture02} value={FoundationTexture.Texture02}>
              <img
                alt={FoundationTexture.Texture02}
                src={Foundation_Texture_02_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture02', lang)}
            </Option>

            <Option key={FoundationTexture.Texture03} value={FoundationTexture.Texture03}>
              <img
                alt={FoundationTexture.Texture03}
                src={Foundation_Texture_03_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture03', lang)}
            </Option>

            <Option key={FoundationTexture.Texture04} value={FoundationTexture.Texture04}>
              <img
                alt={FoundationTexture.Texture04}
                src={Foundation_Texture_04_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture04', lang)}
            </Option>

            <Option key={FoundationTexture.Texture05} value={FoundationTexture.Texture05}>
              <img
                alt={FoundationTexture.Texture05}
                src={Foundation_Texture_05_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture05', lang)}
            </Option>

            <Option key={FoundationTexture.Texture06} value={FoundationTexture.Texture06}>
              <img
                alt={FoundationTexture.Texture06}
                src={Foundation_Texture_06_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture06', lang)}
            </Option>

            <Option key={FoundationTexture.Texture07} value={FoundationTexture.Texture07}>
              <img
                alt={FoundationTexture.Texture07}
                src={Foundation_Texture_07_Menu}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('foundationMenu.Texture07', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={14}
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
};

export default FoundationTextureSelection;
