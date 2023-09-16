/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
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
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { DEFAULT_LEAF_OFF_DAY, DEFAULT_LEAF_OUT_DAY, MONTHS } from '../../../constants';
import { ElementCounter } from '../../../stores/ElementCounter';

export const GroundMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const removeElementsByType = useStore(Selector.removeElementsByType);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const updateAllElementLocks = useStore(Selector.updateAllElementLocks);
  const addUndoable = useStore(Selector.addUndoable);
  const latitude = useStore(Selector.world.latitude);
  const leafDayOfYear1 = useStore(Selector.world.leafDayOfYear1) ?? DEFAULT_LEAF_OUT_DAY;
  const leafDayOfYear2 = useStore(Selector.world.leafDayOfYear2) ?? DEFAULT_LEAF_OFF_DAY;
  const monthlyIrradianceLosses = useStore(Selector.world.monthlyIrradianceLosses) ?? new Array(12).fill(0.05);
  const albedo = useStore((state) => state.world.ground.albedo);
  const groundColor = useStore(Selector.viewState.groundColor);
  const groundImage = useStore(Selector.viewState.groundImage);
  const waterSurface = useStore(Selector.viewState.waterSurface);
  const language = useStore(Selector.language);
  const elementsToPaste = useStore(Selector.elementsToPaste);

  const lang = { lng: language };
  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType(true);
  const treeCount = elementCounter.treeCount;
  const flowerCount = elementCounter.flowerCount;
  const humanCount = elementCounter.humanCount;
  const foundationCount = elementCounter.foundationCount;
  const cuboidCount = elementCounter.cuboidCount;
  const solarPanelCount = elementCounter.solarPanelCount;
  const gotSome = elementCounter.gotSome();

  const setWaterSurface = (checked: boolean) => {
    setCommonStore((state) => {
      state.viewState.waterSurface = checked;
    });
  };

  const setGroundImage = (checked: boolean) => {
    setCommonStore((state) => {
      state.viewState.groundImage = checked;
      state.viewState.groundImageType = state.viewState.mapType;
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

  const setMonthlyIrradianceLoss = (month: number, value: number) => {
    const oldValue = monthlyIrradianceLosses[month];
    const newValue = value;
    const undoableChange = {
      name: 'Set Irradiance Loss in ' + MONTHS[month],
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setCommonStore((state) => {
          state.world.monthlyIrradianceLosses[month] = undoableChange.oldValue as number;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.world.monthlyIrradianceLosses[month] = undoableChange.newValue as number;
        });
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    setCommonStore((state) => {
      if (!state.world.monthlyIrradianceLosses) state.world.monthlyIrradianceLosses = new Array(12).fill(0.05);
      state.world.monthlyIrradianceLosses[month] = newValue as number;
    });
  };

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Flower ||
        e.type === ObjectType.Cuboid ||
        e.type === ObjectType.Foundation
      ) {
        return true;
      }
    }
    return false;
  };

  const northHemisphere = latitude > 0;

  return (
    <Menu.ItemGroup>
      {legalToPaste() && <Paste keyName={'ground-paste'} />}
      {humanCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-humans'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllPeople', lang) + ' (' + humanCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = useStore.getState().elements.filter((e) => !e.locked && e.type === ObjectType.Human);
                removeElementsByType(ObjectType.Human);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Humans',
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
          {i18n.t('groundMenu.RemoveAllUnlockedPeople', lang)} ({humanCount})
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
                const removed = useStore.getState().elements.filter((e) => !e.locked && e.type === ObjectType.Tree);
                removeElementsByType(ObjectType.Tree);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Trees',
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
          {i18n.t('groundMenu.RemoveAllUnlockedTrees', lang)} ({treeCount})
        </Menu.Item>
      )}

      {flowerCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-flowers'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllFlowers', lang) + ' (' + flowerCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = useStore.getState().elements.filter((e) => !e.locked && e.type === ObjectType.Flower);
                removeElementsByType(ObjectType.Flower);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Flowers',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.Flower);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllUnlockedFlowers', lang)} ({flowerCount})
        </Menu.Item>
      )}

      {solarPanelCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-solar-panels'}
          onClick={() => {
            Modal.confirm({
              title: i18n.t('groundMenu.DoYouReallyWantToRemoveAllSolarPanels', lang) + ' (' + solarPanelCount + ')?',
              icon: <ExclamationCircleOutlined />,
              onOk: () => {
                const removed = useStore
                  .getState()
                  .elements.filter((e) => !e.locked && e.type === ObjectType.SolarPanel);
                removeElementsByType(ObjectType.SolarPanel);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Solar Panels',
                  timestamp: Date.now(),
                  removedElements: removedElements,
                  undo: () => {
                    setCommonStore((state) => {
                      state.elements.push(...undoableRemoveAll.removedElements);
                    });
                  },
                  redo: () => {
                    removeElementsByType(ObjectType.SolarPanel);
                  },
                } as UndoableRemoveAll;
                addUndoable(undoableRemoveAll);
              },
            });
          }}
        >
          {i18n.t('groundMenu.RemoveAllUnlockedSolarPanels', lang)} ({solarPanelCount})
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
                const removed = useStore
                  .getState()
                  .elements.filter((e) => !e.locked && e.type === ObjectType.Foundation);
                removeElementsByType(ObjectType.Foundation);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Foundations',
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
          {i18n.t('groundMenu.RemoveAllUnlockedFoundations', lang)} ({foundationCount})
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
                const removed = useStore.getState().elements.filter((e) => !e.locked && e.type === ObjectType.Cuboid);
                removeElementsByType(ObjectType.Cuboid);
                const removedElements = JSON.parse(JSON.stringify(removed));
                const undoableRemoveAll = {
                  name: 'Remove All Cuboids',
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
          {i18n.t('groundMenu.RemoveAllUnlockedCuboids', lang)} ({cuboidCount})
        </Menu.Item>
      )}

      {gotSome && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'lock-all-elements'}
          onClick={() => {
            const oldLocks = new Map<string, boolean>();
            for (const elem of useStore.getState().elements) {
              oldLocks.set(elem.id, !!elem.locked);
            }
            updateAllElementLocks(true);
            const undoableLockAllElements = {
              name: 'Lock All Elements',
              timestamp: Date.now(),
              oldValues: oldLocks,
              newValue: true,
              undo: () => {
                for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
                  updateElementLockById(id, locked as boolean);
                }
              },
              redo: () => {
                updateAllElementLocks(true);
              },
            } as UndoableChangeGroup;
            addUndoable(undoableLockAllElements);
          }}
        >
          {i18n.t('groundMenu.LockAllElements', lang)} ({elements.length})
        </Menu.Item>
      )}
      {!gotSome && elements.length > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'unlock-all-elements'}
          onClick={() => {
            const oldLocks = new Map<string, boolean>();
            for (const elem of useStore.getState().elements) {
              oldLocks.set(elem.id, !!elem.locked);
            }
            updateAllElementLocks(false);
            const undoableLockAllElements = {
              name: 'Lock All Elements',
              timestamp: Date.now(),
              oldValues: oldLocks,
              newValue: false,
              undo: () => {
                for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
                  updateElementLockById(id, locked as boolean);
                }
              },
              redo: () => {
                updateAllElementLocks(false);
              },
            } as UndoableChangeGroup;
            addUndoable(undoableLockAllElements);
          }}
        >
          {i18n.t('groundMenu.UnlockAllElements', lang)} ({elements.length})
        </Menu.Item>
      )}

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

      <Menu.Item key={'water-surface'}>
        <Checkbox
          checked={waterSurface}
          onChange={(e) => {
            const checked = e.target.checked;
            const undoableCheck = {
              name: 'Water Surface',
              timestamp: Date.now(),
              checked: checked,
              undo: () => {
                setWaterSurface(!undoableCheck.checked);
              },
              redo: () => {
                setWaterSurface(undoableCheck.checked);
              },
            } as UndoableCheck;
            addUndoable(undoableCheck);
            setWaterSurface(checked);
          }}
        >
          {i18n.t('groundMenu.WaterSurface', lang)}
        </Checkbox>
      </Menu.Item>

      {!waterSurface && (
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
      )}

      <SubMenu
        key={'vegetation'}
        title={i18n.t('groundMenu.Vegetation', { lng: language })}
        style={{ paddingLeft: '24px' }}
      >
        <Menu>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px', marginTop: 10 }} key={'leaf-out-day'}>
            <InputNumber
              addonBefore={i18n.t(northHemisphere ? 'groundMenu.LeafOutDay' : 'groundMenu.LeafOffDay', lang)}
              addonAfter={'(1-150)'}
              style={{ width: '300px' }}
              min={1}
              max={150}
              step={1}
              precision={0}
              value={leafDayOfYear1}
              onChange={(value) => {
                const oldDay = leafDayOfYear1;
                const newDay = value;
                const undoableChange = {
                  name: 'Set Leaf Day 1',
                  timestamp: Date.now(),
                  oldValue: oldDay,
                  newValue: newDay,
                  undo: () => {
                    setCommonStore((state) => {
                      state.world.leafDayOfYear1 = undoableChange.oldValue as number;
                    });
                  },
                  redo: () => {
                    setCommonStore((state) => {
                      state.world.leafDayOfYear1 = undoableChange.newValue as number;
                    });
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setCommonStore((state) => {
                  state.world.leafDayOfYear1 = newDay as number;
                });
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px', marginTop: 0 }} key={'leaf-shed-day'}>
            <InputNumber
              addonBefore={i18n.t(northHemisphere ? 'groundMenu.LeafOffDay' : 'groundMenu.LeafOutDay', lang)}
              addonAfter={'(215-365)'}
              style={{ width: '300px' }}
              min={215}
              max={365}
              step={1}
              precision={0}
              value={leafDayOfYear2}
              onChange={(value) => {
                const oldDay = leafDayOfYear2;
                const newDay = value;
                const undoableChange = {
                  name: 'Set Leaf Day 2',
                  timestamp: Date.now(),
                  oldValue: oldDay,
                  newValue: newDay,
                  undo: () => {
                    setCommonStore((state) => {
                      state.world.leafDayOfYear2 = undoableChange.oldValue as number;
                    });
                  },
                  redo: () => {
                    setCommonStore((state) => {
                      state.world.leafDayOfYear2 = undoableChange.newValue as number;
                    });
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setCommonStore((state) => {
                  state.world.leafDayOfYear2 = newDay as number;
                });
              }}
            />
          </Menu.Item>
        </Menu>
      </SubMenu>

      <SubMenu
        key={'monthly-irradiance-loss'}
        title={i18n.t('groundMenu.MonthlyIrradianceLoss', { lng: language })}
        style={{ paddingLeft: '24px' }}
      >
        <Menu>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px', marginTop: 10 }} key={'irradiance-loss-jan'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.January', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[0]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(0, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.February', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[1]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(1, value);
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px' }} key={'irradiance-loss-mar'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.March', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[2]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(2, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.April', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[3]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(3, value);
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px' }} key={'irradiance-loss-may'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.May', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[4]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(4, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.June', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[5]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(5, value);
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px' }} key={'irradiance-loss-jul'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.July', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[6]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(6, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.August', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[7]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(7, value);
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px' }} key={'irradiance-loss-sep'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.September', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[8]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(8, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.October', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[9]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(9, value);
              }}
            />
          </Menu.Item>
          <Menu.Item style={{ height: '36px', paddingLeft: '6px' }} key={'irradiance-loss-nov'}>
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.November', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[10]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(10, value);
              }}
            />
            <InputNumber
              addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t('month.December', lang)}</span>}
              style={{ width: '120px' }}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              value={monthlyIrradianceLosses[11]}
              onChange={(value) => {
                setMonthlyIrradianceLoss(11, value);
              }}
            />
          </Menu.Item>
        </Menu>
      </SubMenu>

      <Menu>
        <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'ground-albedo'}>
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
                  name: 'Set Ground Albedo',
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
    </Menu.ItemGroup>
  );
});
