/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, Slider, Space, Switch } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { UndoableDelete } from '../../undo/UndoableDelete';
import { UndoablePaste } from '../../undo/UndoablePaste';
import { UndoableCheck } from '../../undo/UndoableCheck';
import { ActionInfo, ObjectType, SolarCollector } from '../../types';
import { showError, showInfo } from 'src/helpers';
import { WallModel } from 'src/models/WallModel';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage } from 'src/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ElementModel } from 'src/models/ElementModel';
import { GroupableModel, isGroupable } from 'src/models/Groupable';
import { LightModel } from 'src/models/LightModel';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { ClickEvent, EventHandler, MenuItem, SubMenu, SubMenuProps } from '@szhsin/react-menu';
import { LabelMark } from '../mainMenu/mainMenuItems';

interface MenuItemProps {
  noPadding?: boolean;
  stayAfterClick?: boolean;
  fontWeight?: string;
  textSelectable?: boolean;
  update?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

interface DialogItemProps {
  Dialog: (props: { setDialogVisible: (b: boolean) => void }) => JSX.Element | null;
  noPadding?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

interface GroupMasterCheckboxProps {
  groupableElement: GroupableModel;
}

interface LightSideItemProps {
  element: ElementModel;
  inside: boolean;
  children?: React.ReactNode;
}

interface SolarCollectorSunBeamCheckboxProps {
  solarCollector: SolarCollector;
  forModelTree?: boolean;
}

interface CheckboxMenuItemProps {
  checked: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

interface SliderMenuItemProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  children?: React.ReactNode;
}

interface EditAbleIdProps {
  element: BatteryStorageModel;
}

interface MainMenuItemProps {
  noPadding?: boolean;
  stayAfterClick?: boolean;
  onClick?: EventHandler<ClickEvent>;
  children?: React.ReactNode;
}

interface ContextSubMenu {
  noPadding?: boolean;
}

export const ContextMenuItem = ({ noPadding, stayAfterClick, onClick, children }: MainMenuItemProps) => {
  return (
    <MenuItem
      style={{ paddingLeft: noPadding ? '12px' : '36px', paddingRight: '12px' }}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (stayAfterClick) e.keepOpen = true;
      }}
    >
      <span style={{ width: '100%', textAlign: 'start' }}>{children}</span>
    </MenuItem>
  );
};

export const ContextSubMenu = (props: SubMenuProps & ContextSubMenu) => {
  let className = 'context-menu-submenu-item';
  if (props.noPadding) {
    className += ' context-menu-submenu-item-no-padding';
  }
  return (
    <SubMenu
      {...props}
      itemProps={{ className }}
      menuStyle={{ minWidth: '5rem', padding: '2px', borderRadius: '0.35rem' }}
    />
  );
};

export const Paste = () => {
  const setCommonStore = useStore(Selector.set);
  const pasteElements = useStore(Selector.pasteElementsToPoint);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const removeElementById = useStore(Selector.removeElementById);
  const lang = useLanguage();

  const isMac = Util.isMac();

  const paste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const pastedElements = pasteElements();
      if (pastedElements.length > 0) {
        const undoablePaste = {
          name: 'Paste to Point',
          timestamp: Date.now(),
          pastedElements: pastedElements.map((m) => ({ ...m })),
          undo: () => {
            for (const elem of undoablePaste.pastedElements) {
              removeElementById(elem.id, false);
            }
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(...undoablePaste.pastedElements);
              state.selectedElement = undoablePaste.pastedElements[0];
              state.updateElementOnRoofFlag = true;
            });
          },
        } as UndoablePaste;
        useStore.getState().addUndoable(undoablePaste);
      }
    }
  };

  return (
    <ContextMenuItem onClick={paste}>
      {i18n.t('word.Paste', lang)}
      <LabelMark>({isMac ? '⌘' : 'Ctrl'}+V)</LabelMark>
    </ContextMenuItem>
  );
};

export const Copy = () => {
  const setCommonStore = useStore(Selector.set);
  const copyElementById = useStore(Selector.copyElementById);
  const loggable = useStore(Selector.loggable);
  const lang = useLanguage();
  const isMac = Util.isMac();

  const copyElement = () => {
    const selectedElement = useStore.getState().selectedElement;
    if (!selectedElement) return;
    copyElementById(selectedElement.id);
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Copy',
          timestamp: new Date().getTime(),
          elementId: selectedElement.id,
          elementType: selectedElement.type,
        } as ActionInfo;
      });
    }
  };

  return (
    <ContextMenuItem onClick={copyElement}>
      {i18n.t('word.Copy', lang)}
      <LabelMark>({isMac ? '⌘' : 'Ctrl'}+C)</LabelMark>
    </ContextMenuItem>
  );
};

export const Cut = () => {
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const isMac = Util.isMac();
  const lang = useLanguage();

  const cut = () => {
    const selectedElement = useStore.getState().selectedElement;
    if (!selectedElement || selectedElement.type === ObjectType.Roof) return;
    if (selectedElement.locked) {
      showInfo(i18n.t('message.ThisElementIsLocked', lang));
    } else {
      const cutElements = removeElementById(selectedElement.id, true);
      if (cutElements.length === 0) return;

      if (Util.isElementTriggerAutoDeletion(cutElements[0])) {
        useRefStore.getState().setListenToAutoDeletionByCut(true);
        usePrimitiveStore.getState().setPrimitiveStore('selectedElementId', selectedElement.id);
      } else {
        const undoableCut = {
          name: 'Cut',
          timestamp: Date.now(),
          deletedElements: cutElements,
          selectedElementId: selectedElement.id,
          undo: () => {
            const cutElements = undoableCut.deletedElements;
            if (cutElements.length === 0) return;

            const selectedElement = cutElements.find((e) => e.id === undoableCut.selectedElementId);
            if (!selectedElement) return;

            setCommonStore((state) => {
              for (const e of cutElements) {
                state.elements.push(e);
              }
              if (selectedElement.type === ObjectType.Wall) {
                const wall = selectedElement as WallModel;
                let leftWallId: string | null = null;
                let rightWallId: string | null = null;
                if (wall.leftJoints.length > 0) {
                  leftWallId = wall.leftJoints[0];
                }
                if (wall.rightJoints.length > 0) {
                  rightWallId = wall.rightJoints[0];
                }
                if (leftWallId || rightWallId) {
                  for (const e of state.elements) {
                    if (e.id === leftWallId && e.type === ObjectType.Wall) {
                      (e as WallModel).rightJoints[0] = wall.id;
                    }
                    if (e.id === rightWallId && e.type === ObjectType.Wall) {
                      (e as WallModel).leftJoints[0] = wall.id;
                    }
                  }
                }
              }
            });
          },
          redo: () => {
            if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
              removeElementById(undoableCut.deletedElements[0].id, true);
            }
          },
        } as UndoableDelete;
        useStore.getState().addUndoable(undoableCut);
      }
    }
  };

  return (
    <ContextMenuItem onClick={cut}>
      {i18n.t('word.Cut', lang)}
      <LabelMark>({isMac ? '⌘' : 'Ctrl'}+X)</LabelMark>
    </ContextMenuItem>
  );
};

export const Lock = ({ selectedElement }: { selectedElement: ElementModel }) => {
  const lang = useLanguage();
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const addUndoable = useStore(Selector.addUndoable);

  const lockElement = (on: boolean) => {
    if (!selectedElement) return;
    updateElementLockById(selectedElement.id, on);
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Lock',
      timestamp: Date.now(),
      checked: checked,
      selectedElementId: selectedElement?.id,
      selectedElementType: selectedElement?.type,
      undo: () => {
        lockElement(!undoableCheck.checked);
      },
      redo: () => {
        lockElement(undoableCheck.checked);
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    lockElement(checked);
  };

  return (
    <ContextMenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={selectedElement.locked} onChange={onChange}>
        {i18n.t('word.Lock', lang)}
      </Checkbox>
    </ContextMenuItem>
  );
};

export const AntdMenuItem: React.FC<MenuItemProps> = ({
  stayAfterClick,
  noPadding,
  fontWeight,
  textSelectable = true,
  update,
  onClick,
  children,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    if (onClick) {
      onClick(e);
    }
    if (stayAfterClick) {
      e.stopPropagation();
    }
    if (update) {
      usePrimitiveStore.getState().updateContextMenu();
    }
  };

  return (
    <span
      onClick={handleClick}
      style={{
        userSelect: textSelectable ? 'auto' : 'none',
        display: 'inline-block',
        fontWeight: fontWeight,
        width: '100%',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: noPadding ? '0px' : '24px',
      }}
    >
      {children}
    </span>
  );
};

export const DialogItem = ({ Dialog, noPadding, children }: DialogItemProps) => {
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleClick = () => {
    useStore.getState().setApplyCount(0);
    setDialogVisible(true);
  };

  return (
    <>
      <ContextMenuItem noPadding={noPadding} onClick={handleClick}>
        {children}
      </ContextMenuItem>
      {dialogVisible && <Dialog setDialogVisible={setDialogVisible} />}
    </>
  );
};

export const GroupMasterCheckbox = ({ groupableElement }: GroupMasterCheckboxProps) => {
  const lang = useLanguage();

  const toggleGroupMaster = () => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === groupableElement.id && isGroupable(e)) {
          (e as GroupableModel).enableGroupMaster = !(e as GroupableModel).enableGroupMaster;
          break;
        }
      }
      state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Group Master',
      timestamp: Date.now(),
      checked: e.target.checked,
      selectedElementId: groupableElement.id,
      selectedElementType: groupableElement.type,
      undo: () => toggleGroupMaster(),
      redo: () => toggleGroupMaster(),
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    toggleGroupMaster();
  };

  return (
    <ContextMenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={groupableElement.enableGroupMaster} onChange={onChange}>
        {i18n.t('foundationMenu.GroupMaster', lang)}
      </Checkbox>
    </ContextMenuItem>
  );
};

export const LightSideItem = ({ element, inside, children }: LightSideItemProps) => {
  const updateInsideLightsByParentId = useStore.getState().updateInsideLightsByParentId;

  const handleClick = () => {
    const oldValues = new Map<string, boolean>();
    for (const elem of useStore.getState().elements) {
      if (elem.parentId === element.id && elem.type === ObjectType.Light) {
        oldValues.set(elem.id, (elem as LightModel).inside);
      }
    }
    updateInsideLightsByParentId(element.id, inside);
    const undoableInsideLights = {
      name: inside ? `Set All Lights on ${element.type} Inside` : `Set All Lights on ${element.type} Outside`,
      timestamp: Date.now(),
      oldValues: oldValues,
      newValue: true,
      undo: () => {
        for (const [id, inside] of undoableInsideLights.oldValues.entries()) {
          useStore.getState().updateInsideLightById(id, inside as boolean);
        }
      },
      redo: () => {
        updateInsideLightsByParentId(element.id, inside);
      },
    } as UndoableChangeGroup;
    useStore.getState().addUndoable(undoableInsideLights);
  };

  return (
    <ContextMenuItem stayAfterClick noPadding onClick={handleClick}>
      {children}
    </ContextMenuItem>
  );
};

export const SolarCollectorSunBeamCheckbox = ({ solarCollector, forModelTree }: SolarCollectorSunBeamCheckboxProps) => {
  const updateSolarCollectorDrawSunBeamById = useStore.getState().updateSolarCollectorDrawSunBeamById;

  const lang = useLanguage();

  const drawSunBeam = (checked: boolean) => {
    const undoableCheck = {
      name: 'Show Sun Beam',
      timestamp: Date.now(),
      checked: !solarCollector.drawSunBeam,
      selectedElementId: solarCollector.id,
      selectedElementType: solarCollector.type,
      undo: () => {
        updateSolarCollectorDrawSunBeamById(solarCollector.id, !undoableCheck.checked);
      },
      redo: () => {
        updateSolarCollectorDrawSunBeamById(solarCollector.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateSolarCollectorDrawSunBeamById(solarCollector.id, checked);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('solarCollectorMenu.SunBeam', lang)}</span>
      <Switch size={'small'} checked={solarCollector.drawSunBeam} onChange={drawSunBeam} />
    </Space>
  ) : (
    <ContextMenuItem stayAfterClick noPadding>
      <Checkbox
        style={{ width: '100%' }}
        checked={solarCollector.drawSunBeam}
        onChange={(e) => drawSunBeam(e.target.checked)}
      >
        {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
      </Checkbox>
    </ContextMenuItem>
  );
};

export const CheckboxMenuItem = ({ checked, onClick, children }: CheckboxMenuItemProps) => {
  return (
    <ContextMenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={checked} onClick={onClick}>
        {children}
      </Checkbox>
    </ContextMenuItem>
  );
};

export const AntdCheckboxMenuItem = ({ checked, onClick, children }: CheckboxMenuItemProps) => {
  return (
    <AntdMenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={checked} onClick={onClick}>
        {children}
      </Checkbox>
    </AntdMenuItem>
  );
};

export const AntdSliderMenuItem = ({ min, max, value, onChange, children }: SliderMenuItemProps) => {
  return (
    <AntdMenuItem stayAfterClick noPadding>
      {children}
      <Slider min={min} max={max} tooltip={{ open: false }} defaultValue={value} onChange={onChange} />
    </AntdMenuItem>
  );
};

export const SliderMenuItem = ({ min, max, value, onChange, children }: SliderMenuItemProps) => {
  return (
    <ContextMenuItem stayAfterClick noPadding>
      {children}
      <Slider min={min} max={max} tooltip={{ open: false }} defaultValue={value} onChange={onChange} />
    </ContextMenuItem>
  );
};

export const EditableId = ({ element }: EditAbleIdProps) => {
  const [id, setId] = useState(element.editableId ?? element.id.slice(0, 4));
  const lang = useLanguage();

  const setEditableId = (str: string) => {
    const trimmed = str.trim();
    const id = trimmed.length > 0 ? trimmed : element.id.slice(0, 4);

    const idSet = new Set<string>();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.BatteryStorage) {
        const id = (e as BatteryStorageModel).editableId ?? e.id.slice(0, 4);
        idSet.add(id);
      }
    }

    if (idSet.has(id)) {
      showError(i18n.t('message.IdIsAlreadyTaken', lang));
      return;
    } else {
      setId(id);
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === element.id && e.type === ObjectType.BatteryStorage) {
            (e as BatteryStorageModel).editableId = id;
            break;
          }
        }
      });
    }
  };

  useEffect(() => {
    setId(element.editableId ?? element.id.slice(0, 4));
  }, [element]);

  return (
    <ContextMenuItem stayAfterClick>
      <span style={{ paddingRight: '6px' }}>ID:</span>
      <Input
        value={id}
        onChange={(e) => setId(e.target.value)}
        onBlur={() => setEditableId(id)}
        onPressEnter={() => setEditableId(id)}
        style={{ width: '150px' }}
      />
    </ContextMenuItem>
  );
};
