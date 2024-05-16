/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { UndoableChange } from '../undo/UndoableChange';
import { useLanguage } from '../views/hooks';

const EconomicsPanel = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const economicsParams = useStore(Selector.economicsParams);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const electricitySellingPriceRef = useRef<number>(economicsParams.electricitySellingPrice);
  const operationalCostPerUnitRef = useRef<number>(economicsParams.operationalCostPerUnit);

  const lang = useLanguage();

  useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

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

  const apply = () => {
    const oldPrice = economicsParams.electricitySellingPrice;
    const newPrice = electricitySellingPriceRef.current;
    if (oldPrice !== newPrice) {
      const undoableChange = {
        name: 'Electricity Selling Price',
        timestamp: Date.now(),
        oldValue: oldPrice,
        newValue: newPrice,
        undo: () => {
          setCommonStore((state) => {
            state.economicsParams.electricitySellingPrice = undoableChange.oldValue as number;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.economicsParams.electricitySellingPrice = undoableChange.newValue as number;
          });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setCommonStore((state) => {
        state.economicsParams.electricitySellingPrice = newPrice;
      });
    }

    const oldCost = economicsParams.operationalCostPerUnit;
    const newCost = operationalCostPerUnitRef.current;
    if (oldCost !== newCost) {
      const undoableChange = {
        name: 'Operational Cost per Unit',
        timestamp: Date.now(),
        oldValue: oldCost,
        newValue: newCost,
        undo: () => {
          setCommonStore((state) => {
            state.economicsParams.operationalCostPerUnit = undoableChange.oldValue as number;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.economicsParams.operationalCostPerUnit = undoableChange.newValue as number;
          });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setCommonStore((state) => {
        state.economicsParams.operationalCostPerUnit = newCost;
      });
    }
  };

  const onCancelClick = () => {
    setDialogVisible(false);
  };

  const onOkClick = () => {
    apply();
    setDialogVisible(false);
  };

  return (
    <Modal
      width={500}
      open={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {i18n.t('economicsPanel.EconomicsParameters', lang)}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick}>
          {i18n.t('word.OK', lang)}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={() => {
        setDialogVisible(false);
      }}
      maskClosable={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('economicsPanel.ElectricitySellingPrice', lang) + ' ([0.1, 1]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={0.1}
            max={1}
            style={{ width: '100%' }}
            precision={2}
            value={electricitySellingPriceRef.current}
            step={0.01}
            formatter={(value) => `$${value}/kWh`}
            onChange={(value) => {
              if (value === null) return;
              electricitySellingPriceRef.current = value;
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value.replace('$', '').replace('/kWh', '');
              const v = parseFloat(value);
              electricitySellingPriceRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value.replace('$', '').replace('/kWh', '');
              const v = parseFloat(value);
              electricitySellingPriceRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('economicsPanel.OperationalCostPerUnit', lang) + ' ([0.1, 1]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={0.1}
            max={1}
            style={{ width: '100%' }}
            precision={2}
            value={operationalCostPerUnitRef.current}
            step={0.01}
            formatter={(value) => `$${value}/day`}
            onChange={(value) => {
              if (value === null) return;
              operationalCostPerUnitRef.current = value;
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value.replace('$', '').replace('/day', '');
              const v = parseFloat(value);
              operationalCostPerUnitRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value.replace('$', '').replace('/day', '');
              const v = parseFloat(value);
              operationalCostPerUnitRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
});

export default EconomicsPanel;
