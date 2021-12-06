/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Orientation, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from '../../../constants';

const SolarPanelLengthInput = ({
  lengthDialogVisible,
  setLengthDialogVisible,
}: {
  lengthDialogVisible: boolean;
  setLengthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getPvModule = useStore(Selector.getPvModule);
  const updateSolarPanelLyById = useStore(Selector.updateSolarPanelLyById);
  const updateSolarPanelLyOnSurface = useStore(Selector.updateSolarPanelLyOnSurface);
  const updateSolarPanelLyAboveFoundation = useStore(Selector.updateSolarPanelLyAboveFoundation);
  const updateSolarPanelLyForAll = useStore(Selector.updateSolarPanelLyForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [dy, setDy] = useState<number>(0);
  const [inputLength, setInputLength] = useState<number>(
    solarPanel?.orientation === Orientation.portrait ? solarPanel?.ly ?? 2 : solarPanel?.lx ?? 1,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      const pvModel = getPvModule(solarPanel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');
      setDy(solarPanel.orientation === Orientation.portrait ? pvModel.length : pvModel.width);
      setInputLength(solarPanel.ly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (sp: SolarPanelModel, ly: number) => {
    const parent = getElementById(sp.parentId);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.ly = ly;
      return Util.isSolarPanelWithin(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, ly: number) => {
    if (sp.tiltAngle !== 0 && 0.5 * ly * Math.abs(Math.sin(sp.tiltAngle)) > sp.poleHeight) {
      // check if the new length will cause the solar panel to intersect with the base surface
      return true;
    }
    // check if the new length will cause the solar panel to be out of the bound
    if (!withinParent(sp, ly)) {
      return true;
    }
    // other check?
    return false;
  };

  const setLength = (value: number) => {
    rejectedValue.current = undefined;
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            if (rejectChange(elem as SolarPanelModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputLength(solarPanel.ly);
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldLengthsAll.set(elem.id, elem.ly);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelLyById(id, ly as number);
              }
            },
            redo: () => {
              updateSolarPanelLyForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelLyForAll(value);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              if (rejectChange(elem as SolarPanelModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputLength(solarPanel.ly);
          } else {
            const oldLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldLengthsAboveFoundation.set(elem.id, elem.ly);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Length for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLengthsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, ly] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelLyById(id, ly as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelLyAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelLyAboveFoundation(solarPanel.foundationId, value);
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
                  if (rejectChange(elem as SolarPanelModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  if (rejectChange(elem as SolarPanelModel, value)) {
                    rejectRef.current = true;
                    break;
                  }
                }
              }
            }
            if (rejectRef.current) {
              rejectedValue.current = value;
              setInputLength(solarPanel.ly);
            } else {
              const oldLengthsOnSurface = new Map<string, number>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarPanel &&
                    elem.parentId === solarPanel.parentId &&
                    Util.isIdentical(elem.normal, solarPanel.normal)
                  ) {
                    oldLengthsOnSurface.set(elem.id, elem.ly);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                    oldLengthsOnSurface.set(elem.id, elem.ly);
                  }
                }
              }
              const normal = isParentCuboid ? solarPanel.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Length for All Solar Panel Arrays on Surface',
                timestamp: Date.now(),
                oldValues: oldLengthsOnSurface,
                newValue: value,
                groupId: solarPanel.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, ly] of undoableChangeOnSurface.oldValues.entries()) {
                    updateSolarPanelLyById(id, ly as number);
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateSolarPanelLyOnSurface(
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      undoableChangeOnSurface.newValue as number,
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateSolarPanelLyOnSurface(solarPanel.parentId, normal, value);
            }
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldLength = solarPanel.ly;
          rejectRef.current = rejectChange(solarPanel, value);
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputLength(oldLength);
          } else {
            const undoableChange = {
              name: 'Set Solar Panel Array Length',
              timestamp: Date.now(),
              oldValue: oldLength,
              newValue: value,
              undo: () => {
                updateSolarPanelLyById(solarPanel.id, undoableChange.oldValue as number);
              },
              redo: () => {
                updateSolarPanelLyById(solarPanel.id, undoableChange.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateSolarPanelLyById(solarPanel.id, value);
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

  const panelize = (value: number) => {
    let l = value ?? 1;
    const n = Math.max(1, Math.ceil((l - dy / 2) / dy));
    l = n * dy;
    return l;
  };

  return (
    <>
      <Modal
        width={550}
        visible={lengthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Length', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLength(inputLength);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputLength(solarPanel.ly);
              rejectRef.current = false;
              setLengthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setLength(inputLength);
              if (!rejectRef.current) {
                setLengthDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputLength(solarPanel.ly);
          rejectRef.current = false;
          setLengthDialogVisible(false);
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
              min={dy}
              max={100 * dy}
              step={dy}
              style={{ width: 120 }}
              precision={2}
              value={inputLength}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputLength(panelize(value))}
              onPressEnter={() => {
                setLength(inputLength);
                setLengthDialogVisible(false);
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {Math.round(inputLength / dy) + ' ' + i18n.t('solarPanelMenu.PanelsLong', lang)}
              <br />
              {i18n.t('word.MaximumNumber', lang)}: 100 {i18n.t('solarPanelMenu.Panels', lang)}
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

export default SolarPanelLengthInput;
