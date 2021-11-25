/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import Wall_01_Menu_Img from '../../../resources/wall_01_menu.png';
import Wall_02_Menu_Img from '../../../resources/wall_02_menu.png';
import Wall_03_Menu_Img from '../../../resources/wall_03_menu.png';
import Wall_04_Menu_Img from '../../../resources/wall_04_menu.png';
import Wall_05_Menu_Img from '../../../resources/wall_05_menu.png';
import Wall_06_Menu_Img from '../../../resources/wall_06_menu.png';
import Wall_07_Menu_Img from '../../../resources/wall_07_menu.png';
import Wall_08_Menu_Img from '../../../resources/wall_08_menu.png';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope, WallTexture } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../models/WallModel';

const WallTextureSelection = ({
  textureDialogVisible,
  setTextureDialogVisible,
}: {
  textureDialogVisible: boolean;
  setTextureDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateWallTextureById = useStore(Selector.updateWallTextureById);
  const updateWallTextureAboveFoundation = useStore(Selector.updateWallTextureAboveFoundation);
  const updateWallTextureForAll = useStore(Selector.updateWallTextureForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const wallActionScope = useStore(Selector.wallActionScope);
  const setWallActionScope = useStore(Selector.setWallActionScope);

  const wall = getSelectedElement() as WallModel;
  const [selectedTexture, setSelectedTexture] = useState<WallTexture>(wall?.textureType ?? WallTexture.NoTexture);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };
  const { Option } = Select;

  useEffect(() => {
    if (wall) {
      setSelectedTexture(wall?.textureType ?? WallTexture.NoTexture);
    }
  }, [wall]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setWallActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setTexture = (value: WallTexture) => {
    switch (wallActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTexturesAll = new Map<string, WallTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Wall) {
            oldTexturesAll.set(elem.id, (elem as WallModel).textureType ?? WallTexture.NoTexture);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Walls',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeAll.oldValues.entries()) {
              updateWallTextureById(id, texture as WallTexture);
            }
          },
          redo: () => {
            updateWallTextureForAll(undoableChangeAll.newValue as WallTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateWallTextureForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, WallTexture>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Wall && elem.foundationId === wall.foundationId) {
              oldTexturesAboveFoundation.set(elem.id, (elem as WallModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, wt] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateWallTextureById(id, wt as WallTexture);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateWallTextureAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as WallTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateWallTextureAboveFoundation(wall.foundationId, value);
        }
        break;
      default:
        if (wall) {
          const oldTexture = wall.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            undo: () => {
              updateWallTextureById(wall.id, undoableChange.oldValue as WallTexture);
            },
            redo: () => {
              updateWallTextureById(wall.id, undoableChange.newValue as WallTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateWallTextureById(wall.id, value);
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
        width={500}
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
              if (wall?.textureType) {
                setSelectedTexture(wall.textureType);
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
          if (wall?.textureType) {
            setSelectedTexture(wall.textureType);
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
          <Col className="gutter-row" span={10}>
            <Select style={{ width: '150px' }} value={selectedTexture} onChange={(value) => setSelectedTexture(value)}>
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

              <Option key={WallTexture.Texture_1} value={WallTexture.Texture_1}>
                <img
                  alt={WallTexture.Texture_1}
                  src={Wall_01_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture1', lang)}
              </Option>

              <Option key={WallTexture.Texture_2} value={WallTexture.Texture_2}>
                <img
                  alt={WallTexture.Texture_2}
                  src={Wall_02_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture2', lang)}
              </Option>

              <Option key={WallTexture.Texture_3} value={WallTexture.Texture_3}>
                <img
                  alt={WallTexture.Texture_3}
                  src={Wall_03_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture3', lang)}
              </Option>

              <Option key={WallTexture.Texture_4} value={WallTexture.Texture_4}>
                <img
                  alt={WallTexture.Texture_4}
                  src={Wall_04_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture4', lang)}
              </Option>

              <Option key={WallTexture.Texture_5} value={WallTexture.Texture_5}>
                <img
                  alt={WallTexture.Texture_5}
                  src={Wall_05_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture5', lang)}
              </Option>

              <Option key={WallTexture.Texture_6} value={WallTexture.Texture_6}>
                <img
                  alt={WallTexture.Texture_6}
                  src={Wall_06_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture6', lang)}
              </Option>

              <Option key={WallTexture.Texture_7} value={WallTexture.Texture_7}>
                <img
                  alt={WallTexture.Texture_7}
                  src={Wall_07_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture7', lang)}
              </Option>

              <Option key={WallTexture.Texture_8} value={WallTexture.Texture_8}>
                <img
                  alt={WallTexture.Texture_8}
                  src={Wall_08_Menu_Img}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('wallMenu.Texture8', lang)}
              </Option>
            </Select>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={14}
          >
            <Radio.Group onChange={onScopeChange} value={wallActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('wallMenu.OnlyThisWall', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('wallMenu.AllWalls', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default WallTextureSelection;
