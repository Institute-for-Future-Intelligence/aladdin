/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { FresnelReflectorModel } from '../../../models/FresnelReflectorModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import FresnelReflectorLengthInput from './fresnelReflectorLengthInput';
import FresnelReflectorWidthInput from './fresnelReflectorWidthInput';
import FresnelReflectorPoleHeightInput from './fresnelReflectorPoleHeightInput';
import FresnelReflectorModuleLengthInput from './fresnelReflectorModuleLengthInput';
import FresnelReflectorReflectanceInput from './fresnelReflectorReflectanceInput';
import FresnelReflectorAbsorberSelection from './fresnelReflectorAbsorberSelection';
import FresnelReflectorDrawSunBeamSelection from './fresnelReflectorDrawSunBeamSelection';
import { ObjectType } from '../../../types';

export const FresnelReflectorMenu = () => {
  const language = useStore(Selector.language);
  const fresnelReflector = useStore(Selector.selectedElement) as FresnelReflectorModel;
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [moduleLengthDialogVisible, setModuleLengthDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);
  const [receiverDialogVisible, setReceiverDialogVisible] = useState(false);
  const [sunBeamDialogVisible, setSunBeamDialogVisible] = useState(false);

  const lang = { lng: language };

  useEffect(() => {
    if (fresnelReflector) {
      setLabelText(fresnelReflector.label ?? '');
    }
  }, [fresnelReflector]);

  const showLabel = (checked: boolean) => {
    if (fresnelReflector) {
      const undoableCheck = {
        name: 'Show Fresnel Reflector Label',
        timestamp: Date.now(),
        checked: !fresnelReflector.showLabel,
        selectedElementId: fresnelReflector.id,
        selectedElementType: ObjectType.FresnelReflector,
        undo: () => {
          updateElementShowLabelById(fresnelReflector.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(fresnelReflector.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(fresnelReflector.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const updateLabelText = () => {
    if (fresnelReflector) {
      const oldLabel = fresnelReflector.label;
      const undoableChange = {
        name: 'Set Fresnel Reflector Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: fresnelReflector.id,
        changedElementType: fresnelReflector.type,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(fresnelReflector.id, labelText);
      setUpdateFlag(!updateFlag);
    }
  };

  const editable = !fresnelReflector?.locked;

  return (
    <>
      <Copy keyName={'fresnel-reflector-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'fresnel-reflector-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'fresnel-reflector-lock'} />
      {fresnelReflector && editable && (
        <>
          {/* receiver */}
          {receiverDialogVisible && <FresnelReflectorAbsorberSelection setDialogVisible={setReceiverDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-receiver'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReceiverDialogVisible(true);
            }}
          >
            {i18n.t('fresnelReflectorMenu.SelectAbsorberToReflectSunlightTo', lang)} ...
          </Menu.Item>

          {/* reflector length */}
          {lengthDialogVisible && <FresnelReflectorLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* reflector width */}
          {widthDialogVisible && <FresnelReflectorWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-width'}
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
            <FresnelReflectorModuleLengthInput setDialogVisible={setModuleLengthDialogVisible} />
          )}
          <Menu.Item
            key={'fresnel-reflector-module-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setModuleLengthDialogVisible(true);
            }}
          >
            {i18n.t('fresnelReflectorMenu.ModuleLength', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the half of the aperture width */}
          {poleHeightDialogVisible && <FresnelReflectorPoleHeightInput setDialogVisible={setPoleHeightDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-pole-height'}
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
            <FresnelReflectorReflectanceInput setDialogVisible={setReflectanceDialogVisible} />
          )}
          <Menu.Item
            key={'fresnel-reflector-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          {sunBeamDialogVisible && <FresnelReflectorDrawSunBeamSelection setDialogVisible={setSunBeamDialogVisible} />}
          <Menu.Item
            key={'fresnel-reflector-draw-sun-beam'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSunBeamDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </Menu.Item>

          {/* show label or not */}
          <Menu.Item key={'fresnel-reflector-show-label'}>
            <Checkbox checked={!!fresnelReflector?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
              {i18n.t('solarCollectorMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'fresnel-reflector-label-text'} style={{ paddingLeft: '36px' }}>
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
