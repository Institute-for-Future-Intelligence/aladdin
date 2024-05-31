/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { WindowModel, WindowType } from 'src/models/WindowModel';
import WindowNumberInput from './windowNumberInput';
import { useLanguage } from 'src/hooks';
import React, { useState } from 'react';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { MenuItem } from '../../menuItems';
import {
  WindowBooleanDialogSettings,
  WindowBooleanSelectionSettingType,
  WindowColorDialogSettings,
  WindowColorSelectionSettingType,
  WindowNumberDialogSettingType,
  WindowNumberDialogSettings,
  WindowOptionDialogSettings,
  WindowOptionSelectionSettingType,
} from './windowMenu';
import { ObjectType } from 'src/types';
import WindowColorSelection from './windowColorSelection';
import WindowBooleanSelection from './windowBooleanSelection';
import WindowOptionSelection from './windowOptionSelection';
import { Checkbox } from 'antd';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useSelectedElement } from '../menuHooks';
import { WindowBooleanData, WindowColorData, WindowNumberData, WindowOptionData } from './WindowPropertyTypes';

interface WindowMenuItemProps {
  window: WindowModel;
  children?: React.ReactNode;
}

interface WindowDialogItemProps<T> {
  dataType: T;
  noPadding?: boolean;
  children?: React.ReactNode;
}

export const WindowNumberDialogItem = ({ dataType, noPadding }: WindowDialogItemProps<WindowNumberData>) => {
  const lang = useLanguage();
  const [dialogVisible, setDialogVisible] = useState(false);

  const window = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const parent = window ? useStore.getState().getParent(window) : null;

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WindowNumberDialogSettings[dataType] as WindowNumberDialogSettingType;
  if (dataType === WindowNumberData.Width) {
    setting.range[1] =
      parent && window && window.parentType !== ObjectType.Roof
        ? 2 * parent.lx * Math.min(Math.abs(0.5 - window.cx), Math.abs(-0.5 - window.cx))
        : 100;
  } else if (dataType === WindowNumberData.Height) {
    setting.range[1] =
      parent && window && window.parentType !== ObjectType.Roof
        ? 2 * parent.lz * Math.min(Math.abs(0.5 - window.cz), Math.abs(-0.5 - window.cz))
        : 100;
  }

  return (
    <>
      <MenuItem noPadding={noPadding} onClick={handleClick}>
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </MenuItem>
      {dialogVisible && setting && window && (
        <WindowNumberInput
          windowModel={window}
          dataType={dataType}
          attributeKey={setting.attributeKey}
          range={setting.range}
          step={setting.step}
          unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
          note={setting.note ? i18n.t(setting.note, lang) : undefined}
          digit={setting.digit ?? 0}
          setDialogVisible={setDialogVisible}
        />
      )}
    </>
  );
};

export const WindowColorDialogItem = ({ dataType, noPadding }: WindowDialogItemProps<WindowColorData>) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const lang = useLanguage();

  const window = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WindowColorDialogSettings[dataType] as WindowColorSelectionSettingType;

  return (
    <>
      <MenuItem noPadding={noPadding} onClick={handleClick}>
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </MenuItem>
      {dialogVisible && setting && window && (
        <WindowColorSelection
          window={window}
          dataType={dataType}
          attributeKey={setting.attributeKey}
          setDialogVisible={() => setDialogVisible(false)}
        />
      )}
    </>
  );
};

export const WindowBooleanDialogItem = ({ dataType, noPadding }: WindowDialogItemProps<WindowBooleanData>) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const lang = useLanguage();

  const window = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WindowBooleanDialogSettings[dataType] as WindowBooleanSelectionSettingType;

  return (
    <>
      <MenuItem noPadding={noPadding} onClick={handleClick}>
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </MenuItem>
      {dialogVisible && setting && window && (
        <WindowBooleanSelection
          window={window}
          dataType={dataType}
          attributeKey={setting.attributeKey}
          setDialogVisible={() => setDialogVisible(false)}
        />
      )}
    </>
  );
};

export const WindowOptionDialogItem = ({ dataType, noPadding }: WindowDialogItemProps<WindowOptionData>) => {
  const lang = useLanguage();

  const [dialogVisible, setDialogVisible] = useState(false);

  const window = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  const setting = WindowOptionDialogSettings[dataType] as WindowOptionSelectionSettingType;

  return (
    <>
      <MenuItem noPadding={noPadding} onClick={handleClick}>
        {i18n.t(`windowMenu.${dataType}`, lang)} ...
      </MenuItem>
      {dialogVisible && setting && window && (
        <WindowOptionSelection
          window={window}
          dataType={dataType}
          attributeKey={setting.attributeKey}
          options={[WindowType.Default, WindowType.Arched, WindowType.Polygonal]}
          optionsText={[
            i18n.t('windowMenu.Default', lang),
            i18n.t('windowMenu.Arched', lang),
            i18n.t('windowMenu.Polygonal', lang),
          ]}
          setDialogVisible={() => setDialogVisible(false)}
        />
      )}
    </>
  );
};

export const WindowEmptyCheckbox = ({ window }: WindowMenuItemProps) => {
  const lang = useLanguage();

  const updateEmptyWindowById = (id: string, empty: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Window) {
          (e as WindowModel).empty = empty;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableCheck);
    updateEmptyWindowById(window.id, checked);
    useStore.getState().set((state) => {
      state.actionState.windowEmpty = checked;
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!window.empty} onChange={handleChange}>
        {i18n.t('windowMenu.Empty', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const WindowInteriorCheckbox = ({ window }: WindowMenuItemProps) => {
  const lang = useLanguage();

  const updateInteriorById = (id: string, interior: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Window) {
          (e as WindowModel).interior = interior;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableCheck);
    updateInteriorById(window.id, checked);
    useStore.getState().set((state) => {
      state.actionState.windowInterior = checked;
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!window.interior} onChange={handleChange}>
        {i18n.t('windowMenu.Interior', lang)}
      </Checkbox>
    </MenuItem>
  );
};
