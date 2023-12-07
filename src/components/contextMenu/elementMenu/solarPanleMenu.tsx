/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { Vector3 } from 'three';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Util } from '../../../Util';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import SubMenu from 'antd/lib/menu/SubMenu';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelPoleHeightInput from './solarPanelPoleHeightInput';
import SolarPanelPoleSpacingInput from './solarPanelPoleSpacingInput';
import SolarPanelFrameColorSelection from './solarPanelFrameColorSelection';
import { UNIT_VECTOR_POS_Z } from '../../../constants';
import { ObjectType, TrackerType } from '../../../types';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
  useSelectedElement,
} from './menuHooks';
import SolarPanelInverterEfficiencyInput from './solarPanelInverterEfficiencyInput';
import SolarPanelDcToAcRatioInput from './solarPanelDcToAcRatioInput';

export const SolarPanelMenu = React.memo(() => {
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const language = useStore(Selector.language);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const [pvModelDialogVisible, setPvModelDialogVisible] = useState(false);
  const [orientationDialogVisible, setOrientationDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [inverterEfficiencyDialogVisible, setInverterEfficiencyDialogVisible] = useState(false);
  const [dcAcRatioDialogVisible, setDcAcRatioDialogVisible] = useState(false);
  const [tiltDialogVisible, setTiltDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);
  const [trackerDialogVisible, setTrackerDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [poleSpacingDialogVisible, setPoleSpacingDialogVisible] = useState(false);
  const [frameColorDialogVisible, setFrameColorDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(solarPanel);
  const showLabel = useLabelShow(solarPanel);
  const updateLabelText = useLabelText(solarPanel, labelText);
  const setLabelColor = useLabelColor(solarPanel);
  const setLabelSize = useLabelSize(solarPanel);
  const setLabelFontSize = useLabelFontSize(solarPanel);
  const setLabelHeight = useLabelHeight(solarPanel);

  if (!solarPanel) return null;

  const lang = { lng: language };
  const panelNormal = new Vector3().fromArray(solarPanel.normal);
  const editable = !solarPanel?.locked;

  const drawSunBeam = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !solarPanel.drawSunBeam,
        selectedElementId: solarPanel.id,
        selectedElementType: ObjectType.SolarPanel,
        undo: () => {
          updateSolarCollectorDrawSunBeamById(solarPanel.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarCollectorDrawSunBeamById(solarPanel.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarCollectorDrawSunBeamById(solarPanel.id, checked);
    }
  };

  return (
    <Menu.ItemGroup>
      {/* <Copy keyName={'solar-panel-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'solar-panel-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'solar-panel-lock'} /> */}
      {solarPanel && editable && (
        <>
          {/* pv model */}
          {pvModelDialogVisible && <SolarPanelModelSelection setDialogVisible={setPvModelDialogVisible} />}
          <Menu.Item
            key={'solar-panel-change'}
            onClick={() => {
              setApplyCount(0);
              setPvModelDialogVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </Menu.Item>

          {/* orientation: landscape or portrait */}
          {orientationDialogVisible && (
            <SolarPanelOrientationSelection setDialogVisible={setOrientationDialogVisible} />
          )}
          <Menu.Item
            key={'solar-panel-orientation'}
            style={{ paddingLeft: '36px', width: '150px' }}
            onClick={() => {
              setApplyCount(0);
              setOrientationDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </Menu.Item>

          {/* array length */}
          {lengthDialogVisible && <SolarPanelLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'solar-panel-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* array width */}
          {widthDialogVisible && <SolarPanelWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'solar-panel-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* inverter efficiency */}
          {inverterEfficiencyDialogVisible && (
            <SolarPanelInverterEfficiencyInput setDialogVisible={setInverterEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'solar-panel-inverter-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setInverterEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.InverterEfficiency', lang)} ...
          </Menu.Item>

          {/* DC-AC ratio */}
          {dcAcRatioDialogVisible && <SolarPanelDcToAcRatioInput setDialogVisible={setDcAcRatioDialogVisible} />}
          <Menu.Item
            key={'solar-panel-dc-ac-ratio'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setDcAcRatioDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.DcToAcSizeRatio', lang)} ...
          </Menu.Item>

          {solarPanel.parentType === ObjectType.Wall && (
            <>
              <Menu.Item
                key={'solar-panel-tilt-angle'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setTiltDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.TiltAngle', lang)} ...
              </Menu.Item>
            </>
          )}

          {tiltDialogVisible && (
            <SolarPanelTiltAngleInput
              setDialogVisible={setTiltDialogVisible}
              isOnWall={solarPanel.parentType === ObjectType.Wall}
            />
          )}

          {panelNormal && Util.isSame(panelNormal, UNIT_VECTOR_POS_Z) && (
            <>
              {/* tilt angle */}
              {solarPanel.trackerType === TrackerType.NO_TRACKER && (
                <Menu.Item
                  key={'solar-panel-tilt-angle'}
                  style={{ paddingLeft: '36px' }}
                  onClick={() => {
                    setApplyCount(0);
                    setTiltDialogVisible(true);
                  }}
                >
                  {i18n.t('solarPanelMenu.TiltAngle', lang)} ...
                </Menu.Item>
              )}

              {/* relative azimuth to the parent element */}
              {azimuthDialogVisible && <SolarPanelRelativeAzimuthInput setDialogVisible={setAzimuthDialogVisible} />}
              <Menu.Item
                key={'solar-panel-relative-azimuth'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setAzimuthDialogVisible(true);
                }}
              >
                {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
              </Menu.Item>

              {/* solar tracker type */}
              {solarPanel.parentType !== ObjectType.Roof && (
                <>
                  {trackerDialogVisible && <SolarPanelTrackerSelection setDialogVisible={setTrackerDialogVisible} />}
                  <Menu.Item
                    key={'solar-panel-tracker'}
                    style={{ paddingLeft: '36px' }}
                    onClick={() => {
                      setApplyCount(0);
                      setTrackerDialogVisible(true);
                    }}
                  >
                    {i18n.t('solarPanelMenu.Tracker', lang)} ...
                  </Menu.Item>
                </>
              )}
            </>
          )}

          {editable && (
            <>
              {frameColorDialogVisible && (
                <SolarPanelFrameColorSelection setDialogVisible={setFrameColorDialogVisible} />
              )}
              <Menu.Item
                key={'solar-panel-frame-color'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setFrameColorDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.FrameColor', lang)} ...
              </Menu.Item>
            </>
          )}

          {/* draw sun beam or not */}
          <Menu.Item key={'solar-panel-draw-sun-beam'}>
            <Checkbox checked={!!solarPanel?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
              {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
            </Checkbox>
          </Menu.Item>

          <SubMenu
            key={'solar-panel-pole'}
            title={i18n.t('solarCollectorMenu.Pole', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* pole height */}
            {poleHeightDialogVisible && <SolarPanelPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
            <Menu.Item
              key={'solar-panel-pole-height'}
              onClick={() => {
                setApplyCount(0);
                setPoleHeightDialogVisible(true);
              }}
            >
              {i18n.t('solarCollectorMenu.PoleHeight', lang)} ...
            </Menu.Item>

            {/* pole spacing */}
            {poleSpacingDialogVisible && <SolarPanelPoleSpacingInput setDialogVisible={setPoleSpacingDialogVisible} />}
            <Menu.Item
              key={'solar-panel-pole-spacing'}
              onClick={() => {
                setApplyCount(0);
                setPoleSpacingDialogVisible(true);
              }}
            >
              {i18n.t('solarPanelMenu.PoleSpacing', lang)} ...
            </Menu.Item>
          </SubMenu>

          <SubMenu key={'solar-panel-label'} title={i18n.t('labelSubMenu.Label', lang)} style={{ paddingLeft: '24px' }}>
            {/* show label or not */}
            <Menu.Item key={'solar-panel-show-label'}>
              <Checkbox checked={!!solarPanel?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'solar-panel-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelText', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the solar panel's top surface */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'solar-panel-label-height'}>
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0}
                  max={100}
                  step={1}
                  precision={1}
                  value={solarPanel.labelHeight ?? 0.5}
                  onChange={(value) => setLabelHeight(value!)}
                />
              </Menu.Item>
              {/* the label's font size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'solar-panel-label-font-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                  min={10}
                  max={100}
                  step={1}
                  precision={0}
                  value={solarPanel.labelFontSize ?? 20}
                  onChange={(value) => setLabelFontSize(value!)}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'solar-panel-label-size'}>
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={solarPanel.labelSize ?? 0.2}
                  onChange={(value) => setLabelSize(value!)}
                />
              </Menu.Item>
              {/* the label's color */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'solar-panel-label-color'}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                  value={solarPanel.labelColor ?? '#ffffff'}
                  onChange={(e) => setLabelColor(e.target.value)}
                />
              </Menu.Item>
            </Menu>
          </SubMenu>
        </>
      )}
    </Menu.ItemGroup>
  );
});
