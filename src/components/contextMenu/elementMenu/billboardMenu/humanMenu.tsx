/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space, type MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock, MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox, HumanMoveViewItem, HumanObserverCheckbox } from './billboardMenuItems';
import { HumanModel } from 'src/models/HumanModel';
import HumanSelection from './humanSelection';

export const createHumanMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Human) return { items };

  const human = selectedElement as HumanModel;

  const editable = !human.locked;
  const lang = { lng: useStore.getState().language };
  const orthographic = useStore.getState().viewState.orthographic ?? false;

  items.push({
    key: 'human-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'human-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'human-lock',
    label: <Lock selectedElement={human} />,
  });

  if (editable) {
    items.push({
      key: 'human-flip',
      label: <BillboardFlipCheckbox billboardModel={human} />,
    });
  }

  if (!orthographic) {
    items.push({
      key: 'human-move-view',
      label: <HumanMoveViewItem human={human} />,
    });
  }

  if (editable) {
    items.push({
      key: 'human-obserber',
      label: <HumanObserverCheckbox human={human} />,
    });

    items.push({
      key: 'human-selection',
      label: (
        <MenuItem stayAfterClick>
          <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', lang)}: </Space>
          <HumanSelection human={human} />
        </MenuItem>
      ),
    });
  }

  return { items } as MenuProps;
};
