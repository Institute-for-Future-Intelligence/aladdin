/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useState } from 'react';
import { WallNumberInputProps } from './wallNumberInput';
import { WallModel } from 'src/models/WallModel';
import { useLanguage } from 'src/views/hooks';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { WallNumberDialogSettingType, WallNumberDialogSettings } from './wallMenu';

export enum WallNumberDataType {
  Height = 'Height',
  Opacity = 'Opacity',
  StructureSpacing = 'StructureSpacing',
  StructureWidth = 'StructureWidth',
  Thickness = 'Thickness',
  EavesLength = 'EavesLength',
}

interface WallNumberDialogItemsProps {
  Dialog: (props: WallNumberInputProps) => JSX.Element;
  wall: WallModel;
  dataType: WallNumberDataType;
  children?: React.ReactNode;
}

export const WallNumberDialogItem = ({ Dialog, wall, dataType, children }: WallNumberDialogItemsProps) => {
  const lang = useLanguage();

  const [dialogVisible, setDialogVisible] = useState(false);
  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WallNumberDialogSettings[dataType] as WallNumberDialogSettingType;

  return (
    <>
      <MenuItem onClick={handleClick}>{children}</MenuItem>
      {dialogVisible && (
        <Dialog
          wall={wall}
          dataType={dataType}
          attributeKey={setting.attributeKey}
          range={setting.range}
          step={setting.step}
          unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
          setDialogVisible={setDialogVisible}
        />
      )}
    </>
  );
};
