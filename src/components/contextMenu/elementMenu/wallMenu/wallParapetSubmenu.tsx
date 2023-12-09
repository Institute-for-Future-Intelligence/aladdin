/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { ParapetArgs, WallModel } from 'src/models/WallModel';
import { ParapetCheckbox } from './wallMenuItems';
import { DialogItem, MenuItem } from '../../menuItems';
import WallParapetColorSelection from './wallParapetColorSelection';
import WallParapetTextureSelection from './wallParapetTextureSelection';
import { useState } from 'react';
import ParapetNumberInput, { ParapetNumberInputProps } from './wallParapetNumberInput';
import { useLanguage } from 'src/views/hooks';

interface NumberDialogItems {
  Dialog: (props: ParapetNumberInputProps) => JSX.Element;
  wall: WallModel;
  dataType: DataType.ParapetHeight | DataType.CopingsHeight | DataType.CopingsWidth;
  children?: React.ReactNode;
}

enum DataType {
  ParapetHeight = 'ParapetHeight',
  CopingsHeight = 'CopingsHeight',
  CopingsWidth = 'CopingsWidth',
}

type ParapetNumberDialogSettingType = {
  attributeKey: keyof ParapetArgs;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

const NumberDialogSetting = {
  ParapetHeight: { attributeKey: 'parapetHeight', range: [0, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsHeight: { attributeKey: 'copingsHeight', range: [0, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsWidth: { attributeKey: 'copingsWidth', range: [0, 3], step: 0.01, unit: 'word.MeterAbbreviation' },
};

const ParapetNumberDialogItem = ({ Dialog, wall, dataType, children }: NumberDialogItems) => {
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

export const createParapetSubmenu = (wall: WallModel) => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [];
  items.push({
    key: 'parapet-checkbox',
    label: <ParapetCheckbox wall={wall} />,
  });

  if (wall.parapet.display) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'parapet-color',
        label: (
          <DialogItem noPadding Dialog={WallParapetColorSelection}>
            {i18n.t(`wallMenu.ParapetColor`, lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parapet-texture',
        label: (
          <DialogItem noPadding Dialog={WallParapetTextureSelection}>
            {i18n.t(`wallMenu.ParapetTexture`, lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parapet-height',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={DataType.ParapetHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.ParapetHeight`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
      {
        key: 'copings-height',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={DataType.CopingsHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsHeight`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
      {
        key: 'copings-width',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={DataType.CopingsWidth} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsWidth`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
    );
  }

  return items;
};
