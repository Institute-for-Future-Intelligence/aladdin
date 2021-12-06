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

const SolarPanelRelativeAzimuthInput = ({
  azimuthDialogVisible,
  setAzimuthDialogVisible,
}: {
  azimuthDialogVisible: boolean;
  setAzimuthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateSolarPanelRelativeAzimuthById = useStore(Selector.updateSolarPanelRelativeAzimuthById);
  const updateSolarPanelRelativeAzimuthOnSurface = useStore(Selector.updateSolarPanelRelativeAzimuthOnSurface);
  const updateSolarPanelRelativeAzimuthAboveFoundation = useStore(
    Selector.updateSolarPanelRelativeAzimuthAboveFoundation,
  );
  const updateSolarPanelRelativeAzimuthForAll = useStore(Selector.updateSolarPanelRelativeAzimuthForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [inputRelativeAzimuth, setInputRelativeAzimuth] = useState<number>(solarPanel?.relativeAzimuth ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      setInputRelativeAzimuth(solarPanel.relativeAzimuth);
    }
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setRelativeAzimuth = (value: number) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldRelativeAzimuthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldRelativeAzimuthsAll.set(elem.id, (elem as SolarPanelModel).relativeAzimuth);
          }
        }
        const undoableChangeAll = {
          name: 'Set Relative Azimuth for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldRelativeAzimuthsAll,
          newValue: value,
          undo: () => {
            for (const [id, ta] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelRelativeAzimuthById(id, ta as number);
            }
          },
          redo: () => {
            updateSolarPanelRelativeAzimuthForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelRelativeAzimuthForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldRelativeAzimuthsAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldRelativeAzimuthsAboveFoundation.set(elem.id, (elem as SolarPanelModel).relativeAzimuth);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Relative Azimuth for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldRelativeAzimuthsAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, ta] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelRelativeAzimuthById(id, ta as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelRelativeAzimuthAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelRelativeAzimuthAboveFoundation(solarPanel.foundationId, value);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            const oldRelativeAzimuthsOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldRelativeAzimuthsOnSurface.set(elem.id, (elem as SolarPanelModel).relativeAzimuth);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldRelativeAzimuthsOnSurface.set(elem.id, (elem as SolarPanelModel).relativeAzimuth);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Relative Azimuth for All Solar Panel Arrays on Surface',
              timestamp: Date.now(),
              oldValues: oldRelativeAzimuthsOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, ta] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelRelativeAzimuthById(id, ta as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelRelativeAzimuthOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelRelativeAzimuthOnSurface(solarPanel.parentId, normal, value);
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldRelativeAzimuth = solarPanel.relativeAzimuth;
          const undoableChange = {
            name: 'Set Solar Panel Array Relative Azimuth',
            timestamp: Date.now(),
            oldValue: oldRelativeAzimuth,
            newValue: value,
            undo: () => {
              updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSolarPanelRelativeAzimuthById(solarPanel.id, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSolarPanelRelativeAzimuthById(solarPanel.id, value);
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
        visible={azimuthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.RelativeAzimuth', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setRelativeAzimuth(inputRelativeAzimuth);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputRelativeAzimuth(solarPanel.relativeAzimuth);
              setAzimuthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setRelativeAzimuth(inputRelativeAzimuth);
              setAzimuthDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setInputRelativeAzimuth(solarPanel.relativeAzimuth);
          setAzimuthDialogVisible(false);
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
              min={-180}
              max={180}
              style={{ width: 120 }}
              precision={1}
              value={Util.toDegrees(inputRelativeAzimuth)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => setInputRelativeAzimuth(Util.toRadians(value))}
              onPressEnter={(event) => {
                setRelativeAzimuth(inputRelativeAzimuth);
                setAzimuthDialogVisible(false);
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [-180°, 180°]
              <br />
              {i18n.t('shared.AzimuthOfNorthIsZero', lang)}
              <br />
              {i18n.t('shared.CounterclockwiseAzimuthIsPositive', lang)}
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

export default SolarPanelRelativeAzimuthInput;
