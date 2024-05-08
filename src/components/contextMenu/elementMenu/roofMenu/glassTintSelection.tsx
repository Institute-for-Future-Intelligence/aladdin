/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { RoofModel } from 'src/models/RoofModel';

const GlassTintSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const roof = useStore(Selector.selectedElement) as RoofModel;
  const addUndoable = useStore(Selector.addUndoable);
  const roofActionScope = useStore(Selector.roofActionScope);
  const setRoofActionScope = useStore(Selector.setRoofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const [selectedTint, setSelectedTint] = useState<string>(roof?.glassTint ?? '#73D8FF');
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  useEffect(() => {
    if (roof) {
      setSelectedTint(roof?.glassTint ?? '#73D8FF');
    }
  }, [roof]);

  const updateTintById = (id: string, glassTint: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as RoofModel).glassTint = glassTint;
          }
          break;
        }
      }
    });
  };

  const updateColorInMap = (map: Map<string, string>, tint: string) => {
    for (const id of map.keys()) {
      updateTintById(id, tint as string);
    }
  };

  const undoTintInMap = (map: Map<string, string>) => {
    for (const [id, tint] of map.entries()) {
      updateTintById(id, tint as string);
    }
  };

  const setTint = (value: string) => {
    if (!roof) return;
    switch (roofActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTintsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Roof && !elem.locked) {
            oldTintsAll.set(elem.id, (elem as RoofModel).glassTint ?? '#73D8FF');
          }
        }
        const undoableChangeAll = {
          name: 'Set Glass Tint for All Roofs',
          timestamp: Date.now(),
          oldValues: oldTintsAll,
          newValue: value,
          undo: () => {
            undoTintInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateColorInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateColorInMap(oldTintsAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roof.foundationId) {
          const oldTintsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Roof && elem.foundationId === roof.foundationId && !roof.locked) {
              oldTintsAboveFoundation.set(elem.id, (elem as RoofModel).glassTint ?? '#73D8FF');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Glass Tint for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTintsAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
            undo: () => {
              undoTintInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateColorInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateColorInMap(oldTintsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldTint = (updatedRoof ? updatedRoof.glassTint : roof.glassTint) ?? '#73D8FF';
          const undoableChange = {
            name: 'Set Glass Tint of Selected Roof',
            timestamp: Date.now(),
            oldValue: oldTint,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateTintById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateTintById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTintById(roof.id, value);
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
    if (roof?.glassTint) {
      setSelectedTint(roof.glassTint);
    }
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    const updatedRoof = getElementById(roof.id) as RoofModel;
    if (updatedRoof && updatedRoof.glassTint !== selectedTint) {
      setTint(selectedTint);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setTint(selectedTint);
  };

  return (
    <>
      <Modal
        width={640}
        open={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('roofMenu.GlassTint', lang)}
          </div>
        }
        footer={[
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" ref={okButtonRef} onClick={handleOk}>
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
          <Col className="gutter-row" span={11}>
            <CompactPicker
              color={selectedTint ?? roof?.glassTint ?? '#73D8FF'}
              onChangeComplete={(colorResult) => {
                setSelectedTint(colorResult.hex);
              }}
            />
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={13}
          >
            <Radio.Group onChange={(e) => setRoofActionScope(e.target.value)} value={roofActionScope}>
              <Space direction="vertical">
                <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                  {i18n.t('roofMenu.OnlyThisRoof', lang)}
                </Radio>
                <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
                </Radio>
                <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                  {i18n.t('roofMenu.AllRoofs', lang)}
                </Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default GlassTintSelection;
