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

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, RoofTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RoofModel } from 'src/models/RoofModel';

const RoofTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const roof = useStore(Selector.selectedElement) as RoofModel;
  const addUndoable = useStore(Selector.addUndoable);
  const roofActionScope = useStore(Selector.roofActionScope);
  const setRoofActionScope = useStore(Selector.setRoofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const setCommonStore = useStore(Selector.set);

  const [selectedTexture, setSelectedTexture] = useState<RoofTexture>(roof?.textureType ?? RoofTexture.Default);
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
    if (roof) {
      setSelectedTexture(roof?.textureType ?? RoofTexture.Default);
    }
  }, [roof]);

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

  const updateTextureAboveFoundation = (groupId: string, textureType: RoofTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.foundationId === groupId) {
          (e as RoofModel).textureType = textureType;
        }
      }
    });
  };

  const updateTextureInMap = (map: Map<string, RoofTexture>, textureType: RoofTexture) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, textureType);
    }
  };

  const undoTextureInMap = (map: Map<string, RoofTexture>) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, texture);
    }
  };

  const setTexture = (value: RoofTexture) => {
    switch (roofActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTexturesAll = new Map<string, RoofTexture>();
        for (const elem of useStore.getState().elements) {
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
          for (const elem of useStore.getState().elements) {
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
              undoTextureInMap(undoableChangeAboveFoundation.oldTexturesAboveFoundation as Map<string, RoofTexture>);
              console.log('undo');
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTextureAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as RoofTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTextureAboveFoundation(roof.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const oldTexture = roof.textureType;
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
    if (roof?.textureType) {
      setSelectedTexture(roof.textureType);
    }
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setTexture(selectedTexture);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setTexture(selectedTexture);
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
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={handleOk} ref={okButtonRef}>
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
                  src={WallTextureDefaultIcon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.TextureDefault', lang)}
              </Option>

              <Option key={RoofTexture.Texture01} value={RoofTexture.Texture01}>
                <img
                  alt={RoofTexture.Texture01}
                  src={WallTexture01Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture01', lang)}
              </Option>

              <Option key={RoofTexture.Texture02} value={RoofTexture.Texture02}>
                <img
                  alt={RoofTexture.Texture02}
                  src={WallTexture02Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture02', lang)}
              </Option>

              <Option key={RoofTexture.Texture03} value={RoofTexture.Texture03}>
                <img
                  alt={RoofTexture.Texture03}
                  src={WallTexture03Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture03', lang)}
              </Option>

              <Option key={RoofTexture.Texture04} value={RoofTexture.Texture04}>
                <img
                  alt={RoofTexture.Texture04}
                  src={WallTexture04Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture04', lang)}
              </Option>

              <Option key={RoofTexture.Texture05} value={RoofTexture.Texture05}>
                <img
                  alt={RoofTexture.Texture05}
                  src={WallTexture05Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture05', lang)}
              </Option>

              <Option key={RoofTexture.Texture06} value={RoofTexture.Texture06}>
                <img
                  alt={RoofTexture.Texture06}
                  src={WallTexture06Icon}
                  height={20}
                  width={40}
                  style={{ paddingRight: '8px' }}
                />{' '}
                {i18n.t('roofMenu.Texture06', lang)}
              </Option>

              <Option key={RoofTexture.Texture07} value={RoofTexture.Texture07}>
                <img
                  alt={RoofTexture.Texture07}
                  src={WallTexture07Icon}
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
            <Radio.Group value={roofActionScope} onChange={(e) => setRoofActionScope(e.target.value)}>
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
      </Modal>
    </>
  );
};

export default RoofTextureSelection;
