/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Radio } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import DoorTextureSelection from './doorTextureSelection';
import DoorColorSelection from './doorColorSelection';
import { ObjectType } from 'src/types';
import SubMenu from 'antd/lib/menu/SubMenu';
import { radioStyle } from './wallMenu';
import { UndoableChange } from 'src/undo/UndoableChange';

const getSelectedDoor = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Door) {
      return el as DoorModel;
    }
  }
  return null;
};

export const DoorMenu = () => {
  const door = useStore(getSelectedDoor);
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);
  const addUndoable = useStore(Selector.addUndoable);
  const setCommonStore = useStore(Selector.set);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const updateDoorTypeById = (id: string, type: DoorType) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).doorType = type;
          break;
        }
      }
    });
  };

  const renderTypeSubMenu = () => {
    if (!door) {
      return null;
    }
    return (
      <SubMenu key={'door-type'} title={i18n.t('doorMenu.DoorType', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={door.doorType}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Door Type',
              timestamp: Date.now(),
              oldValue: door.doorType,
              newValue: e.target.value,
              changedElementId: door.id,
              changedElementType: door.type,
              undo: () => {
                updateDoorTypeById(undoableChange.changedElementId, undoableChange.oldValue as DoorType);
              },
              redo: () => {
                updateDoorTypeById(undoableChange.changedElementId, undoableChange.newValue as DoorType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateDoorTypeById(door.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.doorType = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={DoorType.Default}>
            {i18n.t('doorMenu.Default', lang)}
          </Radio>
          <Radio style={radioStyle} value={DoorType.Arched}>
            {i18n.t('doorMenu.Arched', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  if (!door) return null;
  return (
    <>
      <Copy keyName={'door-copy'} />
      <Cut keyName={'door-cut'} />
      <Lock keyName={'door-lock'} />

      {renderTypeSubMenu()}

      {textureDialogVisible && <DoorTextureSelection setDialogVisible={setTextureDialogVisible} />}
      {colorDialogVisible && <DoorColorSelection setDialogVisible={setColorDialogVisible} />}

      {door.doorType === DoorType.Default && (
        <>
          <Menu.Item
            key={'door-texture'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setTextureDialogVisible(true);
            }}
          >
            {i18n.t('word.Texture', lang)} ...
          </Menu.Item>
          <Menu.Item
            key={'door-color'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setColorDialogVisible(true);
            }}
          >
            {i18n.t('word.Color', lang)} ...
          </Menu.Item>
        </>
      )}
    </>
  );
};
