/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { Vector3 } from 'three';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import { Util } from '../../../Util';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelPoleHeightInput from './solarPanelPoleHeightInput';
import SolarPanelPoleSpacingInput from './solarPanelPoleSpacingInput';
import { UNIT_VECTOR_POS_Z } from '../../../constants';

export const SolarPanelMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const updateSolarPanelDrawSunBeamById = useStore(Selector.updateSolarPanelDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);

  const [solarPanel, setSolarPanel] = useState<SolarPanelModel>();
  const [panelNormal, setPanelNormal] = useState<Vector3>();
  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [pvModelDialogVisible, setPvModelDialogVisible] = useState(false);
  const [orientationDialogVisible, setOrientationDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [tiltDialogVisible, setTiltDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);
  const [trackerDialogVisible, setTrackerDialogVisible] = useState(false);
  const [poleHeightDialogVisible, setPoleHeightDialogVisible] = useState(false);
  const [poleSpacingDialogVisible, setPoleSpacingDialogVisible] = useState(false);

  const element = getSelectedElement();
  const lang = { lng: language };

  useEffect(() => {
    if (element && element.type === ObjectType.SolarPanel) {
      const panel = element as SolarPanelModel;
      setSolarPanel(panel);
      setPanelNormal(new Vector3().fromArray(element.normal));
      setLabelText(element.label ?? '');
    }
  }, [element]);

  const showLabel = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Solar Panel Label',
        timestamp: Date.now(),
        checked: !solarPanel.showLabel,
        undo: () => {
          updateElementShowLabelById(solarPanel.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(solarPanel.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(solarPanel.id, checked);
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
        changedElementId: solarPanel.id,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(solarPanel.id, labelText);
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
          updateSolarPanelDrawSunBeamById(solarPanel.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarPanelDrawSunBeamById(solarPanel.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarPanelDrawSunBeamById(solarPanel.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const editable = !solarPanel?.locked;

  return (
    <>
      <Copy keyName={'solar-panel-copy'} paddingLeft={'36px'} />
      {editable && <Cut keyName={'solar-panel-cut'} paddingLeft={'36px'} />}
      <Lock keyName={'solar-panel-lock'} />
      {solarPanel && editable && (
        <>
          {/* pv model */}
          <SolarPanelModelSelection
            pvModelDialogVisible={pvModelDialogVisible}
            setPvModelDialogVisible={setPvModelDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-change'}
            onClick={() => {
              setPvModelDialogVisible(true);
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </Menu.Item>

          {/* orientation: landscape or portrait */}
          <SolarPanelOrientationSelection
            orientationDialogVisible={orientationDialogVisible}
            setOrientationDialogVisible={setOrientationDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-orientation'}
            style={{ paddingLeft: '36px', width: '150px' }}
            onClick={() => {
              setOrientationDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </Menu.Item>

          {/* array width */}
          <SolarPanelWidthInput widthDialogVisible={widthDialogVisible} setWidthDialogVisible={setWidthDialogVisible} />
          <Menu.Item
            key={'solar-panel-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* array length */}
          <SolarPanelLengthInput
            lengthDialogVisible={lengthDialogVisible}
            setLengthDialogVisible={setLengthDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {panelNormal && Util.isSame(panelNormal, UNIT_VECTOR_POS_Z) && (
            <>
              {/* tilt angle */}
              <SolarPanelTiltAngleInput
                tiltDialogVisible={tiltDialogVisible}
                setTiltDialogVisible={setTiltDialogVisible}
              />
              <Menu.Item
                key={'solar-panel-tilt-angle'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setTiltDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.TiltAngle', lang)} ...
              </Menu.Item>

              {/* relative azimuth to the parent element */}
              <SolarPanelRelativeAzimuthInput
                azimuthDialogVisible={azimuthDialogVisible}
                setAzimuthDialogVisible={setAzimuthDialogVisible}
              />
              <Menu.Item
                key={'solar-panel-relative-azimuth'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setAzimuthDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.RelativeAzimuth', lang)} ...
              </Menu.Item>

              {/* solar tracker type */}
              <SolarPanelTrackerSelection
                trackerDialogVisible={trackerDialogVisible}
                setTrackerDialogVisible={setTrackerDialogVisible}
              />
              <Menu.Item
                key={'solar-panel-tracker'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setTrackerDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.Tracker', lang)} ...
              </Menu.Item>

              {/* pole height */}
              <SolarPanelPoleHeightInput
                poleHeightDialogVisible={poleHeightDialogVisible}
                setPoleHeightDialogVisible={setPoleHeightDialogVisible}
              />
              <Menu.Item
                key={'solar-panel-pole-height'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setPoleHeightDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.PoleHeight', lang)} ...
              </Menu.Item>

              {/* pole spacing */}
              <SolarPanelPoleSpacingInput
                poleSpacingDialogVisible={poleSpacingDialogVisible}
                setPoleSpacingDialogVisible={setPoleSpacingDialogVisible}
              />
              <Menu.Item
                key={'solar-panel-pole-spacing'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setPoleSpacingDialogVisible(true);
                }}
              >
                {i18n.t('solarPanelMenu.PoleSpacing', lang)} ...
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

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'solar-panel-label-text'} style={{ paddingLeft: '36px' }}>
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
