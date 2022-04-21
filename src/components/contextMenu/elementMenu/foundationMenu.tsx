/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Menu, Modal, Radio, Space } from 'antd';
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
import SolarPowerTowerReceiverAbsorptanceInput from './solarPowerTowerReceiverAbsorptanceInput';
import SolarPowerTowerReceiverOpticalEfficiencyInput from './solarPowerTowerReceiverOpticalEfficiencyInput';
import SolarPowerTowerReceiverThermalEfficiencyInput from './solarPowerTowerReceiverThermalEfficiencyInput';
import SolarUpdraftTowerCollectorTransmissivityInput from './solarUpdraftTowerCollectorTransmissivityInput';
import SolarUpdraftTowerDischargeCoefficientInput from './solarUpdraftTowerDischargeCoefficientInput';
import SolarUpdraftTowerTurbineEfficiencyInput from './solarUpdraftTowerTurbineEfficiencyInput';
import SolarUpdraftTowerCollectorEmissivityInput from './solarUpdraftTowerCollectorEmissivityInput';
import SolarPanelTiltAngleGaWizard from './solarPanelTiltAngleGaWizard';
import SolarPanelTiltAnglePsoWizard from './solarPanelTiltAnglePsoWizard';

export const FoundationMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const addElement = useStore(Selector.addElement);
  const removeElementById = useStore(Selector.removeElementById);
  const setApplyCount = useStore(Selector.setApplyCount);
  const updateFoundationSolarStructureById = useStore(Selector.updateFoundationSolarStructureById);

  const [selectedSolarStructure, setSelectedSolarStructure] = useState(
    foundation?.solarStructure ?? SolarStructure.None,
  );
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);

  const [solarAbsorberPipeHeightDialogVisible, setSolarAbsorberPipeHeightDialogVisible] = useState(false);
  const [solarAbsorberPipeApertureWidthDialogVisible, setSolarAbsorberPipeApertureWidthDialogVisible] = useState(false);
  const [solarAbsorberPipePoleNumberDialogVisible, setSolarAbsorberPipePoleNumberDialogVisible] = useState(false);
  const [solarAbsorberPipeAbsorptanceDialogVisible, setSolarAbsorberPipeAbsorptanceDialogVisible] = useState(false);
  const [solarAbsorberPipeOpticalEfficiencyDialogVisible, setSolarAbsorberPipeOpticalEfficiencyDialogVisible] =
    useState(false);
  const [solarAbsorberPipeThermalEfficiencyDialogVisible, setSolarAbsorberPipeThermalEfficiencyDialogVisible] =
    useState(false);

  const [solarPowerTowerHeightDialogVisible, setSolarPowerTowerHeightDialogVisible] = useState(false);
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

  const counter = foundation ? countAllOffspringsByType(foundation.id) : new ElementCounter();
  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setSelectedSolarStructure(foundation.solarStructure ?? SolarStructure.None);
    }
  }, [foundation]);

  const legalToPaste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
      // when there are multiple elements to paste, the first element is the parent
      // we check the legality of the parent here
      const e = elementsToPaste[0];
      if (
        e.type === ObjectType.Human ||
        e.type === ObjectType.Tree ||
        e.type === ObjectType.Polygon ||
        e.type === ObjectType.Sensor ||
        e.type === ObjectType.SolarPanel ||
        e.type === ObjectType.WaterHeater ||
        e.type === ObjectType.ParabolicDish ||
        e.type === ObjectType.Heliostat ||
        e.type === ObjectType.FresnelReflector ||
        e.type === ObjectType.ParabolicTrough
      ) {
        return true;
      }
    }
    return false;
  };

  const editable = !foundation?.locked;

  return (
    foundation && (
      <Menu.ItemGroup>
        {legalToPaste() && <Paste keyName={'foundation-paste'} />}
        <Copy keyName={'foundation-copy'} />
        {editable && <Cut keyName={'foundation-cut'} />}
        <Lock keyName={'foundation-lock'} />
        {editable && counter.gotSome() && contextMenuObjectType && (
          <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
            {counter.wallCount > 0 && (
              <Menu.Item
                key={'remove-all-walls-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWallsOnFoundation', lang) +
                      ' (' +
                      counter.wallCount +
                      ' ' +
                      i18n.t('foundationMenu.Walls', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Wall && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.Wall);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllWallChildren = {
                          name: 'Remove All Walls on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllWallChildren.removedElements);
                              state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(undoableRemoveAllWallChildren.parentId, ObjectType.Wall);
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllWallChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedWalls', lang)} ({counter.wallCount})
              </Menu.Item>
            )}

            {counter.sensorCount > 0 && (
              <Menu.Item
                key={'remove-all-sensors-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSensorsOnFoundation', lang) +
                      ' (' +
                      counter.sensorCount +
                      ' ' +
                      i18n.t('foundationMenu.Sensors', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Sensor && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.Sensor);
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
                            removeAllChildElementsByType(undoableRemoveAllSensorChildren.parentId, ObjectType.Sensor);
                          },
                        } as UndoableRemoveAllChildren;
                        addUndoable(undoableRemoveAllSensorChildren);
                      }
                    },
                  });
                }}
              >
                {i18n.t('foundationMenu.RemoveAllUnlockedSensors', lang)} ({counter.sensorCount})
              </Menu.Item>
            )}

            {counter.solarPanelCount > 0 && (
              <Menu.Item
                key={'remove-all-solar-panels-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSolarPanelsOnFoundation', lang) +
                      ' (' +
                      counter.solarPanelModuleCount +
                      ' ' +
                      i18n.t('foundationMenu.SolarPanels', lang) +
                      ', ' +
                      counter.solarPanelCount +
                      ' ' +
                      i18n.t('foundationMenu.Racks', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.SolarPanel && e.parentId === foundation.id,
                        );
                        removeAllChildElementsByType(foundation.id, ObjectType.SolarPanel);
                        const removedElements = JSON.parse(JSON.stringify(removed));
                        const undoableRemoveAllSolarPanelChildren = {
                          name: 'Remove All Solar Panels on Foundation',
                          timestamp: Date.now(),
                          parentId: foundation.id,
                          removedElements: removedElements,
                          undo: () => {
                            setCommonStore((state) => {
                              state.elements.push(...undoableRemoveAllSolarPanelChildren.removedElements);
                              state.updateDesignInfo();
                            });
                          },
                          redo: () => {
                            removeAllChildElementsByType(
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
                {i18n.t('foundationMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({counter.solarPanelModuleCount}{' '}
                {i18n.t('foundationMenu.SolarPanels', lang)}, {counter.solarPanelCount}{' '}
                {i18n.t('foundationMenu.Racks', lang)})
              </Menu.Item>
            )}

            {counter.parabolicTroughCount > 0 && (
              <Menu.Item
                key={'remove-all-parabolic-troughs-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicTroughsOnFoundation', lang) +
                      ' (' +
                      counter.parabolicTroughCount +
                      ' ' +
                      i18n.t('foundationMenu.ParabolicTroughs', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicTrough && e.parentId === foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllUnlockedParabolicTroughs', lang)} ({counter.parabolicTroughCount})
              </Menu.Item>
            )}

            {counter.parabolicDishCount > 0 && (
              <Menu.Item
                key={'remove-all-parabolic-dishes-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllParabolicDishesOnFoundation', lang) +
                      ' (' +
                      counter.parabolicDishCount +
                      ' ' +
                      i18n.t('foundationMenu.ParabolicDishes', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.ParabolicDish && e.parentId === foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllUnlockedParabolicDishes', lang)} ({counter.parabolicDishCount})
              </Menu.Item>
            )}

            {counter.fresnelReflectorCount > 0 && (
              <Menu.Item
                key={'remove-all-fresnel-reflector-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllFresnelReflectorsOnFoundation', lang) +
                      ' (' +
                      counter.fresnelReflectorCount +
                      ' ' +
                      i18n.t('foundationMenu.FresnelReflectors', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.FresnelReflector && e.parentId === foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllUnlockedFresnelReflectors', lang)} ({counter.fresnelReflectorCount})
              </Menu.Item>
            )}

            {counter.heliostatCount > 0 && (
              <Menu.Item
                key={'remove-all-heliostats-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHeliostatsOnFoundation', lang) +
                      ' (' +
                      counter.heliostatCount +
                      ' ' +
                      i18n.t('foundationMenu.Heliostats', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Heliostat && e.parentId === foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllUnlockedHeliostats', lang)} ({counter.heliostatCount})
              </Menu.Item>
            )}

            {counter.polygonCount > 0 && (
              <Menu.Item
                key={'remove-all-polygons-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllPolygonsOnFoundation', lang) +
                      ' (' +
                      counter.polygonCount +
                      ' ' +
                      i18n.t('foundationMenu.Polygons', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
                          (e) => !e.locked && e.type === ObjectType.Polygon && e.parentId === foundation.id,
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
                {i18n.t('foundationMenu.RemoveAllUnlockedPolygons', lang)} ({counter.polygonCount})
              </Menu.Item>
            )}

            {counter.humanCount > 0 && (
              <Menu.Item
                key={'remove-all-humans-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHumansOnFoundation', lang) +
                      ' (' +
                      counter.humanCount +
                      ' ' +
                      i18n.t('foundationMenu.Humans', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
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
                {i18n.t('foundationMenu.RemoveAllUnlockedHumans', lang)} ({counter.humanCount})
              </Menu.Item>
            )}

            {counter.treeCount > 0 && (
              <Menu.Item
                key={'remove-all-trees-on-foundation'}
                onClick={() => {
                  Modal.confirm({
                    title:
                      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllTreesOnFoundation', lang) +
                      ' (' +
                      counter.treeCount +
                      ' ' +
                      i18n.t('foundationMenu.Trees', lang) +
                      ')?',
                    icon: <ExclamationCircleOutlined />,
                    onOk: () => {
                      if (foundation) {
                        const removed = elements.filter(
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
                {i18n.t('foundationMenu.RemoveAllUnlockedTrees', lang)} ({counter.treeCount})
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
            key={'select-solar-structure'}
            title={i18n.t('foundationMenu.SelectSolarStructure', lang)}
            style={{ paddingLeft: '24px' }}
          >
            <Radio.Group
              value={selectedSolarStructure ?? SolarStructure.None}
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
                  setSelectedSolarStructure(newValue);
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
              <SolarUpdraftTowerCollectorTransmissivityInput
                setDialogVisible={setCollectorTransmissivityDialogVisible}
              />
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
          {counter.solarPanelCount > 0 && (
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
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang) + ' '}(
                {i18n.t('optimizationMenu.GeneticAlgorithm', lang)})...
              </Menu.Item>
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
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang) + ' '}(
                {i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)})...
              </Menu.Item>
            </>
          )}
        </SubMenu>
      </Menu.ItemGroup>
    )
  );
};
