/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import {
  AirAttenuationCoefficientInput,
  AirConvectiveCoefficientInput,
  AmbientLightIntensityInput,
  AxesCheckbox,
  DirectLightIntensityInput,
  HighestTemperatureTimeInput,
  ShowAzimuthAngleCheckbox,
  ShowElevationAngleCheckbox,
  ShowZenithAngleCheckbox,
  ThemeSubmenu,
} from './skyMenuItems';
import { ContextSubMenu } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';

const SkyMenu = () => {
  const lang = useLanguage();

  return (
    <>
      {/* axes */}
      <AxesCheckbox />

      {/* theme-submenu */}
      <ThemeSubmenu />

      {/* sun-angles-submenu */}
      <ContextSubMenu label={i18n.t('skyMenu.SelectSunAnglesToShow', lang)}>
        <ShowAzimuthAngleCheckbox />
        <ShowElevationAngleCheckbox />
        <ShowZenithAngleCheckbox />
      </ContextSubMenu>

      {/* direct-light-intensity */}
      <DirectLightIntensityInput />

      {/* ambient-light-intensity */}
      <AmbientLightIntensityInput />

      {/* air-attenuation-coefficient */}
      <AirAttenuationCoefficientInput />

      {/* air-convective-coefficient */}
      <AirConvectiveCoefficientInput />

      {/* highest-temperature-time-in-minutes */}
      <HighestTemperatureTimeInput />
    </>
  );
};

export default SkyMenu;
