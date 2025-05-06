/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Modal, Radio, RadioChangeEvent, Space, Switch } from 'antd';
import { MenuItem } from '../../menuItems';
import { FoundationModel } from 'src/models/FoundationModel';
import { useStore } from 'src/stores/common';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ObjectType, SolarStructure } from 'src/types';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import React from 'react';
import { Vector3 } from 'three';
import { UNIT_VECTOR_POS_Z } from 'src/constants';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableChange } from 'src/undo/UndoableChange';
import { Util } from 'src/Util';

interface FoundationItemProps {
  foundation: FoundationModel;
  forModelTree?: boolean;
}

interface LockOffspringsItemProps extends FoundationItemProps {
  lock: boolean;
  count: number;
}

interface RemoveFoundationElementsItemProps extends FoundationItemProps {
  objectType: ObjectType;
  modalTitle: string;
  onClickOk?: () => void;
  children?: React.ReactNode;
}

export const BuildingCheckbox = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const toggleBuilding = () => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === foundation.id) {
          (e as FoundationModel).notBuilding = !(e as FoundationModel).notBuilding;
          break;
        }
      }
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Building',
      timestamp: Date.now(),
      checked: e.target.checked,
      selectedElementId: foundation.id,
      selectedElementType: foundation.type,
      undo: () => toggleBuilding(),
      redo: () => toggleBuilding(),
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    toggleBuilding();
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!foundation.notBuilding} onChange={onChange}>
        {i18n.t('word.Building', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const VisibilityCheckbox = ({ foundation, forModelTree }: FoundationItemProps) => {
  const lang = useLanguage();

  const toggle = () => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === foundation.id) {
          (e as FoundationModel).invisible = !(e as FoundationModel).invisible;
          break;
        }
      }
    });
  };

  const toggleVisibility = () => {
    const undoableCheck = {
      name: 'Visible',
      timestamp: Date.now(),
      checked: !foundation.invisible,
      selectedElementId: foundation.id,
      selectedElementType: foundation.type,
      undo: () => toggle(),
      redo: () => toggle(),
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    toggle();
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('word.Visible', lang)}</span>:
      <Switch size={'small'} checked={!foundation.invisible} onChange={toggleVisibility} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!foundation.invisible} onChange={toggleVisibility}>
        {i18n.t('word.Visible', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const SlopeCheckbox = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const toggleSlope = (checked: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === foundation.id) {
          const foundation = e as FoundationModel;
          foundation.enableSlope = checked;
          if (foundation.slope === undefined) {
            foundation.slope = 0.2;
          }
        }
        if (e.parentId === foundation.id) {
          const slope = checked ? foundation.slope ?? 0.2 : 0;
          switch (e.type) {
            case ObjectType.Tree:
            case ObjectType.Flower:
            case ObjectType.Human:
            case ObjectType.BatteryStorage:
            case ObjectType.SolarPanel: {
              e.cz = foundation.lz / 2 + Util.getZOnSlope(foundation.lx, slope, e.cx);
              break;
            }
          }
        }
      }
      state.actionState.foundationEnableSlope = checked;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const undoableCheck = {
      name: 'Enable Slope',
      timestamp: Date.now(),
      checked: e.target.checked,
      selectedElementId: foundation.id,
      selectedElementType: foundation.type,
      undo: () => toggleSlope(!undoableCheck.checked),
      redo: () => toggleSlope(undoableCheck.checked),
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    toggleSlope(e.target.checked);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={foundation.enableSlope} onChange={onChange}>
        {i18n.t('foundationMenu.Slope', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const LockOffspringsItem = ({ foundation, lock, count }: LockOffspringsItemProps) => {
  const lang = useLanguage();

  const label = lock
    ? 'foundationMenu.LockAllUnlockedElementsOnThisFoundation'
    : 'foundationMenu.UnlockAllLockedElementsOnThisFoundation';

  const handleClick = () => {
    const oldLocks = new Map<string, boolean>();
    for (const elem of useStore.getState().elements) {
      if (elem.foundationId === foundation.id || elem.id === foundation.id) {
        oldLocks.set(elem.id, !!elem.locked);
      }
    }

    const name = lock ? 'Lock All Unlocked Offsprings' : 'Unlock All Locked Offsprings';

    const undoableLockAllElements = {
      name: name,
      timestamp: Date.now(),
      oldValues: oldLocks,
      newValue: true,
      undo: () => {
        for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
          useStore.getState().updateElementLockById(id, locked as boolean);
        }
      },
      redo: () => {
        useStore.getState().updateElementLockByFoundationId(foundation.id, lock);
      },
    } as UndoableChangeGroup;
    useStore.getState().addUndoable(undoableLockAllElements);
    useStore.getState().updateElementLockByFoundationId(foundation.id, lock);
  };

  return (
    <MenuItem noPadding onClick={handleClick}>
      {i18n.t(label, lang)} ({count})
    </MenuItem>
  );
};

export const RemoveFoundationElementsItem = ({
  foundation,
  objectType,
  modalTitle,
  onClickOk,
  children,
}: RemoveFoundationElementsItemProps) => {
  const removeAllElementsOnFoundationByType = useStore.getState().removeAllElementsOnFoundationByType;

  const handleModalOk = () => {
    const removed = useStore
      .getState()
      .elements.filter((e) => !e.locked && e.type === objectType && e.foundationId === foundation.id);
    removeAllElementsOnFoundationByType(foundation.id, objectType);
    const removedElements = JSON.parse(JSON.stringify(removed));
    const undoableRemove = {
      name: `Remove All ${objectType}s on Foundation`,
      timestamp: Date.now(),
      parentId: foundation.id,
      removedElements: removedElements,
      undo: () => {
        useStore.getState().set((state) => {
          state.elements.push(...undoableRemove.removedElements);
        });
      },
      redo: () => {
        removeAllElementsOnFoundationByType(undoableRemove.parentId, objectType);
      },
    } as UndoableRemoveAllChildren;
    useStore.getState().addUndoable(undoableRemove);
  };

  const handleClickItem = () => {
    const onOk = onClickOk ?? handleModalOk;
    Modal.confirm({
      title: modalTitle,
      icon: <ExclamationCircleOutlined />,
      onOk: onOk,
    });
  };

  return (
    <MenuItem noPadding onClick={handleClickItem}>
      {children}
    </MenuItem>
  );
};

export const AddPolygonItem = ({ foundation }: FoundationItemProps) => {
  const setCommonStore = useStore.getState().set;
  const lang = useLanguage();

  const handleClick = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.Polygon;
    });
    const element = useStore
      .getState()
      .addElement(foundation, new Vector3(foundation.cx, foundation.cy, foundation.lz), UNIT_VECTOR_POS_Z);
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      undo: () => {
        useStore.getState().removeElementById(undoableAdd.addedElement.id, false);
      },
      redo: () => {
        setCommonStore((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
        });
      },
    } as UndoableAdd;
    useStore.getState().addUndoable(undoableAdd);
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
    });
  };

  return <MenuItem onClick={handleClick}>{i18n.t('foundationMenu.AddPolygon', lang)}</MenuItem>;
};

export const SolarStructureRadioGroup = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const _foundation = useStore((state) =>
    state.elements.find((e) => e.id === foundation.id && e.type === ObjectType.Foundation),
  ) as FoundationModel;

  const selectedSolarStructure = _foundation?.solarStructure ?? SolarStructure.None;

  const updateFoundationSolarStructureById = (id: string, structure: SolarStructure) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          (e as FoundationModel).solarStructure = structure;
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const oldValue = _foundation.solarStructure;
    const newValue = e.target.value;
    const undoableChange = {
      name: 'Select Solar Structure for Selected Foundation',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      changedElementId: _foundation.id,
      changedElementType: _foundation.type,
      undo: () => {
        updateFoundationSolarStructureById(undoableChange.changedElementId, undoableChange.oldValue as SolarStructure);
      },
      redo: () => {
        updateFoundationSolarStructureById(undoableChange.changedElementId, undoableChange.newValue as SolarStructure);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFoundationSolarStructureById(_foundation.id, newValue);
  };

  if (!_foundation) return null;
  return (
    <MenuItem stayAfterClick noPadding>
      <Radio.Group value={selectedSolarStructure} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={SolarStructure.None}>
            {i18n.t('word.None', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={SolarStructure.FocusPipe}>
            {i18n.t('solarAbsorberPipeMenu.AbsorberPipeForFresnelReflectors', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={SolarStructure.FocusTower}>
            {i18n.t('solarPowerTowerMenu.ReceiverTowerForHeliostats', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={SolarStructure.UpdraftTower}>
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTower', lang)}
          </Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};
