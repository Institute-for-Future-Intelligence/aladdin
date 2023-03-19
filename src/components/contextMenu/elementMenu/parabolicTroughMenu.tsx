/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { ParabolicTroughModel } from '../../../models/ParabolicTroughModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import ParabolicTroughLengthInput from './parabolicTroughLengthInput';
import ParabolicTroughWidthInput from './parabolicTroughWidthInput';
import ParabolicTroughPoleHeightInput from './parabolicTroughPoleHeightInput';
import ParabolicTroughLatusRectumInput from './parabolicTroughLatusRectumInput';
import ParabolicTroughModuleLengthInput from './parabolicTroughModuleLengthInput';
import ParabolicTroughReflectanceInput from './parabolicTroughReflectanceInput';
import ParabolicTroughAbsorptanceInput from './parabolicTroughAbsorptanceInput';
import ParabolicTroughOpticalEfficiencyInput from './parabolicTroughOpticalEfficiencyInput';
import ParabolicTroughThermalEfficiencyInput from './parabolicTroughThermalEfficiencyInput';
import { ObjectType } from '../../../types';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
} from './menuHooks';
import SubMenu from 'antd/lib/menu/SubMenu';

export const ParabolicTroughMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicTrough = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.ParabolicTrough),
  ) as ParabolicTroughModel;

  const [moduleLengthDialogVisible, setModuleLengthDialogVisible] = useState(false);
  const [latusRectumDialogVisible, setLatusRectumDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [absorptanceDialogVisible, setAbsorptanceDialogVisible] = useState(false);
  const [opticalEfficiencyDialogVisible, setOpticalEfficiencyDialogVisible] = useState(false);
  const [thermalEfficiencyDialogVisible, setThermalEfficiencyDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(parabolicTrough);
  const showLabel = useLabelShow(parabolicTrough);
  const updateLabelText = useLabelText(parabolicTrough, labelText);
  const setLabelSize = useLabelSize(parabolicTrough);
  const setLabelFontSize = useLabelFontSize(parabolicTrough);
  const setLabelColor = useLabelColor(parabolicTrough);
  const setLabelHeight = useLabelHeight(parabolicTrough);

  if (!parabolicTrough) return null;

  const lang = { lng: language };
  const editable = !parabolicTrough?.locked;

  const drawSunBeam = (checked: boolean) => {
    if (parabolicTrough) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !parabolicTrough.drawSunBeam,
        selectedElementId: parabolicTrough.id,
        selectedElementType: ObjectType.ParabolicTrough,
        undo: () => {
          updateSolarCollectorDrawSunBeamById(parabolicTrough.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarCollectorDrawSunBeamById(parabolicTrough.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarCollectorDrawSunBeamById(parabolicTrough.id, checked);
    }
  };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'parabolic-trough-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'parabolic-trough-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'parabolic-trough-lock'} />
      {parabolicTrough && editable && (
        <>
          {/* trough length */}
          {lengthDialogVisible && <ParabolicTroughLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'parabolic-trough-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* trough width */}
          {widthDialogVisible && <ParabolicTroughWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'parabolic-trough-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* module length */}
          {moduleLengthDialogVisible && (
            <ParabolicTroughModuleLengthInput setDialogVisible={setModuleLengthDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-module-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setModuleLengthDialogVisible(true);
            }}
          >
            {i18n.t('parabolicTroughMenu.ModuleLength', lang)} ...
          </Menu.Item>

          {/* latus rectum */}
          {latusRectumDialogVisible && (
            <ParabolicTroughLatusRectumInput setDialogVisible={setLatusRectumDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-latus-rectum'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLatusRectumDialogVisible(true);
            }}
          >
            {i18n.t('parabolicTroughMenu.LatusRectum', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the half of the aperture width */}
          {poleHeightDialogVisible && <ParabolicTroughPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
          <Menu.Item
            key={'parabolic-trough-pole-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </Menu.Item>

          {/* reflectance */}
          {reflectanceDialogVisible && (
            <ParabolicTroughReflectanceInput setDialogVisible={setReflectanceDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* absorptance */}
          {absorptanceDialogVisible && (
            <ParabolicTroughAbsorptanceInput setDialogVisible={setAbsorptanceDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-absorptance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setAbsorptanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} ...
          </Menu.Item>

          {/* optical efficiency */}
          {opticalEfficiencyDialogVisible && (
            <ParabolicTroughOpticalEfficiencyInput setDialogVisible={setOpticalEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-optical-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setOpticalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)} ...
          </Menu.Item>

          {/* thermal efficiency */}
          {thermalEfficiencyDialogVisible && (
            <ParabolicTroughThermalEfficiencyInput setDialogVisible={setThermalEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-trough-thermal-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setThermalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          <Menu.Item key={'parabolic-trough-draw-sun-beam'}>
            <Checkbox checked={!!parabolicTrough?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
              {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
            </Checkbox>
          </Menu.Item>

          <SubMenu
            key={'parabolic-trough-label'}
            title={i18n.t('labelSubMenu.Label', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* show label or not */}
            <Menu.Item key={'parabolic-trough-show-label'}>
              <Checkbox checked={!!parabolicTrough?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'parabolic-trough-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.Label', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                  onBlur={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the center */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-trough-label-height'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={parabolicTrough.labelHeight ?? 0.2}
                  onChange={(value) => setLabelHeight(value)}
                />
              </Menu.Item>
              {/* the label's font size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-trough-label-font-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                  min={10}
                  max={100}
                  step={1}
                  precision={0}
                  value={parabolicTrough.labelFontSize ?? 20}
                  onChange={(value) => setLabelFontSize(value)}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-trough-label-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={parabolicTrough.labelSize ?? 0.2}
                  onChange={(value) => setLabelSize(value)}
                />
              </Menu.Item>
              {/* the label's color */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-trough-label-color'}
              >
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                  value={parabolicTrough.labelColor ?? '#ffffff'}
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
