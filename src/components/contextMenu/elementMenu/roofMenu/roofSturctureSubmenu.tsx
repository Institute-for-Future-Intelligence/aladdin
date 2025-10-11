/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { RoofStructureRadioGroup } from './roofMenuItems';
import { ContextSubMenu, DialogItem } from '../../menuItems';
import RoofRafterColorSelection from './roofRafterColorSelection';
import RoofRafterSpacingInput from './roofRafterSpacingInput';
import RoofRafterWidthInput from './roofRafterWidthInput';
import GlassTintSelection from './glassTintSelection';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  roof: RoofModel;
}

const RoofStructureSubmenu = ({ roof }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={i18n.t('roofMenu.RoofStructure', lang)}>
      {/* roof-structure-radio-group */}
      <RoofStructureRadioGroup roof={roof} />

      {roof.roofStructure === RoofStructure.Rafter && (
        <>
          {/* divider */}
          <MenuDivider />

          {/* roof-rafter-spacing */}
          <DialogItem noPadding Dialog={RoofRafterSpacingInput}>
            {i18n.t('roofMenu.RafterSpacing', lang)} ...
          </DialogItem>

          {/* roof-rafter-width */}
          <DialogItem noPadding Dialog={RoofRafterWidthInput}>
            {i18n.t('roofMenu.RafterWidth', lang)} ...
          </DialogItem>

          {/* roof-rafter-color */}
          <DialogItem noPadding Dialog={RoofRafterColorSelection}>
            {i18n.t('roofMenu.RafterColor', lang)} ...
          </DialogItem>
        </>
      )}

      {/* {roof.roofStructure === RoofStructure.Glass && (
        <>
          <MenuDivider />

          <DialogItem noPadding Dialog={GlassTintSelection}>
            {i18n.t('roofMenu.GlassTint', lang)} ...
          </DialogItem>
        </>
      )} */}
    </ContextSubMenu>
  );
};

export default RoofStructureSubmenu;
