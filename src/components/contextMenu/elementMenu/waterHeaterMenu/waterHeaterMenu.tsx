/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import { WaterHeaterModel } from 'src/models/WaterHeaterModel';
import i18n from 'src/i18n/i18n';
import WaterHeaterLengthInput from './waterHeaterLengthInput';
import WaterHeaterWidthInput from './waterHeaterWidthInput';
import { Util } from 'src/Util';
import { UNIT_VECTOR_POS_Z_ARRAY } from 'src/constants';
import WaterHeaterRelativeAzimuthInput from './waterHeaterRelativeAzimuthInput';
import WaterHeaterHeightInput from './waterHeaterHeightInput';

export const createWaterHeaterMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.WaterHeater) return { items };

  const waterHeater = selectedElement as WaterHeaterModel;

  const editable = !waterHeater.locked;
  const lang = { lng: useStore.getState().language };
  const upright =
    selectedElement.type === ObjectType.WaterHeater && Util.isIdentical(waterHeater.normal, UNIT_VECTOR_POS_Z_ARRAY);

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
        label: <DialogItem Dialog={WaterHeaterLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'water-heater-width',
        label: <DialogItem Dialog={WaterHeaterWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'water-heater-height',
        label: <DialogItem Dialog={WaterHeaterHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
      },
    );
  }

  if (upright) {
    items.push({
      key: 'water-heater-relative-azimuth',
      label: (
        <DialogItem Dialog={WaterHeaterRelativeAzimuthInput}>
          {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)} ...
        </DialogItem>
      ),
    });
  }

  return { items } as MenuProps;
};
