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
import { ZERO_TOLERANCE } from '../../../constants';

const SolarPanelPoleHeightInput = ({
  poleHeightDialogVisible,
  setPoleHeightDialogVisible,
}: {
  poleHeightDialogVisible: boolean;
  setPoleHeightDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateSolarPanelPoleHeightById = useStore(Selector.updateSolarPanelPoleHeightById);
  const updateSolarPanelPoleHeightOnSurface = useStore(Selector.updateSolarPanelPoleHeightOnSurface);
  const updateSolarPanelPoleHeightAboveFoundation = useStore(Selector.updateSolarPanelPoleHeightAboveFoundation);
  const updateSolarPanelPoleHeightForAll = useStore(Selector.updateSolarPanelPoleHeightForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [inputPoleHeight, setInputPoleHeight] = useState<number>(solarPanel?.poleHeight ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      setInputPoleHeight(solarPanel.poleHeight);
    }
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (poleHeight: number) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel?.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const e of elements) {
                if (
                  e.type === ObjectType.SolarPanel &&
                  e.parentId === solarPanel.parentId &&
                  Util.isIdentical(e.normal, solarPanel.normal) &&
                  !e.locked
                ) {
                  const sp = e as SolarPanelModel;
                  if (Math.abs(sp.poleHeight - poleHeight) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            } else {
              for (const e of elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  if (Math.abs(sp.poleHeight - poleHeight) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(solarPanel?.poleHeight - poleHeight) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setPoleHeight = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as SolarPanelModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputPoleHeight(solarPanel.poleHeight);
        } else {
          const oldPoleHeightsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldPoleHeightsAll.set(elem.id, (elem as SolarPanelModel).poleHeight);
            }
          }
          const undoableChangeAll = {
            name: 'Set Pole Height for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldPoleHeightsAll,
            newValue: value,
            undo: () => {
              for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelPoleHeightById(id, ph as number);
              }
            },
            redo: () => {
              updateSolarPanelPoleHeightForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelPoleHeightForAll(value);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              if (0.5 * elem.ly * Math.abs(Math.sin((elem as SolarPanelModel).tiltAngle)) > value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputPoleHeight(solarPanel.poleHeight);
          } else {
            const oldPoleHeightsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldPoleHeightsAboveFoundation.set(elem.id, (elem as SolarPanelModel).poleHeight);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Pole Height for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldPoleHeightsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelPoleHeightById(id, ph as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelPoleHeightAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelPoleHeightAboveFoundation(solarPanel.foundationId, value);
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            rejectRef.current = false;
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  // tilt is only allowed for the top surface of a cuboid
                  if (0.5 * elem.ly * Math.abs(Math.sin((elem as SolarPanelModel).tiltAngle)) > value) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            } else {
              // tilt is only allowed on top of a foundation or a roof
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  if (0.5 * elem.ly * Math.abs(Math.sin((elem as SolarPanelModel).tiltAngle)) > value) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            }
            if (rejectRef.current) {
              rejectedValue.current = value;
              setInputPoleHeight(solarPanel.poleHeight);
            } else {
              const oldPoleHeightsOnSurface = new Map<string, number>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarPanel &&
                    elem.parentId === solarPanel.parentId &&
                    Util.isIdentical(elem.normal, solarPanel.normal)
                  ) {
                    oldPoleHeightsOnSurface.set(elem.id, (elem as SolarPanelModel).poleHeight);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                    oldPoleHeightsOnSurface.set(elem.id, (elem as SolarPanelModel).poleHeight);
                  }
                }
              }
              const normal = isParentCuboid ? solarPanel.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Pole Height for All Solar Panel Arrays on Surface',
                timestamp: Date.now(),
                oldValues: oldPoleHeightsOnSurface,
                newValue: value,
                groupId: solarPanel.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, ph] of undoableChangeOnSurface.oldValues.entries()) {
                    updateSolarPanelPoleHeightById(id, ph as number);
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateSolarPanelPoleHeightOnSurface(
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      undoableChangeOnSurface.newValue as number,
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateSolarPanelPoleHeightOnSurface(solarPanel.parentId, normal, value);
            }
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldPoleHeight = solarPanel.poleHeight;
          rejectRef.current = 0.5 * solarPanel.ly * Math.abs(Math.sin(solarPanel.tiltAngle)) > value;
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputPoleHeight(oldPoleHeight);
          } else {
            const undoableChange = {
              name: 'Set Solar Panel Array Pole Height',
              timestamp: Date.now(),
              oldValue: oldPoleHeight,
              newValue: value,
              changedElementId: solarPanel.id,
              undo: () => {
                updateSolarPanelPoleHeightById(undoableChange.changedElementId, undoableChange.oldValue as number);
              },
              redo: () => {
                updateSolarPanelPoleHeightById(undoableChange.changedElementId, undoableChange.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateSolarPanelPoleHeightById(solarPanel.id, value);
          }
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
        visible={poleHeightDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.PoleHeight', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(1) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setPoleHeight(inputPoleHeight);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputPoleHeight(solarPanel.poleHeight);
              rejectRef.current = false;
              setPoleHeightDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setPoleHeight(inputPoleHeight);
              if (!rejectRef.current) {
                setPoleHeightDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputPoleHeight(solarPanel.poleHeight);
          rejectRef.current = false;
          setPoleHeightDialogVisible(false);
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
              min={0}
              max={5}
              style={{ width: 120 }}
              step={0.1}
              precision={2}
              value={inputPoleHeight}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputPoleHeight(value)}
              onPressEnter={() => {
                setPoleHeight(inputPoleHeight);
                if (!rejectRef.current) {
                  setPoleHeightDialogVisible(false);
                }
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 5] {i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
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

export default SolarPanelPoleHeightInput;
