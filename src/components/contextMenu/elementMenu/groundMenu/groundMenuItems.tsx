/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { useLanguage } from 'src/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import * as Selector from '../../../../stores/selector';
import { UndoableRemoveAll } from '../../../../undo/UndoableRemoveAll';
import { UndoableCheck } from '../../../../undo/UndoableCheck';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { Checkbox, InputNumber, Modal, Radio, type RadioChangeEvent, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ColorResult, CompactPicker } from 'react-color';
import { MenuItem } from '../../menuItems';
import { DEFAULT_LEAF_OFF_DAY, DEFAULT_LEAF_OUT_DAY, MONTHS } from '../../../../constants';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';

interface RemoveElementsItemProps {
  itemLabel: string;
  modalTitle: string;
  objectType: ObjectType;
}

interface LockElementsItemProps {
  lock: boolean;
  count: number;
  label: string;
}

export const GroundImageCheckbox = ({ forModelTree }: { forModelTree?: boolean }) => {
  const groundImage = useStore(Selector.viewState.groundImage);
  const lang = useLanguage();

  const setGroundImage = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.groundImage = checked;
      state.viewState.groundImageType = state.viewState.mapType;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Show Ground Image',
      timestamp: Date.now(),
      checked: checked,
      undo: () => {
        setGroundImage(!undoableCheck.checked);
      },
      redo: () => {
        setGroundImage(undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    setGroundImage(checked);
  };

  return forModelTree ? (
    <Space>
      <span> {i18n.t('groundMenu.ImageOnGround', lang)} :</span>
      <Checkbox style={{ width: '100%' }} checked={groundImage} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={groundImage} onChange={onChange}>
        {i18n.t('groundMenu.ImageOnGround', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const SurfaceTypeRadioGroup = () => {
  const waterSurface = useStore(Selector.viewState.waterSurface);
  const lang = useLanguage();

  const setWaterSurface = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.waterSurface = checked;
    });
  };

  const onChange = (e: RadioChangeEvent) => {
    const oldValue = waterSurface;
    const newValue = e.target.value;
    const undoableChange = {
      name: 'Select Surface Type',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        setWaterSurface(undoableChange.oldValue === 'Water');
      },
      redo: () => {
        setWaterSurface(undoableChange.newValue === 'Water');
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setWaterSurface(newValue === 'Water');
  };

  return (
    <MenuItem stayAfterClick noPadding update>
      <Radio.Group value={waterSurface ? 'Water' : 'Land'} onChange={onChange}>
        <Radio style={{ width: '100%', paddingBottom: '6px' }} key={'Land'} value={'Land'}>
          {i18n.t('groundMenu.LandSurface', lang)}
        </Radio>
        <Radio style={{ width: '100%' }} key={'Water'} value={'Water'}>
          {i18n.t('groundMenu.WaterSurface', lang)}
        </Radio>
      </Radio.Group>
    </MenuItem>
  );
};

export const GroundColorPicker = () => {
  const groundColor = useStore(Selector.viewState.groundColor);

  const setGroundColor = (color: string) => {
    useStore.getState().set((state) => {
      state.viewState.groundColor = color;
    });
  };

  const onChange = (colorResult: ColorResult) => {
    const oldColor = groundColor;
    const newColor = colorResult.hex;
    const undoableChange = {
      name: 'Set Ground Color',
      timestamp: Date.now(),
      oldValue: oldColor,
      newValue: newColor,
      undo: () => {
        setGroundColor(undoableChange.oldValue as string);
      },
      redo: () => {
        setGroundColor(undoableChange.newValue as string);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setGroundColor(newColor);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <CompactPicker color={groundColor} onChangeComplete={onChange} />
    </MenuItem>
  );
};

export const LeafOutDayInput = () => {
  const leafDayOfYear1 = useStore(Selector.world.leafDayOfYear1) ?? DEFAULT_LEAF_OUT_DAY;
  const latitude = useStore(Selector.world.latitude);
  const northHemisphere = latitude > 0;
  const lang = useLanguage();

  const setLeafDayOfYear = (value: number) => {
    useStore.getState().set((state) => {
      state.world.leafDayOfYear1 = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldDay = leafDayOfYear1;
    const newDay = value;
    const undoableChange = {
      name: 'Set Leaf Day 1',
      timestamp: Date.now(),
      oldValue: oldDay,
      newValue: newDay,
      undo: () => {
        setLeafDayOfYear(undoableChange.oldValue as number);
      },
      redo: () => {
        setLeafDayOfYear(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setLeafDayOfYear(newDay as number);
  };

  const AddonBefore = () => (
    <div style={{ width: '100px' }}>
      {i18n.t(northHemisphere ? 'groundMenu.LeafOutDay' : 'groundMenu.LeafOffDay', lang)}
    </div>
  );

  const AddonAfter = () => <div style={{ width: '60px' }}>(1-150)</div>;

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<AddonBefore />}
        addonAfter={<AddonAfter />}
        style={{ width: '300px' }}
        min={1}
        max={150}
        step={1}
        precision={0}
        value={leafDayOfYear1}
        onChange={onChange}
      />
    </MenuItem>
  );
};

export const LeafShedDayInput = () => {
  const leafDayOfYear2 = useStore(Selector.world.leafDayOfYear2) ?? DEFAULT_LEAF_OFF_DAY;
  const latitude = useStore(Selector.world.latitude);
  const northHemisphere = latitude > 0;
  const lang = useLanguage();

  const setLeafDayOfYear = (value: number) => {
    useStore.getState().set((state) => {
      state.world.leafDayOfYear2 = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldDay = leafDayOfYear2;
    const newDay = value;
    const undoableChange = {
      name: 'Set Leaf Day 2',
      timestamp: Date.now(),
      oldValue: oldDay,
      newValue: newDay,
      undo: () => {
        setLeafDayOfYear(undoableChange.oldValue as number);
      },
      redo: () => {
        setLeafDayOfYear(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setLeafDayOfYear(newDay as number);
  };

  const AddonBefore = () => (
    <div style={{ width: '100px' }}>
      {i18n.t(northHemisphere ? 'groundMenu.LeafOffDay' : 'groundMenu.LeafOutDay', lang)}
    </div>
  );

  const AddonAfter = () => <div style={{ width: '60px' }}>(215-365)</div>;

  return (
    <MenuItem stayAfterClick noPadding>
      <InputNumber
        addonBefore={<AddonBefore />}
        addonAfter={<AddonAfter />}
        style={{ width: '300px' }}
        min={215}
        max={365}
        step={1}
        precision={0}
        value={leafDayOfYear2}
        onChange={onChange}
      />
    </MenuItem>
  );
};

export const IrradianceLossInput = ({ monthIndex }: { monthIndex: number }) => {
  const monthlyIrradianceLoss =
    useStore((state) => {
      if (!state.world.monthlyIrradianceLosses) {
        return 0.05;
      }
      return state.world.monthlyIrradianceLosses[monthIndex];
    }) ?? 0.05;

  const lang = useLanguage();

  const setMonthlyIrradianceLoss = (value: number) => {
    useStore.getState().set((state) => {
      if (!state.world.monthlyIrradianceLosses) {
        state.world.monthlyIrradianceLosses = new Array(12).fill(0.05);
      }
      state.world.monthlyIrradianceLosses[monthIndex] = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldValue = monthlyIrradianceLoss;
    const newValue = value;
    const undoableChange = {
      name: 'Set Irradiance Loss in ' + MONTHS[monthIndex],
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setMonthlyIrradianceLoss(undoableChange.oldValue as number);
      },
      redo: () => {
        setMonthlyIrradianceLoss(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setMonthlyIrradianceLoss(newValue);
  };

  return (
    <InputNumber
      addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t(`month.${MONTHS[monthIndex]}`, lang)}</span>}
      style={{ width: '120px', paddingRight: monthIndex % 2 === 0 ? '6px' : 0 }}
      min={0}
      max={1}
      step={0.01}
      precision={2}
      value={monthlyIrradianceLoss}
      onChange={onChange}
    />
  );
};

export const AlbedoInput = ({ forModelTree }: { forModelTree?: boolean }) => {
  const albedo = useStore((state) => state.world.ground.albedo);
  const lang = useLanguage();

  const setAlbedo = (value: number) => {
    useStore.getState().set((state) => {
      state.world.ground.albedo = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldValue = albedo;
    const newValue = value;
    const undoableChange = {
      name: 'Set Ground Albedo',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        setAlbedo(undoableChange.oldValue as number);
      },
      redo: () => {
        setAlbedo(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setAlbedo(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('groundMenu.Albedo', lang)} :</span>
      <InputNumber min={0.05} max={1} step={0.01} precision={2} value={albedo} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick>
      <Space style={{ width: '60px' }}>{i18n.t('groundMenu.Albedo', lang)}:</Space>
      <InputNumber min={0.05} max={1} step={0.01} precision={2} value={albedo} onChange={onChange} />
    </MenuItem>
  );
};

export const RemoveGroundElementsItem = ({ itemLabel, modalTitle, objectType }: RemoveElementsItemProps) => {
  const removeElementsByType = useStore.getState().removeElementsByType;

  const handleModalOk = () => {
    const removed = useStore.getState().elements.filter((e) => !e.locked && e.type === objectType);
    removeElementsByType(objectType);
    const removedElements = JSON.parse(JSON.stringify(removed));
    const undoableRemoveAll = {
      name: 'Remove All ' + objectType + 's',
      timestamp: Date.now(),
      removedElements: removedElements,
      undo: () => {
        useStore.getState().set((state) => {
          state.elements.push(...undoableRemoveAll.removedElements);
        });
      },
      redo: () => {
        removeElementsByType(objectType);
      },
    } as UndoableRemoveAll;
    useStore.getState().addUndoable(undoableRemoveAll);
    usePrimitiveStore.getState().updateContextMenu();
  };

  const handleClickItem = () => {
    Modal.confirm({
      title: modalTitle,
      onOk: handleModalOk,
      icon: <ExclamationCircleOutlined />,
    });
  };

  return <MenuItem onClick={handleClickItem}>{itemLabel}</MenuItem>;
};

export const LockElementsItem = ({ lock, count, label }: LockElementsItemProps) => {
  const updateAllElementLocks = useStore.getState().updateAllElementLocks;

  const onClick = () => {
    const oldLocks = new Map<string, boolean>();
    for (const elem of useStore.getState().elements) {
      oldLocks.set(elem.id, !!elem.locked);
    }
    const name = lock ? 'Lock' : 'Unlock';
    const otherName = lock ? 'Unlocked' : 'Locked';
    const undoableLockAllElements = {
      name: `${name} All ${otherName} Elements`,
      timestamp: Date.now(),
      oldValues: oldLocks,
      newValue: true,
      undo: () => {
        for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
          useStore.getState().updateElementLockById(id, locked as boolean);
        }
      },
      redo: () => {
        updateAllElementLocks(lock);
      },
    } as UndoableChangeGroup;
    useStore.getState().addUndoable(undoableLockAllElements);
    updateAllElementLocks(lock);
  };

  return (
    <MenuItem update onClick={onClick}>
      {label} ({count})
    </MenuItem>
  );
};
