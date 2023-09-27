/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel, WindowType } from '../../../models/WindowModel';
import { Checkbox, Divider, Menu } from 'antd';
import i18n from 'src/i18n/i18n';
import SubMenu from 'antd/lib/menu/SubMenu';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from 'src/types';
import WindowColorSelection from './windowColorSelection';
import WindowNumberInput from './windowNumberInput';
import WindowUValueInput from './windowUValueInput';
import { useSelectedElement } from './menuHooks';
import WindowOptionSelection from './windowOptionSelection';
import WindowBooleanSelection from './windowBooleanSelection';

export enum WindowDataType {
  Color = 'Color',
  Tint = 'Tint',
  Opacity = 'Opacity',
  WindowType = 'WindowType',
  HorizontalMullion = 'HorizontalMullion',
  VerticalMullion = 'VerticalMullion',
  MullionWidth = 'MullionWidth',
  HorizontalMullionSpacing = 'HorizontalMullionSpacing',
  VerticalMullionSpacing = 'VerticalMullionSpacing',
  MullionColor = 'MullionColor',
  Frame = 'Frame',
  FrameWidth = 'FrameWidth',
  SillWidth = 'SillWidth',
  Width = 'Width',
  Height = 'Height',
  Setback = 'Setback',
  LeftShutter = 'LeftShutter',
  RightShutter = 'RightShutter',
  ShutterColor = 'ShutterColor',
  ShutterWidth = 'ShutterWidth',
}

type ColorSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

type BooleanSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

type OptionSelectionSettingType = {
  attributeKey: keyof WindowModel;
  options: string[];
};

type NumberDialogSettingType = {
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
  note?: string;
  digit?: number;
};

const ColorDialogSettings = {
  Tint: { attributeKey: 'tint' },
  Color: { attributeKey: 'color' },
  MullionColor: { attributeKey: 'mullionColor' },
  ShutterColor: { attributeKey: 'shutterColor' },
};

const BooleanDialogSettings = {
  HorizontalMullion: { attributeKey: 'horizontalMullion' },
  VerticalMullion: { attributeKey: 'verticalMullion' },
  Frame: { attributeKey: 'frame' },
  LeftShutter: { attributeKey: 'leftShutter' },
  RightShutter: { attributeKey: 'rightShutter' },
};

const OptionDialogSettings = {
  WindowType: {
    attributeKey: 'windowType',
    options: [WindowType.Default, WindowType.Arched, WindowType.Polygonal],
  },
};

const NumberDialogSettings = {
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
  MullionWidth: { attributeKey: 'mullionWidth', range: [0, 0.2], step: 0.1, unit: 'word.MeterAbbreviation', digit: 1 },
  ShutterWidth: { attributeKey: 'shutterWidth', range: [0, 0.5], step: 0.01, unit: '', digit: 1 },
  HorizontalMullionSpacing: {
    attributeKey: 'horizontalMullionSpacing',
    range: [0.1, 5],
    step: 0.01,
    unit: 'word.MeterAbbreviation',
    digit: 1,
  },
  VerticalMullionSpacing: {
    attributeKey: 'verticalMullionSpacing',
    range: [0.1, 5],
    step: 0.01,
    unit: 'word.MeterAbbreviation',
    digit: 1,
  },
  FrameWidth: { attributeKey: 'frameWidth', range: [0.05, 0.2], step: 0.01, unit: 'word.MeterAbbreviation', digit: 2 },
  SillWidth: { attributeKey: 'sillWidth', range: [0, 0.5], step: 0.01, unit: 'word.MeterAbbreviation', digit: 2 },
};

export const WindowMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getParent = useStore(Selector.getParent);

  const [dataType, setDataType] = useState<WindowDataType | null>(null);
  const [uValueDialogVisible, setUValueDialogVisible] = useState(false);

  const window = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  if (!window) return null;

  const lang = { lng: language };
  const parent = window ? getParent(window) : null;

  const updateEmptyWindowById = (id: string, empty: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Window) {
          (e as WindowModel).empty = empty;
          break;
        }
      }
    });
  };

  const updateInteriorById = (id: string, interior: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Window) {
          (e as WindowModel).interior = interior;
          break;
        }
      }
    });
  };

  const renderCut = () => {
    if (!window || window.locked) {
      return null;
    }
    return <Cut keyName={'window-cut'} />;
  };

  const renderMenuItem = (dataType: WindowDataType) => {
    return (
      <Menu.Item
        key={`window-${dataType}`}
        style={{ paddingLeft: '36px' }}
        onClick={() => {
          setApplyCount(0);
          setDataType(dataType);
        }}
      >
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </Menu.Item>
    );
  };

  const renderMullionSubMenu = () => {
    if (!window) return null;
    return (
      <SubMenu key={'window-mullion'} title={i18n.t('windowMenu.Mullion', lang)} style={{ paddingLeft: '24px' }}>
        {renderMenuItem(WindowDataType.HorizontalMullion)}
        {renderMenuItem(WindowDataType.VerticalMullion)}
        <Divider plain style={{ margin: '6px' }} />
        {renderMenuItem(WindowDataType.HorizontalMullionSpacing)}
        {renderMenuItem(WindowDataType.VerticalMullionSpacing)}
        {renderMenuItem(WindowDataType.MullionWidth)}
        {renderMenuItem(WindowDataType.MullionColor)}
      </SubMenu>
    );
  };

  const renderFrameSubMenu = () => {
    if (!window) return null;
    return (
      <SubMenu key={'window-frame'} title={i18n.t('windowMenu.Frame', lang)} style={{ paddingLeft: '24px' }}>
        {renderMenuItem(WindowDataType.Frame)}
        <Divider plain style={{ margin: '6px' }} />
        {renderMenuItem(WindowDataType.FrameWidth)}
        {renderMenuItem(WindowDataType.SillWidth)}
        {renderMenuItem(WindowDataType.Color)}
      </SubMenu>
    );
  };

  const renderShutterSubMenu = () => {
    if (!window) return null;
    return (
      <SubMenu key={'window-shutter'} title={i18n.t('windowMenu.Shutter', lang)} style={{ paddingLeft: '24px' }}>
        {renderMenuItem(WindowDataType.LeftShutter)}
        {renderMenuItem(WindowDataType.RightShutter)}
        {renderMenuItem(WindowDataType.ShutterColor)}
        {renderMenuItem(WindowDataType.ShutterWidth)}
      </SubMenu>
    );
  };

  const renderDialogs = () => {
    switch (dataType) {
      case WindowDataType.Frame:
      case WindowDataType.LeftShutter:
      case WindowDataType.RightShutter:
      case WindowDataType.HorizontalMullion:
      case WindowDataType.VerticalMullion: {
        const setting = BooleanDialogSettings[dataType] as BooleanSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowBooleanSelection
            window={window!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            setDialogVisible={() => setDataType(null)}
          />
        );
      }
      case WindowDataType.Tint:
      case WindowDataType.MullionColor:
      case WindowDataType.ShutterColor:
      case WindowDataType.Color: {
        const setting = ColorDialogSettings[dataType] as ColorSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowColorSelection
            window={window!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            setDialogVisible={() => setDataType(null)}
          />
        );
      }
      case WindowDataType.WindowType: {
        const setting = OptionDialogSettings[dataType] as OptionSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowOptionSelection
            window={window!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            options={[WindowType.Default, WindowType.Arched, WindowType.Polygonal]}
            optionsText={[
              i18n.t('windowMenu.Default', lang),
              i18n.t('windowMenu.Arched', lang),
              i18n.t('windowMenu.Polygonal', lang),
            ]}
            setDialogVisible={() => setDataType(null)}
          />
        );
      }
      case WindowDataType.Opacity:
      case WindowDataType.Width:
      case WindowDataType.Height:
      case WindowDataType.Setback:
      case WindowDataType.HorizontalMullionSpacing:
      case WindowDataType.VerticalMullionSpacing:
      case WindowDataType.MullionWidth:
      case WindowDataType.SillWidth:
      case WindowDataType.ShutterWidth:
      case WindowDataType.FrameWidth: {
        const setting = NumberDialogSettings[dataType] as NumberDialogSettingType;
        if (dataType === WindowDataType.Width) {
          setting.range[1] =
            parent && window && window.parentType !== ObjectType.Roof
              ? 2 * parent.lx * Math.min(Math.abs(0.5 - window.cx), Math.abs(-0.5 - window.cx))
              : 100;
        } else if (dataType === WindowDataType.Height) {
          setting.range[1] =
            parent && window && window.parentType !== ObjectType.Roof
              ? 2 * parent.lz * Math.min(Math.abs(0.5 - window.cz), Math.abs(-0.5 - window.cz))
              : 100;
        }
        if (!setting) return null;
        return (
          <WindowNumberInput
            windowModel={window!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            range={setting.range}
            step={setting.step}
            setDialogVisible={() => setDataType(null)}
            unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
            note={setting.note ? i18n.t(setting.note, lang) : undefined}
            digit={setting.digit ?? 0}
          />
        );
      }
    }
  };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'window-copy'} />
      {renderCut()}
      <Lock keyName={'window-lock'} />

      {!window.locked && (
        <>
          <Menu.Item key={'window-empty'}>
            <Checkbox
              checked={!!window.empty}
              onChange={(e) => {
                const checked = e.target.checked;
                const undoableCheck = {
                  name: 'Empty Window',
                  timestamp: Date.now(),
                  checked: checked,
                  selectedElementId: window.id,
                  selectedElementType: window.type,
                  undo: () => {
                    updateEmptyWindowById(window.id, !undoableCheck.checked);
                  },
                  redo: () => {
                    updateEmptyWindowById(window.id, undoableCheck.checked);
                  },
                } as UndoableCheck;
                addUndoable(undoableCheck);
                updateEmptyWindowById(window.id, checked);
                setCommonStore((state) => {
                  state.actionState.windowEmpty = checked;
                });
              }}
            >
              {i18n.t('windowMenu.Empty', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item style={{ paddingLeft: '10px' }}>
            <Checkbox
              checked={!!window.interior}
              onChange={(e) => {
                const checked = e.target.checked;
                const undoableCheck = {
                  name: 'Interior Window',
                  timestamp: Date.now(),
                  checked: checked,
                  selectedElementId: window.id,
                  selectedElementType: window.type,
                  undo: () => {
                    updateInteriorById(window.id, !undoableCheck.checked);
                  },
                  redo: () => {
                    updateInteriorById(window.id, undoableCheck.checked);
                  },
                } as UndoableCheck;
                addUndoable(undoableCheck);
                updateInteriorById(window.id, checked);
                setCommonStore((state) => {
                  state.actionState.windowInterior = checked;
                });
              }}
            >
              {i18n.t('windowMenu.Interior', lang)}
            </Checkbox>
          </Menu.Item>
          {renderMenuItem(WindowDataType.WindowType)}
          {renderMenuItem(WindowDataType.Width)}
          {renderMenuItem(WindowDataType.Height)}
          {renderMenuItem(WindowDataType.Setback)}
          {renderMenuItem(WindowDataType.Opacity)}
          {renderMenuItem(WindowDataType.Tint)}
          {/* u-value has its special UI */}
          {uValueDialogVisible && <WindowUValueInput setDialogVisible={setUValueDialogVisible} />}
          <Menu.Item
            key={'window-u-value'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setUValueDialogVisible(true);
            }}
          >
            {i18n.t('word.UValue', lang)} ...
          </Menu.Item>
          {renderMullionSubMenu()}
          {renderFrameSubMenu()}
          {renderShutterSubMenu()}
          {renderDialogs()}
        </>
      )}
    </Menu.ItemGroup>
  );
});
