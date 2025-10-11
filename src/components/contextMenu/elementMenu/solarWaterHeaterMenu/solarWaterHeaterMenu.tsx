/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';
import i18n from 'src/i18n/i18n';
import SolarWaterHeaterLengthInput from './solarWaterHeaterLengthInput';
import SolarWaterHeaterWidthInput from './solarWaterHeaterWidthInput';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from 'src/constants';
import SolarWaterHeaterRelativeAzimuthInput from './solarWaterHeaterRelativeAzimuthInput';
import SolarWaterHeaterHeightInput from './solarWaterHeaterHeightInput';
import SolarWaterHeaterColorSelection from './solarWaterHeaterColorSelection';
import LabelSubmenu from '../../labelSubmenuItems';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const SolarWaterHeaterMenu = () => {
  const lang = useLanguage();
  const waterHeater = useContextMenuElement(ObjectType.SolarWaterHeater) as SolarWaterHeaterModel;
  if (!waterHeater) return null;

  const editable = !waterHeater.locked;
  const upright = Util.isIdentical(waterHeater.normal, UNIT_VECTOR_POS_Z_ARRAY);

  return (
    <>
      {/* water-heater-copy */}
      <Copy />

      {/* water-heater-cut */}
      {editable && <Cut />}

      {/* water-heater-lock */}
      <Lock selectedElement={waterHeater} />

      {editable && (
        <>
          {/* water-heater-length */}
          <DialogItem Dialog={SolarWaterHeaterLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* water-heater-width */}
          <DialogItem Dialog={SolarWaterHeaterWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* water-heater-height */}
          <DialogItem Dialog={SolarWaterHeaterHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>

          {/* water-heater-relative-azimuth */}
          {upright && (
            <DialogItem Dialog={SolarWaterHeaterRelativeAzimuthInput}>
              {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
            </DialogItem>
          )}

          {/* water-heater-frame-color */}
          <DialogItem Dialog={SolarWaterHeaterColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>

          {/* water-heater-draw-sun-beam */}
          <SolarCollectorSunBeamCheckbox solarCollector={waterHeater} />

          {/* solar-water-heater-label */}
          <LabelSubmenu element={waterHeater} />
        </>
      )}
    </>
  );
};

export default SolarWaterHeaterMenu;
