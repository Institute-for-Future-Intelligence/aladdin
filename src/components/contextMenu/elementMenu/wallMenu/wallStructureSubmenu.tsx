/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { WallStructureRadioGroup } from './wallMenuItems';
import WallNumberInput from './wallNumberInput';
import { WallNumberDialogItem } from './wallNumberDialogItem';
import { ContextSubMenu, DialogItem } from '../../menuItems';
import WallStructureColorSelection from './wallStructureColorSelection';
import { WallNumberDataType } from './WallNumberDataType';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  wall: WallModel;
}

const WallStructureSubmenu = ({ wall }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={i18n.t('wallMenu.WallStructure', lang)}>
      <WallStructureRadioGroup wall={wall} />

      {wall.wallStructure !== WallStructure.Default && (
        <>
          <MenuDivider />

          {/* wall-structure-spacing */}
          <WallNumberDialogItem noPadding dataType={WallNumberDataType.StructureSpacing} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.StructureSpacing}`, lang)} ...
          </WallNumberDialogItem>

          {/* wall-structure-width */}
          <WallNumberDialogItem noPadding dataType={WallNumberDataType.StructureWidth} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.StructureWidth}`, lang)} ...
          </WallNumberDialogItem>

          {/* wall-structure-color */}
          <DialogItem noPadding Dialog={WallStructureColorSelection}>
            {i18n.t(`wallMenu.StructureColor`, lang)} ...
          </DialogItem>
        </>
      )}
    </ContextSubMenu>
  );
};

export default WallStructureSubmenu;
