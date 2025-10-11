/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { WallFill, WallModel } from 'src/models/WallModel';
import { WallOpenToOutsideCheckbox, WallFillRadioGroup } from './wallMenuItems';
import { ContextSubMenu } from '../../menuItems';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  wall: WallModel;
}

const WallFillSubmenu = ({ wall }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={i18n.t('wallMenu.Fill', lang)}>
      <WallFillRadioGroup wall={wall} />
      {wall.fill !== WallFill.Full && (
        <>
          <MenuDivider />
          <WallOpenToOutsideCheckbox wall={wall} />
        </>
      )}
    </ContextSubMenu>
  );
};

export default WallFillSubmenu;
