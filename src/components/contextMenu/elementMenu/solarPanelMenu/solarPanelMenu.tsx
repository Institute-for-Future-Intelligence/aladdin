/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { ObjectType, TrackerType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import { SolarPanelSunBeamCheckbox } from './solarPanelMenuItems';
import i18n from 'src/i18n/i18n';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelInverterEfficiencyInput from '../solarPanelInverterEfficiencyInput';
import SolarPanelDcToAcRatioInput from '../solarPanelDcToAcRatioInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import { Vector3 } from 'three';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z } from 'src/constants';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelFrameColorSelection from '../solarPanelFrameColorSelection';
import SolarPanelPoleHeightInput from './solarPanelPoleHeightInput';
import SolarPanelPoleSpacingInput from './solarPanelPoleSpacingInput';
import { createLabelSubmenu } from '../../labelSubmenuItems';

export const createSolarPanelMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.SolarPanel) return { items };

  const solarPanel = selectedElement as SolarPanelModel;

  const editable = !solarPanel.locked;
  const lang = { lng: useStore.getState().language };
  const panelNormal = new Vector3().fromArray(solarPanel.normal);

  // solar-panel-lock
  items.push({
    key: 'solar-panel-lock',
    label: <Lock selectedElement={solarPanel} />,
  });

  if (editable) {
    items.push(
      // solar-panel-draw-sun-beam
      {
        key: 'solar-panel-draw-sun-beam',
        label: <SolarPanelSunBeamCheckbox solarPanel={solarPanel} />,
      },
      // solar-panel-cut
      {
        key: 'solar-panel-cut',
        label: <Cut />,
      },
    );
  }

  // solar-panel-copy
  items.push({
    key: 'solar-panel-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push(
      // solar-panel-model-change
      {
        key: 'solar-panel-model-change',
        label: (
          <DialogItem Dialog={SolarPanelModelSelection}>
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </DialogItem>
        ),
      },
      // solar-panel-orientation
      {
        key: 'solar-panel-orientation',
        label: (
          <DialogItem Dialog={SolarPanelOrientationSelection}>
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </DialogItem>
        ),
      },
      // solar-panel-length
      {
        key: 'solar-panel-length',
        label: <DialogItem Dialog={SolarPanelLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      // solar-panel-width
      {
        key: 'solar-panel-width',
        label: <DialogItem Dialog={SolarPanelWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      // solar-panel-inverter-efficiency
      {
        key: 'solar-panel-inverter-efficiency',
        label: (
          <DialogItem Dialog={SolarPanelInverterEfficiencyInput}>
            {i18n.t('solarPanelMenu.InverterEfficiency', lang)} ...
          </DialogItem>
        ),
      },
      // solar-panel-dc-ac-ratio
      {
        key: 'solar-panel-dc-ac-ratio',
        label: (
          <DialogItem Dialog={SolarPanelDcToAcRatioInput}>
            {i18n.t('solarPanelMenu.DcToAcSizeRatio', lang)} ...
          </DialogItem>
        ),
      },
    );

    // solar-panel-tilt-angle-on-wall
    if (solarPanel.parentType === ObjectType.Wall) {
      items.push({
        key: 'solar-panel-tilt-angle-on-wall',
        label: (
          <DialogItem Dialog={SolarPanelTiltAngleInput}>{i18n.t('solarPanelMenu.TiltAngle', lang)} ...</DialogItem>
        ),
      });
    }

    if (panelNormal && Util.isSame(panelNormal, UNIT_VECTOR_POS_Z)) {
      // solar-panel-tilt-angle
      if (solarPanel.trackerType === TrackerType.NO_TRACKER) {
        items.push({
          key: 'solar-panel-tilt-angle',
          label: (
            <DialogItem Dialog={SolarPanelTiltAngleInput}>{i18n.t('solarPanelMenu.TiltAngle', lang)} ...</DialogItem>
          ),
        });
      }

      // solar-panel-relative-azimuth
      items.push({
        key: 'solar-panel-relative-azimuth',
        label: (
          <DialogItem Dialog={SolarPanelRelativeAzimuthInput}>
            {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
          </DialogItem>
        ),
      });

      // solar-panel-tracker
      if (solarPanel.parentType !== ObjectType.Roof) {
        items.push({
          key: 'solar-panel-tracker',
          label: (
            <DialogItem Dialog={SolarPanelTrackerSelection}>{i18n.t('solarPanelMenu.Tracker', lang)} ...</DialogItem>
          ),
        });
      }
    }

    // solar-panel-frame-color
    items.push({
      key: 'solar-panel-frame-color',
      label: (
        <DialogItem Dialog={SolarPanelFrameColorSelection}>{i18n.t('solarPanelMenu.FrameColor', lang)} ...</DialogItem>
      ),
    });

    // solar-panel-pole-submenu
    items.push({
      key: 'solar-panel-pole-submenu',
      label: <MenuItem>{i18n.t('solarCollectorMenu.Pole', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-panel-pole-height',
          label: (
            <DialogItem Dialog={SolarPanelPoleHeightInput}>
              {i18n.t('solarCollectorMenu.PoleHeight', lang)} ...
            </DialogItem>
          ),
        },
        {
          key: 'solar-panel-pole-spacing',
          label: (
            <DialogItem Dialog={SolarPanelPoleSpacingInput}>
              {i18n.t('solarPanelMenu.PoleSpacing', lang)} ...
            </DialogItem>
          ),
        },
      ],
    });

    // solar-panel-label
    items.push({
      key: 'solar-panel-label',
      label: i18n.t('labelSubMenu.Label', lang),
      children: createLabelSubmenu(solarPanel),
    });
  }

  return { items } as MenuProps;
};
