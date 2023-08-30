/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Scope, TrackerType } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { useSelectedElement } from './menuHooks';

const SolarPanelTrackerSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const [selectedTrackerType, setSelectedTrackerType] = useState<TrackerType>(
    solarPanel?.trackerType ?? TrackerType.NO_TRACKER,
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
    if (solarPanel) {
      setSelectedTrackerType(solarPanel.trackerType);
    }
  }, [solarPanel]);

  const updateSolarPanelTrackerTypeById = (id: string, trackerType: TrackerType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          (e as SolarPanelModel).trackerType = trackerType;
          break;
        }
      }
    });
  };

  const updateSolarPanelTrackerTypeAboveFoundation = (foundationId: string, trackerType: TrackerType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          (e as SolarPanelModel).trackerType = trackerType;
        }
      }
    });
  };

  const updateSolarPanelTrackerTypeOnSurface = (
    parentId: string,
    normal: number[] | undefined,
    trackerType: TrackerType,
  ) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            (e as SolarPanelModel).trackerType = trackerType;
          }
        }
      }
    });
  };

  const updateSolarPanelTrackerTypeForAll = (trackerType: TrackerType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          (e as SolarPanelModel).trackerType = trackerType;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (tracker: TrackerType) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.trackerType !== tracker) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.trackerType !== tracker) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
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
                if (sp.trackerType !== tracker) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (sp.trackerType !== tracker) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (solarPanel?.trackerType !== tracker) {
          return true;
        }
    }
    return false;
  };

  const setTrackerType = (value: TrackerType) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTrackerTypesAll = new Map<string, TrackerType>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldTrackerTypesAll.set(elem.id, (elem as SolarPanelModel).trackerType);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tracker Type for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldTrackerTypesAll,
          newValue: value,
          undo: () => {
            for (const [id, tt] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelTrackerTypeById(id, tt as TrackerType);
            }
          },
          redo: () => {
            updateSolarPanelTrackerTypeForAll(undoableChangeAll.newValue as TrackerType);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelTrackerTypeForAll(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldTrackerTypesAboveFoundation = new Map<string, TrackerType>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldTrackerTypesAboveFoundation.set(elem.id, (elem as SolarPanelModel).trackerType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tracker Type for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTrackerTypesAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, tt] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelTrackerTypeById(id, tt as TrackerType);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelTrackerTypeAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as TrackerType,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelTrackerTypeAboveFoundation(solarPanel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
        if (parent) {
          const oldTrackerTypesOnSurface = new Map<string, TrackerType>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldTrackerTypesOnSurface.set(elem.id, (elem as SolarPanelModel).trackerType);
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldTrackerTypesOnSurface.set(elem.id, (elem as SolarPanelModel).trackerType);
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set Tracker Type for All Solar Panel Arrays on Surface',
            timestamp: Date.now(),
            oldValues: oldTrackerTypesOnSurface,
            newValue: value,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, tt] of undoableChangeOnSurface.oldValues.entries()) {
                updateSolarPanelTrackerTypeById(id, tt as TrackerType);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateSolarPanelTrackerTypeOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as TrackerType,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateSolarPanelTrackerTypeOnSurface(solarPanel.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldTrackerType = sp ? sp.trackerType : solarPanel.trackerType;
        const undoableChange = {
          name: 'Set Solar Panel Array Tracker Type',
          timestamp: Date.now(),
          oldValue: oldTrackerType,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateSolarPanelTrackerTypeById(undoableChange.changedElementId, undoableChange.oldValue as TrackerType);
          },
          redo: () => {
            updateSolarPanelTrackerTypeById(undoableChange.changedElementId, undoableChange.newValue as TrackerType);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSolarPanelTrackerTypeById(solarPanel.id, value);
        setApplyCount(applyCount + 1);
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
    if (!solarPanel) return;
    setSelectedTrackerType(solarPanel.trackerType);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setTrackerType(selectedTrackerType);
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
            {i18n.t('solarPanelMenu.Tracker', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setTrackerType(selectedTrackerType);
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
          <Col className="gutter-row" span={7}>
            <Select
              style={{ width: '120px' }}
              value={selectedTrackerType}
              onChange={(value) => setSelectedTrackerType(value)}
            >
              <Option key={'NONE'} value={TrackerType.NO_TRACKER} title={i18n.t('solarPanelMenu.NoTracker', lang)}>
                {i18n.t('word.None', lang)}
              </Option>
              <Option
                key={'HSAT'}
                value={TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER}
                title={i18n.t('solarPanelMenu.HorizontalSingleAxisTracker', lang)}
              >
                HSAT
              </Option>
              <Option
                key={'VSAT'}
                value={TrackerType.VERTICAL_SINGLE_AXIS_TRACKER}
                title={i18n.t('solarPanelMenu.VerticalSingleAxisTracker', lang)}
              >
                VSAT
              </Option>
              <Option
                key={'AADAT'}
                value={TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER}
                title={i18n.t('solarPanelMenu.AltazimuthDualAxisTracker', lang)}
              >
                AADAT
              </Option>
            </Select>
            <div style={{ paddingTop: '20px', paddingRight: '10px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('solarPanelMenu.SolarTrackerFollowsSun', lang)}
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={onScopeChange} value={actionScope}>
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

export default SolarPanelTrackerSelection;
