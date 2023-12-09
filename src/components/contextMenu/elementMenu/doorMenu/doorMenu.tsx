/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { DoorModel } from 'src/models/DoorModel';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { DoorTexture, ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import { DoorFilledCheckbox, DoorInteriorCheckbox, DoorTypeRadioGroup } from './doorMenuItems';
import i18n from 'src/i18n/i18n';
import DoorWidthInput from './doorWidthInput';
import DoorHeightInput from './doorHeightInput';
import DoorOpacityInput from './doorOpacityInput';
import DoorUValueInput from './doorUValueInput';
import DoorHeatCapacityInput from './doorHeatCapacityInput';
import DoorTextureSelection from './doorTextureSelection';
import DoorColorSelection from './doorColorSelection';
import DoorFrameColorSelection from './doorFrameColorSelection';

export const createDoorMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Door) return { items };

  const door = selectedElement as DoorModel;

  const editable = !door.locked;
  const lang = { lng: useStore.getState().language };

  // lock
  items.push({
    key: 'door-lock',
    label: <Lock selectedElement={door} />,
  });

  if (editable) {
    items.push(
      // door-filled
      {
        key: 'door-filled',
        label: <DoorFilledCheckbox door={door} />,
      },
      // door-interior
      {
        key: 'door-interior',
        label: <DoorInteriorCheckbox door={door} />,
      },
      // cut
      {
        key: 'door-cut',
        label: <Cut />,
      },
    );
  }

  // copy
  items.push({
    key: 'door-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push(
      // door-type-submenu
      {
        key: 'door-type-submenu',
        label: <MenuItem>{i18n.t('doorMenu.DoorType', lang)}</MenuItem>,
        children: [
          {
            key: 'door-type-radio-group',
            label: <DoorTypeRadioGroup door={door} />,
            style: { backgroundColor: 'white' },
          },
        ],
      },
      // door-width
      {
        key: 'door-width',
        label: <DialogItem Dialog={DoorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      // door-height
      {
        key: 'door-height',
        label: <DialogItem Dialog={DoorHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
      },
    );

    if (door.filled) {
      items.push(
        // door-u-value
        {
          key: 'door-u-value',
          label: <DialogItem Dialog={DoorUValueInput}>{i18n.t('word.UValue', lang)} ...</DialogItem>,
        },
        // door-heat-capacity
        {
          key: 'door-heat-capacity',
          label: (
            <DialogItem Dialog={DoorHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>
          ),
        },
        // door-texture
        {
          key: 'door-texture',
          label: <DialogItem Dialog={DoorTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>,
        },
        // door-color
        {
          key: 'door-color',
          label: <DialogItem Dialog={DoorColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
        },
        // door-frame-color
        {
          key: 'door-frame-color',
          label: <DialogItem Dialog={DoorFrameColorSelection}>{i18n.t('doorMenu.FrameColor', lang)} ...</DialogItem>,
        },
      );

      if (door.textureType === DoorTexture.Default || door.textureType === DoorTexture.NoTexture) {
        // door-opacity
        items.push({
          key: 'door-opacity',
          label: <DialogItem Dialog={DoorOpacityInput}>{i18n.t('wallMenu.Opacity', lang)} ...</DialogItem>,
        });
      }
    }
  }

  return { items } as MenuProps;
};
