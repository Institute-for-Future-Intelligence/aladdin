/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { ObjectType } from '../../../types';
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
import SubMenu from 'antd/lib/menu/SubMenu';
import { WindTurbineModel } from '../../../models/WindTurbineModel';
import WindTurbineTowerHeightInput from './windTurbineTowerHeightInput';
import WindTurbineTowerRadiusInput from './windTurbineTowerRadiusInput';
import WindTurbineBladeRadiusInput from './windTurbineBladeRadiusInput';
import WindTurbineYawInput from './windTurbineYawInput';
import WindTurbineRotorInitialAngleInput from './windTurbineRotorInitialAngleInput';
import WindTurbineBladeDesign from './windTurbineBladeDesign';
import WindTurbineBladePitchInput from './windTurbineBladePitchInput';
import WindTurbineBladeNumberSelection from './windTurbineBladeNumberSelection';
import WindTurbineHubDesign from './windTurbineHubDesign';
import WindTurbineBirdSafeSelection from './windTurbineBirdSafeSelection';

export const WindTurbineMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const windTurbine = useSelectedElement(ObjectType.WindTurbine) as WindTurbineModel | undefined;

  const [birdSafeDialogVisible, setBirdSafeDialogVisible] = useState(false);
  const [bladeNumberDialogVisible, setBladeNumberDialogVisible] = useState(false);
  const [relativeAngleDialogVisible, setRelativeAngleDialogVisible] = useState(false);
  const [rotorInitialAngleDialogVisible, setRotorInitialAngleDialogVisible] = useState(false);
  const [bladeRadiusDialogVisible, setBladeRadiusDialogVisible] = useState(false);
  const [bladePitchDialogVisible, setBladePitchDialogVisible] = useState(false);
  const [bladeDesignDialogVisible, setBladeDesignDialogVisible] = useState(false);
  const [towerHeightDialogVisible, setTowerHeightDialogVisible] = useState(false);
  const [towerRadiusDialogVisible, setTowerRadiusDialogVisible] = useState(false);
  const [hubDesignDialogVisible, setHubDesignDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(windTurbine);
  const showLabel = useLabelShow(windTurbine);
  const updateLabelText = useLabelText(windTurbine, labelText);
  const setLabelSize = useLabelSize(windTurbine);
  const setLabelFontSize = useLabelFontSize(windTurbine);
  const setLabelColor = useLabelColor(windTurbine);
  const setLabelHeight = useLabelHeight(windTurbine);

  if (!windTurbine) return null;

  const lang = { lng: language };
  const editable = !windTurbine?.locked;

  return (
    <Menu.ItemGroup>
      {/* <Copy keyName={'wind-turbine-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'wind-turbine-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'wind-turbine-lock'} /> */}
      {windTurbine && editable && (
        <>
          {/* relative yaw angle to the parent element */}
          {relativeAngleDialogVisible && <WindTurbineYawInput setDialogVisible={setRelativeAngleDialogVisible} />}
          <Menu.Item
            key={'wind-turbine-relative-yaw-angle'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setRelativeAngleDialogVisible(true);
            }}
          >
            {i18n.t('windTurbineMenu.RelativeYawAngle', lang)} ...
          </Menu.Item>

          {/* rotor properties */}
          <SubMenu
            key={'wind-turbine-rotor'}
            title={i18n.t('windTurbineMenu.Rotor', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* blade number */}
            {bladeNumberDialogVisible && (
              <WindTurbineBladeNumberSelection setDialogVisible={setBladeNumberDialogVisible} />
            )}
            <Menu.Item
              key={'wind-turbine-rotor-blade-number'}
              onClick={() => {
                setApplyCount(0);
                setBladeNumberDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.BladeNumber', lang)} ...
            </Menu.Item>

            {/* initial angle */}
            {rotorInitialAngleDialogVisible && (
              <WindTurbineRotorInitialAngleInput setDialogVisible={setRotorInitialAngleDialogVisible} />
            )}
            <Menu.Item
              key={'wind-turbine-rotor-initial-angle'}
              onClick={() => {
                setApplyCount(0);
                setRotorInitialAngleDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.RotorInitialAngle', lang)} ...
            </Menu.Item>

            {/* blade pitch angle */}
            {bladePitchDialogVisible && <WindTurbineBladePitchInput setDialogVisible={setBladePitchDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-rotor-blade-pitch-angle'}
              onClick={() => {
                setApplyCount(0);
                setBladePitchDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.RotorBladePitchAngle', lang)} ...
            </Menu.Item>

            {/* blade radius */}
            {bladeRadiusDialogVisible && <WindTurbineBladeRadiusInput setDialogVisible={setBladeRadiusDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-rotor-blade-radius'}
              onClick={() => {
                setApplyCount(0);
                setBladeRadiusDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.RotorBladeRadius', lang)} ...
            </Menu.Item>

            {/* blade design */}
            {bladeDesignDialogVisible && <WindTurbineBladeDesign setDialogVisible={setBladeDesignDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-rotor-blade-design'}
              onClick={() => {
                setApplyCount(0);
                setBladeDesignDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.RotorBladeDesign', lang)} ...
            </Menu.Item>

            {/* hub design */}
            {hubDesignDialogVisible && <WindTurbineHubDesign setDialogVisible={setHubDesignDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-hub-design'}
              onClick={() => {
                setApplyCount(0);
                setHubDesignDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.HubDesign', lang)} ...
            </Menu.Item>

            {/* bird-safe blade */}
            {birdSafeDialogVisible && <WindTurbineBirdSafeSelection setDialogVisible={setBirdSafeDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-bird-safe-blade'}
              onClick={() => {
                setApplyCount(0);
                setBirdSafeDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.BirdSafeDesign', lang)} ...
            </Menu.Item>
          </SubMenu>

          {/* tower properties */}
          <SubMenu
            key={'wind-turbine-tower'}
            title={i18n.t('windTurbineMenu.Tower', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* tower height */}
            {towerHeightDialogVisible && <WindTurbineTowerHeightInput setDialogVisible={setTowerHeightDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-tower-height'}
              onClick={() => {
                setApplyCount(0);
                setTowerHeightDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.TowerHeight', lang)} ...
            </Menu.Item>

            {/* tower radius */}
            {towerRadiusDialogVisible && <WindTurbineTowerRadiusInput setDialogVisible={setTowerRadiusDialogVisible} />}
            <Menu.Item
              key={'wind-turbine-tower-radius'}
              onClick={() => {
                setApplyCount(0);
                setTowerRadiusDialogVisible(true);
              }}
            >
              {i18n.t('windTurbineMenu.TowerRadius', lang)} ...
            </Menu.Item>
          </SubMenu>

          {/* label */}
          <SubMenu
            key={'wind-turbine-label'}
            title={i18n.t('labelSubMenu.Label', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* show label or not */}
            <Menu.Item key={'wind-turbine-show-label'}>
              <Checkbox checked={!!windTurbine?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'wind-turbine-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.Label', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the center */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'wind-turbine-label-height'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={windTurbine.labelHeight ?? 0.2}
                  onChange={(value) => {
                    if (value === null) return;
                    setLabelHeight(value);
                  }}
                />
              </Menu.Item>
              {/* the label's font size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'wind-turbine-label-font-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                  min={10}
                  max={100}
                  step={1}
                  precision={0}
                  value={windTurbine.labelFontSize ?? 20}
                  onChange={(value) => {
                    if (value === null) return;
                    setLabelFontSize(value);
                  }}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'wind-turbine-label-size'}>
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.5}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={windTurbine.labelSize ?? 1}
                  onChange={(value) => {
                    if (value === null) return;
                    setLabelSize(value);
                  }}
                />
              </Menu.Item>
              {/* the label's color */}
              <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'wind-turbine-label-color'}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                  value={windTurbine.labelColor ?? '#ffffff'}
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
