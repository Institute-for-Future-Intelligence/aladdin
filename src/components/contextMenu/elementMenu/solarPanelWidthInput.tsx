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
import { UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from '../../../constants';

const SolarPanelWidthInput = ({
  widthDialogVisible,
  setWidthDialogVisible,
}: {
  widthDialogVisible: boolean;
  setWidthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getPvModule = useStore(Selector.getPvModule);
  const updateSolarPanelLxById = useStore(Selector.updateSolarPanelLxById);
  const updateSolarPanelLxOnSurface = useStore(Selector.updateSolarPanelLxOnSurface);
  const updateSolarPanelLxAboveFoundation = useStore(Selector.updateSolarPanelLxAboveFoundation);
  const updateSolarPanelLxForAll = useStore(Selector.updateSolarPanelLxForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [dx, setDx] = useState<number>(0);
  const [inputWidth, setInputWidth] = useState<number>(
    solarPanel?.orientation === Orientation.portrait ? solarPanel?.lx ?? 1 : solarPanel?.ly ?? 2,
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
      setDx(solarPanel.orientation === Orientation.portrait ? pvModel.width : pvModel.length);
      setInputWidth(solarPanel.lx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (sp: SolarPanelModel, lx: number) => {
    const parent = getElementById(sp.parentId);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.lx = lx;
      return Util.isSolarPanelWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, lx: number) => {
    // check if the new width will cause the solar panel to be out of the bound
    if (!withinParent(sp, lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
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
                  if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            } else {
              for (const e of elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  if (Math.abs(sp.lx - lx) > ZERO_TOLERANCE) {
                    return true;
                  }
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(solarPanel?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setWidth = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
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
          setInputWidth(solarPanel.lx);
        } else {
          const oldWidthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldWidthsAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Width for All Solar Panel Arrays',
            timestamp: Date.now(),
            oldValues: oldWidthsAll,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelLxById(id, lx as number);
              }
            },
            redo: () => {
              updateSolarPanelLxForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelLxForAll(value);
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
            setInputWidth(solarPanel.lx);
          } else {
            const oldWidthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldWidthsAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Width for All Solar Panel Arrays Above Foundation',
              timestamp: Date.now(),
              oldValues: oldWidthsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, lx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelLxAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelLxAboveFoundation(solarPanel.foundationId, value);
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
              setInputWidth(solarPanel.lx);
            } else {
              const oldWidthsOnSurface = new Map<string, number>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarPanel &&
                    elem.parentId === solarPanel.parentId &&
                    Util.isIdentical(elem.normal, solarPanel.normal)
                  ) {
                    oldWidthsOnSurface.set(elem.id, elem.lx);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                    oldWidthsOnSurface.set(elem.id, elem.lx);
                  }
                }
              }
              const normal = isParentCuboid ? solarPanel.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Width for All Solar Panel Arrays on Surface',
                timestamp: Date.now(),
                oldValues: oldWidthsOnSurface,
                newValue: value,
                groupId: solarPanel.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, lx] of undoableChangeOnSurface.oldValues.entries()) {
                    updateSolarPanelLxById(id, lx as number);
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateSolarPanelLxOnSurface(
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      undoableChangeOnSurface.newValue as number,
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateSolarPanelLxOnSurface(solarPanel.parentId, normal, value);
            }
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldWidth = solarPanel.lx;
          rejectRef.current = rejectChange(solarPanel, value);
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputWidth(oldWidth);
          } else {
            const undoableChange = {
              name: 'Set Solar Panel Array Width',
              timestamp: Date.now(),
              oldValue: oldWidth,
              newValue: value,
              changedElementId: solarPanel.id,
              undo: () => {
                updateSolarPanelLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
              },
              redo: () => {
                updateSolarPanelLxById(undoableChange.changedElementId, undoableChange.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateSolarPanelLxById(solarPanel.id, value);
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
    let w = value ?? 1;
    const n = Math.max(1, Math.ceil((w - dx / 2) / dx));
    w = n * dx;
    return w;
  };

  return (
    <>
      <Modal
        width={550}
        visible={widthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Width', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setWidth(inputWidth);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputWidth(solarPanel.lx);
              rejectRef.current = false;
              setWidthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setWidth(inputWidth);
              if (!rejectRef.current) {
                setWidthDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputWidth(solarPanel.lx);
          rejectRef.current = false;
          setWidthDialogVisible(false);
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
              min={dx}
              max={100 * dx}
              step={dx}
              style={{ width: 120 }}
              precision={2}
              value={inputWidth}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputWidth(panelize(value))}
              onPressEnter={() => {
                setWidth(inputWidth);
                if (!rejectRef.current) {
                  setWidthDialogVisible(false);
                }
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {Math.round(inputWidth / dx) + ' ' + i18n.t('solarPanelMenu.PanelsWide', lang)}
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

export default SolarPanelWidthInput;
