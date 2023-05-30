/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import { WindowModel, WindowType } from '../../../models/WindowModel';
import { Checkbox, Divider, Menu, Radio } from 'antd';
import i18n from 'src/i18n/i18n';
import WindowShutterSubMenu from './windowShutterSubMenu';
import SubMenu from 'antd/lib/menu/SubMenu';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { ObjectType } from 'src/types';
import WindowItemSelection from './windowItemSelection';
import WindowNumberInput from './windowNumberInput';
import { radioStyle } from './wallMenu';
import { UndoableChange } from 'src/undo/UndoableChange';
import WindowUValueInput from './windowUValueInput';

export enum WindowDataType {
  Color = 'Color',
  Tint = 'Tint',
  Opacity = 'Opacity',
  MullionWidth = 'MullionWidth',
  MullionSpacing = 'MullionSpacing',
  MullionColor = 'MullionColor',
  FrameWidth = 'FrameWidth',
  SillWidth = 'SillWidth',
  Width = 'Width',
  Height = 'Height',
}

type ItemSelectionSettingType = {
  attributeKey: keyof WindowModel;
};

type NumberDialogSettingType = {
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
  note?: string;
  digit?: number;
};

const SelectionDialogSettings = {
  Tint: { attributeKey: 'tint' },
  Color: { attributeKey: 'color' },
  MullionColor: { attributeKey: 'mullionColor' },
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
  MullionWidth: { attributeKey: 'mullionWidth', range: [0, 0.2], step: 0.1, unit: 'word.MeterAbbreviation', digit: 1 },
  MullionSpacing: {
    attributeKey: 'mullionSpacing',
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

  const window = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Window),
  ) as WindowModel;

  if (!window) return null;

  const lang = { lng: language };
  const parent = window ? getParent(window) : null;

  const updateWindowMullionById = (id: string, mullion: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Window && e.id === id) {
          (e as WindowModel).mullion = mullion;
          state.selectedElement = e;
          break;
        }
      }
    });
  };

  const updateWindowTypeById = (id: string, type: WindowType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Window && e.id === id) {
          (e as WindowModel).windowType = type;
          state.selectedElement = e;
          break;
        }
      }
    });
  };

  const updateWindowFrameById = (id: string, checked: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WindowModel).frame = checked;
          break;
        }
      }
    });
  };

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
        <Menu.Item key={'mullion'}>
          <Checkbox
            checked={window.mullion}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Mullion',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: window.id,
                selectedElementType: window.type,
                undo: () => {
                  updateWindowMullionById(window.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateWindowMullionById(window.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateWindowMullionById(window.id, checked);
              setCommonStore((state) => {
                state.actionState.windowMullion = checked;
              });
            }}
          >
            {i18n.t('windowMenu.Mullion', { lng: language })}
          </Checkbox>
        </Menu.Item>

        <Divider plain style={{ margin: '6px' }} />

        {renderMenuItem(WindowDataType.MullionWidth)}
        {renderMenuItem(WindowDataType.MullionSpacing)}
        {renderMenuItem(WindowDataType.MullionColor)}
      </SubMenu>
    );
  };

  const renderFrameSubMenu = () => {
    if (!window) return null;

    return (
      <SubMenu key={'window-frame'} title={i18n.t('windowMenu.Frame', lang)} style={{ paddingLeft: '24px' }}>
        <Menu.Item key={'frame'}>
          <Checkbox
            checked={window.frame}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Frame',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: window.id,
                selectedElementType: window.type,
                undo: () => {
                  updateWindowFrameById(window.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateWindowFrameById(window.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateWindowFrameById(window.id, checked);
              setCommonStore((state) => {
                state.actionState.windowFrame = checked;
              });
            }}
          >
            {i18n.t('windowMenu.Frame', { lng: language })}
          </Checkbox>
        </Menu.Item>

        <Divider plain style={{ margin: '6px' }} />

        {renderMenuItem(WindowDataType.FrameWidth)}
        {renderMenuItem(WindowDataType.SillWidth)}
        {renderMenuItem(WindowDataType.Color)}
      </SubMenu>
    );
  };

  const renderTypeSubMenu = () => {
    if (!window) {
      return null;
    }
    return (
      <SubMenu key={'window-type'} title={i18n.t('windowMenu.WindowType', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={window.windowType ?? WindowType.Default}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Window Type',
              timestamp: Date.now(),
              oldValue: window.windowType,
              newValue: e.target.value,
              changedElementId: window.id,
              changedElementType: window.type,
              undo: () => {
                updateWindowTypeById(undoableChange.changedElementId, undoableChange.oldValue as WindowType);
              },
              redo: () => {
                updateWindowTypeById(undoableChange.changedElementId, undoableChange.newValue as WindowType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateWindowTypeById(window.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.windowType = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={WindowType.Default}>
            {i18n.t('windowMenu.Default', lang)}
          </Radio>
          <Radio style={radioStyle} value={WindowType.Arched}>
            {i18n.t('windowMenu.Arched', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderDialogs = () => {
    switch (dataType) {
      case WindowDataType.Tint:
      case WindowDataType.MullionColor:
      case WindowDataType.Color: {
        const setting = SelectionDialogSettings[dataType] as ItemSelectionSettingType;
        if (!setting) return null;
        return (
          <WindowItemSelection
            window={window!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            setDialogVisible={() => setDataType(null)}
          />
        );
      }
      case WindowDataType.Opacity:
      case WindowDataType.Width:
      case WindowDataType.Height:
      case WindowDataType.MullionSpacing:
      case WindowDataType.MullionWidth:
      case WindowDataType.SillWidth:
      case WindowDataType.FrameWidth: {
        const setting = NumberDialogSettings[dataType] as NumberDialogSettingType;
        if (dataType === WindowDataType.Width) {
          setting.range[1] =
            parent && window ? 2 * parent.lx * Math.min(Math.abs(0.5 - window.cx), Math.abs(-0.5 - window.cx)) : 100;
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
              }}
            >
              {i18n.t('windowMenu.Interior', lang)}
            </Checkbox>
          </Menu.Item>
          {renderMenuItem(WindowDataType.Width)}
          {renderMenuItem(WindowDataType.Height)}
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
          {renderTypeSubMenu()}
          {renderMullionSubMenu()}
          {renderFrameSubMenu()}
          <WindowShutterSubMenu windowId={window.id} />
          {renderDialogs()}
        </>
      )}
    </Menu.ItemGroup>
  );
});
