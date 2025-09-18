import { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { ProtractorModel } from 'src/models/ProtractorModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import ProtractorColorSelection from './protractorColorSelection';
import ProtractorTickMarkColorSelection from './protractorTickMarkColorSelection';
import ProtractorThicknessInput from './protractorThicknessInput';
import ProtractorWidthInput from './protractorWidthInput';
import ProtractorRadiusInput from './protractorRadiusInput';

export const createProtractorMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Protractor) return { items };

  const protractor = selectedElement as ProtractorModel;

  const lang = { lng: useStore.getState().language };

  const editable = !protractor?.locked;

  items.push({
    key: 'protractor-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'protractor-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'protractor-lock',
    label: <Lock selectedElement={protractor} />,
  });

  if (editable) {
    items.push({
      key: 'protractor-thickness',
      label: <DialogItem Dialog={ProtractorThicknessInput}>{i18n.t('word.Thickness', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'protractor-width',
      label: <DialogItem Dialog={ProtractorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'protractor-radius',
      label: <DialogItem Dialog={ProtractorRadiusInput}>{i18n.t('protractorMenu.Radius', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'protractor-color',
      label: <DialogItem Dialog={ProtractorColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
    });
    items.push({
      key: 'protractor-tick-color',
      label: (
        <DialogItem Dialog={ProtractorTickMarkColorSelection}>{i18n.t('rulerMenu.TickMarkColor', lang)} ...</DialogItem>
      ),
    });
  }

  return { items } as MenuProps;
};
