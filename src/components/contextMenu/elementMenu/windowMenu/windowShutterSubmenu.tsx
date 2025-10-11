/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { WindowBooleanDialogItem, WindowColorDialogItem, WindowNumberDialogItem } from './windowMenuItems';
import { WindowModel } from 'src/models/WindowModel';
import { WindowBooleanData, WindowColorData, WindowNumberData } from './WindowPropertyTypes';
import { useLanguage } from 'src/hooks';
import { ContextSubMenu } from '../../menuItems';
import { t } from 'i18next';
import { MenuDivider } from '@szhsin/react-menu';

interface Props {
  window: WindowModel;
}

const WindowShutterSubmenu = ({ window }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={t('windowMenu.Shutter', lang)}>
      {/* window-left-shutter */}
      <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.LeftShutter} />

      {/* window-right-shutter */}
      <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.RightShutter} />

      {(window.leftShutter || window.rightShutter) && (
        <>
          {/* divider */}
          <MenuDivider />

          {/* window-shutter-color */}
          <WindowColorDialogItem noPadding dataType={WindowColorData.ShutterColor} />

          {/* window-shutter-width */}
          <WindowNumberDialogItem noPadding dataType={WindowNumberData.ShutterWidth} />
        </>
      )}
    </ContextSubMenu>
  );
};

export default WindowShutterSubmenu;
