/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, InputNumber, Menu, Modal, Space } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { CompactPicker } from 'react-color';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import { Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAll } from '../../../undo/UndoableRemoveAll';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';

export const GroundMenu = () => {
  const language = useStore(Selector.language);
  const albedo = useStore((state) => state.world.ground.albedo);
  const groundColor = useStore(Selector.viewState.groundColor);
  const setCommonStore = useStore(Selector.set);
  const countElementsByType = useStore(Selector.countElementsByType);
  const removeElementsByType = useStore(Selector.removeElementsByType);
  const addUndoable = useStore(Selector.addUndoable);
  const elements = useStore(Selector.elements);
  const groundImage = useStore(Selector.viewState.groundImage);
  const elementsToPaste = useStore(Selector.elementsToPaste);

  const treeCount = countElementsByType(ObjectType.Tree);
  const humanCount = countElementsByType(ObjectType.Human);
  const foundationCount = countElementsByType(ObjectType.Foundation);
  const cuboidCount = countElementsByType(ObjectType.Cuboid);

  const lang = { lng: language };

  const setGroundImage = (checked: boolean) => {
    setCommonStore((state) => {
      state.viewState.groundImage = checked;
    });
  };

  const setGroundColor = (color: string) => {
    setCommonStore((state) => {
      state.viewState.groundColor = color;
    });
  };

  const setAlbedo = (value: number) => {
    setCommonStore((state) => {
      state.world.ground.albedo = value;
    });
  };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Cuboid ||
        e.type === ObjectType.Foundation
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <>
      {legalToPaste() && <Paste />}
      {humanCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-humans'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllPeople', lang) + ' (' + humanCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = elements.filter((e) => e.type === ObjectType.Human);
                removeElementsByType(ObjectType.Human);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
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
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllTrees', lang) + ' (' + treeCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = elements.filter((e) => e.type === ObjectType.Tree);
                removeElementsByType(ObjectType.Tree);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
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

      {foundationCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-foundations'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllFoundations', lang) + ' (' + foundationCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = elements.filter((e) => e.type === ObjectType.Foundation);
                removeElementsByType(ObjectType.Foundation);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.Foundation);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllFoundations', lang)} ({foundationCount})
        </Menu.Item>
      )}

      {cuboidCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-cuboids'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllCuboids', lang) + ' (' + cuboidCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = elements.filter((e) => e.type === ObjectType.Cuboid);
                removeElementsByType(ObjectType.Cuboid);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.Cuboid);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllCuboids', lang)} ({cuboidCount})
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
                const oldAlbedo = albedo;
                const newAlbedo = value;
                const undoableChange = {
                  name: 'Set Albedo',
                  timestamp: Date.now(),
                  oldValue: oldAlbedo,
                  newValue: newAlbedo,
                  undo: () => {
                    setAlbedo(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setAlbedo(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setAlbedo(newAlbedo);
              }
            }}
          />
        </Menu.Item>
      </Menu>

      <Menu.Item key={'image-on-ground'}>
        <Checkbox
          checked={groundImage}
          onChange={(e) => {
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
            addUndoable(undoableCheck);
            setGroundImage(checked);
          }}
        >
          {i18n.t('groundMenu.ImageOnGround', lang)}
        </Checkbox>
      </Menu.Item>

      <SubMenu key={'ground-color'} title={i18n.t('word.Color', { lng: language })} style={{ paddingLeft: '24px' }}>
        <CompactPicker
          color={groundColor}
          onChangeComplete={(colorResult) => {
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
            addUndoable(undoableChange);
            setGroundColor(newColor);
          }}
        />
      </SubMenu>
    </>
  );
};
