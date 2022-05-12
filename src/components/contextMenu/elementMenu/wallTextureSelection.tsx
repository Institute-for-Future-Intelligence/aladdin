/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, WallTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WallModel } from 'src/models/WallModel';

const WallTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateWallTextureById = useStore(Selector.updateWallTextureById);
  const updateWallTextureAboveFoundation = useStore(Selector.updateWallTextureAboveFoundation);
  const updateWallTextureForAll = useStore(Selector.updateWallTextureForAll);
  const wall = useStore(Selector.selectedElement) as WallModel;
  const addUndoable = useStore(Selector.addUndoable);
  const wallActionScope = useStore(Selector.wallActionScope);
  const setWallActionScope = useStore(Selector.setWallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const [selectedTexture, setSelectedTexture] = useState<WallTexture>(wall?.textureType ?? WallTexture.Default);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };
  const { Option } = Select;

  useEffect(() => {
    if (wall) {
      setSelectedTexture(wall?.textureType ?? WallTexture.Default);
    }
  }, [wall]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setWallActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setTexture = (value: WallTexture) => {
    if (!wall) return;
    switch (wallActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTexturesAll = new Map<string, WallTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Wall && !elem.locked) {
            oldTexturesAll.set(elem.id, (elem as WallModel).textureType ?? WallTexture.Default);
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
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, WallTexture>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Wall && elem.foundationId === wall.foundationId && !elem.locked) {
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
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldTexture = updatedWall?.textureType ?? wall.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateWallTextureById(undoableChange.changedElementId, undoableChange.oldValue as WallTexture);
            },
            redo: () => {
              updateWallTextureById(undoableChange.changedElementId, undoableChange.newValue as WallTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateWallTextureById(wall.id, value);
          setApplyCount(applyCount + 1);
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

  const close = () => {
    if (wall?.textureType) {
      setSelectedTexture(wall.textureType);
    }
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setTexture(selectedTexture);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={550}
        visible={true}
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
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok} ref={okButtonRef}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={close}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={9}>
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
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={15}
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
