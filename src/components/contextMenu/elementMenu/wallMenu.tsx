/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Menu, Modal, Radio } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallTextureSelection from './wallTextureSelection';
import WallBodyColorSelection from './wallColorSelection';
import { WallModel, WallDisplayMode, WallStructure } from 'src/models/WallModel';
import { ObjectType, WallTexture } from 'src/types';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import { Util } from 'src/Util';
import { UndoableChange } from 'src/undo/UndoableChange';
import WallStructureColorSelection from './wallStructureColorSelection';
import WallNumberInput from './wallNumberInput';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { LightModel } from '../../../models/LightModel';
import WallRValueInput from './wallRValueInput';
import { UndoableCheck } from 'src/undo/UndoableCheck';

enum DataType {
  Height = 'Height',
  Opacity = 'Opacity',
  StructureSpacing = 'StructureSpacing',
  StructureWidth = 'StructureWidth',
  Thickness = 'Thickness',
  StructureColor = 'StructureColor',
  Color = 'Color',
  Texture = 'Texture',
}

type NumberDialogSettingType = {
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

const DialogSetting = {
  Height: { attributeKey: 'lz', range: [0.1, 100], step: 0.1, unit: 'word.MeterAbbreviation' },
  Opacity: { attributeKey: 'opacity', range: [0, 1], step: 0.01 },
  StructureSpacing: { attributeKey: 'structureSpacing', range: [0.1, 1000], step: 0.1, unit: 'word.MeterAbbreviation' },
  StructureWidth: { attributeKey: 'structureWidth', range: [0.01, 1], step: 0.1, unit: 'word.MeterAbbreviation' },
  Thickness: { attributeKey: 'ly', range: [0.1, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
};

export const radioStyle = {
  display: 'block',
  height: '30px',
  paddingLeft: '10px',
  lineHeight: '30px',
};

const getSelectedWall = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Wall) {
      return el as WallModel;
    }
  }
  return null;
};

export const WallMenu = () => {
  const wall = useStore(getSelectedWall);
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const setApplyCount = useStore(Selector.setApplyCount);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const addUndoable = useStore(Selector.addUndoable);
  const updateWallStructureById = useStore(Selector.updateWallStructureById);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const updateElementUnlockByParentId = useStore(Selector.updateElementLockByParentId);
  const updateInsideLightsByParentId = useStore(Selector.updateInsideLightsByParentId);
  const updateInsideLightById = useStore(Selector.updateInsideLightById);

  const [dataType, setDataType] = useState<DataType | null>(null);
  const [rValueDialogVisible, setRValueDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (Util.isLegalOnWall(e.type)) {
        return true;
      }
    }
    return false;
  };

  const handleClearOk = (objectType: ObjectType) => {
    if (wall) {
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
          setCommonStore((state) => {
            state.elements.push(...undoableRemoveAllChildren.removedElements);
          });
        },
        redo: () => {
          removeAllChildElementsByType(undoableRemoveAllChildren.parentId, objectType);
        },
      } as UndoableRemoveAllChildren;
      addUndoable(undoableRemoveAllChildren);
    }
  };

  const updateWallDisplayModeById = (id: string, mode: WallDisplayMode) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall) {
          (e as WallModel).displayMode = mode;
          break;
        }
      }
    });
  };

  const renderCopy = () => <Copy keyName={'wall-copy'} />;

  const renderLock = () => <Lock keyName={'wall-lock'} />;

  const renderCut = () => {
    if (!wall || wall.locked) {
      return null;
    }
    return <Cut keyName={'wall-cut'} />;
  };

  const renderPaste = () => {
    if (!legalToPaste()) {
      return null;
    }
    return <Paste keyName={'wall-paste'} />;
  };

  const renderDisplayModeSubMenu = () => {
    if (!wall) {
      return null;
    }
    return (
      <SubMenu key={'wall-shown-type'} title={i18n.t('wallMenu.DisplayMode', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={wall.displayMode}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Wall Display Mode',
              timestamp: Date.now(),
              oldValue: wall.displayMode,
              newValue: e.target.value,
              changedElementId: wall.id,
              changedElementType: wall.type,
              undo: () => {
                updateWallDisplayModeById(undoableChange.changedElementId, undoableChange.oldValue as WallDisplayMode);
              },
              redo: () => {
                updateWallDisplayModeById(undoableChange.changedElementId, undoableChange.newValue as WallDisplayMode);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateWallDisplayModeById(wall.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.wallDisplayMode = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={WallDisplayMode.All}>
            {i18n.t('wallMenu.DisplayAll', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallDisplayMode.Partial}>
            {i18n.t('wallMenu.DisplayPartial', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallDisplayMode.Empty}>
            {i18n.t('wallMenu.DisplayEmpty', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderSturctureSubMenu = () => {
    if (!wall) {
      return null;
    }
    return (
      <SubMenu key={'wall-structure'} title={i18n.t('wallMenu.WallStructure', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={wall.wallStructure ?? WallStructure.Default}
          style={{ height: '75px' }}
          onChange={(e) => {
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
            addUndoable(undoableChange);
            updateWallStructureById(wall.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.wallStructure = e.target.value;
              if (
                state.actionState.wallStructure === WallStructure.Stud ||
                state.actionState.wallStructure === WallStructure.Pillar
              ) {
                state.actionState.wallOpacity = 0;
              }
            });
          }}
        >
          <Radio style={radioStyle} value={WallStructure.Default}>
            {i18n.t('wallMenu.DefaultStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Stud}>
            {i18n.t('wallMenu.StudStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Pillar}>
            {i18n.t('wallMenu.PillarStructure', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderStructureItems = () => {
    if (wall?.wallStructure === WallStructure.Stud || wall?.wallStructure === WallStructure.Pillar) {
      return (
        <>
          {renderMenuItem(DataType.StructureSpacing)}

          {renderMenuItem(DataType.StructureWidth)}

          {renderMenuItem(DataType.StructureColor)}

          {renderMenuItem(DataType.Opacity)}
        </>
      );
    }
    return null;
  };

  const renderMenuItem = (dataType: DataType) => {
    return (
      <Menu.Item
        key={`wall-${dataType}`}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setApplyCount(0);
          setDataType(dataType);
        }}
      >
        {i18n.t(`wallMenu.${dataType}`, lang)} ...
      </Menu.Item>
    );
  };

  const renderTexture = () => {
    if (wall?.wallStructure === WallStructure.Default) {
      return renderMenuItem(DataType.Texture);
    }
    return null;
  };

  const renderWallColor = () => {
    if (
      (wall?.wallStructure === WallStructure.Default || wall?.opacity === undefined || wall?.opacity > 0) &&
      (wall?.textureType === WallTexture.NoTexture || wall?.textureType === WallTexture.Default)
    ) {
      return renderMenuItem(DataType.Color);
    }
    return null;
  };

  const renderClearItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;

    const titleText = (type: string, count: number) =>
      `${i18n.t(`wallMenu.DoYouReallyWantToRemoveAll${type}sOnThisWall`, lang)} (${count} ${i18n.t(
        `wallMenu.${type}s`,
        lang,
      )})?`;

    const objectTypeText = objectType.replaceAll(' ', '');

    return (
      <Menu.Item
        key={`remove-all-${objectTypeText}s-on-wall`}
        onClick={() => {
          Modal.confirm({
            title: titleText(objectTypeText, count),
            icon: <ExclamationCircleOutlined />,
            onOk: () => {
              handleClearOk(objectType);
            },
          });
        }}
      >
        {i18n.t(`wallMenu.RemoveAllUnlocked${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderLockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`lock-all-${objectTypeText}s-on-wall`}
        onClick={() => {
          if (!wall) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.parentId === wall.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(wall.id, objectType, true);
          const undoableLockAllElementsOfType = {
            name: 'Lock All ' + objectTypeText + ' on Wall',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableLockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(wall.id, objectType, true);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableLockAllElementsOfType);
        }}
      >
        {i18n.t(`wallMenu.LockAll${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderUnlockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`unlock-all-${objectTypeText}s-on-wall`}
        onClick={() => {
          if (!wall) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.parentId === wall.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(wall.id, objectType, false);
          const undoableUnlockAllElementsOfType = {
            name: 'Unlock All ' + objectTypeText + ' on Wall',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableUnlockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(wall.id, objectType, false);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableUnlockAllElementsOfType);
        }}
      >
        {i18n.t(`wallMenu.UnlockAll${objectTypeText}s`, lang)}
      </Menu.Item>
    );
  };

  const renderInsideLightItem = (count: number, inside: boolean) => {
    if (count === 0) return null;
    return (
      <Menu.Item
        key={inside ? `inside-lights-on-wall` : 'outside-lights-on-wall'}
        onClick={() => {
          if (!wall) return;
          const oldValues = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.parentId === wall.id && elem.type === ObjectType.Light) {
              oldValues.set(elem.id, (elem as LightModel).inside);
            }
          }
          updateInsideLightsByParentId(wall.id, inside);
          const undoableInsideLightsOnWall = {
            name: inside ? 'Set All Lights on Wall Inside' : 'Set All Lights on Wall Outside',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: true,
            undo: () => {
              for (const [id, inside] of undoableInsideLightsOnWall.oldValues.entries()) {
                updateInsideLightById(id, inside as boolean);
              }
            },
            redo: () => {
              updateInsideLightsByParentId(wall.id, inside);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableInsideLightsOnWall);
        }}
      >
        {i18n.t(inside ? `wallMenu.AllLightsOnWallInside` : `wallMenu.AllLightsOnWallOutside`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderElementsSubMenu = () => {
    const counterAll = wall ? countAllOffspringsByType(wall.id, true) : new ElementCounter();
    if (counterAll.gotSome() && useStore.getState().contextMenuObjectType) {
      const counterUnlocked = wall ? countAllOffspringsByType(wall.id, false) : new ElementCounter();
      return (
        <SubMenu
          key={'lock-unlock-clear-on-wall'}
          title={i18n.t('word.Elements', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {renderClearItem(ObjectType.Window, counterUnlocked.windowCount)}
          {renderClearItem(ObjectType.Door, counterUnlocked.doorCount)}
          {renderClearItem(ObjectType.SolarPanel, counterUnlocked.solarPanelCount)}
          {renderClearItem(ObjectType.Sensor, counterUnlocked.sensorCount)}
          {renderClearItem(ObjectType.Light, counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount)}
          {renderLockItem(ObjectType.Window, counterUnlocked.windowCount)}
          {renderUnlockItem(ObjectType.Window, counterAll.windowCount)}
          {renderLockItem(ObjectType.SolarPanel, counterUnlocked.solarPanelCount)}
          {renderUnlockItem(ObjectType.SolarPanel, counterAll.solarPanelCount)}
          {renderLockItem(ObjectType.Sensor, counterUnlocked.sensorCount)}
          {renderUnlockItem(ObjectType.Sensor, counterAll.sensorCount)}
          {renderInsideLightItem(counterAll.outsideLightCount, true)}
          {renderInsideLightItem(counterAll.insideLightCount, false)}
        </SubMenu>
      );
    }
    return null;
  };

  const renderDialogs = () => {
    switch (dataType) {
      case DataType.Height:
      case DataType.Opacity:
      case DataType.Thickness:
      case DataType.StructureSpacing:
      case DataType.StructureWidth:
        const setting = DialogSetting[dataType] as NumberDialogSettingType;
        if (!setting) return null;
        return (
          <WallNumberInput
            wall={wall!}
            dataType={dataType}
            attributeKey={setting.attributeKey}
            range={setting.range}
            step={setting.step}
            setDialogVisible={() => setDataType(null)}
            unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
          />
        );
      case DataType.Color:
        return <WallBodyColorSelection setDialogVisible={() => setDataType(null)} />;
      case DataType.StructureColor:
        return <WallStructureColorSelection setDialogVisible={() => setDataType(null)} />;
      case DataType.Texture:
        return <WallTextureSelection setDialogVisible={() => setDataType(null)} />;
    }
  };

  if (!wall) return null;

  return (
    <Menu.ItemGroup>
      {renderPaste()}

      {renderCopy()}

      {renderCut()}

      {renderLock()}

      {!wall.locked && (
        <>
          {renderDialogs()}

          {renderElementsSubMenu()}

          {renderDisplayModeSubMenu()}

          {renderSturctureSubMenu()}

          {renderStructureItems()}

          {renderMenuItem(DataType.Thickness)}

          {renderMenuItem(DataType.Height)}

          {/* r-value has its special UI */}
          {rValueDialogVisible && <WallRValueInput setDialogVisible={setRValueDialogVisible} />}
          <Menu.Item
            key={'wall-r-value'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setRValueDialogVisible(true);
            }}
          >
            {i18n.t('word.RValue', lang)} ...
          </Menu.Item>

          {renderTexture()}

          {renderWallColor()}
        </>
      )}
    </Menu.ItemGroup>
  );
};
