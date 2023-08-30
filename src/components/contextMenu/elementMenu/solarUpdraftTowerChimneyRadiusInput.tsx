/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, SolarStructure } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { ZERO_TOLERANCE } from 'src/constants';
import { SolarUpdraftTowerModel } from '../../../models/SolarUpdraftTowerModel';
import { useSelectedElement } from './menuHooks';

const SolarUpdraftTowerChimneyRadiusInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const setActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputChimneyRadiusRef = useRef<number>(
    foundation?.solarUpdraftTower?.chimneyRadius ??
      Math.max(1, 0.025 * Math.min(foundation?.lx ?? 0, foundation?.ly ?? 0)),
  );

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      inputChimneyRadiusRef.current =
        foundation.solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(foundation.lx, foundation.ly));
    }
  }, [foundation]);

  const updateChimneyRadiusById = (id: string, radius: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
            f.solarUpdraftTower.chimneyRadius = radius;
          }
          break;
        }
      }
    });
  };

  const updateChimneyRadiusForAll = (radius: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            if (!f.solarUpdraftTower) f.solarUpdraftTower = {} as SolarUpdraftTowerModel;
            f.solarUpdraftTower.chimneyRadius = radius;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (chimneyRadius: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
              if (
                f.solarUpdraftTower.chimneyRadius === undefined ||
                Math.abs(f.solarUpdraftTower.chimneyRadius - chimneyRadius) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (foundation && foundation.solarStructure === SolarStructure.UpdraftTower && foundation.solarUpdraftTower) {
          if (
            foundation.solarUpdraftTower.chimneyRadius === undefined ||
            Math.abs(foundation.solarUpdraftTower.chimneyRadius - chimneyRadius) > ZERO_TOLERANCE
          ) {
            return true;
          }
        }
    }
    return false;
  };

  const setChimneyRadius = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            const f = elem as FoundationModel;
            if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
              oldValuesAll.set(
                elem.id,
                f.solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(f.lx, f.ly)),
              );
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Solar Chimney Radius for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, cr] of undoableChangeAll.oldValues.entries()) {
              updateChimneyRadiusById(id, cr as number);
            }
          },
          redo: () => {
            updateChimneyRadiusForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateChimneyRadiusForAll(value);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation.solarStructure === SolarStructure.UpdraftTower && foundation.solarUpdraftTower) {
          // foundation selected element may be outdated, make sure that we get the latest
          const f = getElementById(foundation.id) as FoundationModel;
          const oldValue =
            f && f.solarUpdraftTower
              ? f.solarUpdraftTower.chimneyRadius ?? Math.max(1, 0.025 * Math.min(f.lx, f.ly))
              : foundation.solarUpdraftTower.chimneyRadius ??
                Math.max(1, 0.025 * Math.min(foundation.lx, foundation.ly));
          updateChimneyRadiusById(foundation.id, value);
          const undoableChange = {
            name: 'Set Solar Chimney Radius on Foundation',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: foundation.id,
            changedElementType: foundation.type,
            undo: () => {
              updateChimneyRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateChimneyRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
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
    if (!foundation) return;
    inputChimneyRadiusRef.current =
      foundation?.solarUpdraftTower?.chimneyRadius ?? Math.max(1, 0.025 * Math.min(foundation.lx, foundation.ly));
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setChimneyRadius(inputChimneyRadiusRef.current);
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
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyRadius', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setChimneyRadius(inputChimneyRadiusRef.current);
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
              min={0.1}
              max={10}
              style={{ width: 120 }}
              step={1}
              precision={1}
              value={inputChimneyRadiusRef.current}
              onChange={(value) => {
                inputChimneyRadiusRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, 10] {i18n.t('word.MeterAbbreviation', lang)}
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
            <Radio.Group onChange={onScopeChange} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default SolarUpdraftTowerChimneyRadiusInput;
