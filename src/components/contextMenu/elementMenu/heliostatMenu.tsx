/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { HeliostatModel } from '../../../models/HeliostatModel';
import HeliostatWidthInput from './heliostatWidthInput';
import HeliostatLengthInput from './heliostatLengthInput';
import HeliostatPoleHeightInput from './heliostatPoleHeightInput';
import HeliostatReflectanceInput from './heliostatReflectorReflectanceInput';

export const HeliostatMenu = () => {
  const language = useStore(Selector.language);
  const heliostat = useStore(Selector.selectedElement) as HeliostatModel;
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const updateSolarCollectorDrawSunBeamById = useStore(Selector.updateSolarCollectorDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [reflectanceDialogVisible, setReflectanceDialogVisible] = useState(false);

  const lang = { lng: language };

  useEffect(() => {
    if (heliostat) {
      setLabelText(heliostat.label ?? '');
    }
  }, [heliostat]);

  const showLabel = (checked: boolean) => {
    if (heliostat) {
      const undoableCheck = {
        name: 'Show Heliostat Label',
        timestamp: Date.now(),
        checked: !heliostat.showLabel,
        undo: () => {
          updateElementShowLabelById(heliostat.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(heliostat.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(heliostat.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const updateLabelText = () => {
    if (heliostat) {
      const oldLabel = heliostat.label;
      const undoableChange = {
        name: 'Set Heliostat Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: heliostat.id,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(heliostat.id, labelText);
      setUpdateFlag(!updateFlag);
    }
  };

  const drawSunBeam = (checked: boolean) => {
    if (heliostat) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !heliostat.drawSunBeam,
        undo: () => {
          updateSolarCollectorDrawSunBeamById(heliostat.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarCollectorDrawSunBeamById(heliostat.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarCollectorDrawSunBeamById(heliostat.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const editable = !heliostat?.locked;

  return (
    <>
      <Copy keyName={'heliostat-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'heliostat-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'heliostat-lock'} />
      {heliostat && editable && (
        <>
          {/* heliostat length */}
          <HeliostatLengthInput dialogVisible={lengthDialogVisible} setDialogVisible={setLengthDialogVisible} />
          <Menu.Item
            key={'heliostat-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* heliostat width */}
          <HeliostatWidthInput dialogVisible={widthDialogVisible} setDialogVisible={setWidthDialogVisible} />
          <Menu.Item
            key={'heliostat-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* extra pole height in addition to the half of the aperture size */}
          <HeliostatPoleHeightInput
            dialogVisible={poleHeightDialogVisible}
            setDialogVisible={setPoleHeightDialogVisible}
          />
          <Menu.Item
            key={'heliostat-pole-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setPoleHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </Menu.Item>

          {/* reflectance */}
          <HeliostatReflectanceInput
            dialogVisible={reflectanceDialogVisible}
            setDialogVisible={setReflectanceDialogVisible}
          />
          <Menu.Item
            key={'heliostat-reflectance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setReflectanceDialogVisible(true);
            }}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </Menu.Item>

          {/* draw sun beam or not */}
          <Menu.Item key={'heliostat-draw-sun-beam'}>
            <Checkbox checked={!!heliostat?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
              {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
            </Checkbox>
          </Menu.Item>

          {/* show label or not */}
          <Menu.Item key={'heliostat-show-label'}>
            <Checkbox checked={!!heliostat?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
              {i18n.t('solarCollectorMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'heliostat-label-text'} style={{ paddingLeft: '36px' }}>
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
