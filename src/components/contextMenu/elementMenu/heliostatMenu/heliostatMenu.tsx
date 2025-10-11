/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import LabelSubmenu from '../../labelSubmenuItems';
import { HeliostatModel } from 'src/models/HeliostatModel';
import HeliostatDrawSunBeamSelection from './heliostatDrawSunBeamSelection';
import HeliostatTowerSelection from './heliostatTowerSelection';
import HeliostatLengthInput from './heliostatLengthInput';
import HeliostatWidthInput from './heliostatWidthInput';
import HeliostatPoleHeightInput from './heliostatPoleHeightInput';
import HeliostatPoleRadiusInput from './heliostatPoleRadiusInput';
import HeliostatReflectanceInput from './heliostatReflectorReflectanceInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const HeliostatMenu = () => {
  const lang = useLanguage();
  const heliostat = useContextMenuElement(ObjectType.Heliostat) as HeliostatModel;
  if (!heliostat) return null;

  const editable = !heliostat.locked;

  return (
    <>
      {/* heliostat-copy */}
      <Copy />

      {/* heliostat-cut */}
      {editable && <Cut />}

      {/* heliostat-lock */}
      <Lock selectedElement={heliostat} />

      {editable && (
        <>
          {/* heliostat-tower */}
          <DialogItem Dialog={HeliostatTowerSelection}>
            {i18n.t('heliostatMenu.SelectTowerToReflectSunlightTo', lang)} ...
          </DialogItem>

          {/* heliostat-length */}
          <DialogItem Dialog={HeliostatLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* heliostat-width */}
          <DialogItem Dialog={HeliostatWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* heliostat-pole-height */}
          <DialogItem Dialog={HeliostatPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>

          {/* heliostat-pole-radius */}
          <DialogItem Dialog={HeliostatPoleRadiusInput}>{i18n.t('solarCollectorMenu.PoleRadius', lang)} ...</DialogItem>

          {/* heliostat-reflectance */}
          <DialogItem Dialog={HeliostatReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>

          {/* heliostat-draw-sun-beam */}
          <DialogItem Dialog={HeliostatDrawSunBeamSelection}>
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </DialogItem>

          {/* heliostat-label-submenu */}
          <LabelSubmenu element={heliostat} />
        </>
      )}
    </>
  );
};

export default HeliostatMenu;
