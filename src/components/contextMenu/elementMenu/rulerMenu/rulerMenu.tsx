/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { RulerModel } from 'src/models/RulerModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import RulerColorSelection from './rulerColorSelection';
import RulerThicknessInput from './rulerThicknessInput';
import RulerWidthInput from './rulerWidthInput';
import RulerTickColorSelection from './rulerTickColorSelection';
import { RulerTypeSubmenu } from './rulerTypeSubmenu';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const RulerMenu = () => {
  const lang = useLanguage();

  const ruler = useContextMenuElement(ObjectType.Ruler) as RulerModel;

  if (!ruler) return null;

  const editable = !ruler?.locked;

  return (
    <>
      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={ruler} />

      {editable && (
        <>
          <DialogItem Dialog={RulerWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>
          <DialogItem Dialog={RulerThicknessInput}>{i18n.t('word.Thickness', lang)} ...</DialogItem>
          <DialogItem Dialog={RulerColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>
          <DialogItem Dialog={RulerTickColorSelection}>{i18n.t('rulerMenu.TickMarkColor', lang)} ...</DialogItem>
          <RulerTypeSubmenu ruler={ruler} />
        </>
      )}
    </>
  );
};

export default RulerMenu;
