/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
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
import { useLabel, useLabelShow, useLabelText } from './menuHooks';

export const ParabolicDishMenu = React.memo(() => {
  const language = useStore(Selector.language);
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicDish = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.ParabolicDish),
  ) as ParabolicDishModel;

  const [structureTypeDialogVisible, setStructureTypeDialogVisible] = useState(false);
  const [latusRectumDialogVisible, setLatusRectumDialogVisible] = useState(false);
  const [diameterDialogVisible, setDiameterDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [absorptanceDialogVisible, setAbsorptanceDialogVisible] = useState(false);
  const [opticalEfficiencyDialogVisible, setOpticalEfficiencyDialogVisible] = useState(false);
  const [thermalEfficiencyDialogVisible, setThermalEfficiencyDialogVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(parabolicDish);
  const showLabel = useLabelShow(parabolicDish);
  const updateLabelText = useLabelText(parabolicDish, labelText);

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
    <>
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

          {/* show label or not */}
          <Menu.Item key={'parabolic-dish-show-label'}>
            <Checkbox checked={!!parabolicDish?.showLabel} onChange={showLabel}>
              {i18n.t('solarCollectorMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'parabolic-dish-label-text'} style={{ paddingLeft: '36px' }}>
              <Input
                addonBefore={i18n.t('solarCollectorMenu.Label', lang) + ':'}
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
});
