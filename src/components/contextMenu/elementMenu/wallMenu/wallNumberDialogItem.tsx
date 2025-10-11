/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { WallNumberInputProps } from './wallNumberInput';
import { WallModel } from 'src/models/WallModel';
import { useLanguage } from 'src/hooks';
import { useStore } from 'src/stores/common';
import { ContextMenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { WallNumberDialogSettingType, WallNumberDialogSettings } from './wallMenu';
import { useSelectedElement } from '../menuHooks';
import { ObjectType } from 'src/types';
import { WallNumberDataType } from './WallNumberDataType';

interface WallNumberDialogItemsProps {
  Dialog: (props: WallNumberInputProps) => JSX.Element;
  noPadding?: boolean;
  dataType: WallNumberDataType;
  children?: React.ReactNode;
}

export const WallNumberDialogItem = ({ Dialog, noPadding, dataType, children }: WallNumberDialogItemsProps) => {
  const lang = useLanguage();

  const [dialogVisible, setDialogVisible] = useState(false);

  const wall = useSelectedElement(ObjectType.Wall) as WallModel | undefined;

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WallNumberDialogSettings[dataType] as WallNumberDialogSettingType;

  return (
    <>
      <ContextMenuItem noPadding={noPadding} onClick={handleClick}>
        {children}
      </ContextMenuItem>
      {dialogVisible && wall && (
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
