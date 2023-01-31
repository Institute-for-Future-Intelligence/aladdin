/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Modal, Radio, Space } from 'antd';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { FoundationTexture, ObjectType, SolarStructure } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import FoundationColorSelection from './foundationColorSelection';
import FoundationLengthInput from './foundationLengthInput';
import FoundationWidthInput from './foundationWidthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import FoundationTextureSelection from './foundationTextureSelection';
import { FoundationModel } from '../../../models/FoundationModel';
import { UndoableAdd } from '../../../undo/UndoableAdd';
import { Vector3 } from 'three';
import { UNIT_VECTOR_POS_Z } from '../../../constants';
import { UndoableChange } from '../../../undo/UndoableChange';
import { ElementCounter } from '../../../stores/ElementCounter';
import SolarAbsorberPipeHeightInput from './solarAbsorberPipeHeightInput';
import SolarAbsorberPipeAbsorptanceInput from './solarAbsorberPipeAbsorptanceInput';
import SolarAbsorberPipeOpticalEfficiencyInput from './solarAbsorberPipeOpticalEfficiencyInput';
import SolarAbsorberPipeThermalEfficiencyInput from './solarAbsorberPipeThermalEfficiencyInput';
import SolarAbsorberPipeApertureWidthInput from './solarAbsorberPipeApertureWidthInput';
import SolarAbsorberPipePoleNumberInput from './solarAbsorberPipePoleNumberInput';
import SolarUpdraftTowerChimneyHeightInput from './solarUpdraftTowerChimneyHeightInput';
import SolarUpdraftTowerChimneyRadiusInput from './solarUpdraftTowerChimneyRadiusInput';
import SolarUpdraftTowerCollectorRadiusInput from './solarUpdraftTowerCollectorRadiusInput';
import SolarUpdraftTowerCollectorHeightInput from './solarUpdraftTowerCollectorHeightInput';
import SolarPowerTowerHeightInput from './solarPowerTowerHeightInput';
import SolarPowerTowerRadiusInput from './solarPowerTowerRadiusInput';
import SolarPowerTowerReceiverAbsorptanceInput from './solarPowerTowerReceiverAbsorptanceInput';
import SolarPowerTowerReceiverOpticalEfficiencyInput from './solarPowerTowerReceiverOpticalEfficiencyInput';
import SolarPowerTowerReceiverThermalEfficiencyInput from './solarPowerTowerReceiverThermalEfficiencyInput';
import SolarUpdraftTowerCollectorTransmissivityInput from './solarUpdraftTowerCollectorTransmissivityInput';
import SolarUpdraftTowerDischargeCoefficientInput from './solarUpdraftTowerDischargeCoefficientInput';
import SolarUpdraftTowerTurbineEfficiencyInput from './solarUpdraftTowerTurbineEfficiencyInput';
import SolarUpdraftTowerCollectorEmissivityInput from './solarUpdraftTowerCollectorEmissivityInput';
import SolarPanelTiltAngleGaWizard from './solarPanelTiltAngleGaWizard';
import SolarPanelTiltAnglePsoWizard from './solarPanelTiltAnglePsoWizard';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import FloorRValueInput from './floorRValueInput';
import { Util } from '../../../Util';
import { useLabel, useLabelHeight, useLabelShow, useLabelSize, useLabelText } from './menuHooks';

export const FoundationMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const removeAllElementsOnFoundationByType = useStore(Selector.removeAllElementsOnFoundationByType);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const updateElementLockByFoundationId = useStore(Selector.updateElementLockByFoundationId);
  const updateFoundationThermostatSetpointById = useStore(Selector.updateFoundationThermostatSetpointById);
  const updateFoundationTemperatureThresholdById = useStore(Selector.updateFoundationTemperatureThresholdById);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setApplyCount = useStore(Selector.setApplyCount);
  const updateFoundationSolarStructureById = useStore(Selector.updateFoundationSolarStructureById);
  const language = useStore(Selector.language);
  const elementsToPaste = useStore(Selector.elementsToPaste);

  const foundation = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Foundation),
  ) as FoundationModel;

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);
  const [rValueDialogVisible, setRValueDialogVisible] = useState(false);

  const [solarAbsorberPipeHeightDialogVisible, setSolarAbsorberPipeHeightDialogVisible] = useState(false);
  const [solarAbsorberPipeApertureWidthDialogVisible, setSolarAbsorberPipeApertureWidthDialogVisible] = useState(false);
  const [solarAbsorberPipePoleNumberDialogVisible, setSolarAbsorberPipePoleNumberDialogVisible] = useState(false);
  const [solarAbsorberPipeAbsorptanceDialogVisible, setSolarAbsorberPipeAbsorptanceDialogVisible] = useState(false);
  const [solarAbsorberPipeOpticalEfficiencyDialogVisible, setSolarAbsorberPipeOpticalEfficiencyDialogVisible] =
    useState(false);
  const [solarAbsorberPipeThermalEfficiencyDialogVisible, setSolarAbsorberPipeThermalEfficiencyDialogVisible] =
    useState(false);

  const [solarPowerTowerHeightDialogVisible, setSolarPowerTowerHeightDialogVisible] = useState(false);
  const [solarPowerTowerRadiusDialogVisible, setSolarPowerTowerRadiusDialogVisible] = useState(false);
  const [solarPowerTowerReceiverAbsorptanceDialogVisible, setSolarPowerTowerReceiverAbsorptanceDialogVisible] =
    useState(false);
  const [
    solarPowerTowerReceiverOpticalEfficiencyDialogVisible,
    setSolarPowerTowerReceiverOpticalEfficiencyDialogVisible,
  ] = useState(false);
  const [
    solarPowerTowerReceiverThermalEfficiencyDialogVisible,
    setSolarPowerTowerReceiverThermalEfficiencyDialogVisible,
  ] = useState(false);

  const [chimneyHeightDialogVisible, setChimneyHeightDialogVisible] = useState(false);
  const [chimneyRadiusDialogVisible, setChimneyRadiusDialogVisible] = useState(false);
  const [collectorHeightDialogVisible, setCollectorHeightDialogVisible] = useState(false);
  const [collectorRadiusDialogVisible, setCollectorRadiusDialogVisible] = useState(false);
  const [collectorTransmissivityDialogVisible, setCollectorTransmissivityDialogVisible] = useState(false);
  const [collectorEmissivityDialogVisible, setCollectorEmissivityDialogVisible] = useState(false);
  const [dischargeCoefficientDialogVisible, setDischargeCoefficientDialogVisible] = useState(false);
  const [turbineEfficiencyDialogVisible, setTurbineEfficiencyDialogVisible] = useState(false);
  const [solarPanelTiltAngleGaWizardVisible, setSolarPanelTiltAngleGaWizardVisible] = useState(false);
  const [solarPanelTiltAnglePsoWizardVisible, setSolarPanelTiltAnglePsoWizardVisible] = useState(false);

  const { labelText, setLabelText } = useLabel(foundation);
  const showLabel = useLabelShow(foundation);
  const updateLabelText = useLabelText(foundation, labelText);
  const setLabelSize = useLabelSize(foundation);
  const setLabelHeight = useLabelHeight(foundation);

  if (!foundation) return null;

  const selectedSolarStructure = foundation?.solarStructure ?? SolarStructure.None;
  const counterAll = foundation ? countAllOffspringsByType(foundation.id, true) : new ElementCounter();
  const counterUnlocked = foundation ? countAllOffspringsByType(foundation.id, false) : new ElementCounter();
  const lang = { lng: language };
  const editable = !foundation?.locked;

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      // when there are multiple elements to paste, the first element is the parent
      // we check the legality of the parent here
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Flower ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.Light ||
        e.type === ObjectType.SolarPanel ||
        e.type === ObjectType.WaterHeater ||
        e.type === ObjectType.ParabolicDish ||
        e.type === ObjectType.Heliostat ||
        e.type === ObjectType.FresnelReflector ||
        e.type === ObjectType.ParabolicTrough ||
        e.type === ObjectType.WindTurbine ||
        e.type === ObjectType.Wall
      ) {
        return true;
      }
    }
    return false;
  };

  const isBuilding = Util.isCompleteBuilding(foundation, elements);

  return (
    <Menu.ItemGroup>
      {legalToPaste() && <Paste keyName={'foundation-paste'} />}
      <Copy keyName={'foundation-copy'} />
      {editable && <Cut keyName={'foundation-cut'} />}
      <Lock keyName={'foundation-lock'} />

      <Menu.Item>
        <Checkbox
          checked={foundation.enableGroupMaster}
          onChange={(e) => {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === foundation.id) {
                  (e as FoundationModel).enableGroupMaster = !(e as FoundationModel).enableGroupMaster;
                  break;
                }
              }
              state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
            });
          }}
        >
          {i18n.t('foundationMenu.GroupMaster', { lng: language })}
        </Checkbox>
      </Menu.Item>

      {counterAll.gotSome() && (
        <SubMenu
          key={'lock-unlock-clear-on-foundation'}
          title={i18n.t('word.Elements', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {counterUnlocked.gotSome() && (
            <Menu.Item
              key={'lock-all-offsprings'}
              onClick={() => {
                const oldLocks = new Map<string, boolean>();
                for (const elem of useStore.getState().elements) {
                  if (elem.foundationId === foundation.id || elem.id === foundation.id) {
                    oldLocks.set(elem.id, !!elem.locked);
                  }
                }
                updateElementLockByFoundationId(foundation.id, true);
                const undoableLockAllElements = {
                  name: 'Lock All Offsprings',
                  timestamp: Date.now(),
                  oldValues: oldLocks,
                  newValue: true,
                  undo: () => {
                    for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
                      updateElementLockById(id, locked as boolean);
                    }
                  },
                  redo: () => {
                    updateElementLockByFoundationId(foundation.id, true);
                  },
                } as UndoableChangeGroup;
                addUndoable(undoableLockAllElements);
              }}
            >
              {i18n.t('foundationMenu.LockAllElementsOnThisFoundation', lang)}
            </Menu.Item>
          )}
          <Menu.Item
            key={'unlock-all-offsprings'}
            onClick={() => {
              const oldLocks = new Map<string, boolean>();
              for (const elem of useStore.getState().elements) {
                if (elem.foundationId === foundation.id || elem.id === foundation.id) {
                  oldLocks.set(elem.id, !!elem.locked);
                }
              }
              updateElementLockByFoundationId(foundation.id, false);
              const undoableLockAllElements = {
                name: 'Unlock All Offsprings',
                timestamp: Date.now(),
                oldValues: oldLocks,
                newValue: true,
                undo: () => {
                  for (const [id, locked] of undoableLockAllElements.oldValues.entries()) {
                    updateElementLockById(id, locked as boolean);
                  }
                },
                redo: () => {
                  updateElementLockByFoundationId(foundation.id, false);
                },
              } as UndoableChangeGroup;
              addUndoable(undoableLockAllElements);
            }}
          >
            {i18n.t('foundationMenu.UnlockAllElementsOnThisFoundation', lang)}
          </Menu.Item>
          {counterUnlocked.wallCount > 0 && (
            <Menu.Item
              key={'remove-all-walls-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWallsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.wallCount +
                    ' ' +
                    i18n.t('foundationMenu.Walls', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const wallsIdSet = new Set();
                      useStore.getState().elements.forEach((e) => {
                        if (
                          !e.locked &&
                          e.type === ObjectType.Wall &&
                          (e.parentId === foundation.id || e.foundationId === foundation.id)
                        ) {
                          wallsIdSet.add(e.id);
                        }
                      });
                      const removed = useStore
                        .getState()
                        .elements.filter((e) => wallsIdSet.has(e.id) || wallsIdSet.has(e.parentId));
                      setCommonStore((state) => {
                        state.elements = state.elements.filter(
                          (e) => !wallsIdSet.has(e.id) && !wallsIdSet.has(e.parentId),
                        );
                      });
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllWallChildren = {
                        name: 'Remove All Walls on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllWallChildren.removedElements);
                            state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                          });
                        },
                        redo: () => {
                          const wallsIdSet = new Set();
                          useStore.getState().elements.forEach((e) => {
                            if (
                              !e.locked &&
                              e.type === ObjectType.Wall &&
                              e.parentId === undoableRemoveAllWallChildren.parentId
                            ) {
                              wallsIdSet.add(e.id);
                            }
                          });
                          setCommonStore((state) => {
                            state.elements = state.elements.filter(
                              (e) => !wallsIdSet.has(e.id) && !wallsIdSet.has(e.parentId),
                            );
                          });
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllWallChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedWalls', lang)} ({counterUnlocked.wallCount})
            </Menu.Item>
          )}

          {counterUnlocked.windowCount > 0 && (
            <Menu.Item
              key={'remove-all-windows-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWindowsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.windowCount +
                    ' ' +
                    i18n.t('foundationMenu.Windows', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Window && e.foundationId === foundation.id,
                        );
                      removeAllElementsOnFoundationByType(foundation.id, ObjectType.Window);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllWindowGrandchildren = {
                        name: 'Remove All Windows on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllWindowGrandchildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllElementsOnFoundationByType(
                            undoableRemoveAllWindowGrandchildren.parentId,
                            ObjectType.Window,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllWindowGrandchildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedWindows', lang)} ({counterUnlocked.windowCount})
            </Menu.Item>
          )}

          {counterUnlocked.doorCount > 0 && (
            <Menu.Item
              key={'remove-all-doors-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllDoorsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.doorCount +
                    ' ' +
                    i18n.t('foundationMenu.Doors', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Door && e.foundationId === foundation.id,
                        );
                      removeAllElementsOnFoundationByType(foundation.id, ObjectType.Door);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllDoorGrandchildren = {
                        name: 'Remove All Doors on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllDoorGrandchildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllElementsOnFoundationByType(
                            undoableRemoveAllDoorGrandchildren.parentId,
                            ObjectType.Door,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllDoorGrandchildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedDoors', lang)} ({counterUnlocked.doorCount})
            </Menu.Item>
          )}

          {counterUnlocked.sensorCount > 0 && (
            <Menu.Item
              key={'remove-all-sensors-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSensorsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.sensorCount +
                    ' ' +
                    i18n.t('foundationMenu.Sensors', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Sensor && e.foundationId === foundation.id,
                        );
                      removeAllElementsOnFoundationByType(foundation.id, ObjectType.Sensor);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSensorChildren = {
                        name: 'Remove All Sensors on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllSensorChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllElementsOnFoundationByType(
                            undoableRemoveAllSensorChildren.parentId,
                            ObjectType.Sensor,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllSensorChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedSensors', lang)} ({counterUnlocked.sensorCount})
            </Menu.Item>
          )}

          {counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount > 0 && (
            <Menu.Item
              key={'remove-all-lights-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllLightsOnFoundation', lang) +
                    ' (' +
                    (counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount) +
                    ' ' +
                    i18n.t('foundationMenu.Lights', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Light && e.foundationId === foundation.id,
                        );
                      removeAllElementsOnFoundationByType(foundation.id, ObjectType.Light);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllLightChildren = {
                        name: 'Remove All Lights on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllLightChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllElementsOnFoundationByType(
                            undoableRemoveAllLightChildren.parentId,
                            ObjectType.Light,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllLightChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedLights', lang)} (
              {counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount})
            </Menu.Item>
          )}

          {counterUnlocked.solarPanelCount > 0 && (
            <Menu.Item
              key={'remove-all-solar-panels-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSolarPanelsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.solarPanelModuleCount +
                    ' ' +
                    i18n.t('foundationMenu.SolarPanels', lang) +
                    ', ' +
                    counterUnlocked.solarPanelCount +
                    ' ' +
                    i18n.t('foundationMenu.Racks', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.SolarPanel && e.foundationId === foundation.id,
                        );
                      removeAllElementsOnFoundationByType(foundation.id, ObjectType.SolarPanel);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllSolarPanelChildren = {
                        name: 'Remove All Solar Panels on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllSolarPanelChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllElementsOnFoundationByType(
                            undoableRemoveAllSolarPanelChildren.parentId,
                            ObjectType.SolarPanel,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllSolarPanelChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; (
              {counterUnlocked.solarPanelModuleCount} {i18n.t('foundationMenu.SolarPanels', lang)},{' '}
              {counterUnlocked.solarPanelCount} {i18n.t('foundationMenu.Racks', lang)})
            </Menu.Item>
          )}

          {counterUnlocked.parabolicTroughCount > 0 && (
            <Menu.Item
              key={'remove-all-parabolic-troughs-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicTroughsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.parabolicTroughCount +
                    ' ' +
                    i18n.t('foundationMenu.ParabolicTroughs', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicTrough && e.foundationId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.ParabolicTrough);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllParabolicTroughChildren = {
                        name: 'Remove All Parabolic Troughs on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllParabolicTroughChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(
                            undoableRemoveAllParabolicTroughChildren.parentId,
                            ObjectType.ParabolicTrough,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllParabolicTroughChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedParabolicTroughs', lang)} ({counterUnlocked.parabolicTroughCount}
              )
            </Menu.Item>
          )}

          {counterUnlocked.parabolicDishCount > 0 && (
            <Menu.Item
              key={'remove-all-parabolic-dishes-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicDishesOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.parabolicDishCount +
                    ' ' +
                    i18n.t('foundationMenu.ParabolicDishes', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicDish && e.foundationId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.ParabolicDish);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllParabolicDishChildren = {
                        name: 'Remove All Parabolic Dishes on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllParabolicDishChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(
                            undoableRemoveAllParabolicDishChildren.parentId,
                            ObjectType.ParabolicDish,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllParabolicDishChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedParabolicDishes', lang)} ({counterUnlocked.parabolicDishCount})
            </Menu.Item>
          )}

          {counterUnlocked.fresnelReflectorCount > 0 && (
            <Menu.Item
              key={'remove-all-fresnel-reflector-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllFresnelReflectorsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.fresnelReflectorCount +
                    ' ' +
                    i18n.t('foundationMenu.FresnelReflectors', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) =>
                            !e.locked && e.type === ObjectType.FresnelReflector && e.foundationId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.FresnelReflector);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllFresnelReflectorChildren = {
                        name: 'Remove All Fresnel Reflectors on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllFresnelReflectorChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(
                            undoableRemoveAllFresnelReflectorChildren.parentId,
                            ObjectType.FresnelReflector,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllFresnelReflectorChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedFresnelReflectors', lang)} (
              {counterUnlocked.fresnelReflectorCount})
            </Menu.Item>
          )}

          {counterUnlocked.heliostatCount > 0 && (
            <Menu.Item
              key={'remove-all-heliostats-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHeliostatsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.heliostatCount +
                    ' ' +
                    i18n.t('foundationMenu.Heliostats', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Heliostat && e.foundationId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.Heliostat);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllHeliostatChildren = {
                        name: 'Remove All Heliostats on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllHeliostatChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(
                            undoableRemoveAllHeliostatChildren.parentId,
                            ObjectType.Heliostat,
                          );
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllHeliostatChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedHeliostats', lang)} ({counterUnlocked.heliostatCount})
            </Menu.Item>
          )}

          {counterUnlocked.polygonCount > 0 && (
            <Menu.Item
              key={'remove-all-polygons-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllPolygonsOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.polygonCount +
                    ' ' +
                    i18n.t('foundationMenu.Polygons', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Polygon && e.foundationId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.Polygon);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllPolygonChildren = {
                        name: 'Remove All Polygons on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllPolygonChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(undoableRemoveAllPolygonChildren.parentId, ObjectType.Polygon);
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllPolygonChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedPolygons', lang)} ({counterUnlocked.polygonCount})
            </Menu.Item>
          )}

          {counterUnlocked.humanCount > 0 && (
            <Menu.Item
              key={'remove-all-humans-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHumansOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.humanCount +
                    ' ' +
                    i18n.t('foundationMenu.Humans', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Human && e.parentId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.Human);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllHumanChildren = {
                        name: 'Remove All Humans on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllHumanChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(undoableRemoveAllHumanChildren.parentId, ObjectType.Human);
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllHumanChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedHumans', lang)} ({counterUnlocked.humanCount})
            </Menu.Item>
          )}

          {counterUnlocked.treeCount > 0 && (
            <Menu.Item
              key={'remove-all-trees-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllTreesOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.treeCount +
                    ' ' +
                    i18n.t('foundationMenu.Trees', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Tree && e.parentId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.Tree);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllTreeChildren = {
                        name: 'Remove All Trees on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllTreeChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(undoableRemoveAllTreeChildren.parentId, ObjectType.Tree);
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllTreeChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedTrees', lang)} ({counterUnlocked.treeCount})
            </Menu.Item>
          )}

          {counterUnlocked.flowerCount > 0 && (
            <Menu.Item
              key={'remove-all-flowers-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    i18n.t('foundationMenu.DoYouReallyWantToRemoveAllFlowersOnFoundation', lang) +
                    ' (' +
                    counterUnlocked.flowerCount +
                    ' ' +
                    i18n.t('foundationMenu.Flowers', lang) +
                    ')?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (foundation) {
                      const removed = useStore
                        .getState()
                        .elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Flower && e.parentId === foundation.id,
                        );
                      removeAllChildElementsByType(foundation.id, ObjectType.Flower);
                      const removedElements = JSON.parse(JSON.stringify(removed));
                      const undoableRemoveAllFlowerChildren = {
                        name: 'Remove All Flowers on Foundation',
                        timestamp: Date.now(),
                        parentId: foundation.id,
                        removedElements: removedElements,
                        undo: () => {
                          setCommonStore((state) => {
                            state.elements.push(...undoableRemoveAllFlowerChildren.removedElements);
                          });
                        },
                        redo: () => {
                          removeAllChildElementsByType(undoableRemoveAllFlowerChildren.parentId, ObjectType.Flower);
                        },
                      } as UndoableRemoveAllChildren;
                      addUndoable(undoableRemoveAllFlowerChildren);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllUnlockedFlowers', lang)} ({counterUnlocked.flowerCount})
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {editable && (!foundation.textureType || foundation.textureType === FoundationTexture.NoTexture) && (
        <>
          {colorDialogVisible && <FoundationColorSelection setDialogVisible={setColorDialogVisible} />}
          <Menu.Item
            key={'foundation-color'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setColorDialogVisible(true);
            }}
          >
            {i18n.t('word.Color', lang)} ...
          </Menu.Item>
        </>
      )}

      {editable && (
        <>
          {textureDialogVisible && <FoundationTextureSelection setDialogVisible={setTextureDialogVisible} />}
          <Menu.Item
            key={'foundation-texture'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setTextureDialogVisible(true);
            }}
          >
            {i18n.t('word.Texture', lang)} ...
          </Menu.Item>

          {lengthDialogVisible && <FoundationLengthInput setDialogVisible={setLengthDialogVisible} />}
          <Menu.Item
            key={'foundation-length'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {widthDialogVisible && <FoundationWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'foundation-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {heightDialogVisible && <FoundationHeightInput setDialogVisible={setHeightDialogVisible} />}
          <Menu.Item
            key={'foundation-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setHeightDialogVisible(true);
            }}
          >
            {i18n.t('word.Height', lang)} ...
          </Menu.Item>

          {azimuthDialogVisible && <FoundationAzimuthInput setDialogVisible={setAzimuthDialogVisible} />}
          <Menu.Item
            key={'foundation-azimuth'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setAzimuthDialogVisible(true);
            }}
          >
            {i18n.t('word.Azimuth', lang)} ...
          </Menu.Item>

          {isBuilding && rValueDialogVisible && <FloorRValueInput setDialogVisible={setRValueDialogVisible} />}
          {isBuilding && (
            <Menu.Item
              key={'floor-r-value'}
              style={{ paddingLeft: '36px' }}
              onClick={() => {
                setApplyCount(0);
                setRValueDialogVisible(true);
              }}
            >
              {i18n.t('foundationMenu.FloorRValue', lang)} ...
            </Menu.Item>
          )}
        </>
      )}

      <Menu.Item
        style={{ paddingLeft: '36px' }}
        key={'add-polygon-on-foundation'}
        onClick={() => {
          if (foundation) {
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.Polygon;
            });
            const element = addElement(
              foundation,
              new Vector3(foundation.cx, foundation.cy, foundation.lz),
              UNIT_VECTOR_POS_Z,
            );
            const undoableAdd = {
              name: 'Add',
              timestamp: Date.now(),
              addedElement: element,
              undo: () => {
                removeElementById(undoableAdd.addedElement.id, false);
              },
              redo: () => {
                setCommonStore((state) => {
                  state.elements.push(undoableAdd.addedElement);
                  state.selectedElement = undoableAdd.addedElement;
                });
              },
            } as UndoableAdd;
            addUndoable(undoableAdd);
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
            });
          }
        }}
      >
        {i18n.t('foundationMenu.AddPolygon', lang)}
      </Menu.Item>

      {editable && (
        <SubMenu
          key={'building-hvac-system'}
          title={i18n.t('word.BuildingHVACSystem', lang)}
          style={{ paddingLeft: '24px' }}
        >
          <Menu>
            <Menu.Item key={'thermostat-temperature'}>
              <Space style={{ width: '160px' }}>{i18n.t('word.ThermostatSetpoint', lang) + ':'}</Space>
              <InputNumber
                min={0}
                max={30}
                step={1}
                style={{ width: 60 }}
                precision={1}
                value={foundation.hvacSystem?.thermostatSetpoint ?? 20}
                onChange={(value) => {
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
                  addUndoable(undoableChange);
                  updateFoundationThermostatSetpointById(foundation.id, newValue);
                }}
              />
              <Space style={{ paddingLeft: '10px' }}>°C</Space>
            </Menu.Item>

            <Menu.Item key={'tolerance-threshold'}>
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
                onChange={(value) => {
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
                  addUndoable(undoableChange);
                  updateFoundationTemperatureThresholdById(foundation.id, newValue);
                }}
              />
              <Space style={{ paddingLeft: '10px' }}>°C</Space>
            </Menu.Item>
          </Menu>
        </SubMenu>
      )}

      {editable && (
        <SubMenu
          key={'select-solar-structure'}
          title={i18n.t('foundationMenu.SelectSolarStructure', lang)}
          style={{ paddingLeft: '24px' }}
        >
          <Radio.Group
            value={selectedSolarStructure}
            style={{ paddingLeft: '12px' }}
            onChange={(e) => {
              if (foundation) {
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
                    updateFoundationSolarStructureById(
                      undoableChange.changedElementId,
                      undoableChange.oldValue as SolarStructure,
                    );
                  },
                  redo: () => {
                    updateFoundationSolarStructureById(
                      undoableChange.changedElementId,
                      undoableChange.newValue as SolarStructure,
                    );
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                updateFoundationSolarStructureById(foundation.id, newValue);
              }
            }}
          >
            <Space direction="vertical">
              <Radio value={SolarStructure.None}>{i18n.t('word.None', lang)}</Radio>
              <Radio value={SolarStructure.FocusPipe}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberPipeForFresnelReflectors', lang)}
              </Radio>
              <Radio value={SolarStructure.FocusTower}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerForHeliostats', lang)}
              </Radio>
              <Radio value={SolarStructure.UpdraftTower}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTower', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </SubMenu>
      )}

      {editable && foundation.solarStructure === SolarStructure.FocusPipe && (
        <SubMenu
          key={'solar-absorber-pipe-physical-properties'}
          title={i18n.t('solarAbsorberPipeMenu.AbsorberPipePhysicalProperties', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {solarAbsorberPipeHeightDialogVisible && (
            <SolarAbsorberPipeHeightInput setDialogVisible={setSolarAbsorberPipeHeightDialogVisible} />
          )}
          <Menu.Item
            key={'solar-absorber-pipe-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipeHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberHeight', lang)} ...
          </Menu.Item>

          {solarAbsorberPipeApertureWidthDialogVisible && (
            <SolarAbsorberPipeApertureWidthInput setDialogVisible={setSolarAbsorberPipeApertureWidthDialogVisible} />
          )}
          <Menu.Item
            key={'solar-absorber-pipe-aperture-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipeApertureWidthDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberApertureWidth', lang)} ...
          </Menu.Item>
          {solarAbsorberPipePoleNumberDialogVisible && (
            <SolarAbsorberPipePoleNumberInput setDialogVisible={setSolarAbsorberPipePoleNumberDialogVisible} />
          )}

          <Menu.Item
            key={'foundation-solar-receiver-pipe-pole-number'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipePoleNumberDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberPipePoleNumber', lang)} ...
          </Menu.Item>

          {solarAbsorberPipeAbsorptanceDialogVisible && (
            <SolarAbsorberPipeAbsorptanceInput setDialogVisible={setSolarAbsorberPipeAbsorptanceDialogVisible} />
          )}
          <Menu.Item
            key={'solar-absorber-pipe-absorptance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipeAbsorptanceDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberAbsorptance', lang)} ...
          </Menu.Item>

          {solarAbsorberPipeOpticalEfficiencyDialogVisible && (
            <SolarAbsorberPipeOpticalEfficiencyInput
              setDialogVisible={setSolarAbsorberPipeOpticalEfficiencyDialogVisible}
            />
          )}
          <Menu.Item
            key={'solar-absorber-optical-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipeOpticalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberOpticalEfficiency', lang)} ...
          </Menu.Item>

          {solarAbsorberPipeThermalEfficiencyDialogVisible && (
            <SolarAbsorberPipeThermalEfficiencyInput
              setDialogVisible={setSolarAbsorberPipeThermalEfficiencyDialogVisible}
            />
          )}
          <Menu.Item
            key={'solar-absorber-thermal-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarAbsorberPipeThermalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarAbsorberPipeMenu.AbsorberThermalEfficiency', lang)} ...
          </Menu.Item>
        </SubMenu>
      )}

      {editable && foundation.solarStructure === SolarStructure.FocusTower && (
        <SubMenu
          key={'solar-power-tower-physical-properties'}
          title={i18n.t('solarPowerTowerMenu.ReceiverTowerPhysicalProperties', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {solarPowerTowerHeightDialogVisible && (
            <SolarPowerTowerHeightInput setDialogVisible={setSolarPowerTowerHeightDialogVisible} />
          )}
          <Menu.Item
            key={'solar-power-tower-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarPowerTowerHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarPowerTowerMenu.ReceiverTowerHeight', lang)} ...
          </Menu.Item>

          {solarPowerTowerRadiusDialogVisible && (
            <SolarPowerTowerRadiusInput setDialogVisible={setSolarPowerTowerRadiusDialogVisible} />
          )}
          <Menu.Item
            key={'solar-power-tower-radius'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarPowerTowerRadiusDialogVisible(true);
            }}
          >
            {i18n.t('solarPowerTowerMenu.ReceiverTowerRadius', lang)} ...
          </Menu.Item>

          {solarPowerTowerReceiverAbsorptanceDialogVisible && (
            <SolarPowerTowerReceiverAbsorptanceInput
              setDialogVisible={setSolarPowerTowerReceiverAbsorptanceDialogVisible}
            />
          )}
          <Menu.Item
            key={'solar-power-tower-receiver-absorptance'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarPowerTowerReceiverAbsorptanceDialogVisible(true);
            }}
          >
            {i18n.t('solarPowerTowerMenu.ReceiverAbsorptance', lang)} ...
          </Menu.Item>

          {solarPowerTowerReceiverOpticalEfficiencyDialogVisible && (
            <SolarPowerTowerReceiverOpticalEfficiencyInput
              setDialogVisible={setSolarPowerTowerReceiverOpticalEfficiencyDialogVisible}
            />
          )}
          <Menu.Item
            key={'solar-power-tower-receiver-optical-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarPowerTowerReceiverOpticalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarPowerTowerMenu.ReceiverOpticalEfficiency', lang)} ...
          </Menu.Item>

          {solarPowerTowerReceiverThermalEfficiencyDialogVisible && (
            <SolarPowerTowerReceiverThermalEfficiencyInput
              setDialogVisible={setSolarPowerTowerReceiverThermalEfficiencyDialogVisible}
            />
          )}
          <Menu.Item
            key={'solar-power-tower-receiver-thermal-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setSolarPowerTowerReceiverThermalEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarPowerTowerMenu.ReceiverThermalEfficiency', lang)} ...
          </Menu.Item>
        </SubMenu>
      )}

      {editable && foundation.solarStructure === SolarStructure.UpdraftTower && (
        <SubMenu
          key={'solar-updraft-tower-physical-properties'}
          title={i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerPhysicalProperties', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {chimneyHeightDialogVisible && (
            <SolarUpdraftTowerChimneyHeightInput setDialogVisible={setChimneyHeightDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-chimney-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setChimneyHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyHeight', lang)} ...
          </Menu.Item>

          {chimneyRadiusDialogVisible && (
            <SolarUpdraftTowerChimneyRadiusInput setDialogVisible={setChimneyRadiusDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-chimney-radius'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setChimneyRadiusDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyRadius', lang)} ...
          </Menu.Item>

          {collectorHeightDialogVisible && (
            <SolarUpdraftTowerCollectorHeightInput setDialogVisible={setCollectorHeightDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-collector-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setCollectorHeightDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorHeight', lang)} ...
          </Menu.Item>

          {collectorRadiusDialogVisible && (
            <SolarUpdraftTowerCollectorRadiusInput setDialogVisible={setCollectorRadiusDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-collector-radius'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setCollectorRadiusDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorRadius', lang)} ...
          </Menu.Item>

          {collectorTransmissivityDialogVisible && (
            <SolarUpdraftTowerCollectorTransmissivityInput setDialogVisible={setCollectorTransmissivityDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-collector-transmissivity'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setCollectorTransmissivityDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorTransmissivity', lang)} ...
          </Menu.Item>

          {collectorEmissivityDialogVisible && (
            <SolarUpdraftTowerCollectorEmissivityInput setDialogVisible={setCollectorEmissivityDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-collector-emissivity'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setCollectorEmissivityDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorEmissivity', lang)} ...
          </Menu.Item>

          {dischargeCoefficientDialogVisible && (
            <SolarUpdraftTowerDischargeCoefficientInput setDialogVisible={setDischargeCoefficientDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-discharge-coefficient'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setDischargeCoefficientDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerDischargeCoefficient', lang)} ...
          </Menu.Item>

          {turbineEfficiencyDialogVisible && (
            <SolarUpdraftTowerTurbineEfficiencyInput setDialogVisible={setTurbineEfficiencyDialogVisible} />
          )}
          <Menu.Item
            key={'solar-updraft-tower-turbine-efficiency'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setTurbineEfficiencyDialogVisible(true);
            }}
          >
            {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerTurbineEfficiency', lang)} ...
          </Menu.Item>
        </SubMenu>
      )}
      <SubMenu
        key={'optimization'}
        title={i18n.t('optimizationMenu.Optimization', lang)}
        style={{ paddingLeft: '24px' }}
      >
        <SubMenu key={'genetic-algorithms'} title={i18n.t('optimizationMenu.GeneticAlgorithm', lang)}>
          {counterUnlocked.solarPanelCount > 0 && (
            <>
              {solarPanelTiltAngleGaWizardVisible && (
                <SolarPanelTiltAngleGaWizard setDialogVisible={setSolarPanelTiltAngleGaWizardVisible} />
              )}
              <Menu.Item
                key={'solar-panel-tilt-angle-ga-optimizer'}
                onClick={() => {
                  setSolarPanelTiltAngleGaWizardVisible(true);
                }}
                style={{ paddingLeft: '12px' }}
              >
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </Menu.Item>
            </>
          )}
        </SubMenu>
        <SubMenu key={'particle-swarm-optimization'} title={i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)}>
          {counterUnlocked.solarPanelCount > 0 && (
            <>
              {solarPanelTiltAnglePsoWizardVisible && (
                <SolarPanelTiltAnglePsoWizard setDialogVisible={setSolarPanelTiltAnglePsoWizardVisible} />
              )}
              <Menu.Item
                key={'solar-panel-tilt-angle-pso-optimizer'}
                onClick={() => {
                  setSolarPanelTiltAnglePsoWizardVisible(true);
                }}
                style={{ paddingLeft: '12px' }}
              >
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </Menu.Item>
            </>
          )}
        </SubMenu>
      </SubMenu>

      {editable && (
        <SubMenu key={'foundation-label'} title={i18n.t('labelSubMenu.Label', lang)} style={{ paddingLeft: '24px' }}>
          {/* show label or not */}
          <Menu.Item key={'foundation-show-label'}>
            <Checkbox checked={!!foundation?.showLabel} onChange={showLabel}>
              {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'foundation-label-text'} style={{ paddingLeft: '36px', marginTop: 10 }}>
              <Input
                addonBefore={i18n.t('labelSubMenu.LabelText', lang) + ':'}
                value={labelText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                onPressEnter={updateLabelText}
                onBlur={updateLabelText}
              />
            </Menu.Item>
            {/* the label's height relative to the foundation's top surface */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'foundation-label-height'}>
              <InputNumber
                addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                min={foundation.lz / 2 + 0.2}
                max={100}
                step={1}
                precision={1}
                value={foundation.labelHeight ?? foundation.lz / 2 + 0.2}
                onChange={(value) => setLabelHeight(value)}
              />
            </Menu.Item>
            {/* the label's size */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'foundation-label-size'}>
              <InputNumber
                addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                min={0.2}
                max={2}
                step={0.1}
                precision={1}
                value={foundation.labelSize ?? 0.2}
                onChange={(value) => setLabelSize(value)}
              />
            </Menu.Item>
          </Menu>
        </SubMenu>
      )}
    </Menu.ItemGroup>
  );
});
