/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu } from 'antd';
import { ParabolicDishModel } from '../../../models/ParabolicDishModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import ParabolicDishDiameterInput from './parabolicDishDiameterInput';
import ParabolicDishPoleHeightInput from './parabolicDishPoleHeightInput';
import ParabolicDishLatusRectumInput from './parabolicDishLatusRectumInput';
import ParabolicDishReflectanceInput from './parabolicDishReflectanceInput';
import ParabolicDishAbsorptanceInput from './parabolicDishAbsorptanceInput';
import ParabolicDishOpticalEfficiencyInput from './parabolicDishOpticalEfficiencyInput';
import ParabolicDishThermalEfficiencyInput from './parabolicDishThermalEfficiencyInput';
import ParabolicDishStructureTypeInput from './parabolicDishStructureTypeInput';
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
import ParabolicDishPoleRadiusInput from './parabolicDishPoleRadiusInput';

export const ParabolicDishMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [structureTypeDialogVisible, setStructureTypeDialogVisible] = useState(false);
  const [latusRectumDialogVisible, setLatusRectumDialogVisible] = useState(false);
  const [diameterDialogVisible, setDiameterDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [poleRadiusDialogVisible, setPoleRadiusDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [absorptanceDialogVisible, setAbsorptanceDialogVisible] = useState(false);
  const [opticalEfficiencyDialogVisible, setOpticalEfficiencyDialogVisible] = useState(false);
  const [thermalEfficiencyDialogVisible, setThermalEfficiencyDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(parabolicDish);
  const showLabel = useLabelShow(parabolicDish);
  const updateLabelText = useLabelText(parabolicDish, labelText);
  const setLabelSize = useLabelSize(parabolicDish);
  const setLabelFontSize = useLabelFontSize(parabolicDish);
  const setLabelColor = useLabelColor(parabolicDish);
  const setLabelHeight = useLabelHeight(parabolicDish);

  if (!parabolicDish) return null;

  const lang = { lng: language };
  const editable = !parabolicDish?.locked;

  const drawSunBeam = (checked: boolean) => {
    if (parabolicDish) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !parabolicDish.drawSunBeam,
        selectedElementId: parabolicDish.id,
        selectedElementType: ObjectType.ParabolicDish,
        undo: () => {
          updateSolarCollectorDrawSunBeamById(parabolicDish.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarCollectorDrawSunBeamById(parabolicDish.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarCollectorDrawSunBeamById(parabolicDish.id, checked);
    }
  };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'parabolic-dish-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'parabolic-dish-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'parabolic-dish-lock'} />
      {parabolicDish && editable && (
        <>
          {/* dish rim diameter */}
          {diameterDialogVisible && <ParabolicDishDiameterInput setDialogVisible={setDiameterDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-radius'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setDiameterDialogVisible(true);
            }}
          >
            {i18n.t('parabolicDishMenu.RimDiameter', lang)} ...
          </Menu.Item>

          {/* latus rectum */}
          {latusRectumDialogVisible && <ParabolicDishLatusRectumInput setDialogVisible={setLatusRectumDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-latus-rectum'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLatusRectumDialogVisible(true);
            }}
          >
            {i18n.t('parabolicDishMenu.LatusRectum', lang)} ...
          </Menu.Item>

          {/* structure type */}
          {structureTypeDialogVisible && (
            <ParabolicDishStructureTypeInput setDialogVisible={setStructureTypeDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-dish-structure-type'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setStructureTypeDialogVisible(true);
            }}
          >
            {i18n.t('parabolicDishMenu.ReceiverStructure', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the aperture radius */}
          {poleHeightDialogVisible && <ParabolicDishPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-pole-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </Menu.Item>

          {poleRadiusDialogVisible && <ParabolicDishPoleRadiusInput setDialogVisible={setPoleRadiusDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-pole-radius'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleRadiusDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.PoleRadius', lang)} ...
          </Menu.Item>

          {/* reflectance */}
          {reflectanceDialogVisible && <ParabolicDishReflectanceInput setDialogVisible={setReflectanceDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* absorptance */}
          {absorptanceDialogVisible && <ParabolicDishAbsorptanceInput setDialogVisible={setAbsorptanceDialogVisible} />}
          <Menu.Item
            key={'parabolic-dish-absorptance'}
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
            <ParabolicDishOpticalEfficiencyInput setDialogVisible={setOpticalEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-dish-optical-efficiency'}
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
            <ParabolicDishThermalEfficiencyInput setDialogVisible={setThermalEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'parabolic-dish-thermal-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setThermalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          <Menu.Item key={'parabolic-dish-draw-sun-beam'}>
            <Checkbox checked={!!parabolicDish?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
              {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
            </Checkbox>
          </Menu.Item>

          <SubMenu
            key={'parabolic-dish-label'}
            title={i18n.t('labelSubMenu.Label', lang)}
            style={{ paddingLeft: '24px' }}
          >
            {/* show label or not */}
            <Menu.Item key={'parabolic-dish-show-label'}>
              <Checkbox checked={!!parabolicDish?.showLabel} onChange={showLabel}>
                {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
            <Menu>
              {/* label text */}
              <Menu.Item key={'parabolic-dish-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelText', lang) + ':'}
                  value={labelText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                  onPressEnter={updateLabelText}
                  onBlur={updateLabelText}
                />
              </Menu.Item>
              {/* the label's height relative to the dish center */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-dish-label-height'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={parabolicDish.labelHeight ?? 0.2}
                  onChange={(value) => setLabelHeight(value)}
                />
              </Menu.Item>
              {/* the label's font size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-dish-label-font-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                  min={10}
                  max={100}
                  step={1}
                  precision={0}
                  value={parabolicDish.labelFontSize ?? 20}
                  onChange={(value) => setLabelFontSize(value)}
                />
              </Menu.Item>
              {/* the label's size */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-dish-label-size'}
              >
                <InputNumber
                  addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                  min={0.2}
                  max={5}
                  step={0.1}
                  precision={1}
                  value={parabolicDish.labelSize ?? 0.2}
                  onChange={(value) => setLabelSize(value)}
                />
              </Menu.Item>
              {/* the label's color */}
              <Menu.Item
                style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
                key={'parabolic-dish-label-color'}
              >
                <Input
                  addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                  value={parabolicDish.labelColor ?? '#ffffff'}
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
