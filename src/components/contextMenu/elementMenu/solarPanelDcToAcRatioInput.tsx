/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { ZERO_TOLERANCE } from '../../../constants';

const SolarPanelDcToAcRatioInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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

  const solarPanel = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.SolarPanel),
  ) as SolarPanelModel;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputDcToAcRatioRef = useRef<number>(solarPanel?.dcToAcRatio ?? 1);

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      inputDcToAcRatioRef.current = solarPanel.dcToAcRatio ?? 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanel.dcToAcRatio]);

  const updateDcToAcRatioById = (id: string, ratio: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          (e as SolarPanelModel).dcToAcRatio = ratio;
          break;
        }
      }
    });
  };

  const updateDcToAcRatioAboveFoundation = (foundationId: string, ratio: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          (e as SolarPanelModel).dcToAcRatio = ratio;
        }
      }
    });
  };

  const updateDcToAcRatioOnSurface = (parentId: string, normal: number[] | undefined, ratio: number) => {
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
            (e as SolarPanelModel).dcToAcRatio = ratio;
          }
        }
      }
    });
  };

  const updateDcToAcRatioForAll = (ratio: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          (e as SolarPanelModel).dcToAcRatio = ratio;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked && map.has(e.id)) {
          (e as SolarPanelModel).dcToAcRatio = value;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (ratio: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const sp = e as SolarPanelModel;
            if (Math.abs((sp.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs((sp.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (Math.abs((sp.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
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
                if (Math.abs((sp.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (Math.abs((sp.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (Math.abs((solarPanel?.dcToAcRatio ?? 1) - ratio) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setDcToAcRatio = (value: number) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as SolarPanelModel).dcToAcRatio ?? 1);
          }
        }
        const undoableChangeSelected = {
          name: 'Set DC-AC Ratio for Selected Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ratio] of undoableChangeSelected.oldValues.entries()) {
              updateDcToAcRatioById(id, ratio as number);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldValuesAll.set(elem.id, (elem as SolarPanelModel).dcToAcRatio ?? 1);
          }
        }
        const undoableChangeAll = {
          name: 'Set DC-AC Ratio for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ratio] of undoableChangeAll.oldValues.entries()) {
              updateDcToAcRatioById(id, ratio as number);
            }
          },
          redo: () => {
            updateDcToAcRatioForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateDcToAcRatioForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as SolarPanelModel).dcToAcRatio ?? 1);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set DC-AC Ratio for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, ratio] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateDcToAcRatioById(id, ratio as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateDcToAcRatioAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateDcToAcRatioAboveFoundation(solarPanel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
        if (parent) {
          const oldValuesOnSurface = new Map<string, number>();
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const elem of elements) {
              if (
                elem.type === ObjectType.SolarPanel &&
                elem.parentId === solarPanel.parentId &&
                Util.isIdentical(elem.normal, solarPanel.normal)
              ) {
                oldValuesOnSurface.set(elem.id, (elem as SolarPanelModel).dcToAcRatio ?? 1);
              }
            }
          } else {
            for (const elem of elements) {
              if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                oldValuesOnSurface.set(elem.id, (elem as SolarPanelModel).dcToAcRatio ?? 1);
              }
            }
          }
          const normal = isParentCuboid ? solarPanel.normal : undefined;
          const undoableChangeOnSurface = {
            name: 'Set DC-AC Ratio for All Solar Panel Arrays on Surface',
            timestamp: Date.now(),
            oldValues: oldValuesOnSurface,
            newValue: value,
            groupId: solarPanel.parentId,
            normal: normal,
            undo: () => {
              for (const [id, ratio] of undoableChangeOnSurface.oldValues.entries()) {
                updateDcToAcRatioById(id, ratio as number);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateDcToAcRatioOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateDcToAcRatioOnSurface(solarPanel.parentId, normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id);
        const oldValue = sp ? (sp as SolarPanelModel).dcToAcRatio ?? 1 : solarPanel.dcToAcRatio ?? 1;
        const undoableChange = {
          name: 'Set Solar Panel Array DC-AC Ratio',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateDcToAcRatioById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateDcToAcRatioById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateDcToAcRatioById(solarPanel.id, value);
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
    inputDcToAcRatioRef.current = solarPanel.dcToAcRatio ?? 1;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setDcToAcRatio(inputDcToAcRatioRef.current);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={550}
        open={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.DcToAcSizeRatio', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setDcToAcRatio(inputDcToAcRatioRef.current);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok}>
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
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={1}
              max={2}
              step={0.01}
              style={{ width: 120 }}
              precision={2}
              value={inputDcToAcRatioRef.current}
              onChange={(value) => {
                if (value === null) return;
                inputDcToAcRatioRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              [1.0, 2.0]
              <br />
              {i18n.t('solarPanelMenu.DcToAcSizeRatioExplained', lang)}
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
                <Radio value={Scope.AllSelectedObjectsOfThisType}>
                  {i18n.t('solarPanelMenu.AllSelectedSolarPanels', lang)}
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

export default SolarPanelDcToAcRatioInput;
