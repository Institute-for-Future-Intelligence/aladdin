/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';
import i18n from 'src/i18n/i18n';
import SolarWaterHeaterLengthInput from './solarWaterHeaterLengthInput';
import SolarWaterHeaterWidthInput from './solarWaterHeaterWidthInput';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from 'src/constants';
import SolarWaterHeaterRelativeAzimuthInput from './solarWaterHeaterRelativeAzimuthInput';
import SolarWaterHeaterHeightInput from './solarWaterHeaterHeightInput';
import SolarWaterHeaterColorSelection from './solarWaterHeaterColorSelection';
import { createLabelSubmenu } from '../../labelSubmenuItems';

export const createSolarWaterHeaterMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.SolarWaterHeater) return { items };

  const waterHeater = selectedElement as SolarWaterHeaterModel;

  const editable = !waterHeater.locked;
  const lang = { lng: useStore.getState().language };
  const upright =
    selectedElement.type === ObjectType.SolarWaterHeater &&
    Util.isIdentical(waterHeater.normal, UNIT_VECTOR_POS_Z_ARRAY);

  items.push({
    key: 'water-heater-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'water-heater-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'water-heater-lock',
    label: <Lock selectedElement={waterHeater} />,
  });

  if (editable) {
    items.push(
      {
        key: 'water-heater-length',
        label: <DialogItem Dialog={SolarWaterHeaterLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'water-heater-width',
        label: <DialogItem Dialog={SolarWaterHeaterWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'water-heater-height',
        label: <DialogItem Dialog={SolarWaterHeaterHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
      },
    );

    if (upright) {
      items.push({
        key: 'water-heater-relative-azimuth',
        label: (
          <DialogItem Dialog={SolarWaterHeaterRelativeAzimuthInput}>
            {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
          </DialogItem>
        ),
      });
    }

    items.push({
      key: 'water-heater-frame-color',
      label: <DialogItem Dialog={SolarWaterHeaterColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'water-heater-draw-sun-beam',
      label: <SolarCollectorSunBeamCheckbox solarCollector={waterHeater} />,
    });

    items.push({
      key: 'solar-water-heater-label',
      label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
      children: createLabelSubmenu(waterHeater),
    });
  }

  return { items } as MenuProps;
};
