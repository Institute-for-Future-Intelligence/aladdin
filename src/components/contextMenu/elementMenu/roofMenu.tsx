/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Menu, Modal, Radio } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Lock, Paste } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { ObjectType, RoofTexture } from 'src/types';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import { RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import RoofOverhangInput from './roofOverhangInput';
import RoofThicknessInput from './roofThicknessInput';
import RoofRafterSpacingInput from './roofRafterSpacingInput';
import RoofOpacityInput from './roofOpacityInput';
import SubMenu from 'antd/lib/menu/SubMenu';
import GlassTintSelection from './glassTintSelection';
import { UndoableChange } from 'src/undo/UndoableChange';
import RoofRafterColorSelection from './roofRafterColorSelection';
import RoofRafterWidthInput from './roofRafterWidthInput';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import { LightModel } from '../../../models/LightModel';
import RoofSideColorSelection from './roofSideColorSelection';
import RoofRValueInput from './roofRValueInput';
import RoofHeightInput from './roofHeightInput';
import RoofHeatCapacityInput from './roofHeatCapacityInput';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import CeilingRValueInput from './ceilingRValueInput';

export const RoofMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const updateRoofStructureById = useStore(Selector.updateRoofStructureById);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const updateElementUnlockByParentId = useStore(Selector.updateElementLockByParentId);
  const updateInsideLightsByParentId = useStore(Selector.updateInsideLightsByParentId);
  const updateInsideLightById = useStore(Selector.updateInsideLightById);
  const setApplyCount = useStore(Selector.setApplyCount);
  const addUndoable = useStore(Selector.addUndoable);
  const roof = useStore((state) => state.elements.find((e) => e.selected && e.type === ObjectType.Roof)) as RoofModel;

  const [rafterSpacingDialogVisible, setRafterSpacingDialogVisible] = useState(false);
  const [rafterWidthDialogVisible, setRafterWidthDialogVisible] = useState(false);
  const [rafterColorDialogVisible, setRafterColorDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [overhangDialogVisible, setOverhangDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [roofColorDialogVisible, setRoofColorDialogVisible] = useState(false);
  const [roofSideColorDialogVisible, setRoofSideColorDialogVisible] = useState(false);
  const [glassTintDialogVisible, setGlassTintDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [roofRValueDialogVisible, setRoofRValueDialogVisible] = useState(false);
  const [ceilingRValueDialogVisible, setCeilingRValueDialogVisible] = useState(false);
  const [heatCapacityDialogVisible, setHeatCapacityDialogVisible] = useState(false);

  if (!roof) return null;

  const lang = { lng: language };
  const paddingLeft = '36px';
  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      switch (e.type) {
        case ObjectType.SolarPanel:
        case ObjectType.Sensor:
        case ObjectType.Light:
          return true;
      }
    }
    return false;
  };

  const handleClearOk = (objectType: ObjectType) => {
    if (roof) {
      const removed = useStore
        .getState()
        .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === roof.id);
      removeAllChildElementsByType(roof.id, objectType);
      const removedElements = JSON.parse(JSON.stringify(removed));
      const undoableRemoveAllChildren = {
        name: `Remove All ${objectType}s on Roof`,
        timestamp: Date.now(),
        parentId: roof.id,
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

  const renderClearItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const titleText = (type: string, count: number) =>
      `${i18n.t(`roofMenu.DoYouReallyWantToRemoveAll${type}sOnThisRoof`, lang)} (${count} ${i18n.t(
        `roofMenu.${type}s`,
        lang,
      )})?`;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`remove-all-${objectTypeText}s-on-roof`}
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
        {i18n.t(`roofMenu.RemoveAllUnlocked${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderLockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`lock-all-${objectTypeText}s-on-roof`}
        onClick={() => {
          if (!roof) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of useStore.getState().elements) {
            if (elem.parentId === roof.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(roof.id, objectType, true);
          const undoableLockAllElementsOfType = {
            name: 'Lock All ' + objectTypeText + ' on Roof',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableLockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(roof.id, objectType, true);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableLockAllElementsOfType);
        }}
      >
        {i18n.t(`roofMenu.LockAll${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderUnlockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`unlock-all-${objectTypeText}s-on-roof`}
        onClick={() => {
          if (!roof) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of useStore.getState().elements) {
            if (elem.parentId === roof.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(roof.id, objectType, false);
          const undoableUnlockAllElementsOfType = {
            name: 'Unlock All ' + objectTypeText + ' on Roof',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableUnlockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(roof.id, objectType, false);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableUnlockAllElementsOfType);
        }}
      >
        {i18n.t(`roofMenu.UnlockAll${objectTypeText}s`, lang)}
      </Menu.Item>
    );
  };

  const renderInsideLightItem = (count: number, inside: boolean) => {
    if (count === 0) return null;
    return (
      <Menu.Item
        key={inside ? `inside-lights-on-roof` : 'outside-lights-on-roof'}
        onClick={() => {
          if (!roof) return;
          const oldValues = new Map<string, boolean>();
          for (const elem of useStore.getState().elements) {
            if (elem.parentId === roof.id && elem.type === ObjectType.Light) {
              oldValues.set(elem.id, (elem as LightModel).inside);
            }
          }
          updateInsideLightsByParentId(roof.id, inside);
          const undoableInsideLightsOnRoof = {
            name: inside ? 'Set All Lights on Roof Inside' : 'Set All Lights on Roof Outside',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: true,
            undo: () => {
              for (const [id, inside] of undoableInsideLightsOnRoof.oldValues.entries()) {
                updateInsideLightById(id, inside as boolean);
              }
            },
            redo: () => {
              updateInsideLightsByParentId(roof.id, inside);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableInsideLightsOnRoof);
        }}
      >
        {i18n.t(inside ? `roofMenu.AllLightsOnRoofInside` : `roofMenu.AllLightsOnRoofOutside`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderElementsSubMenu = () => {
    const counterAll = roof ? countAllOffspringsByType(roof.id, true) : new ElementCounter();
    if (counterAll.gotSome() && useStore.getState().contextMenuObjectType) {
      const counterUnlocked = roof ? countAllOffspringsByType(roof.id, false) : new ElementCounter();
      return (
        <SubMenu
          key={'lock-unlock-clear-on-roof'}
          title={i18n.t('word.Elements', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {renderClearItem(ObjectType.SolarPanel, counterUnlocked.solarPanelCount)}
          {renderClearItem(ObjectType.Sensor, counterUnlocked.sensorCount)}
          {renderClearItem(ObjectType.Light, counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount)}
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

  const updateRoofCeiling = (roofId: string, b: boolean) => {
    useStore.getState().set((state) => {
      const roof = state.elements.find((e) => e.id === roofId && e.type === ObjectType.Roof) as RoofModel;
      if (roof) {
        roof.ceiling = b;
        state.actionState.roofCeiling = b;
      }
    });
  };

  return (
    <Menu.ItemGroup>
      {legalToPaste() && <Paste keyName={'roof-paste'} />}
      <Lock keyName={'roof-lock'} />

      <Menu.Item key={'roof-ceiling'}>
        <Checkbox
          checked={roof.ceiling}
          onChange={(e) => {
            const checked = e.target.checked;
            const undoableCheck = {
              name: 'Roof Ceiling',
              timestamp: Date.now(),
              checked: checked,
              selectedElementId: roof.id,
              selectedElementType: roof.type,
              undo: () => {
                updateRoofCeiling(roof.id, !undoableCheck.checked);
              },
              redo: () => {
                updateRoofCeiling(roof.id, undoableCheck.checked);
              },
            } as UndoableCheck;
            addUndoable(undoableCheck);
            updateRoofCeiling(roof.id, checked);
          }}
        >
          {i18n.t('roofMenu.Ceiling', { lng: language })}
        </Checkbox>
      </Menu.Item>

      {renderElementsSubMenu()}

      {!roof.locked && roof.roofType === RoofType.Gable && (
        <SubMenu key={'roof-structure'} title={i18n.t('roofMenu.RoofStructure', lang)} style={{ paddingLeft: '24px' }}>
          <Radio.Group
            value={roof.roofStructure ?? RoofStructure.Default}
            style={{ height: '110px', paddingTop: '0' }}
            onChange={(e) => {
              const undoableChange = {
                name: 'Select Roof Structure',
                timestamp: Date.now(),
                oldValue: roof.roofStructure ?? RoofStructure.Default,
                newValue: e.target.value,
                changedElementId: roof.id,
                changedElementType: roof.type,
                undo: () => {
                  updateRoofStructureById(undoableChange.changedElementId, undoableChange.oldValue as RoofStructure);
                },
                redo: () => {
                  updateRoofStructureById(undoableChange.changedElementId, undoableChange.newValue as RoofStructure);
                },
              } as UndoableChange;
              addUndoable(undoableChange);
              updateRoofStructureById(roof.id, e.target.value);
              setCommonStore((state) => {
                state.actionState.roofStructure = e.target.value;
              });
            }}
          >
            <Radio style={radioStyle} value={RoofStructure.Default}>
              {i18n.t('roofMenu.DefaultStructure', lang)}
            </Radio>
            <Radio style={radioStyle} value={RoofStructure.Rafter}>
              {i18n.t('roofMenu.RafterStructure', lang)}
            </Radio>
            <Radio style={radioStyle} value={RoofStructure.Glass}>
              {i18n.t('roofMenu.GlassStructure', lang)}
            </Radio>
          </Radio.Group>
        </SubMenu>
      )}

      {!roof.locked && (
        <>
          {(roof.roofStructure === RoofStructure.Rafter || roof.roofStructure === RoofStructure.Glass) && (
            <>
              {opacityDialogVisible && <RoofOpacityInput setDialogVisible={setOpacityDialogVisible} />}
              <Menu.Item
                key={'roof-opacityInput'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setOpacityDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.Opacity', lang)} ...
              </Menu.Item>
            </>
          )}

          {roof.roofStructure === RoofStructure.Rafter && roof.roofType === RoofType.Gable && (
            <>
              {rafterColorDialogVisible && <RoofRafterColorSelection setDialogVisible={setRafterColorDialogVisible} />}
              <Menu.Item
                key={'roof-rafter-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setRafterColorDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.RafterColor', lang)} ...
              </Menu.Item>

              {rafterSpacingDialogVisible && (
                <RoofRafterSpacingInput setDialogVisible={setRafterSpacingDialogVisible} />
              )}
              <Menu.Item
                key={'roof-rafter-spacing'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setRafterSpacingDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.RafterSpacing', lang)} ...
              </Menu.Item>

              {rafterWidthDialogVisible && <RoofRafterWidthInput setDialogVisible={setRafterWidthDialogVisible} />}
              <Menu.Item
                key={'roof-rafter-width'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setRafterWidthDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.RafterWidth', lang)} ...
              </Menu.Item>
            </>
          )}

          {thicknessDialogVisible && <RoofThicknessInput setDialogVisible={setThicknessDialogVisible} />}
          <Menu.Item
            key={'roof-thickness'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setThicknessDialogVisible(true);
            }}
          >
            {i18n.t(roof.roofStructure === RoofStructure.Rafter ? 'roofMenu.RafterThickness' : 'word.Thickness', lang)}{' '}
            ...
          </Menu.Item>

          {roof.roofStructure === RoofStructure.Glass && roof.roofType === RoofType.Gable && (
            <>
              {glassTintDialogVisible && <GlassTintSelection setDialogVisible={setGlassTintDialogVisible} />}
              <Menu.Item
                key={'roof-glass-tint-selection'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setGlassTintDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.GlassTint', lang)} ...
              </Menu.Item>
            </>
          )}

          {heightDialogVisible && <RoofHeightInput setDialogVisible={setHeightDialogVisible} />}
          <Menu.Item
            key={'roof-height'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setHeightDialogVisible(true);
            }}
          >
            {i18n.t('word.Height', lang)} ...
          </Menu.Item>

          {overhangDialogVisible && <RoofOverhangInput setDialogVisible={setOverhangDialogVisible} />}
          <Menu.Item
            key={'roof-overhang'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setOverhangDialogVisible(true);
            }}
          >
            {i18n.t('roofMenu.EavesOverhangLength', lang)} ...
          </Menu.Item>

          {(roof.roofStructure !== RoofStructure.Rafter || roof.opacity === undefined || roof.opacity > 0) && (
            <>
              {roofRValueDialogVisible && <RoofRValueInput setDialogVisible={setRoofRValueDialogVisible} />}
              <Menu.Item
                key={'roof-r-value'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setRoofRValueDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.RoofRValue', lang)} ...
              </Menu.Item>
              {roof.ceiling && ceilingRValueDialogVisible && (
                <CeilingRValueInput setDialogVisible={setCeilingRValueDialogVisible} />
              )}
              {roof.ceiling && (
                <Menu.Item
                  key={'ceiling-r-value'}
                  style={{ paddingLeft: '36px' }}
                  onClick={() => {
                    setApplyCount(0);
                    setCeilingRValueDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.CeilingRValue', lang)} ...
                </Menu.Item>
              )}
              {heatCapacityDialogVisible && <RoofHeatCapacityInput setDialogVisible={setHeatCapacityDialogVisible} />}
              <Menu.Item
                key={'roof-heat-capacity'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setHeatCapacityDialogVisible(true);
                }}
              >
                {i18n.t('word.VolumetricHeatCapacity', lang)} ...
              </Menu.Item>
            </>
          )}

          {roof.roofStructure !== RoofStructure.Rafter && (
            <>
              {textureDialogVisible && <RoofTextureSelection setDialogVisible={setTextureDialogVisible} />}
              <Menu.Item
                key={'roof-texture'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setTextureDialogVisible(true);
                }}
              >
                {i18n.t('word.Texture', lang)} ...
              </Menu.Item>
            </>
          )}

          {(roof.roofStructure !== RoofStructure.Rafter || roof.opacity === undefined || roof.opacity > 0) && (
            <>
              {roofColorDialogVisible && <RoofColorSelection setDialogVisible={setRoofColorDialogVisible} />}
              {(roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) && (
                <Menu.Item
                  key={'roof-color'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setRoofColorDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.RoofColor', lang)} ...
                </Menu.Item>
              )}
              {roofSideColorDialogVisible && (
                <RoofSideColorSelection setDialogVisible={setRoofSideColorDialogVisible} />
              )}
              <Menu.Item
                key={'roof-side-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setRoofSideColorDialogVisible(true);
                }}
              >
                {i18n.t('roofMenu.RoofSideColor', lang)} ...
              </Menu.Item>
            </>
          )}
        </>
      )}
    </Menu.ItemGroup>
  );
});
