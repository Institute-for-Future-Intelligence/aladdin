/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { MenuItem } from '../../menuItems';
import { Checkbox, Modal, Radio, RadioChangeEvent, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableChange } from 'src/undo/UndoableChange';
import { Euler, Vector3 } from 'three';
import { FoundationModel } from 'src/models/FoundationModel';
import { Util } from 'src/Util';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import React from 'react';

interface WallMenuItemProps {
  wall: WallModel;
  children?: React.ReactNode;
}

interface RemoveWallElementsItemProps extends WallMenuItemProps {
  objectType: ObjectType;
  modalTitle: string;
  onClickOk?: () => void;
}

interface LockWallElementsItemProps extends WallMenuItemProps {
  objectType: ObjectType;
  lock: boolean;
}

export const RemoveWallElementsItem = ({
  wall,
  objectType,
  modalTitle,
  onClickOk,
  children,
}: RemoveWallElementsItemProps) => {
  const removeAllChildElementsByType = useStore.getState().removeAllChildElementsByType;

  const handleModalOk = () => {
    const removed = useStore
      .getState()
      .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === wall.id);
    removeAllChildElementsByType(wall.id, objectType);
    const removedElements = JSON.parse(JSON.stringify(removed));
    const undoableRemoveAllChildren = {
      name: `Remove All ${objectType}s on Wall`,
      timestamp: Date.now(),
      parentId: wall.id,
      removedElements: removedElements,
      undo: () => {
        useStore.getState().set((state) => {
          state.elements.push(...undoableRemoveAllChildren.removedElements);
        });
      },
      redo: () => {
        removeAllChildElementsByType(undoableRemoveAllChildren.parentId, objectType);
      },
    } as UndoableRemoveAllChildren;
    useStore.getState().addUndoable(undoableRemoveAllChildren);
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
    <MenuItem update noPadding onClick={handleClickItem}>
      {children}
    </MenuItem>
  );
};

export const LockWallElementsItem = ({ wall, objectType, lock, children }: LockWallElementsItemProps) => {
  const updateElementLockById = useStore.getState().updateElementLockById;
  const updateElementUnlockByParentId = useStore.getState().updateElementLockByParentId;

  const handleClick = () => {
    const objectTypeText = objectType.replaceAll(' ', '');
    const oldLocks = new Map<string, boolean>();
    for (const elem of useStore.getState().elements) {
      if (elem.parentId === wall.id && elem.type === objectType) {
        oldLocks.set(elem.id, !!elem.locked);
      }
    }
    updateElementUnlockByParentId(wall.id, objectType, lock);

    const name = lock ? `Lock All Unlocked ${objectTypeText} on Wall` : `Unlock All Locked ${objectTypeText} on Wall`;

    const undoable = {
      name: name,
      timestamp: Date.now(),
      oldValues: oldLocks,
      newValue: true,
      undo: () => {
        for (const [id, locked] of undoable.oldValues.entries()) {
          updateElementLockById(id, locked as boolean);
        }
      },
      redo: () => {
        updateElementUnlockByParentId(wall.id, objectType, lock);
      },
    } as UndoableChangeGroup;
    useStore.getState().addUndoable(undoable);
  };

  return (
    <MenuItem stayAfterClick update noPadding onClick={handleClick}>
      {children}
    </MenuItem>
  );
};

export const ParapetCheckbox = ({ wall }: WallMenuItemProps) => {
  const lang = useLanguage();

  const setCommonStore = useStore.getState().set;

  const updateParapetDisplayById = (id: string, display: boolean) => {
    setCommonStore((state) => {
      const wall = state.elements.find((e) => e.id === id && e.type === ObjectType.Wall) as WallModel;
      if (!wall) return;
      wall.parapet.display = display;
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Parapet',
      timestamp: Date.now(),
      checked: checked,
      selectedElementId: wall.id,
      selectedElementType: wall.type,
      undo: () => {
        updateParapetDisplayById(wall.id, !undoableCheck.checked);
      },
      redo: () => {
        updateParapetDisplayById(wall.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateParapetDisplayById(wall.id, checked);
    setCommonStore((state) => {
      state.actionState.wallParapet.display = checked;
    });
  };

  return (
    <MenuItem stayAfterClick={false} noPadding>
      <Checkbox style={{ width: '100%' }} checked={wall.parapet.display} onChange={handleChange}>
        {i18n.t('wallMenu.Parapet', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const WallStructureRadioGroup = ({ wall }: WallMenuItemProps) => {
  const lang = useLanguage();

  const updateWallStructureById = (id: string, structure: WallStructure) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall) {
          const wallModel = e as WallModel;
          wallModel.wallStructure = structure;
          if (structure === WallStructure.Stud || structure === WallStructure.Pillar) {
            wallModel.opacity = 0;
          }
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const undoableChange = {
      name: 'Select Wall Structure',
      timestamp: Date.now(),
      oldValue: wall.wallStructure,
      newValue: e.target.value,
      changedElementId: wall.id,
      changedElementType: wall.type,
      undo: () => {
        updateWallStructureById(undoableChange.changedElementId, undoableChange.oldValue as WallStructure);
      },
      redo: () => {
        updateWallStructureById(undoableChange.changedElementId, undoableChange.newValue as WallStructure);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateWallStructureById(wall.id, e.target.value);
    useStore.getState().set((state) => {
      state.actionState.wallStructure = e.target.value;
      if (
        state.actionState.wallStructure === WallStructure.Stud ||
        state.actionState.wallStructure === WallStructure.Pillar
      ) {
        state.actionState.wallOpacity = 0;
      }
    });
  };

  const value = wall.wallStructure ?? WallStructure.Default;

  return (
    <MenuItem stayAfterClick={false} noPadding>
      <Radio.Group value={value} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={WallStructure.Default}>
            {i18n.t('wallMenu.DefaultStructure', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={WallStructure.Stud}>
            {i18n.t('wallMenu.StudStructure', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={WallStructure.Pillar}>
            {i18n.t('wallMenu.PillarStructure', lang)}
          </Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};

export const AddPolygonOnWallItem = ({ wall }: WallMenuItemProps) => {
  const setCommonStore = useStore.getState().set;
  const lang = useLanguage();

  const getRelativePosOnWall = (p: Vector3, wall: WallModel, foundation: FoundationModel) => {
    const { cx, cy, cz } = wall;
    const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
    if (foundation && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundation).setZ(
        wall.lz / 2 + foundation.lz,
      );
      return new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
    }
    return new Vector3();
  };

  const handleClick = () => {
    const foundation = useStore.getState().getFoundation(wall);
    if (!foundation) return;

    const p = getRelativePosOnWall(useStore.getState().pastePoint, wall, foundation);
    const polygon = ElementModelFactory.makePolygon(
      wall,
      -p.x / wall.lx,
      0,
      -p.z / wall.lz,
      new Vector3(0, 0, 1),
      [0, 0, 0],
      ObjectType.Wall,
    );
    setCommonStore((state) => {
      state.elements.push(polygon);
      state.objectTypeToAdd = ObjectType.None;
    });
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: polygon,
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
  };

  return <MenuItem onClick={handleClick}>{i18n.t('foundationMenu.AddPolygon', lang)}</MenuItem>;
};

export const WallFillRadioGroup = ({ wall }: WallMenuItemProps) => {
  const lang = useLanguage();

  const updateWallFillById = (id: string, fill: WallFill) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall) {
          (e as WallModel).fill = fill;
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const undoableChange = {
      name: 'Select Wall Fill',
      timestamp: Date.now(),
      oldValue: wall.fill,
      newValue: e.target.value,
      changedElementId: wall.id,
      changedElementType: wall.type,
      undo: () => {
        updateWallFillById(undoableChange.changedElementId, undoableChange.oldValue as WallFill);
      },
      redo: () => {
        updateWallFillById(undoableChange.changedElementId, undoableChange.newValue as WallFill);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateWallFillById(wall.id, e.target.value);
  };

  return (
    <MenuItem stayAfterClick={false} noPadding>
      <Radio.Group value={wall.fill} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={WallFill.Full}>
            {i18n.t('wallMenu.Full', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={WallFill.Partial}>
            {i18n.t('wallMenu.Partial', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={WallFill.Empty}>
            {i18n.t('wallMenu.Empty', lang)}
          </Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};

export const WallOpenToOutsideCheckbox = ({ wall }: WallMenuItemProps) => {
  const lang = useLanguage();

  const updateOpenToOutsideById = (id: string, open: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall) {
          (e as WallModel).openToOutside = open;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const undoableChange = {
      name: 'Set Open to Outside',
      timestamp: Date.now(),
      oldValue: !!wall.openToOutside,
      newValue: e.target.checked,
      changedElementId: wall.id,
      changedElementType: wall.type,
      undo: () => {
        updateOpenToOutsideById(undoableChange.changedElementId, undoableChange.oldValue as boolean);
      },
      redo: () => {
        updateOpenToOutsideById(undoableChange.changedElementId, undoableChange.newValue as boolean);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateOpenToOutsideById(wall.id, e.target.checked);
  };

  return (
    <MenuItem stayAfterClick={false} noPadding>
      <Checkbox style={{ width: '100%' }} checked={!!wall.openToOutside} onChange={handleChange}>
        {i18n.t('wallMenu.OpenToOutside', lang)}
      </Checkbox>
    </MenuItem>
  );
};
