/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { RoofModel } from 'src/models/RoofModel';
import { RoofCeilingCheckbox } from './roofMenuItems';
import { ContextSubMenu, DialogItem } from '../../menuItems';
import CeilingRValueInput from './ceilingRValueInput';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  roof: RoofModel;
}

const RoofCeilingSubmenu = ({ roof }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={i18n.t('roofMenu.Ceiling', lang)}>
      {/* roof-ceiling */}
      <RoofCeilingCheckbox roof={roof} />

      {roof.ceiling && (
        <>
          {/* divider */}
          <MenuDivider />

          {/* ceiling-r-value */}
          <DialogItem noPadding Dialog={CeilingRValueInput}>
            {i18n.t('roofMenu.CeilingRValue', lang)} ...
          </DialogItem>
        </>
      )}
    </ContextSubMenu>
  );
};

export default RoofCeilingSubmenu;
