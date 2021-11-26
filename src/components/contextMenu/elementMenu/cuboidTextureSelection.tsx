/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import CuboidTexture01Icon from '../../../resources/building_facade_01_menu.png';

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
  const updateCuboidTextureById = useStore(Selector.updateCuboidTextureById);
  const updateCuboidTextureForAll = useStore(Selector.updateCuboidTextureForAll);
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
  }, [cuboid]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setTexture = (value: CuboidTexture) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTexturesAll = new Map<string, CuboidTexture[] | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            oldTexturesAll.set(elem.id, (elem as CuboidModel).textureTypes);
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
                  updateCuboidTextureById(id, tx[i] as CuboidTexture);
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
      case Scope.OnlyThisSide:
        if (cuboid && selectedSideIndex >= 0) {
          const oldTexture = cuboid.textureTypes ? cuboid.textureTypes[selectedSideIndex] : CuboidTexture.NoTexture;
          const undoableChange = {
            name: 'Set Texture for Selected Side of Cuboid',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            undo: () => {
              updateCuboidTextureBySide(selectedSideIndex, cuboid.id, undoableChange.oldValue as CuboidTexture);
            },
            redo: () => {
              updateCuboidTextureBySide(selectedSideIndex, cuboid.id, undoableChange.newValue as CuboidTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateCuboidTextureBySide(selectedSideIndex, cuboid.id, value);
        }
        break;
      default:
        if (cuboid) {
          const oldTextures = cuboid.textureTypes;
          const undoableChange = {
            name: 'Set Texture for All Sides of Selected Cuboid',
            timestamp: Date.now(),
            oldValue: oldTextures,
            newValue: value,
            undo: () => {
              if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
                for (let i = 0; i < undoableChange.oldValue.length; i++) {
                  updateCuboidTextureById(cuboid.id, undoableChange.oldValue[i] as CuboidTexture);
                }
              }
            },
            redo: () => {
              updateCuboidTextureById(cuboid.id, undoableChange.newValue as CuboidTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateCuboidTextureById(cuboid.id, value);
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
        // this must be specified for the x button at the upper-right corner to work
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
