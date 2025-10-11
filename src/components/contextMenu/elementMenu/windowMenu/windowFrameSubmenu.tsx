/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { WindowBooleanDialogItem, WindowColorDialogItem, WindowNumberDialogItem } from './windowMenuItems';
import { WindowModel } from 'src/models/WindowModel';
import { WindowBooleanData, WindowColorData, WindowNumberData } from './WindowPropertyTypes';
import { ContextSubMenu } from '../../menuItems';
import { t } from 'i18next';
import { useLanguage } from 'src/hooks';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  window: WindowModel;
}

const WindowFrameSubmenu = ({ window }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={t('windowMenu.Frame', lang)}>
      {/* window-frame-boolean */}
      <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.Frame} />

      {window.frame && (
        <>
          {/* divider */}
          <MenuDivider />

          {/* window-frame-width */}
          <WindowNumberDialogItem noPadding dataType={WindowNumberData.FrameWidth} />

          {/* window-sill-width */}
          <WindowNumberDialogItem noPadding dataType={WindowNumberData.SillWidth} />

          {/* window-frame-color */}
          <WindowColorDialogItem noPadding dataType={WindowColorData.Color} />
        </>
      )}
    </ContextSubMenu>
  );
};

export default WindowFrameSubmenu;
