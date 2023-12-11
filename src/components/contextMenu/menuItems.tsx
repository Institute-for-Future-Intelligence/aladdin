/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Slider } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { UndoableDelete } from '../../undo/UndoableDelete';
import { UndoablePaste } from '../../undo/UndoablePaste';
import { UndoableCheck } from '../../undo/UndoableCheck';
import { ActionInfo, ObjectType, SolarCollector } from '../../types';
import { showInfo } from 'src/helpers';
import { WallModel } from 'src/models/WallModel';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage } from 'src/views/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ElementModel } from 'src/models/ElementModel';
import { GroupableModel, isGroupable } from 'src/models/Groupable';
import { LightModel } from 'src/models/LightModel';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';

interface MenuItemProps {
  noPadding?: boolean;
  stayAfterClick?: boolean;
  textSelectable?: boolean;
  update?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

interface DialogItemProps {
  Dialog: (props: { setDialogVisible: (b: boolean) => void }) => JSX.Element | null;
  noPadding?: boolean;
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
    <MenuItem onClick={paste}>
      {i18n.t('word.Paste', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</span>
    </MenuItem>
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
    <MenuItem onClick={copyElement}>
      {i18n.t('word.Copy', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+C)</span>
    </MenuItem>
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
    <MenuItem onClick={cut}>
      {i18n.t('word.Cut', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+X)</span>
    </MenuItem>
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
    <MenuItem stayAfterClick noPadding>
      <Checkbox checked={selectedElement.locked} onChange={onChange}>
        {i18n.t('word.Lock', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const MenuItem: React.FC<MenuItemProps> = ({
  stayAfterClick,
  noPadding,
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
        width: '100%',
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
      <MenuItem noPadding={noPadding} onClick={handleClick}>
        {children}
      </MenuItem>
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
    <MenuItem stayAfterClick noPadding>
      <Checkbox checked={groupableElement.enableGroupMaster} onChange={onChange}>
        {i18n.t('foundationMenu.GroupMaster', lang)}
      </Checkbox>
    </MenuItem>
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
    <MenuItem stayAfterClick update noPadding onClick={handleClick}>
      {children}
    </MenuItem>
  );
};

export const SolarCollectorSunBeamCheckbox = ({ solarCollector }: SolarCollectorSunBeamCheckboxProps) => {
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

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox checked={!!solarCollector.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
        {i18n.t('solarCollectorMenu.DrawSunBeam', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const CheckboxMenuItem = ({ checked, onClick, children }: CheckboxMenuItemProps) => {
  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox checked={checked} onClick={onClick}>
        {children}
      </Checkbox>
    </MenuItem>
  );
};

export const SliderMenuItem = ({ min, max, value, onChange, children }: SliderMenuItemProps) => {
  return (
    <MenuItem stayAfterClick noPadding>
      {children}
      <Slider min={min} max={max} tooltip={{ open: false }} defaultValue={value} onChange={onChange} />
    </MenuItem>
  );
};
