/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';

const SolarPanelTiltAngleInput = ({
  tiltDialogVisible,
  setTiltDialogVisible,
}: {
  tiltDialogVisible: boolean;
  setTiltDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateSolarPanelTiltAngleById = useStore(Selector.updateSolarPanelTiltAngleById);
  const updateSolarPanelTiltAngleOnSurface = useStore(Selector.updateSolarPanelTiltAngleOnSurface);
  const updateSolarPanelTiltAngleAboveFoundation = useStore(Selector.updateSolarPanelTiltAngleAboveFoundation);
  const updateSolarPanelTiltAngleForAll = useStore(Selector.updateSolarPanelTiltAngleForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [inputTiltAngle, setInputTiltAngle] = useState<number>(solarPanel?.tiltAngle ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      setInputTiltAngle(solarPanel.tiltAngle);
    }
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setTiltAngle = (value: number) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTiltAnglesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldTiltAnglesAll.set(elem.id, (elem as SolarPanelModel).tiltAngle);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tilt Angle for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldTiltAnglesAll,
          newValue: value,
          undo: () => {
            for (const [id, ta] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelTiltAngleById(id, ta as number);
            }
          },
          redo: () => {
            updateSolarPanelTiltAngleForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelTiltAngleForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldTiltAnglesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldTiltAnglesAboveFoundation.set(elem.id, (elem as SolarPanelModel).tiltAngle);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tilt Angle for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTiltAnglesAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, ta] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelTiltAngleById(id, ta as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelTiltAngleAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelTiltAngleAboveFoundation(solarPanel.foundationId, value);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            const oldTiltAnglesOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldTiltAnglesOnSurface.set(elem.id, (elem as SolarPanelModel).tiltAngle);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldTiltAnglesOnSurface.set(elem.id, (elem as SolarPanelModel).tiltAngle);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Tilt Angle for All Solar Panel Arrays on Surface',
              timestamp: Date.now(),
              oldValues: oldTiltAnglesOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, ta] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelTiltAngleById(id, ta as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelTiltAngleOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelTiltAngleOnSurface(solarPanel.parentId, normal, value);
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldTiltAngle = solarPanel.tiltAngle;
          const undoableChange = {
            name: 'Set Solar Panel Array Tilt Angle',
            timestamp: Date.now(),
            oldValue: oldTiltAngle,
            newValue: value,
            undo: () => {
              updateSolarPanelTiltAngleById(solarPanel.id, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSolarPanelTiltAngleById(solarPanel.id, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSolarPanelTiltAngleById(solarPanel.id, value);
          setUpdateFlag(!updateFlag);
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
        width={550}
        visible={tiltDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.TiltAngle', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setTiltAngle(inputTiltAngle);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputTiltAngle(solarPanel.tiltAngle);
              setTiltDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setTiltAngle(inputTiltAngle);
              setTiltDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setInputTiltAngle(solarPanel.tiltAngle);
          setTiltDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={-90}
              max={90}
              style={{ width: 120 }}
              precision={1}
              value={Util.toDegrees(inputTiltAngle)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => setInputTiltAngle(Util.toRadians(value))}
              onPressEnter={(event) => {
                setTiltAngle(inputTiltAngle);
                setTiltDialogVisible(false);
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [-90°, 90°]
              <br />
              {i18n.t('solarPanelMenu.SouthFacingIsPositive', lang)}
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={solarPanelActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default SolarPanelTiltAngleInput;
