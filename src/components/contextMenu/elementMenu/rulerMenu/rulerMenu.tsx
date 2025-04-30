import { MenuProps } from 'antd';
import i18n from 'src/i18n/i18n';
import { ElementModel } from 'src/models/ElementModel';
import { RulerModel } from 'src/models/RulerModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import RulerColorSelection from './rulerColorSelection';
import RulerThicknessInput from './rulerThicknessInput';
import RulerWidthInput from './rulerWidthInput';
import RulerTickColorSelection from './rulerTickColorSelection';
import { RulerTypeRadioGroup } from './rulerTypeSubmenu';

export const createRulerMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Ruler) return { items };

  const ruler = selectedElement as RulerModel;

  const lang = { lng: useStore.getState().language };

  const editable = !ruler?.locked;

  items.push({
    key: 'ruler-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'ruler-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'ruler-lock',
    label: <Lock selectedElement={ruler} />,
  });

  if (editable) {
    items.push({
      key: 'ruler-type',
      label: <MenuItem>{i18n.t('rulerMenu.RulerType', lang)}</MenuItem>,
      children: [
        {
          key: 'ruler-type-radio-group',
          label: <RulerTypeRadioGroup ruler={ruler} />,
          style: { backgroundColor: 'white' },
        },
      ],
    });
    items.push({
      key: 'ruler-color',
      label: <DialogItem Dialog={RulerColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'ruler-tick-color',
      label: <DialogItem Dialog={RulerTickColorSelection}>{i18n.t('rulerMenu.TickColor', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'ruler-width',
      label: <DialogItem Dialog={RulerWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'ruler-thickness',
      label: <DialogItem Dialog={RulerThicknessInput}>{i18n.t('word.Thickness', lang)} ...</DialogItem>,
    });
  }

  return { items } as MenuProps;
};
