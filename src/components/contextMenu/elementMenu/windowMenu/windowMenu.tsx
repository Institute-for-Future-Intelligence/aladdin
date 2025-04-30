/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import {
  WindowColorDialogItem,
  WindowEmptyCheckbox,
  WindowInteriorCheckbox,
  WindowNumberDialogItem,
  WindowOptionDialogItem,
} from './windowMenuItems';
import i18n from 'src/i18n/i18n';
import WindowUValueInput from './windowUValueInput';
import { createWindowFrameSubmenu } from './windowFrameSubmenu';
import { createWindowMullionSubmenu } from './windowMullionSubmenu';
import { createWindowShutterSubmenu } from './windowShutterSubmenu';
import { WindowColorData, WindowNumberData, WindowOptionData } from './WindowPropertyTypes';
import WindowPermeabilityInput from './windowPermeabilityInput';

// TODO: This needs to be merged with WindowPropertyType
export enum WindowDataType {
  Color = 'Color',
  Tint = 'Tint',
  Opacity = 'Opacity',
  WindowType = 'WindowType',
  MullionWidth = 'MullionWidth',
  HorizontalMullionSpacing = 'HorizontalMullionSpacing',
  VerticalMullionSpacing = 'VerticalMullionSpacing',
  MullionColor = 'MullionColor',
  Frame = 'Frame',
  FrameWidth = 'FrameWidth',
  SillWidth = 'SillWidth',
  Width = 'Width',
  Height = 'Height',
}

export type WindowColorSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

export type WindowBooleanSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

export type WindowOptionSelectionSettingType = {
  attributeKey: keyof WindowModel;
  options: string[];
};

export type WindowNumberDialogSettingType = {
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
  note?: string;
  digit?: number;
};

export const WindowColorDialogSettings = {
  Tint: { attributeKey: 'tint' },
  Color: { attributeKey: 'color' },
  MullionColor: { attributeKey: 'mullionColor' },
  ShutterColor: { attributeKey: 'shutterColor' },
};

export const WindowBooleanDialogSettings = {
  HorizontalMullion: { attributeKey: 'horizontalMullion' },
  VerticalMullion: { attributeKey: 'verticalMullion' },
  Frame: { attributeKey: 'frame' },
  LeftShutter: { attributeKey: 'leftShutter' },
  RightShutter: { attributeKey: 'rightShutter' },
};

export const WindowOptionDialogSettings = {
  WindowType: {
    attributeKey: 'windowType',
    options: [WindowType.Default, WindowType.Arched, WindowType.Polygonal],
  },
};

export const WindowNumberDialogSettings = {
  Opacity: {
    attributeKey: 'opacity',
    range: [0, 0.9],
    step: 0.1,
    note: 'windowMenu.SolarHeatGainCoefficient',
    digit: 1,
  },
  Width: { attributeKey: 'lx', range: [0.1, 100], step: 0.1, unit: 'word.MeterAbbreviation', digit: 1 },
  Height: { attributeKey: 'lz', range: [0.1, 100], step: 0.1, unit: 'word.MeterAbbreviation', digit: 1 },
  Setback: {
    attributeKey: 'cy',
    range: [0, 1],
    step: 0.01,
    unit: '',
    digit: 0,
    note: 'windowMenu.RelativeToWallThickness',
  },
  MullionWidth: { attributeKey: 'mullionWidth', range: [0, 0.5], step: 0.1, unit: 'word.MeterAbbreviation', digit: 1 },
  ShutterWidth: { attributeKey: 'shutterWidth', range: [0, 0.5], step: 0.01, unit: '', digit: 1 },
  HorizontalMullionSpacing: {
    attributeKey: 'horizontalMullionSpacing',
    range: [0.1, 10],
    step: 0.01,
    unit: 'word.MeterAbbreviation',
    digit: 1,
  },
  VerticalMullionSpacing: {
    attributeKey: 'verticalMullionSpacing',
    range: [0.1, 10],
    step: 0.01,
    unit: 'word.MeterAbbreviation',
    digit: 1,
  },
  FrameWidth: { attributeKey: 'frameWidth', range: [0.05, 0.2], step: 0.01, unit: 'word.MeterAbbreviation', digit: 2 },
  SillWidth: { attributeKey: 'sillWidth', range: [0, 0.5], step: 0.01, unit: 'word.MeterAbbreviation', digit: 2 },
};

export const createWindowMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Window) return { items };

  const window = selectedElement as WindowModel;

  const editable = !window.locked;
  const lang = { lng: useStore.getState().language };

  // window-copy
  items.push({
    key: 'window-copy',
    label: <Copy />,
  });

  // window-cut
  if (editable) {
    items.push({
      key: 'window-cut',
      label: <Cut />,
    });
  }

  // window-lock
  items.push({
    key: 'window-lock',
    label: <Lock selectedElement={window} />,
  });

  if (editable) {
    items.push(
      {
        key: 'window-empty',
        label: <WindowEmptyCheckbox window={window} />,
      },
      {
        key: 'window-interior',
        label: <WindowInteriorCheckbox window={window} />,
      },
    );
  }

  if (editable) {
    items.push(
      // window-type
      {
        key: 'window-type',
        label: <WindowOptionDialogItem dataType={WindowOptionData.WindowType} />,
      },
      // window-width
      {
        key: 'window-width',
        label: <WindowNumberDialogItem dataType={WindowNumberData.Width} />,
      },
      // window-height
      {
        key: 'window-height',
        label: <WindowNumberDialogItem dataType={WindowNumberData.Height} />,
      },
      // window-setback
      {
        key: 'window-setback',
        label: <WindowNumberDialogItem dataType={WindowNumberData.Setback} />,
      },
      // window-opacity
      {
        key: 'window-opacity',
        label: <WindowNumberDialogItem dataType={WindowNumberData.Opacity} />,
      },
      // window-tint
      {
        key: 'window-tint',
        label: <WindowColorDialogItem dataType={WindowColorData.Tint} />,
      },
      // window-u-value
      {
        key: 'window-u-value',
        label: <DialogItem Dialog={WindowUValueInput}>{i18n.t('word.UValue', lang)} ...</DialogItem>,
      },
      // window-air-permeability
      {
        key: 'window-air-permeability',
        label: <DialogItem Dialog={WindowPermeabilityInput}>{i18n.t('word.AirPermeability', lang)} ...</DialogItem>,
      },
      // window-mullion-submenu
      {
        key: 'window-mullion-submenu',
        label: <MenuItem>{i18n.t('windowMenu.Mullion', lang)}</MenuItem>,
        children: createWindowMullionSubmenu(window),
      },
      // window-frame-submenu
      {
        key: 'window-frame-submenu',
        label: <MenuItem>{i18n.t('windowMenu.Frame', lang)}</MenuItem>,
        children: createWindowFrameSubmenu(window),
      },
      // window-shutter-submenu
      {
        key: 'window-shutter-submenu',
        label: <MenuItem>{i18n.t('windowMenu.Shutter', lang)}</MenuItem>,
        children: createWindowShutterSubmenu(window),
      },
    );
  }

  return { items } as MenuProps;
};
