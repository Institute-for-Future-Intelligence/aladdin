/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useLanguage } from '../../../../hooks';
import React, { useState } from 'react';
import { useStore } from '../../../../stores/common';
import { MenuItem } from '../../menuItems';
import i18n from '../../../../i18n/i18n';
import { ParapetNumberInputProps } from './wallParapetNumberInput';
import { ParapetArgs, WallModel } from '../../../../models/WallModel';
import { ParapetDataType } from './ParapetDataType';

type ParapetNumberDialogSettingType = {
  attributeKey: keyof ParapetArgs;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

interface NumberDialogItems {
  Dialog: (props: ParapetNumberInputProps) => JSX.Element;
  wall: WallModel;
  dataType: ParapetDataType.ParapetHeight | ParapetDataType.CopingsHeight | ParapetDataType.CopingsWidth;
  children?: React.ReactNode;
}

const NumberDialogSetting = {
  ParapetHeight: { attributeKey: 'parapetHeight', range: [0, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsHeight: { attributeKey: 'copingsHeight', range: [0, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsWidth: { attributeKey: 'copingsWidth', range: [0, 3], step: 0.01, unit: 'word.MeterAbbreviation' },
};

export const ParapetNumberDialogItem = ({ Dialog, wall, dataType, children }: NumberDialogItems) => {
  const lang = useLanguage();

  const [dialogVisible, setDialogVisible] = useState(false);
  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = NumberDialogSetting[dataType] as ParapetNumberDialogSettingType;

  return (
    <>
      <MenuItem noPadding onClick={handleClick}>
        {children}
      </MenuItem>
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
