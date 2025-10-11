/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { WallModel } from 'src/models/WallModel';
import { ParapetCheckbox } from './wallMenuItems';
import { ContextSubMenu, DialogItem } from '../../menuItems';
import WallParapetColorSelection from './wallParapetColorSelection';
import WallParapetTextureSelection from './wallParapetTextureSelection';
import ParapetNumberInput from './wallParapetNumberInput';
import { ParapetDataType } from './ParapetDataType';
import { ParapetNumberDialogItem } from './parapetNumberDialogItem';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  wall: WallModel;
}

const ParapetSubmenu = ({ wall }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={i18n.t('wallMenu.Parapet', lang)}>
      <ParapetCheckbox wall={wall} />

      {wall.parapet.display && (
        <>
          <MenuDivider />

          {/* parapet-color */}
          <DialogItem noPadding Dialog={WallParapetColorSelection}>
            {i18n.t(`wallMenu.ParapetColor`, lang)} ...
          </DialogItem>

          {/* parapet-texture */}
          <DialogItem noPadding Dialog={WallParapetTextureSelection}>
            {i18n.t(`wallMenu.ParapetTexture`, lang)} ...
          </DialogItem>

          {/* parapet-height */}
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.ParapetHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.ParapetHeight`, lang)} ...
          </ParapetNumberDialogItem>

          {/* copings-height */}
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.CopingsHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsHeight`, lang)} ...
          </ParapetNumberDialogItem>

          {/* copings-width */}
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.CopingsWidth} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsWidth`, lang)} ...
          </ParapetNumberDialogItem>
        </>
      )}
    </ContextSubMenu>
  );
};

export default ParapetSubmenu;
