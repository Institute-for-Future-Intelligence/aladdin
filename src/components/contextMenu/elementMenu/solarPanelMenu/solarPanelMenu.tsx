/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { ObjectType, TrackerType } from 'src/types';
import { ContextSubMenu, Copy, Cut, DialogItem, Lock, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelInverterEfficiencyInput from './solarPanelInverterEfficiencyInput';
import SolarPanelDcToAcRatioInput from './solarPanelDcToAcRatioInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from 'src/constants';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelFrameColorSelection from './solarPanelFrameColorSelection';
import SolarPanelPoleHeightInput from './solarPanelPoleHeightInput';
import SolarPanelPoleSpacingInput from './solarPanelPoleSpacingInput';
import LabelSubmenu from '../../labelSubmenuItems';
import SolarPanelXInput from './solarPanelXInput';
import SolarPanelYInput from './solarPanelYInput';
import SolarPanelBatteryStorageSelection from './solarPanelBatteryStorageSelection';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const SolarPanelMenu = () => {
  const lang = useLanguage();
  const solarPanel = useContextMenuElement(ObjectType.SolarPanel) as SolarPanelModel;
  if (!solarPanel) return null;

  const editable = !solarPanel.locked;
  const upright = Util.isIdentical(solarPanel.normal, UNIT_VECTOR_POS_Z_ARRAY);

  return (
    <>
      {/* solar-panel-copy */}
      <Copy />

      {/* solar-panel-cut */}
      {editable && <Cut />}

      {/* solar-panel-lock */}
      <Lock selectedElement={solarPanel} />

      {editable && (
        <>
          {/* solar-panel-model-change */}
          <DialogItem Dialog={SolarPanelModelSelection}>
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </DialogItem>

          {/* solar-panel-orientation */}
          <DialogItem Dialog={SolarPanelOrientationSelection}>
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </DialogItem>

          {/* solar-panel-tilt-angle-on-wall */}
          {solarPanel.parentType === ObjectType.Wall && (
            <DialogItem Dialog={SolarPanelTiltAngleInput}>{i18n.t('solarPanelMenu.TiltAngle', lang)} ...</DialogItem>
          )}

          {upright && (
            <>
              {/* solar-panel-tilt-angle */}
              {solarPanel.trackerType === TrackerType.NO_TRACKER && (
                <DialogItem Dialog={SolarPanelTiltAngleInput}>
                  {i18n.t('solarPanelMenu.TiltAngle', lang)} ...
                </DialogItem>
              )}

              {/* solar-panel-relative-azimuth */}
              <DialogItem Dialog={SolarPanelRelativeAzimuthInput}>
                {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
              </DialogItem>

              {/* solar-panel-tracker */}
              {solarPanel.parentType !== ObjectType.Roof && (
                <DialogItem Dialog={SolarPanelTrackerSelection}>
                  {i18n.t('solarPanelMenu.Tracker', lang)} ...
                </DialogItem>
              )}
            </>
          )}

          {/* solar-panel-frame-color */}
          <DialogItem Dialog={SolarPanelFrameColorSelection}>
            {i18n.t('solarPanelMenu.FrameColor', lang)} ...
          </DialogItem>

          {/* solar-panel-draw-sun-beam */}
          <SolarCollectorSunBeamCheckbox solarCollector={solarPanel} />

          {/* solar-panel-size-submenu */}
          <ContextSubMenu label={i18n.t('word.Size', lang)}>
            <DialogItem noPadding Dialog={SolarPanelLengthInput}>
              {i18n.t('word.Length', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={SolarPanelWidthInput}>
              {i18n.t('word.Width', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* solar-panel-coordinates-submenu */}
          <ContextSubMenu label={i18n.t('solarCollectorMenu.Coordinates', lang)}>
            <DialogItem Dialog={SolarPanelXInput} noPadding>
              {i18n.t('solarCollectorMenu.RelativeXCoordinateOfCenter', lang)} ...
            </DialogItem>
            <DialogItem Dialog={SolarPanelYInput} noPadding>
              {i18n.t('solarCollectorMenu.RelativeYCoordinateOfCenter', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* solar-panel-electrical-submenu */}
          <ContextSubMenu label={i18n.t('solarPanelMenu.ElectricalProperties', lang)}>
            <DialogItem Dialog={SolarPanelInverterEfficiencyInput} noPadding>
              {i18n.t('solarPanelMenu.InverterEfficiency', lang)} ...
            </DialogItem>
            <DialogItem Dialog={SolarPanelDcToAcRatioInput} noPadding>
              {i18n.t('solarPanelMenu.DcToAcSizeRatio', lang)} ...
            </DialogItem>
            <DialogItem Dialog={SolarPanelBatteryStorageSelection} noPadding>
              {i18n.t('solarPanelMenu.BatteryStorageSelection', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* solar-panel-pole-submenu */}
          <ContextSubMenu label={i18n.t('solarCollectorMenu.Pole', lang)}>
            <DialogItem noPadding Dialog={SolarPanelPoleHeightInput}>
              {i18n.t('solarCollectorMenu.PoleHeight', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={SolarPanelPoleSpacingInput}>
              {i18n.t('solarPanelMenu.PoleSpacing', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* solar-panel-label */}
          <LabelSubmenu element={solarPanel} />
        </>
      )}
    </>
  );
};

export default SolarPanelMenu;
