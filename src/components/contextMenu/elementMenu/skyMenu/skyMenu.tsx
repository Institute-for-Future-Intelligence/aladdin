/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import {
  AirAttenuationCoefficientInput,
  AirConvectiveCoefficientInput,
  AmbientLightIntensityInput,
  AxesCheckBox,
  DirectLightIntensityInput,
  HighestTemperatureTimeInput,
  ShowAzimuthAngleCheckbox,
  ShowElevationAngle,
  ShowZenithAngle,
  ThemeRadioGroup,
} from './skyMenuItems';
import { MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';

export const createSkyMenu = () => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [];

  items.push({
    key: 'axes',
    label: <AxesCheckBox />,
  });

  items.push({
    key: 'theme-submenu',
    label: <MenuItem>{i18n.t('skyMenu.Theme', lang)}</MenuItem>,
    children: [
      {
        key: 'theme-radio-group',
        label: <ThemeRadioGroup />,
        style: { backgroundColor: 'white' },
      },
    ],
  });

  items.push({
    key: 'sun-angles-submenu',
    label: <MenuItem>{i18n.t('skyMenu.SelectSunAnglesToShow', lang)}</MenuItem>,
    children: [
      {
        key: 'show-azimuth-angle',
        label: <ShowAzimuthAngleCheckbox />,
      },
      {
        key: 'ShowElevationAngle',
        label: <ShowElevationAngle />,
      },
      {
        key: 'ShowZenithAngle',
        label: <ShowZenithAngle />,
      },
    ],
  });

  items.push({
    key: 'direct-light-intensity',
    label: <DirectLightIntensityInput />,
  });

  items.push({
    key: 'ambient-light-intensity',
    label: <AmbientLightIntensityInput />,
  });

  items.push({
    key: 'air-attenuation-coefficient',
    label: <AirAttenuationCoefficientInput />,
  });

  items.push({
    key: 'air-convective-coefficient',
    label: <AirConvectiveCoefficientInput />,
  });

  items.push({
    key: 'highest-temperature-time-in-minutes',
    label: <HighestTemperatureTimeInput />,
  });

  return { items } as MenuProps;
};
