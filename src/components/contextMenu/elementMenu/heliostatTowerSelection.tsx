/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HeliostatModel } from '../../../models/HeliostatModel';
import { ObjectType, Scope, SolarStructure } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';

const { Option } = Select;

const HeliostatTowerSelection = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateSolarReceiverById);
  const updateAboveFoundation = useStore(Selector.updateSolarReceiverAboveFoundation);
  const updateForAll = useStore(Selector.updateSolarReceiverForAll);
  const heliostat = useStore(Selector.selectedElement) as HeliostatModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.heliostatActionScope);
  const setActionScope = useStore(Selector.setHeliostatActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [selectedTowerId, setSelectedTowerId] = useState<string>(heliostat?.towerId ?? 'None');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  okButtonRef.current?.focus();

  const lang = { lng: language };

  const towers = useMemo(() => {
    const towerIds: string[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.FocusTower) {
          towerIds.push(f.id);
        }
      }
    }
    return towerIds;
  }, [elements]);

  useEffect(() => {
    setSelectedTowerId('None');
    if (heliostat) {
      if (heliostat.towerId) {
        setSelectedTowerId(heliostat.towerId);
      } else {
        const parent = getElementById(heliostat.parentId);
        if (parent) {
          if (
            parent.type === ObjectType.Foundation &&
            (parent as FoundationModel).solarStructure === SolarStructure.FocusTower
          ) {
            setSelectedTowerId(parent.id);
          }
        }
      }
    }
  }, [heliostat]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (towerId: string) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.towerId !== towerId) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Heliostat && e.foundationId === heliostat?.foundationId && !e.locked) {
            const hs = e as HeliostatModel;
            if (hs.towerId !== towerId) {
              return true;
            }
          }
        }
        break;
      default:
        if (heliostat?.towerId !== towerId) {
          return true;
        }
    }
    return false;
  };

  const setTowerId = (value: string) => {
    if (!heliostat) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Heliostat) {
            oldValuesAll.set(elem.id, (elem as HeliostatModel).towerId);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tower for All Heliostats',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ti] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ti as string);
            }
          },
          redo: () => {
            updateForAll(ObjectType.Heliostat, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.Heliostat, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (heliostat.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Heliostat && elem.foundationId === heliostat.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as HeliostatModel).towerId);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tower for All Heliostats Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: heliostat.foundationId,
            undo: () => {
              for (const [id, ti] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ti as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.Heliostat,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.Heliostat, heliostat.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (heliostat) {
          const oldValue = heliostat.towerId;
          const undoableChange = {
            name: 'Set Tower for Heliostat',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: heliostat.id,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(heliostat.id, value);
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
    setTowerId(heliostat.towerId);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    if (selectedTowerId) {
      setTowerId(selectedTowerId);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  return heliostat?.type === ObjectType.Heliostat ? (
    <>
      <Modal
        width={600}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('heliostatMenu.SelectTowerToReflectSunlightTo', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              if (selectedTowerId) {
                setTowerId(selectedTowerId);
              }
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
          <Col className="gutter-row" span={8}>
            <Select
              style={{ width: '120px' }}
              value={selectedTowerId}
              onChange={(value) => {
                setSelectedTowerId(value);
              }}
            >
              {towers.map((s, i) => {
                return (
                  <Option key={i} value={s}>
                    {i18n.t('heliostatMenu.Tower', lang) + ' ' + (i + 1)}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('heliostatMenu.OnlyThisHeliostat', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('heliostatMenu.AllHeliostatsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('heliostatMenu.AllHeliostats', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  ) : (
    <></>
  );
};

export default HeliostatTowerSelection;
