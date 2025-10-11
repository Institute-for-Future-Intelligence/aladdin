import { ProtractorModel } from 'src/models/ProtractorModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import ProtractorColorSelection from './protractorColorSelection';
import ProtractorTickMarkColorSelection from './protractorTickMarkColorSelection';
import ProtractorThicknessInput from './protractorThicknessInput';
import ProtractorWidthInput from './protractorWidthInput';
import ProtractorRadiusInput from './protractorRadiusInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const ProtractorMenu = () => {
  const lang = useLanguage();
  const protractor = useContextMenuElement(ObjectType.Protractor) as ProtractorModel;

  if (!protractor) return null;

  const editable = !protractor.locked;

  return (
    <>
      <Copy />
      {editable && <Cut />}
      <Lock selectedElement={protractor} />
      {editable && (
        <>
          <DialogItem Dialog={ProtractorThicknessInput}>{i18n.t('word.Thickness', lang)} ...</DialogItem>
          <DialogItem Dialog={ProtractorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>
          <DialogItem Dialog={ProtractorRadiusInput}>{i18n.t('protractorMenu.Radius', lang)} ...</DialogItem>
          <DialogItem Dialog={ProtractorColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>
          <DialogItem Dialog={ProtractorTickMarkColorSelection}>
            {i18n.t('rulerMenu.TickMarkColor', lang)} ...
          </DialogItem>
        </>
      )}
    </>
  );
};

export default ProtractorMenu;
