import { MenuProps } from 'antd';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import i18n from 'src/i18n/i18n';
import BatteryStorageAzimuthInput from './batteryStorageAzimuthInput';
import BatteryStorageHeightInput from './batteryStorageHeightInput';
import BatteryStorageWidthInput from './batteryStorageWidthInput';
import BatteryStorageLengthInput from './batteryStorageLengthInput';
import BatteryStorageColorSelection from './batteryStorageColorSelection';

export const createBatteryStorageMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.BatteryStorage) return { items };

  const batteryStorage = selectedElement as BatteryStorageModel;

  const lang = { lng: useStore.getState().language };

  const editable = !batteryStorage?.locked;

  items.push({
    key: 'battery-storage-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'battery-storage-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'battery-storage-lock',
    label: <Lock selectedElement={batteryStorage} />,
  });

  if (editable) {
    items.push({
      key: 'battery-storage-color',
      label: <DialogItem Dialog={BatteryStorageColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'battery-storage-length',
      label: <DialogItem Dialog={BatteryStorageLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'battery-storage-width',
      label: <DialogItem Dialog={BatteryStorageWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'battery-storage-height',
      label: <DialogItem Dialog={BatteryStorageHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'battery-storage-azimuth',
      label: <DialogItem Dialog={BatteryStorageAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'battery-storage-label',
      label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
      children: createLabelSubmenu(batteryStorage),
    });
  }

  return { items } as MenuProps;
};
