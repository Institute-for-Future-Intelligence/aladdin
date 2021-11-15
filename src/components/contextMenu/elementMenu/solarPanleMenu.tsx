/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Select, Space } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { Vector3 } from 'three';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Orientation, TrackerType } from '../../../types';
import { Util } from '../../../Util';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';

const { Option } = Select;

export const SolarPanelMenu = ({ setPvDialogVisible }: { setPvDialogVisible: (visible: boolean) => void }) => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setElementSize = useStore(Selector.setElementSize);
  const updateElementById = useStore(Selector.updateElementById);
  const getPvModule = useStore(Selector.getPvModule);
  const addUndoable = useStore(Selector.addUndoable);

  const [solarPanel, setSolarPanel] = useState<SolarPanelModel>();
  const [dx, setDx] = useState<number>(0);
  const [dy, setDy] = useState<number>(0);
  const [panelNormal, setPanelNormal] = useState<Vector3>();
  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const element = getSelectedElement();
  const lang = { lng: language };

  useEffect(() => {
    if (element && element.type === ObjectType.SolarPanel) {
      const panel = element as SolarPanelModel;
      const pvModel = getPvModule(panel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');
      setSolarPanel(panel);
      setDx(panel.orientation === Orientation.portrait ? pvModel.width : pvModel.length);
      setDy(panel.orientation === Orientation.portrait ? pvModel.length : pvModel.width);
      setPanelNormal(new Vector3().fromArray(element.normal));
      setLabelText(element.label ?? '');
    }
  }, [element]);

  const setWidth = (value: number) => {
    if (solarPanel) {
      const oldWidth = solarPanel.lx;
      let w = value ?? 1;
      const n = Math.max(1, Math.ceil((w - dx / 2) / dx));
      w = n * dx;
      const undoableChange = {
        name: 'Set Solar Panel Array Width',
        timestamp: Date.now(),
        oldValue: oldWidth,
        newValue: w,
        undo: () => {
          updateElementById(solarPanel.id, { lx: undoableChange.oldValue as number });
        },
        redo: () => {
          updateElementById(solarPanel.id, { lx: undoableChange.newValue as number });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { lx: w });
      setUpdateFlag(!updateFlag);
    }
  };

  const setLength = (value: number) => {
    if (solarPanel) {
      const oldLength = solarPanel.ly;
      let l = value ?? 2;
      const n = Math.max(1, Math.ceil((l - dy / 2) / dy));
      l = n * dy;
      const undoableChange = {
        name: 'Set Solar Panel Array Length',
        timestamp: Date.now(),
        oldValue: oldLength,
        newValue: l,
        undo: () => {
          updateElementById(solarPanel.id, { ly: undoableChange.oldValue as number });
        },
        redo: () => {
          updateElementById(solarPanel.id, { ly: undoableChange.newValue as number });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { ly: l });
      setUpdateFlag(!updateFlag);
    }
  };

  const showLabel = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Solar Panel Label',
        timestamp: Date.now(),
        checked: !solarPanel.showLabel,
        undo: () => {
          updateElementById(solarPanel.id, { showLabel: !undoableCheck.checked });
        },
        redo: () => {
          updateElementById(solarPanel.id, { showLabel: undoableCheck.checked });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementById(solarPanel.id, { showLabel: checked });
      setUpdateFlag(!updateFlag);
    }
  };

  const setOrientation = (value: Orientation) => {
    if (solarPanel) {
      const oldOrientation = solarPanel.orientation;
      const undoableChange = {
        name: 'Set Solar Panel Orientation',
        timestamp: Date.now(),
        oldValue: oldOrientation,
        newValue: value,
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
      updateElementById(solarPanel.id, { orientation: value });
      setUpdateFlag(!updateFlag);
    }
  };

  const updateLabelText = () => {
    if (solarPanel) {
      const oldLabel = solarPanel.label;
      const undoableChange = {
        name: 'Set Solar Panel Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        undo: () => {
          updateElementById(solarPanel.id, { label: undoableChange.oldValue as string });
        },
        redo: () => {
          updateElementById(solarPanel.id, { label: undoableChange.newValue as string });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { label: labelText });
      setUpdateFlag(!updateFlag);
    }
  };

  const updatePoleHeight = (value: number) => {
    if (solarPanel) {
      const oldHeight = solarPanel.poleHeight;
      const undoableChange = {
        name: 'Set Solar Panel Pole Height',
        timestamp: Date.now(),
        oldValue: oldHeight,
        newValue: value,
        undo: () => {
          updateElementById(solarPanel.id, { poleHeight: undoableChange.oldValue as number });
        },
        redo: () => {
          updateElementById(solarPanel.id, { poleHeight: undoableChange.newValue as number });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { poleHeight: value });
      setUpdateFlag(!updateFlag);
    }
  };

  const updatePoleSpacing = (value: number) => {
    if (solarPanel) {
      const oldSpacing = solarPanel.poleSpacing;
      const undoableChange = {
        name: 'Set Solar Panel Pole Spacing',
        timestamp: Date.now(),
        oldValue: oldSpacing,
        newValue: value,
        undo: () => {
          updateElementById(solarPanel.id, { poleSpacing: undoableChange.oldValue as number });
        },
        redo: () => {
          updateElementById(solarPanel.id, { poleSpacing: undoableChange.newValue as number });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { poleSpacing: value ?? 1 });
      setUpdateFlag(!updateFlag);
    }
  };

  const setAzimuth = (value: number) => {
    if (solarPanel) {
      const oldAzimuth = solarPanel.relativeAzimuth;
      const undoableChange = {
        name: 'Set Solar Panel Azimuth',
        timestamp: Date.now(),
        oldValue: oldAzimuth,
        newValue: value,
        undo: () => {
          updateElementById(solarPanel.id, { relativeAzimuth: Util.toRadians(undoableChange.oldValue as number) });
        },
        redo: () => {
          updateElementById(solarPanel.id, { relativeAzimuth: Util.toRadians(undoableChange.newValue as number) });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { relativeAzimuth: Util.toRadians(value ?? 0) });
      setUpdateFlag(!updateFlag);
    }
  };

  const setTiltAngle = (value: number) => {
    if (solarPanel) {
      const oldTilt = solarPanel.tiltAngle;
      const undoableChange = {
        name: 'Set Solar Panel Tilt Angle',
        timestamp: Date.now(),
        oldValue: oldTilt,
        newValue: value,
        undo: () => {
          updateElementById(solarPanel.id, { tiltAngle: Util.toRadians(undoableChange.oldValue as number) });
        },
        redo: () => {
          updateElementById(solarPanel.id, { tiltAngle: Util.toRadians(undoableChange.newValue as number) });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { tiltAngle: Util.toRadians(value ?? 0) });
      setUpdateFlag(!updateFlag);
    }
  };

  const setTracker = (value: string) => {
    if (solarPanel) {
      const oldTracker = solarPanel.trackerType;
      const undoableChange = {
        name: 'Set Solar Panel Tracker',
        timestamp: Date.now(),
        oldValue: oldTracker,
        newValue: value,
        undo: () => {
          updateElementById(solarPanel.id, { trackerType: undoableChange.oldValue as string });
        },
        redo: () => {
          updateElementById(solarPanel.id, { trackerType: undoableChange.newValue as string });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(solarPanel.id, { trackerType: value });
      setUpdateFlag(!updateFlag);
    }
  };

  const drawSunBeam = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !solarPanel.drawSunBeam,
        undo: () => {
          updateElementById(solarPanel.id, { drawSunBeam: !undoableCheck.checked });
        },
        redo: () => {
          updateElementById(solarPanel.id, { drawSunBeam: undoableCheck.checked });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementById(solarPanel.id, { drawSunBeam: checked });
      setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy paddingLeft={'40px'} />
      <Cut paddingLeft={'40px'} />
      {solarPanel && (
        <>
          {/* pv model */}
          <Menu.Item
            key={'solar-panel-change'}
            onClick={() => {
              setPvDialogVisible(true);
            }}
            style={{ paddingLeft: '40px' }}
          >
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName})...
          </Menu.Item>

          {/* orientation: landscape or portrait */}
          <Menu>
            <Menu.Item key={'solar-panel-orientation'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.Orientation', lang) + ':'}</Space>
              <Select
                style={{ width: '120px' }}
                value={solarPanel.orientation}
                onChange={(value) => setOrientation(value)}
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
            </Menu.Item>

            {/* array width */}
            <Menu.Item key={'solar-panel-width'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>
                {i18n.t('word.Width', lang) +
                  ' (' +
                  Math.round(solarPanel.lx / dx) +
                  ' ' +
                  i18n.t('solarPanelMenu.Panels', lang) +
                  ') (' +
                  i18n.t('word.MeterAbbreviation', lang) +
                  '):'}
              </Space>
              <InputNumber
                min={dx}
                max={100 * dx}
                step={dx}
                style={{ width: 120 }}
                precision={2}
                value={solarPanel.lx}
                formatter={(a) => Number(a).toFixed(2)}
                onChange={(value) => setWidth(value)}
              />
            </Menu.Item>

            {/* array length */}
            <Menu.Item key={'solar-panel-length'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>
                {i18n.t('word.Length', lang) +
                  ' (' +
                  Math.round(solarPanel.ly / dy) +
                  ' ' +
                  i18n.t('solarPanelMenu.Panels', lang) +
                  ') (' +
                  i18n.t('word.MeterAbbreviation', lang) +
                  '):'}
              </Space>
              <InputNumber
                min={dy}
                max={100 * dy}
                step={dy}
                style={{ width: 120 }}
                precision={2}
                value={solarPanel.ly}
                formatter={(a) => Number(a).toFixed(2)}
                onChange={(value) => setLength(value)}
              />
            </Menu.Item>

            {panelNormal && Util.isSame(panelNormal, Util.UNIT_VECTOR_POS_Z) && (
              <>
                {/* tilt angle */}
                <Menu.Item key={'solar-panel-tilt-angle'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.TiltAngle', lang) + ':'}</Space>
                  <InputNumber
                    min={-90}
                    max={90}
                    style={{ width: 120 }}
                    precision={1}
                    value={Util.toDegrees(solarPanel.tiltAngle)}
                    step={1}
                    formatter={(a) => Number(a).toFixed(1) + '°'}
                    onChange={(value) => setTiltAngle(value)}
                  />
                </Menu.Item>

                {/* relative azimuth to the parent element */}
                <Menu.Item key={'solar-panel-relative-azimuth'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.RelativeAzimuth', lang) + ':'}</Space>
                  <InputNumber
                    min={-180}
                    max={180}
                    style={{ width: 120 }}
                    precision={1}
                    value={Util.toDegrees(solarPanel.relativeAzimuth)}
                    step={1}
                    formatter={(a) => Number(a).toFixed(1) + '°'}
                    onChange={(value) => setAzimuth(value)}
                  />
                </Menu.Item>

                {/* solar tracker type */}
                <Menu.Item key={'solar-panel-tracker'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.Tracker', lang) + ':'}</Space>
                  <Select
                    style={{ width: '120px' }}
                    value={solarPanel.trackerType}
                    onChange={(value) => setTracker(value)}
                  >
                    <Option key={'NONE'} value={TrackerType.NO_TRACKER} title={'No tracker'}>
                      None
                    </Option>
                    )
                    <Option
                      key={'HSAT'}
                      value={TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER}
                      title={'Horizontal single axis tracker'}
                    >
                      HSAT
                    </Option>
                    )
                    <Option
                      key={'VSAT'}
                      value={TrackerType.VERTICAL_SINGLE_AXIS_TRACKER}
                      title={'Vertical single axis tracker'}
                    >
                      VSAT
                    </Option>
                    )
                    <Option
                      key={'AADAT'}
                      value={TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER}
                      title={'Altazimuth single axis tracker'}
                    >
                      AADAT
                    </Option>
                    )
                  </Select>
                </Menu.Item>

                {/* pole height */}
                <Menu.Item key={'solar-panel-pole-height'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>
                    {i18n.t('solarPanelMenu.PoleHeight', lang) +
                      ' (' +
                      i18n.t('word.MeterAbbreviation', lang) +
                      ')' +
                      ':'}
                  </Space>
                  <InputNumber
                    min={0}
                    max={5}
                    style={{ width: 120 }}
                    step={0.1}
                    precision={2}
                    value={solarPanel.poleHeight}
                    formatter={(a) => Number(a).toFixed(2)}
                    onChange={(value) => updatePoleHeight(value)}
                  />
                </Menu.Item>

                {/* pole spacing */}
                <Menu.Item key={'solar-panel-pole-spacing'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>
                    {i18n.t('solarPanelMenu.PoleSpacing', lang) +
                      ' (' +
                      i18n.t('word.MeterAbbreviation', lang) +
                      ')' +
                      ':'}
                  </Space>
                  <InputNumber
                    min={1}
                    max={10}
                    step={1}
                    style={{ width: 120 }}
                    precision={2}
                    value={solarPanel.poleSpacing}
                    formatter={(a) => Number(a).toFixed(2)}
                    onChange={(value) => updatePoleSpacing(value)}
                  />
                </Menu.Item>
              </>
            )}

            {/* draw sun beam or not */}
            <Menu.Item key={'solar-panel-draw-sun-beam'}>
              <Checkbox checked={!!solarPanel?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
                {i18n.t('solarPanelMenu.DrawSunBeam', lang)}
              </Checkbox>
            </Menu.Item>

            {/* show label or not */}
            <Menu.Item key={'solar-panel-show-label'}>
              <Checkbox checked={!!solarPanel?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
                {i18n.t('solarPanelMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/* label text */}
            <Menu.Item key={'solar-panel-label-text'} style={{ paddingLeft: '40px' }}>
              <Input
                addonBefore={i18n.t('solarPanelMenu.Label', lang) + ':'}
                value={labelText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                onPressEnter={updateLabelText}
                onBlur={updateLabelText}
              />
            </Menu.Item>
          </Menu>
        </>
      )}
    </>
  );
};
