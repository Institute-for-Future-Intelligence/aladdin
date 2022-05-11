/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { ParabolicTroughModel } from '../../../models/ParabolicTroughModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
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

export const ParabolicTroughMenu = () => {
  const language = useStore(Selector.language);
  const parabolicTrough = useStore(Selector.selectedElement) as ParabolicTroughModel;
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [moduleLengthDialogVisible, setModuleLengthDialogVisible] = useState(false);
  const [latusRectumDialogVisible, setLatusRectumDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [absorptanceDialogVisible, setAbsorptanceDialogVisible] = useState(false);
  const [opticalEfficiencyDialogVisible, setOpticalEfficiencyDialogVisible] = useState(false);
  const [thermalEfficiencyDialogVisible, setThermalEfficiencyDialogVisible] = useState(false);

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicTrough) {
      setLabelText(parabolicTrough.label ?? '');
    }
  }, [parabolicTrough]);

  const showLabel = (checked: boolean) => {
    if (parabolicTrough) {
      const undoableCheck = {
        name: 'Show Parabolic Trough Label',
        timestamp: Date.now(),
        checked: !parabolicTrough.showLabel,
        selectedElementId: parabolicTrough.id,
        selectedElementType: ObjectType.ParabolicTrough,
        undo: () => {
          updateElementShowLabelById(parabolicTrough.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(parabolicTrough.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(parabolicTrough.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const updateLabelText = () => {
    if (parabolicTrough) {
      const oldLabel = parabolicTrough.label;
      const undoableChange = {
        name: 'Set Parabolic Trough Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: parabolicTrough.id,
        changedElementType: parabolicTrough.type,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(parabolicTrough.id, labelText);
      setUpdateFlag(!updateFlag);
    }
  };

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
      setUpdateFlag(!updateFlag);
    }
  };

  const editable = !parabolicTrough?.locked;

  return (
    <>
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

          {/* show label or not */}
          <Menu.Item key={'parabolic-trough-show-label'}>
            <Checkbox checked={!!parabolicTrough?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
              {i18n.t('solarCollectorMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'parabolic-trough-label-text'} style={{ paddingLeft: '36px' }}>
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
};
