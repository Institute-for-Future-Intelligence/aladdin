/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import Foundation_Texture_01_Menu from '../../../resources/foundation_01_menu.png';
import Foundation_Texture_02_Menu from '../../../resources/foundation_02_menu.png';
import Foundation_Texture_03_Menu from '../../../resources/foundation_03_menu.png';
import Foundation_Texture_04_Menu from '../../../resources/foundation_04_menu.png';
import Foundation_Texture_05_Menu from '../../../resources/foundation_05_menu.png';
import Foundation_Texture_06_Menu from '../../../resources/foundation_06_menu.png';
import Foundation_Texture_07_Menu from '../../../resources/foundation_07_menu.png';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FoundationTexture, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';

const FoundationTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateFoundationTextureById = useStore(Selector.updateFoundationTextureById);
  const updateFoundationTextureForAll = useStore(Selector.updateFoundationTextureForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const foundation = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Foundation),
  ) as FoundationModel;

  const [selectedTexture, setSelectedTexture] = useState<FoundationTexture>(
    foundation?.textureType ?? FoundationTexture.NoTexture,
  );
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
    if (foundation) {
      setSelectedTexture(foundation?.textureType ?? FoundationTexture.NoTexture);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (texture: FoundationTexture) => {
    switch (foundationActionScope) {
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

  const setTexture = (value: FoundationTexture) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
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
      default:
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
    }
    setCommonStore((state) => {
      state.actionState.foundationTexture = value;
    });
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
    if (foundation?.textureType) {
      setSelectedTexture(foundation.textureType);
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
        width={500}
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
          <Col className="gutter-row" span={10}>
            <Select style={{ width: '150px' }} value={selectedTexture} onChange={(value) => setSelectedTexture(value)}>
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
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationTextureSelection;
