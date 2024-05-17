/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Input, InputNumber, Modal, Radio, RadioChangeEvent, Space } from 'antd';
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
import { useState } from 'react';
import { Vector3 } from 'three';
import { UNIT_VECTOR_POS_Z } from 'src/constants';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { HvacSystem } from 'src/models/HvacSystem';
import { UndoableChange } from 'src/undo/UndoableChange';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
} from '../menuHooks';

interface FoundationItemProps {
  foundation: FoundationModel;
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

export const HvacSystemIdInput = ({ foundation }: FoundationItemProps) => {
  const [hvacId, setHvacId] = useState<string | undefined>(foundation?.hvacSystem?.id);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let s: string | undefined = e.target.value;
    if (s.trim().length === 0) s = undefined;
    setHvacId(s);
  };

  const updateHvacIdByFoundationId = (id: string, value: string | undefined) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id) {
          const foundation = e as FoundationModel;
          if (foundation.hvacSystem) {
            foundation.hvacSystem.id = value;
          } else {
            foundation.hvacSystem = { thermostatSetpoint: 20, temperatureThreshold: 3, id: value } as HvacSystem;
          }
          break;
        }
      }
    });
  };

  const updateHvacId = (value: string | undefined) => {
    const oldValue = foundation.hvacSystem?.id;
    const newValue = value && value.trim().length > 0 ? value : undefined;
    const undoableChange = {
      name: 'Change HVAC ID',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        updateHvacIdByFoundationId(foundation.id, undoableChange.oldValue as string | undefined);
      },
      redo: () => {
        updateHvacIdByFoundationId(foundation.id, undoableChange.newValue as string | undefined);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateHvacIdByFoundationId(foundation.id, newValue);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Space style={{ width: '40px', paddingLeft: '0px', textAlign: 'left' }}>{'ID:'}</Space>
      <Input
        style={{ width: '180px' }}
        value={hvacId}
        onChange={onChange}
        onPressEnter={() => updateHvacId(hvacId)}
        onBlur={() => updateHvacId(hvacId)}
      />
    </MenuItem>
  );
};

export const ThermostatTemperatureInput = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const updateFoundationThermostatSetpointById = (id: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id) {
          const foundation = e as FoundationModel;
          if (foundation.hvacSystem) {
            foundation.hvacSystem.thermostatSetpoint = value;
          } else {
            foundation.hvacSystem = { thermostatSetpoint: value, temperatureThreshold: 3 } as HvacSystem;
          }
          break;
        }
      }
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldValue = foundation.hvacSystem?.thermostatSetpoint ?? 20;
    const newValue = value;
    const undoableChange = {
      name: 'Change Thermostat Setpoint',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        updateFoundationThermostatSetpointById(foundation.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateFoundationThermostatSetpointById(foundation.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFoundationThermostatSetpointById(foundation.id, newValue);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Space style={{ width: '160px' }}>{i18n.t('word.ThermostatSetpoint', lang) + ':'}</Space>
      <InputNumber
        min={0}
        max={30}
        step={1}
        style={{ width: 60 }}
        precision={1}
        value={foundation.hvacSystem?.thermostatSetpoint ?? 20}
        onChange={onChange}
      />
    </MenuItem>
  );
};

export const ToleranceThresholdInput = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const updateFoundationTemperatureThresholdById = (id: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id) {
          const foundation = e as FoundationModel;
          if (foundation.hvacSystem) {
            foundation.hvacSystem.temperatureThreshold = value;
          } else {
            foundation.hvacSystem = { thermostatSetpoint: 20, temperatureThreshold: value } as HvacSystem;
          }
          break;
        }
      }
    });
  };

  const handleChange = (value: number | null) => {
    if (value === null) return;
    const oldValue = foundation.hvacSystem?.temperatureThreshold ?? 3;
    const newValue = value;
    const undoableChange = {
      name: 'Change Temperature Tolerance Threshold',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        updateFoundationTemperatureThresholdById(foundation.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateFoundationTemperatureThresholdById(foundation.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFoundationTemperatureThresholdById(foundation.id, newValue);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Space title={i18n.t('word.TemperatureToleranceThresholdExplanation', lang)} style={{ width: '160px' }}>
        {i18n.t('word.TemperatureToleranceThreshold', lang) + ':'}
      </Space>
      <InputNumber
        min={0}
        max={30}
        step={1}
        style={{ width: 60 }}
        precision={1}
        value={foundation.hvacSystem?.temperatureThreshold ?? 3}
        onChange={handleChange}
      />
      <Space style={{ paddingLeft: '10px' }}>°C</Space>
    </MenuItem>
  );
};

export const SolarStructureRadioGroup = ({ foundation }: FoundationItemProps) => {
  const lang = useLanguage();

  const selectedSolarStructure = foundation?.solarStructure ?? SolarStructure.None;

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
    const oldValue = foundation.solarStructure;
    const newValue = e.target.value;
    const undoableChange = {
      name: 'Select Solar Structure for Selected Foundation',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      changedElementId: foundation.id,
      changedElementType: foundation.type,
      undo: () => {
        updateFoundationSolarStructureById(undoableChange.changedElementId, undoableChange.oldValue as SolarStructure);
      },
      redo: () => {
        updateFoundationSolarStructureById(undoableChange.changedElementId, undoableChange.newValue as SolarStructure);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateFoundationSolarStructureById(foundation.id, newValue);
  };

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
