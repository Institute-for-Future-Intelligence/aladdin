/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { ObjectType, TrackerType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelInverterEfficiencyInput from '../solarPanelInverterEfficiencyInput';
import SolarPanelDcToAcRatioInput from '../solarPanelDcToAcRatioInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from 'src/constants';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelFrameColorSelection from './solarPanelFrameColorSelection';
import SolarPanelPoleHeightInput from './solarPanelPoleHeightInput';
import SolarPanelPoleSpacingInput from './solarPanelPoleSpacingInput';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import SolarPanelXInput from './solarPanelXInput';
import SolarPanelYInput from './solarPanelYInput';

export const createSolarPanelMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.SolarPanel) return { items };

  const solarPanel = selectedElement as SolarPanelModel;

  const editable = !solarPanel.locked;
  const lang = { lng: useStore.getState().language };
  const upright = Util.isIdentical(solarPanel.normal, UNIT_VECTOR_POS_Z_ARRAY);

  items.push({
    key: 'solar-panel-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'solar-panel-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'solar-panel-lock',
    label: <Lock selectedElement={solarPanel} />,
  });

  if (editable) {
    items.push(
      {
        key: 'solar-panel-model-change',
        label: (
          <DialogItem Dialog={SolarPanelModelSelection}>
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </DialogItem>
        ),
      },
      {
        key: 'solar-panel-orientation',
        label: (
          <DialogItem Dialog={SolarPanelOrientationSelection}>
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'solar-panel-length',
        label: <DialogItem Dialog={SolarPanelLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'solar-panel-width',
        label: <DialogItem Dialog={SolarPanelWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'solar-panel-center-x',
        label: (
          <DialogItem Dialog={SolarPanelXInput}>
            {i18n.t('solarCollectorMenu.RelativeXCoordinateOfCenter', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'solar-panel-center-y',
        label: (
          <DialogItem Dialog={SolarPanelYInput}>
            {i18n.t('solarCollectorMenu.RelativeYCoordinateOfCenter', lang)} ...
          </DialogItem>
        ),
      },
    );

    if (solarPanel.parentType === ObjectType.Wall) {
      items.push({
        key: 'solar-panel-tilt-angle-on-wall',
        label: (
          <DialogItem Dialog={SolarPanelTiltAngleInput}>{i18n.t('solarPanelMenu.TiltAngle', lang)} ...</DialogItem>
        ),
      });
    }

    if (upright) {
      if (solarPanel.trackerType === TrackerType.NO_TRACKER) {
        items.push({
          key: 'solar-panel-tilt-angle',
          label: (
            <DialogItem Dialog={SolarPanelTiltAngleInput}>{i18n.t('solarPanelMenu.TiltAngle', lang)} ...</DialogItem>
          ),
        });
      }

      items.push({
        key: 'solar-panel-relative-azimuth',
        label: (
          <DialogItem Dialog={SolarPanelRelativeAzimuthInput}>
            {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
          </DialogItem>
        ),
      });

      if (solarPanel.parentType !== ObjectType.Roof) {
        items.push({
          key: 'solar-panel-tracker',
          label: (
            <DialogItem Dialog={SolarPanelTrackerSelection}>{i18n.t('solarPanelMenu.Tracker', lang)} ...</DialogItem>
          ),
        });
      }
    }

    items.push({
      key: 'solar-panel-frame-color',
      label: (
        <DialogItem Dialog={SolarPanelFrameColorSelection}>{i18n.t('solarPanelMenu.FrameColor', lang)} ...</DialogItem>
      ),
    });

    items.push({
      key: 'solar-panel-draw-sun-beam',
      label: <SolarCollectorSunBeamCheckbox solarCollector={solarPanel} />,
    });

    items.push({
      key: 'solar-panel-electrical-submenu',
      label: <MenuItem>{i18n.t('solarPanelMenu.ElectricalProperties', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-panel-inverter-efficiency',
          label: (
            <DialogItem Dialog={SolarPanelInverterEfficiencyInput}>
              {i18n.t('solarPanelMenu.InverterEfficiency', lang)} ...
            </DialogItem>
          ),
        },
        {
          key: 'solar-panel-dc-ac-ratio',
          label: (
            <DialogItem Dialog={SolarPanelDcToAcRatioInput}>
              {i18n.t('solarPanelMenu.DcToAcSizeRatio', lang)} ...
            </DialogItem>
          ),
        },
      ],
    });

    items.push({
      key: 'solar-panel-pole-submenu',
      label: <MenuItem>{i18n.t('solarCollectorMenu.Pole', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-panel-pole-height',
          label: (
            <DialogItem noPadding Dialog={SolarPanelPoleHeightInput}>
              {i18n.t('solarCollectorMenu.PoleHeight', lang)} ...
            </DialogItem>
          ),
        },
        {
          key: 'solar-panel-pole-spacing',
          label: (
            <DialogItem noPadding Dialog={SolarPanelPoleSpacingInput}>
              {i18n.t('solarPanelMenu.PoleSpacing', lang)} ...
            </DialogItem>
          ),
        },
      ],
    });

    items.push({
      key: 'solar-panel-label',
      label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
      children: createLabelSubmenu(solarPanel),
    });
  }

  return { items } as MenuProps;
};
