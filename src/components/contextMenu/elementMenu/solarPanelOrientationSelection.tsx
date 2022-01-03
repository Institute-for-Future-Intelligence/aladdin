/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
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

const { Option } = Select;

const SolarPanelOrientationSelection = ({
  orientationDialogVisible,
  setOrientationDialogVisible,
}: {
  orientationDialogVisible: boolean;
  setOrientationDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getPvModule = useStore(Selector.getPvModule);
  const updateSolarPanelOrientationById = useStore(Selector.updateSolarPanelOrientationById);
  const updateSolarPanelOrientationOnSurface = useStore(Selector.updateSolarPanelOrientationOnSurface);
  const updateSolarPanelOrientationAboveFoundation = useStore(Selector.updateSolarPanelOrientationAboveFoundation);
  const updateSolarPanelOrientationForAll = useStore(Selector.updateSolarPanelOrientationForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setElementSize = useStore(Selector.setElementSize);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>(
    solarPanel?.orientation ?? Orientation.portrait,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<Orientation | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      setSelectedOrientation(solarPanel.orientation);
    }
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  // cannot use the stored dx, dy in the following calculation
  // as changing orientation does not cause it to update
  const changeOrientation = (value: Orientation) => {
    if (solarPanel) {
      const pvModel = getPvModule(solarPanel.pvModelName);
      if (value === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.width));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.length));
        setElementSize(solarPanel.id, nx * pvModel.width, ny * pvModel.length);
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.length));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.width));
        setElementSize(solarPanel.id, nx * pvModel.length, ny * pvModel.width);
      }
      updateSolarPanelOrientationById(solarPanel.id, value);
      setUpdateFlag(!updateFlag);
    }
  };

  const withinParent = (sp: SolarPanelModel, orientation: Orientation) => {
    const parent = getElementById(sp.parentId);
    if (parent) {
      if (parent.type === ObjectType.Cuboid && !Util.isIdentical(sp.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
        // TODO: cuboid vertical sides
        return true;
      }
      const clone = JSON.parse(JSON.stringify(sp)) as SolarPanelModel;
      clone.orientation = orientation;
      const pvModel = getPvModule(clone.pvModelName);
      if (orientation === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(clone.lx / pvModel.width));
        const ny = Math.max(1, Math.round(clone.ly / pvModel.length));
        clone.lx = nx * pvModel.width;
        clone.ly = ny * pvModel.length;
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(clone.lx / pvModel.length));
        const ny = Math.max(1, Math.round(clone.ly / pvModel.width));
        clone.lx = nx * pvModel.length;
        clone.ly = ny * pvModel.width;
      }
      return Util.isSolarPanelWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (sp: SolarPanelModel, orientation: Orientation) => {
    // check if the new orientation will cause the solar panel to be out of the bound
    if (!withinParent(sp, orientation)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (orientation: Orientation) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.orientation !== orientation) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.orientation !== orientation) {
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
                  if (sp.orientation !== orientation) {
                    return true;
                  }
                }
              }
            } else {
              for (const e of elements) {
                if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                  const sp = e as SolarPanelModel;
                  if (sp.orientation !== orientation) {
                    return true;
                  }
                }
              }
            }
          }
        }
        break;
      default:
        if (solarPanel?.orientation !== orientation) {
          return true;
        }
    }
    return false;
  };

  const setOrientation = (value: Orientation) => {
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
          setSelectedOrientation(solarPanel.orientation);
        } else {
          const oldOrientationsAll = new Map<string, Orientation>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel) {
              oldOrientationsAll.set(elem.id, (elem as SolarPanelModel).orientation);
            }
          }
          const undoableChangeAll = {
            name: 'Set Orientation for All Solar Panels',
            timestamp: Date.now(),
            oldValues: oldOrientationsAll,
            newValue: value,
            undo: () => {
              for (const [id, orientation] of undoableChangeAll.oldValues.entries()) {
                updateSolarPanelOrientationById(id, orientation as Orientation);
              }
            },
            redo: () => {
              updateSolarPanelOrientationForAll(undoableChangeAll.newValue as Orientation);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateSolarPanelOrientationForAll(value);
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
            setSelectedOrientation(solarPanel.orientation);
          } else {
            const oldOrientationsAboveFoundation = new Map<string, Orientation>();
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
                oldOrientationsAboveFoundation.set(elem.id, (elem as SolarPanelModel).orientation);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Orientation for All Solar Panels Above Foundation',
              timestamp: Date.now(),
              oldValues: oldOrientationsAboveFoundation,
              newValue: value,
              groupId: solarPanel.foundationId,
              undo: () => {
                for (const [id, orientation] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateSolarPanelOrientationById(id, orientation as Orientation);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateSolarPanelOrientationAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as Orientation,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateSolarPanelOrientationAboveFoundation(solarPanel.foundationId, value);
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
              setSelectedOrientation(solarPanel.orientation);
            } else {
              const oldOrientationsOnSurface = new Map<string, Orientation>();
              const isParentCuboid = parent.type === ObjectType.Cuboid;
              if (isParentCuboid) {
                for (const elem of elements) {
                  if (
                    elem.type === ObjectType.SolarPanel &&
                    elem.parentId === solarPanel.parentId &&
                    Util.isIdentical(elem.normal, solarPanel.normal)
                  ) {
                    oldOrientationsOnSurface.set(elem.id, (elem as SolarPanelModel).orientation);
                  }
                }
              } else {
                for (const elem of elements) {
                  if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                    oldOrientationsOnSurface.set(elem.id, (elem as SolarPanelModel).orientation);
                  }
                }
              }
              const normal = isParentCuboid ? solarPanel.normal : undefined;
              const undoableChangeOnSurface = {
                name: 'Set Orientation for All Solar Panels on Surface',
                timestamp: Date.now(),
                oldValues: oldOrientationsOnSurface,
                newValue: value,
                groupId: solarPanel.parentId,
                normal: normal,
                undo: () => {
                  for (const [id, orientation] of undoableChangeOnSurface.oldValues.entries()) {
                    updateSolarPanelOrientationById(id, orientation as Orientation);
                  }
                },
                redo: () => {
                  if (undoableChangeOnSurface.groupId) {
                    updateSolarPanelOrientationOnSurface(
                      undoableChangeOnSurface.groupId,
                      undoableChangeOnSurface.normal,
                      undoableChangeOnSurface.newValue as Orientation,
                    );
                  }
                },
              } as UndoableChangeGroup;
              addUndoable(undoableChangeOnSurface);
              updateSolarPanelOrientationOnSurface(solarPanel.parentId, normal, value);
            }
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldOrientation = solarPanel.orientation;
          rejectRef.current = rejectChange(solarPanel, value);
          if (rejectRef.current) {
            rejectedValue.current = value;
            setSelectedOrientation(oldOrientation);
          } else {
            const undoableChange = {
              name: 'Set Orientation of Selected Solar Panel',
              timestamp: Date.now(),
              oldValue: oldOrientation,
              newValue: value,
              changedElementId: solarPanel.id,
              undo: () => {
                changeOrientation(undoableChange.oldValue as Orientation);
              },
              redo: () => {
                changeOrientation(undoableChange.newValue as Orientation);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            changeOrientation(value);
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
        visible={orientationDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.Orientation', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current
                    ? ' (' +
                      (rejectedValue.current === Orientation.portrait
                        ? i18n.t('solarPanelMenu.Portrait', lang)
                        : i18n.t('solarPanelMenu.Landscape', lang)) +
                      ')'
                    : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setOrientation(selectedOrientation);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setSelectedOrientation(solarPanel.orientation);
              rejectRef.current = false;
              setOrientationDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setOrientation(selectedOrientation);
              if (!rejectRef.current) {
                setOrientationDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setSelectedOrientation(solarPanel.orientation);
          rejectRef.current = false;
          setOrientationDialogVisible(false);
        }}
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
              style={{ width: '150px' }}
              value={selectedOrientation}
              onChange={(value) => setSelectedOrientation(value)}
            >
              <Option key={Orientation.portrait} value={Orientation.portrait}>
                {i18n.t('solarPanelMenu.Portrait', lang)}
              </Option>
              )
              <Option key={Orientation.landscape} value={Orientation.landscape}>
                {i18n.t('solarPanelMenu.Landscape', lang)}
              </Option>
              )
            </Select>
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

export default SolarPanelOrientationSelection;
