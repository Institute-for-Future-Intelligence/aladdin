/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { CuboidTexture, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { CuboidModel } from '../../../models/CuboidModel';

const CuboidTextureSelection = ({
  textureDialogVisible,
  setTextureDialogVisible,
}: {
  textureDialogVisible: boolean;
  setTextureDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateCuboidTextureBySide = useStore(Selector.updateCuboidTextureBySide);
  const updateCuboidTextureById = useStore(Selector.updateCuboidFacadeTextureById);
  const updateCuboidTextureForAll = useStore(Selector.updateCuboidFacadeTextureForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);
  const selectedSideIndex = useStore(Selector.selectedSideIndex);

  const cuboid = getSelectedElement() as CuboidModel;
  const [selectedTexture, setSelectedTexture] = useState<CuboidTexture>(
    cuboid && cuboid.textureTypes && selectedSideIndex >= 0
      ? cuboid.textureTypes[selectedSideIndex]
      : CuboidTexture.NoTexture,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };
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

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (texture: CuboidTexture) => {
    switch (cuboidActionScope) {
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
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
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
        break;
      case Scope.OnlyThisObject:
        if (cuboid) {
          const oldTextures = cuboid.textureTypes ? [...cuboid.textureTypes] : undefined;
          const undoableChange = {
            name: 'Set Texture for All Sides of Selected Cuboid',
            timestamp: Date.now(),
            oldValue: oldTextures,
            newValue: value,
            changedElementId: cuboid.id,
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
        }
        break;
      default:
        if (cuboid && selectedSideIndex >= 0) {
          const oldTexture = cuboid.textureTypes ? cuboid.textureTypes[selectedSideIndex] : CuboidTexture.NoTexture;
          const undoableChange = {
            name: 'Set Texture for Selected Side of Cuboid',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: cuboid.id,
            undo: () => {
              updateCuboidTextureBySide(
                selectedSideIndex,
                undoableChange.changedElementId,
                undoableChange.oldValue as CuboidTexture,
              );
            },
            redo: () => {
              updateCuboidTextureBySide(
                selectedSideIndex,
                undoableChange.changedElementId,
                undoableChange.newValue as CuboidTexture,
              );
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateCuboidTextureBySide(selectedSideIndex, cuboid.id, value);
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

  return (
    <>
      <Modal
        width={600}
        visible={textureDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Texture', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setTexture(selectedTexture);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              if (cuboid?.textureTypes && selectedSideIndex >= 0) {
                setSelectedTexture(cuboid.textureTypes[selectedSideIndex]);
              }
              setTextureDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setTexture(selectedTexture);
              setTextureDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          if (cuboid?.textureTypes && selectedSideIndex >= 0) {
            setSelectedTexture(cuboid.textureTypes[selectedSideIndex]);
          }
          setTextureDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={12}>
            <Select style={{ width: '150px' }} value={selectedTexture} onChange={(value) => setSelectedTexture(value)}>
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
            <Radio.Group onChange={onScopeChange} value={cuboidActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisSide}>{i18n.t('cuboidMenu.OnlyThisSide', lang)}</Radio>
                <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.AllSidesOfThisCuboid', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllSidesOfAllCuboids', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CuboidTextureSelection;
