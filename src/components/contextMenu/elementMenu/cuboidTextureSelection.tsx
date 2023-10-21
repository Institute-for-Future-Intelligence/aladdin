/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import CuboidTexture01Icon from '../../../resources/building_facade_01_menu.png';
import CuboidTexture02Icon from '../../../resources/building_facade_02_menu.png';
import CuboidTexture03Icon from '../../../resources/building_facade_03_menu.png';
import CuboidTexture04Icon from '../../../resources/building_facade_04_menu.png';
import CuboidTexture05Icon from '../../../resources/building_facade_05_menu.png';
import CuboidTexture06Icon from '../../../resources/building_facade_06_menu.png';
import CuboidTexture07Icon from '../../../resources/building_facade_07_menu.png';
import CuboidTexture08Icon from '../../../resources/building_facade_08_menu.png';
import CuboidTexture09Icon from '../../../resources/building_facade_09_menu.png';
import CuboidTexture10Icon from '../../../resources/building_facade_10_menu.png';

import React, { useEffect, useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { CuboidTexture, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { CuboidModel } from '../../../models/CuboidModel';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const CuboidTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.cuboidActionScope);
  const setActionScope = useStore(Selector.setCuboidActionScope);
  const selectedSideIndex = useStore(Selector.selectedSideIndex);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const cuboid = useSelectedElement(ObjectType.Cuboid) as CuboidModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<CuboidTexture>(
    cuboid && cuboid.textureTypes && selectedSideIndex >= 0
      ? cuboid.textureTypes[selectedSideIndex]
      : CuboidTexture.NoTexture,
  );

  const lang = useLanguage();
  const { Option } = Select;

  useEffect(() => {
    if (cuboid) {
      setSelectedTexture(
        cuboid.textureTypes && selectedSideIndex >= 0
          ? cuboid.textureTypes[selectedSideIndex]
          : CuboidTexture.NoTexture,
      );
    }
  }, [cuboid, selectedSideIndex]);

  const updateCuboidTextureBySide = (side: number, id: string, texture: CuboidTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
          const cuboid = e as CuboidModel;
          if (!cuboid.textureTypes) {
            cuboid.textureTypes = new Array<CuboidTexture>(6);
            cuboid.textureTypes.fill(CuboidTexture.NoTexture);
          }
          cuboid.textureTypes[side] = texture;
          break;
        }
      }
    });
  };

  const updateCuboidTextureById = (id: string, texture: CuboidTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && e.id === id && !e.locked) {
          const cuboid = e as CuboidModel;
          if (!cuboid.textureTypes) {
            cuboid.textureTypes = new Array<CuboidTexture>(6);
            cuboid.textureTypes.fill(CuboidTexture.NoTexture);
          }
          for (let i = 0; i < 4; i++) {
            cuboid.textureTypes[i] = texture;
          }
          break;
        }
      }
    });
  };

  const updateCuboidTextureInMap = (map: Map<string, CuboidTexture[] | undefined>, texture?: CuboidTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && !e.locked && map.has(e.id)) {
          const cuboid = e as CuboidModel;
          if (!cuboid.textureTypes) {
            cuboid.textureTypes = new Array<CuboidTexture>(6);
            cuboid.textureTypes.fill(CuboidTexture.NoTexture);
          }
          if (texture !== undefined) {
            for (let i = 0; i < 4; i++) {
              cuboid.textureTypes[i] = texture;
            }
          } else {
            const textures = map.get(e.id);
            if (textures && textures.length >= 4) {
              for (let i = 0; i < 4; i++) {
                cuboid.textureTypes[i] = textures[i];
              }
            }
          }
        }
      }
    });
  };

  const updateCuboidTextureForAll = (texture: CuboidTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Cuboid && !e.locked) {
          const cuboid = e as CuboidModel;
          if (!cuboid.textureTypes) {
            cuboid.textureTypes = new Array<CuboidTexture>(6);
            cuboid.textureTypes.fill(CuboidTexture.NoTexture);
          }
          for (let i = 0; i < 4; i++) {
            cuboid.textureTypes[i] = texture;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (texture: CuboidTexture) => {
    if (!cuboid) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const cm = e as CuboidModel;
            if (cm.textureTypes) {
              // do not check the top and bottom sides, check only the vertical sides (the first four)
              for (let i = 0; i < 4; i++) {
                if (texture !== cm.textureTypes[i]) {
                  return true;
                }
              }
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const cm = e as CuboidModel;
            if (cm.textureTypes) {
              // do not check the top and bottom sides, check only the vertical sides (the first four)
              for (let i = 0; i < 4; i++) {
                if (texture !== cm.textureTypes[i]) {
                  return true;
                }
              }
            }
          }
        }
        break;
      case Scope.OnlyThisObject:
        if (cuboid.textureTypes) {
          // do not check the top and bottom sides, check only the vertical sides (the first four)
          for (let i = 0; i < 4; i++) {
            if (texture !== cuboid.textureTypes[i]) {
              return true;
            }
          }
        }
        break;
      default:
        if (selectedSideIndex >= 0 && cuboid.textureTypes) {
          if (texture !== cuboid.textureTypes[selectedSideIndex]) {
            return true;
          }
        }
    }
    return false;
  };

  const setTexture = (value: CuboidTexture) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, CuboidTexture[] | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const cm = elem as CuboidModel;
            oldTexturesSelected.set(elem.id, cm.textureTypes ? [...cm.textureTypes] : undefined);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Cuboids',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            for (const [id, tx] of undoableChangeSelected.oldValues.entries()) {
              if (tx && Array.isArray(tx)) {
                for (let i = 0; i < tx.length; i++) {
                  updateCuboidTextureBySide(i, id, tx[i] as CuboidTexture);
                }
              }
            }
          },
          redo: () => {
            updateCuboidTextureInMap(
              undoableChangeSelected.oldValues as Map<string, CuboidTexture[]>,
              undoableChangeSelected.newValue as CuboidTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateCuboidTextureInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceTextures)
            state.actionState.cuboidFaceTextures = [
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
            ];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceTextures[i] = value;
          }
        });
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, CuboidTexture[] | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            const cm = elem as CuboidModel;
            oldTexturesAll.set(elem.id, cm.textureTypes ? [...cm.textureTypes] : undefined);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Cuboids',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, tx] of undoableChangeAll.oldValues.entries()) {
              if (tx && Array.isArray(tx)) {
                for (let i = 0; i < tx.length; i++) {
                  updateCuboidTextureBySide(i, id, tx[i] as CuboidTexture);
                }
              }
            }
          },
          redo: () => {
            updateCuboidTextureForAll(undoableChangeAll.newValue as CuboidTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateCuboidTextureForAll(value);
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceTextures)
            state.actionState.cuboidFaceTextures = [
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
            ];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceTextures[i] = value;
          }
        });
        break;
      }
      case Scope.OnlyThisObject:
        const oldTextures = cuboid.textureTypes ? [...cuboid.textureTypes] : undefined;
        const undoableChange = {
          name: 'Set Texture for All Sides of Selected Cuboid',
          timestamp: Date.now(),
          oldValue: oldTextures,
          newValue: value,
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
          undo: () => {
            if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
              for (let i = 0; i < undoableChange.oldValue.length; i++) {
                updateCuboidTextureBySide(
                  i,
                  undoableChange.changedElementId,
                  undoableChange.oldValue[i] as CuboidTexture,
                );
              }
            }
          },
          redo: () => {
            updateCuboidTextureById(undoableChange.changedElementId, undoableChange.newValue as CuboidTexture);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateCuboidTextureById(cuboid.id, value);
        setApplyCount(applyCount + 1);
        setCommonStore((state) => {
          if (!state.actionState.cuboidFaceTextures)
            state.actionState.cuboidFaceTextures = [
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
              CuboidTexture.NoTexture,
            ];
          for (let i = 0; i < 4; i++) {
            state.actionState.cuboidFaceTextures[i] = value;
          }
        });
        break;
      default:
        if (selectedSideIndex >= 0) {
          const oldTexture = cuboid.textureTypes ? cuboid.textureTypes[selectedSideIndex] : CuboidTexture.NoTexture;
          const undoableChange = {
            name: 'Set Texture for Selected Side of Cuboid',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: cuboid.id,
            changedElementType: cuboid.type,
            changedSideIndex: selectedSideIndex,
            undo: () => {
              if (undoableChange.changedSideIndex !== undefined) {
                updateCuboidTextureBySide(
                  undoableChange.changedSideIndex,
                  undoableChange.changedElementId,
                  undoableChange.oldValue as CuboidTexture,
                );
              }
            },
            redo: () => {
              if (undoableChange.changedSideIndex !== undefined) {
                updateCuboidTextureBySide(
                  undoableChange.changedSideIndex,
                  undoableChange.changedElementId,
                  undoableChange.newValue as CuboidTexture,
                );
              }
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateCuboidTextureBySide(selectedSideIndex, cuboid.id, value);
          setApplyCount(applyCount + 1);
          setCommonStore((state) => {
            if (!state.actionState.cuboidFaceTextures)
              state.actionState.cuboidFaceTextures = [
                CuboidTexture.NoTexture,
                CuboidTexture.NoTexture,
                CuboidTexture.NoTexture,
                CuboidTexture.NoTexture,
                CuboidTexture.NoTexture,
                CuboidTexture.NoTexture,
              ];
            state.actionState.cuboidFaceTextures[selectedSideIndex] = value;
          });
        }
    }
  };

  const close = () => {
    if (cuboid?.textureTypes && selectedSideIndex >= 0) {
      setSelectedTexture(cuboid.textureTypes[selectedSideIndex]);
    }
    setDialogVisible(false);
  };

  const apply = () => {
    setTexture(selectedTexture);
  };

  return (
    <Dialog width={600} title={i18n.t('word.Texture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={12}>
          <Select style={{ width: '150px' }} value={selectedTexture} onChange={setSelectedTexture}>
            <Option key={CuboidTexture.NoTexture} value={CuboidTexture.NoTexture}>
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

            <Option key={CuboidTexture.Facade01} value={CuboidTexture.Facade01}>
              <img
                alt={CuboidTexture.Facade01}
                src={CuboidTexture01Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture01', lang)}
            </Option>

            <Option key={CuboidTexture.Facade02} value={CuboidTexture.Facade02}>
              <img
                alt={CuboidTexture.Facade02}
                src={CuboidTexture02Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture02', lang)}
            </Option>

            <Option key={CuboidTexture.Facade03} value={CuboidTexture.Facade03}>
              <img
                alt={CuboidTexture.Facade03}
                src={CuboidTexture03Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture03', lang)}
            </Option>

            <Option key={CuboidTexture.Facade04} value={CuboidTexture.Facade04}>
              <img
                alt={CuboidTexture.Facade04}
                src={CuboidTexture04Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture04', lang)}
            </Option>

            <Option key={CuboidTexture.Facade05} value={CuboidTexture.Facade05}>
              <img
                alt={CuboidTexture.Facade05}
                src={CuboidTexture05Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture05', lang)}
            </Option>

            <Option key={CuboidTexture.Facade06} value={CuboidTexture.Facade06}>
              <img
                alt={CuboidTexture.Facade06}
                src={CuboidTexture06Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture06', lang)}
            </Option>

            <Option key={CuboidTexture.Facade07} value={CuboidTexture.Facade07}>
              <img
                alt={CuboidTexture.Facade07}
                src={CuboidTexture07Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture07', lang)}
            </Option>

            <Option key={CuboidTexture.Facade08} value={CuboidTexture.Facade08}>
              <img
                alt={CuboidTexture.Facade08}
                src={CuboidTexture08Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture08', lang)}
            </Option>

            <Option key={CuboidTexture.Facade09} value={CuboidTexture.Facade09}>
              <img
                alt={CuboidTexture.Facade09}
                src={CuboidTexture09Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture09', lang)}
            </Option>

            <Option key={CuboidTexture.Facade10} value={CuboidTexture.Facade10}>
              <img
                alt={CuboidTexture.Facade10}
                src={CuboidTexture10Icon}
                height={20}
                width={40}
                style={{ paddingRight: '8px' }}
              />{' '}
              {i18n.t('cuboidMenu.Texture10', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={12}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisSide}>{i18n.t('cuboidMenu.OnlyThisSide', lang)}</Radio>
              <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.AllSidesOfThisCuboid', lang)}</Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('cuboidMenu.AllSidesOfSelectedCuboids', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllSidesOfAllCuboids', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default CuboidTextureSelection;
