/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, InputNumber, Menu, Modal, Space } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { CompactPicker } from 'react-color';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAll } from '../../../undo/UndoableRemoveAll';
import { ElementModel } from '../../../models/ElementModel';

export const GroundMenu = () => {
  const language = useStore((state) => state.language);
  const albedo = useStore((state) => state.world.ground.albedo);
  const groundColor = useStore((state) => state.viewState.groundColor);
  const setCommonStore = useStore((state) => state.set);
  const countElementsByType = useStore((state) => state.countElementsByType);
  const removeElementsByType = useStore((state) => state.removeElementsByType);
  const addUndoable = useStore((state) => state.addUndoable);
  const elements = useStore((state) => state.elements);

  const groundImage = useStore((state) => state.viewState.groundImage);
  const treeCount = countElementsByType(ObjectType.Tree);
  const humanCount = countElementsByType(ObjectType.Human);

  const lang = { lng: language };

  return (
    <>
      <Paste />
      {humanCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-humans'}
          onClick={() => {
            Modal.confirm({
              title: 'Do you really want to remove all ' + humanCount + ' people?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed: ElementModel[] = [];
                for (const elem of elements) {
                  if (elem.type === ObjectType.Human) {
                    removed.push(elem);
                  }
                }
                removeElementsByType(ObjectType.Human);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      for (const elem of undoableRemoveAll.removedElements) {
                        state.elements.push(elem);
                      }
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.Human);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllPeople', lang)} ({humanCount})
        </Menu.Item>
      )}
      {treeCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-trees'}
          onClick={() => {
            Modal.confirm({
              title: 'Do you really want to remove all ' + treeCount + ' trees?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed: ElementModel[] = [];
                for (const elem of elements) {
                  if (elem.type === ObjectType.Tree) {
                    removed.push(elem);
                  }
                }
                removeElementsByType(ObjectType.Tree);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      for (const elem of undoableRemoveAll.removedElements) {
                        state.elements.push(elem);
                      }
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.Tree);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllTrees', lang)} ({treeCount})
        </Menu.Item>
      )}
      <Menu>
        <Menu.Item style={{ paddingLeft: '36px' }} key={'ground-albedo'}>
          <Space style={{ width: '60px' }}>{i18n.t('groundMenu.Albedo', lang)}:</Space>
          <InputNumber
            min={0.05}
            max={1}
            step={0.01}
            precision={2}
            value={albedo}
            onChange={(value) => {
              if (value) {
                setCommonStore((state) => {
                  state.world.ground.albedo = value;
                });
              }
            }}
          />
        </Menu.Item>
      </Menu>
      <Menu.Item key={'image-on-ground'}>
        <Checkbox
          checked={groundImage}
          onChange={(e) => {
            setCommonStore((state) => {
              state.viewState.groundImage = e.target.checked;
            });
          }}
        >
          {i18n.t('groundMenu.ImageOnGround', lang)}
        </Checkbox>
      </Menu.Item>
      <SubMenu key={'ground-color'} title={i18n.t('word.Color', { lng: language })} style={{ paddingLeft: '24px' }}>
        <CompactPicker
          color={groundColor}
          onChangeComplete={(colorResult) => {
            setCommonStore((state) => {
              state.viewState.groundColor = colorResult.hex;
            });
          }}
        />
      </SubMenu>
    </>
  );
};
