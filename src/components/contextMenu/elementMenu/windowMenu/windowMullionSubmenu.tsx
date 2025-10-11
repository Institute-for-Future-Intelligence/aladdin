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

const WindowMullionSubmenu = ({ window }: Props) => {
  const lang = useLanguage();

  return (
    <ContextSubMenu label={t('windowMenu.Mullion', lang)}>
      {/* window-horizontal-mullion */}
      <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.HorizontalMullion} />

      {/* window-vertical-mullion */}
      <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.VerticalMullion} />

      {(window.horizontalMullion || window.verticalMullion) && (
        <>
          {/* divider */}
          <MenuDivider />

          {/* window-mullion-width */}
          <WindowNumberDialogItem noPadding dataType={WindowNumberData.MullionWidth} />

          {/* window-mullion-color */}
          <WindowColorDialogItem noPadding dataType={WindowColorData.MullionColor} />

          {window.horizontalMullion && (
            <>
              {/* window-horizontal-mullion-spacing */}
              <WindowNumberDialogItem noPadding dataType={WindowNumberData.HorizontalMullionSpacing} />
            </>
          )}

          {window.verticalMullion && (
            <>
              {/* window-vertical-mullion-spacing */}
              <WindowNumberDialogItem noPadding dataType={WindowNumberData.VerticalMullionSpacing} />
            </>
          )}
        </>
      )}
    </ContextSubMenu>
  );
};

export default WindowMullionSubmenu;
