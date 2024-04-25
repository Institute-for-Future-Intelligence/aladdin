/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Modal } from 'antd';
import { MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/views/hooks';
import { CuboidModel } from 'src/models/CuboidModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Util } from 'src/Util';
import {
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface CuboidMenuItemProps {
  cuboid: CuboidModel;
}

interface AddPolygonItemProps extends CuboidMenuItemProps {
  selectedSideIndex: number;
}

interface RemoveCuboidElementsItemProps extends CuboidMenuItemProps {
  objectType: ObjectType;
  modalTitle: string;
  onClickOk?: () => void;
  children?: React.ReactNode;
}

export const StackableCheckbox = ({ cuboid }: CuboidMenuItemProps) => {
  const lang = useLanguage();

  const handleChange = () => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === cuboid.id && e.type === ObjectType.Cuboid) {
          const cuboid = e as CuboidModel;
          const stackable = !cuboid.stackable;
          cuboid.stackable = stackable;
          state.actionState.cuboidStackable = stackable;
          break;
        }
      }
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={cuboid.stackable} onChange={handleChange}>
        {i18n.t('cuboidMenu.Stackable', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const AddPolygonItem = ({ cuboid, selectedSideIndex }: AddPolygonItemProps) => {
  const lang = useLanguage();

  const setCommonStore = useStore.getState().set;

  const handleClick = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.Polygon;
    });
    const { pos: position } = Util.getWorldDataById(cuboid.id);
    let normal;
    switch (selectedSideIndex) {
      case 0:
        normal = UNIT_VECTOR_POS_X;
        break;
      case 1:
        normal = UNIT_VECTOR_NEG_X;
        break;
      case 2:
        normal = UNIT_VECTOR_POS_Y;
        break;
      case 3:
        normal = UNIT_VECTOR_NEG_Y;
        break;
      default:
        normal = UNIT_VECTOR_POS_Z;
        position.z = cuboid.lz;
    }
    const element = useStore.getState().addElement(cuboid, position, normal);
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

  return <MenuItem onClick={handleClick}>{i18n.t('cuboidMenu.AddPolygon', lang)}</MenuItem>;
};

export const RemoveCuboidElementsItem = ({
  cuboid,
  objectType,
  modalTitle,
  onClickOk,
  children,
}: RemoveCuboidElementsItemProps) => {
  const removeAllChildElementsByType = useStore.getState().removeAllChildElementsByType;

  const handleModalOk = () => {
    const removed = useStore
      .getState()
      .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === cuboid.id);
    removeAllChildElementsByType(cuboid.id, objectType);
    const removedElements = JSON.parse(JSON.stringify(removed));
    const undoableRemove = {
      name: `Remove All ${objectType}s on Cuboid`,
      timestamp: Date.now(),
      parentId: cuboid.id,
      removedElements: removedElements,
      undo: () => {
        useStore.getState().set((state) => {
          state.elements.push(...undoableRemove.removedElements);
        });
      },
      redo: () => {
        removeAllChildElementsByType(undoableRemove.parentId, objectType);
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
