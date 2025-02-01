/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, Divider, Input, InputNumber, Radio, Row, Space, TimePicker } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { FoundationModel } from '../../../../models/FoundationModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import dayjs from 'dayjs';
import { HvacSystem, TimedSetpoint } from 'src/models/HvacSystem';
import produce from 'immer';
import { UndoableHvacSystem } from 'src/undo/UndoableHvacSystem';

const Default_Thermostat_Setpoints = [
  { time: 6, heat: 20, cool: 20 },
  { time: 8, heat: 20, cool: 20 },
  { time: 18, heat: 20, cool: 20 },
  { time: 23, heat: 20, cool: 20 },
];

const timeFormat = 'HH:mm';

const BuildingHVACSystem = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const lang = useLanguage();

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;
  const hvac = foundation?.hvacSystem;

  const IDRef = useRef(hvac?.id);
  const [type, setType] = useState<'Simple' | 'Programmable'>(hvac?.type ?? 'Simple');
  const [tolerance, setTolerance] = useState<number>(hvac?.temperatureThreshold ?? 2);
  const [heatingSetpoint, setHeatingSetpoint] = useState<number>(
    hvac?.heatingSetpoint ?? hvac?.thermostatSetpoint ?? 20,
  );
  const [coolingSetpoint, setCoolingSetpoint] = useState<number>(
    hvac?.coolingSetpoint ?? hvac?.thermostatSetpoint ?? 20,
  );
  const [thermostatSetpoints, setThermostatSetpoints] = useState<TimedSetpoint[]>(
    hvac?.thermostatSetpoints ?? Default_Thermostat_Setpoints,
  );
  const [timeError, setTimeError] = useState<number | null>(null);

  const noChange = (hvac: HvacSystem) => {
    if (!foundation) return false;
    const h1 = foundation.hvacSystem;
    const h2 = hvac;

    if (
      h1.id !== h2.id ||
      h1.temperatureThreshold !== h2.temperatureThreshold ||
      h1.heatingSetpoint !== h2.heatingSetpoint ||
      h1.coolingSetpoint !== h2.coolingSetpoint ||
      h1.type !== h2.type
    ) {
      return false;
    }
    if (h1.thermostatSetpoints && h2.thermostatSetpoints) {
      for (let i = 0; i < h1.thermostatSetpoints.length; i++) {
        if (h1.thermostatSetpoints[i].time !== h2.thermostatSetpoints[i].time) return false;
        if (h1.thermostatSetpoints[i].heat !== h2.thermostatSetpoints[i].heat) return false;
        if (h1.thermostatSetpoints[i].cool !== h2.thermostatSetpoints[i].cool) return false;
      }
    } else if (h1.thermostatSetpoints || h2.thermostatSetpoints) {
      return false;
    }
    return true;
  };

  const updateHvacInMap = (map: Map<string, HvacSystem>, hvac?: HvacSystem) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id) && e.type === ObjectType.Foundation) {
          if (hvac) {
            (e as FoundationModel).hvacSystem = hvac;
          } else {
            const hvac = map.get(e.id);
            if (hvac) {
              (e as FoundationModel).hvacSystem = { ...hvac };
            }
          }
        }
      }
    });
  };

  const deepClone = (hvac: HvacSystem) => {
    const cloned = { ...hvac };
    if (hvac.thermostatSetpoints) {
      const setpoints = [];
      for (const setpoint of hvac.thermostatSetpoints) {
        setpoints.push({ ...setpoint });
      }
      cloned.thermostatSetpoints = setpoints;
    }
    return cloned;
  };

  const updateHvac = (hvac: HvacSystem) => {
    if (!foundation) return;

    const hvacMap = new Map<string, HvacSystem>();

    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (
          e.id === foundation.id ||
          (IDRef.current && e.type === ObjectType.Foundation && (e as FoundationModel).hvacSystem.id === IDRef.current)
        ) {
          hvacMap.set(e.id, deepClone((e as FoundationModel).hvacSystem));
          (e as FoundationModel).hvacSystem = hvac;
        }
      }
    });
    setApplyCount(useStore.getState().applyCount + 1);

    const undoable = {
      name: 'Set Building HVAC System',
      timestamp: Date.now(),
      foundationID: foundation.id,
      systemID: foundation.hvacSystem.id,
      oldValues: hvacMap,
      newValue: hvac,
      undo() {
        updateHvacInMap(undoable.oldValues);
      },
      redo() {
        updateHvacInMap(undoable.oldValues, undoable.newValue);
      },
    } as UndoableHvacSystem;
    addUndoable(undoable);
  };

  const getTime = (val: number) => {
    const hours = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);
    return dayjs(`${hours}:${minutes}`, timeFormat);
  };

  const setSetpointsValueByIndex = (val: number, i: number, j: number) => {
    setThermostatSetpoints(
      produce((setpoints) => {
        if (j === 0) {
          setpoints[i].time = val;
        } else if (j === 1) {
          setpoints[i].heat = val;
        } else if (j === 2) {
          setpoints[i].cool = val;
        }
      }),
    );
  };

  const isTimeInvalid = () => {
    for (let i = 1; i < thermostatSetpoints.length; i++) {
      const prevTime = thermostatSetpoints[i - 1].time;
      const currTime = thermostatSetpoints[i].time;
      if (prevTime > currTime) {
        setTimeError(i);
        return true;
      }
    }
    return false;
  };

  const onApply = () => {
    const hvac = {
      heatingSetpoint,
      coolingSetpoint,
      temperatureThreshold: tolerance,
      type,
      thermostatSetpoints,
    } as HvacSystem;
    if (IDRef.current) {
      hvac.id = IDRef.current;
    }
    if (noChange(hvac) || isTimeInvalid()) {
      return;
    } else {
      updateHvac(hvac);
    }
  };

  const onOk = () => {
    if (isTimeInvalid()) {
      return;
    } else {
      onApply();
      onClose();
      setApplyCount(0);
    }
  };

  const onClose = () => {
    setDialogVisible(false);
  };

  return (
    <Dialog
      width={500}
      title={i18n.t('HVACMenu.BuildingHVACSystem', lang)}
      onApply={onApply}
      onClose={onClose}
      onClickOk={onOk}
    >
      <Row style={{ padding: '4px 0' }}>
        <Col span={2} style={{ display: 'flex', alignItems: 'center' }}>
          <b>{i18n.t('HVACMenu.ID', lang)}:</b>
        </Col>
        <Col span={8}>
          <Input
            defaultValue={IDRef.current}
            onChange={(e) => {
              const str = e.target.value.trim();
              if (str.length === 0) {
                IDRef.current = undefined;
              } else {
                IDRef.current = str;
              }
            }}
          />
        </Col>
        <Col span={7} style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
          <Space title={i18n.t('HVACMenu.ToleranceExplanation', lang)} style={{ paddingRight: '8px' }}>
            <b>{i18n.t('HVACMenu.Tolerance', lang) + ':'}</b>
          </Space>
        </Col>
        <Col span={7}>
          <InputNumber
            addonAfter="°C"
            value={tolerance}
            min={0}
            max={10}
            onChange={(val) => {
              if (val === null) return;
              setTolerance(Number(val));
            }}
          />
        </Col>
      </Row>
      <Row style={{ padding: '4px 0', height: '39px' }}>
        <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <b>{i18n.t('HVACMenu.ThermostatType', lang)}:</b>
        </Col>
        <Col span={16} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Radio.Group defaultValue={type} onChange={(e) => setType(e.target.value)}>
            <Radio value={'Simple'}>{i18n.t('HVACMenu.Simple', lang)}</Radio>
            <Radio style={{ margin: '0 0 0 48px' }} value={'Programmable'}>
              {i18n.t('HVACMenu.Programmable', lang)}
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      {type === 'Simple' ? (
        <>
          <Row>
            <Col span={11} style={{ display: 'flex', alignItems: 'center' }}>
              <b>{i18n.t('HVACMenu.HeatingSetpoint', lang)}:</b>
            </Col>
            <Col span={13}>
              <InputNumber
                addonAfter="°C"
                value={heatingSetpoint}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setHeatingSetpoint(Number(val));
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col span={11} style={{ display: 'flex', alignItems: 'center' }}>
              <b>{i18n.t('HVACMenu.CoolingSetpoint', lang)}:</b>
            </Col>
            <Col span={13}>
              <InputNumber
                addonAfter="°C"
                value={coolingSetpoint}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setCoolingSetpoint(Number(val));
                }}
              />
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Row style={{ height: '34px' }}>
            <Col span={4}>
              <b>{i18n.t('HVACMenu.Period', lang)}</b>
            </Col>
            <Col span={6} style={{ paddingRight: '6px' }}>
              <b>{i18n.t('HVACMenu.StartTime', lang)}</b>
            </Col>
            <Col span={7} style={{ paddingRight: '6px' }}>
              <b>{i18n.t('HVACMenu.HeatingSetpoint', lang)}</b>
            </Col>
            <Col span={7}>
              <b>{i18n.t('HVACMenu.CoolingSetpoint', lang)}</b>
            </Col>
          </Row>
          <Row>
            <Col span={4} style={{ paddingRight: '6px' }}>
              {i18n.t('HVACMenu.Wake', lang)}
            </Col>
            <Col span={6} style={{ paddingRight: '6px' }}>
              <TimePicker
                value={getTime(thermostatSetpoints[0].time)}
                format={timeFormat}
                onChange={(t) => {
                  setSetpointsValueByIndex(t.hour() + t.minute() / 60, 0, 0);
                  setTimeError(null);
                }}
              />
            </Col>
            <Col span={7} style={{ paddingRight: '6px' }}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[0].heat ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 0, 1);
                }}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[0].cool ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 0, 2);
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col span={4} style={{ paddingRight: '6px' }}>
              {i18n.t('HVACMenu.Day', lang)}
            </Col>
            <Col span={6} style={{ paddingRight: '6px' }}>
              <TimePicker
                status={timeError === 1 ? 'error' : undefined}
                value={getTime(thermostatSetpoints[1].time)}
                format={timeFormat}
                onChange={(t) => {
                  setSetpointsValueByIndex(t.hour() + t.minute() / 60, 1, 0);
                  setTimeError(null);
                }}
              />
            </Col>
            <Col span={7} style={{ paddingRight: '6px' }}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[1].heat ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 1, 1);
                }}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[1].cool ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 1, 2);
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col span={4} style={{ paddingRight: '6px' }}>
              {i18n.t('HVACMenu.Evening', lang)}
            </Col>
            <Col span={6} style={{ paddingRight: '6px' }}>
              <TimePicker
                status={timeError === 2 ? 'error' : undefined}
                value={getTime(thermostatSetpoints[2].time)}
                format={timeFormat}
                onChange={(t) => {
                  setSetpointsValueByIndex(t.hour() + t.minute() / 60, 2, 0);
                  setTimeError(null);
                }}
              />
            </Col>
            <Col span={7} style={{ paddingRight: '6px' }}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[2].heat ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 2, 1);
                }}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[2].cool ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 2, 2);
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col span={4} style={{ paddingRight: '6px' }}>
              {i18n.t('HVACMenu.Sleep', lang)}
            </Col>
            <Col span={6} style={{ paddingRight: '6px' }}>
              <TimePicker
                status={timeError === 3 ? 'error' : undefined}
                value={getTime(thermostatSetpoints[3].time)}
                format={timeFormat}
                onChange={(t) => {
                  setSetpointsValueByIndex(t.hour() + t.minute() / 60, 3, 0);
                  setTimeError(null);
                }}
              />
            </Col>
            <Col span={7} style={{ paddingRight: '6px' }}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[3].heat ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 3, 1);
                }}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                addonAfter="°C"
                value={thermostatSetpoints[3].cool ?? 20}
                min={0}
                max={30}
                onChange={(val) => {
                  if (val === null) return;
                  setSetpointsValueByIndex(val, 3, 2);
                }}
              />
            </Col>
          </Row>
        </>
      )}
      <br />
      {timeError !== null && <div style={{ color: 'red' }}>{i18n.t('HVACMenu.TimeErrorMessage', lang)}</div>}
    </Dialog>
  );
};

export default BuildingHVACSystem;
