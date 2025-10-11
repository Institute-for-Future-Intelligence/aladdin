/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { WindowModel, WindowType } from 'src/models/WindowModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import {
  WindowColorDialogItem,
  WindowEmptyCheckbox,
  WindowInteriorCheckbox,
  WindowNumberDialogItem,
  WindowOptionDialogItem,
} from './windowMenuItems';
import i18n from 'src/i18n/i18n';
import WindowUValueInput from './windowUValueInput';
import WindowFrameSubmenu from './windowFrameSubmenu';
import WindowMullionSubmenu from './windowMullionSubmenu';
import { WindowColorData, WindowNumberData, WindowOptionData } from './WindowPropertyTypes';
import WindowPermeabilityInput from './windowPermeabilityInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';
import WindowShutterSubmenu from './windowShutterSubmenu';

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

const WindowMenu = () => {
  const lang = useLanguage();
  const window = useContextMenuElement(ObjectType.Window) as WindowModel;
  if (!window) return null;

  const editable = !window.locked;

  return (
    <>
      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={window} />

      {editable && (
        <>
          {/* window-empty */}
          <WindowEmptyCheckbox window={window} />

          {/* window-interior */}
          <WindowInteriorCheckbox window={window} />

          {editable && (
            <>
              {/* window-type */}
              <WindowOptionDialogItem dataType={WindowOptionData.WindowType} />

              {/* window-width */}
              <WindowNumberDialogItem dataType={WindowNumberData.Width} />

              {/* window-height */}
              <WindowNumberDialogItem dataType={WindowNumberData.Height} />

              {/* window-setback */}
              <WindowNumberDialogItem dataType={WindowNumberData.Setback} />

              {/* window-opacity */}
              <WindowNumberDialogItem dataType={WindowNumberData.Opacity} />

              {/* window-tint */}
              <WindowColorDialogItem dataType={WindowColorData.Tint} />

              {/* window-u-value */}
              <DialogItem Dialog={WindowUValueInput}>{i18n.t('word.UValue', lang)} ...</DialogItem>

              {/* window-air-permeability */}
              <DialogItem Dialog={WindowPermeabilityInput}>{i18n.t('word.AirPermeability', lang)} ...</DialogItem>

              {/* window-mullion-submenu */}
              <WindowMullionSubmenu window={window} />

              {/* window-frame-submenu */}
              <WindowFrameSubmenu window={window} />

              {/* window-shutter-submenu */}
              <WindowShutterSubmenu window={window} />
            </>
          )}
        </>
      )}
    </>
  );
};

export default WindowMenu;
