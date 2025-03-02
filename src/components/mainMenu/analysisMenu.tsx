/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { MenuProps, Modal } from 'antd';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../../stores/selector';
import { Util } from 'src/Util';
import { showError, showInfo, showWarning } from 'src/helpers';
import { MainMenuSwitch } from './mainMenuItems';
import { ElementCounter } from 'src/stores/ElementCounter';
import { BuildingCompletionStatus, EnergyModelingType, ObjectType, SolarStructure } from 'src/types';
import { checkBuilding, CheckStatus } from 'src/analysis/heatTools';
import { buildingEnergySimulationSettingsSubmenu } from './buildingEnergySimulationSettings';
import { pvSimulationSettings } from './pvSimulationSettings';
import { cspSimulationSettings } from './cspSimulationSettings';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { MAXIMUM_HEATMAP_CELLS } from '../../constants';
import { SolarRadiationHeatmapMaxValueInput } from './solarRadiationHeatmapMaxValueInput';
import { SensorSimulationSamplingFrequencyInput } from './sensorSimulationSamplingFrequencyInput';
import { SolarPanelVisibilityGridCellSizeInput } from './solarPanelVisibilityGridCellSizeInput';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';
import { sutSimulationSettings } from './sutSimulationSettings';
import { SolarPanelModel } from 'src/models/SolarPanelModel';

export const createAnalysisMenu = (elementCounter: ElementCounter) => {
  const lang = { lng: useStore.getState().language };

  const setPrimitiveStore = usePrimitiveStore.getState().setPrimitiveStore;
  const setCommonStore = useStore.getState().set;
  const selectNone = useStore.getState().selectNone;
  const countElementsByType = useStore.getState().countElementsByType;
  const countHeatmapCells = useStore.getState().countHeatmapCells;

  const runDynamicSimulation = usePrimitiveStore.getState().runDynamicSimulation;
  const runStaticSimulation = usePrimitiveStore.getState().runStaticSimulation;
  const noAnimationForHeatmapSimulation = useStore.getState().world.noAnimationForHeatmapSimulation;
  const elements = useStore.getState().elements;
  const loggable = useStore.getState().loggable;

  const hasMovingParts = Util.hasMovingParts(elements);

  const items: MenuProps['items'] = [];

  const toggleStaticSolarRadiationHeatmap = () => {
    if (!runStaticSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setPrimitiveStore('runStaticSimulation', !runStaticSimulation);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Static)',
            timestamp: new Date().getTime(),
          };
        });
      }
    }, 100);
  };

  const toggleDynamicSolarRadiationHeatmap = () => {
    if (!runDynamicSimulation) {
      showInfo(i18n.t('message.SimulationStarted', lang));
    }
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      setPrimitiveStore('runDynamicSimulation', !runDynamicSimulation);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Generate Daily Solar Radiation Heatmap (Dynamic)',
            timestamp: new Date().getTime(),
          };
        });
      }
    }, 100);
  };

  const handleDailySolarRadiationHeatmap = () => {
    const cellCount = countHeatmapCells();
    if (cellCount > MAXIMUM_HEATMAP_CELLS) {
      Modal.confirm({
        title:
          i18n.t('message.CalculationMayBeSlowDoYouWantToContinue', lang) +
          ' (' +
          i18n.t('message.IncreaseSolarRadiationHeatmapGridCellSizeToSpeedUp', lang) +
          ')',
        icon: <QuestionCircleOutlined />,
        onOk: () => {
          toggleSolarRadiationHeatmap();
        },
        onCancel: () => {},
        okText: `${i18n.t('word.Yes', lang)}`,
        cancelText: `${i18n.t('word.No', lang)}`,
      });
    } else {
      toggleSolarRadiationHeatmap();
    }
  };

  const toggleSolarRadiationHeatmap = () => {
    if (!noAnimationForHeatmapSimulation || hasMovingParts) {
      toggleDynamicSolarRadiationHeatmap();
    } else {
      toggleStaticSolarRadiationHeatmap();
    }
  };

  const collectSensorDailyData = () => {
    const sensorCount = countElementsByType(ObjectType.Sensor);
    if (sensorCount === 0) {
      showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = { name: 'Collect Daily Data for Sensors', timestamp: new Date().getTime() };
        });
      }
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailyLightSensor = true;
      });
    }, 100);
  };

  const collectSensorYearlyData = () => {
    const sensorCount = countElementsByType(ObjectType.Sensor);
    if (sensorCount === 0) {
      showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = { name: 'Collect Yearly Data for Sensors', timestamp: new Date().getTime() };
        });
      }
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlyLightSensor = true;
      });
    }, 100);
  };

  const handleBuildingEnergyDailyData = () => {
    const checkResult = checkBuilding(
      elements,
      useStore.getState().countElementsByType,
      useStore.getState().getChildrenOfType,
    );
    if (checkResult.status === CheckStatus.NO_BUILDING) {
      showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
      return;
    }
    if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
      let errorType;
      switch (checkResult.buildingCompletion) {
        case BuildingCompletionStatus.WALL_DISJOINED:
          errorType = i18n.t('message.WallsAreNotConnected', lang);
          break;
        case BuildingCompletionStatus.WALL_EMPTY:
          errorType = i18n.t('message.BuildingContainsEmptyWall', lang);
          break;
        case BuildingCompletionStatus.ROOF_MISSING:
          errorType = i18n.t('message.BuildingRoofMissing', lang);
          break;
        default:
          errorType = i18n.t('message.UnknownErrors', lang);
      }
      showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang) + ': ' + errorType);
      return;
    }
    if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
      showWarning(i18n.t('message.SimulationWillStartDespiteWarnings', lang));
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = { name: 'Analyze Daily Building Energy', timestamp: new Date().getTime() };
        });
      }
      usePrimitiveStore.getState().set((state) => {
        state.runDailyThermalSimulation = true;
        state.simulationInProgress = true;
      });
    }, 100);
  };

  const handleBuildingEnergyYearlyData = () => {
    const checkResult = checkBuilding(
      elements,
      useStore.getState().countElementsByType,
      useStore.getState().getChildrenOfType,
    );
    if (checkResult.status === CheckStatus.NO_BUILDING) {
      showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
      return;
    }
    if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
      let errorType;
      switch (checkResult.buildingCompletion) {
        case BuildingCompletionStatus.WALL_DISJOINED:
          errorType = i18n.t('message.WallsAreNotConnected', lang);
          break;
        case BuildingCompletionStatus.WALL_EMPTY:
          errorType = i18n.t('message.BuildingContainsEmptyWall', lang);
          break;
        case BuildingCompletionStatus.ROOF_MISSING:
          errorType = i18n.t('message.BuildingRoofMissing', lang);
          break;
        default:
          errorType = i18n.t('message.UnknownErrors', lang);
      }
      showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang) + ': ' + errorType);
      return;
    }
    if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
      showWarning(i18n.t('message.SimulationWillStartDespiteWarnings', lang));
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      selectNone();
      usePrimitiveStore.getState().set((state) => {
        state.runYearlyThermalSimulation = true;
        state.simulationInProgress = true;
      });
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = { name: 'Analyze Yearly Building Energy', timestamp: new Date().getTime() };
        });
      }
    }, 100);
  };

  const atLeastOneConnectedBatteryStorage = () => {
    const idSet = new Set<string>();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).batteryStorageId) {
        idSet.add((e as SolarPanelModel).batteryStorageId!);
      }
      if (e.type === ObjectType.BatteryStorage && idSet.has(e.id)) {
        return true;
      }
    }
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.BatteryStorage && idSet.has(e.id)) {
        return true;
      }
    }
    return false;
  };

  const analyzeBatteryStorageDailyYield = () => {
    if (!atLeastOneConnectedBatteryStorage()) {
      showInfo(i18n.t('analysisManager.NoBatteryStorageForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyBatteryStorageIndividualOutputs = true;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation For Battery Storage',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForBatteryStorages = true;
        state.runDailyThermalSimulation = true;
      });
    }, 100);
  };

  const analyzeBatteryStorageYearlyYield = () => {
    if (!atLeastOneConnectedBatteryStorage()) {
      showInfo(i18n.t('analysisManager.NoBatteryStorageForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyBatteryStorageIndividualOutputs = true;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation For Battery Storage',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForBatteryStorages = true;
        state.runYearlyThermalSimulation = true;
      });
    }, 100);
  };

  const analyzeSolarPanelDailyYield = () => {
    const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
    if (solarPanelCount === 0) {
      showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyPvIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation For Solar Panels',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForSolarPanels = true;
      });
    }, 100);
  };

  const analyzeSolarPanelYearlyYield = () => {
    const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
    if (solarPanelCount === 0) {
      showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyPvIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation For Solar Panels',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForSolarPanels = true;
      });
    }, 100);
  };

  const solarPanelVisibility = () => {
    const observerCount = useStore.getState().countObservers();
    if (observerCount === 0) {
      showInfo(i18n.t('analysisManager.NoObserverForVisibilityAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      usePrimitiveStore.getState().set((state) => {
        state.runSolarPanelVisibilityAnalysis = !state.runSolarPanelVisibilityAnalysis;
        state.simulationInProgress = true;
      });
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Run Visibility Analysis For Solar Panels',
            timestamp: new Date().getTime(),
          };
        });
      }
    }, 100);
  };

  const analyzeParabolicTroughDailyYield = () => {
    const parabolicTroughCount = countElementsByType(ObjectType.ParabolicTrough);
    if (parabolicTroughCount === 0) {
      showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyParabolicTroughIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation for Parabolic Troughs',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForParabolicTroughs = true;
      });
    }, 100);
  };

  const analyzeParabolicTroughYearlyYield = () => {
    const parabolicTroughCount = countElementsByType(ObjectType.ParabolicTrough);
    if (parabolicTroughCount === 0) {
      showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyParabolicTroughIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation for Parabolic Troughs',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForParabolicTroughs = true;
      });
    }, 100);
  };

  const analyzeParabolicDishDailyYield = () => {
    const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
    if (parabolicDishCount === 0) {
      showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyParabolicDishIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation for Parabolic Dishes',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForParabolicDishes = true;
      });
    }, 100);
  };

  const analyzeParabolicDishYearlyYield = () => {
    const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
    if (parabolicDishCount === 0) {
      showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyParabolicDishIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation for Parabolic Dishes',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForParabolicDishes = true;
      });
    }, 100);
  };

  const analyzeFresnelReflectorDailyYield = () => {
    const fresnelReflectorCount = countElementsByType(ObjectType.FresnelReflector);
    if (fresnelReflectorCount === 0) {
      showInfo(i18n.t('analysisManager.NoFresnelReflectorForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyFresnelReflectorIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation for Fresnel Reflectors',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForFresnelReflectors = true;
      });
    }, 100);
  };

  const analyzeFresnelReflectorYearlyYield = () => {
    const fresnelReflectorCount = countElementsByType(ObjectType.FresnelReflector);
    if (fresnelReflectorCount === 0) {
      showInfo(i18n.t('analysisManager.NoFresnelReflectorForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyFresnelReflectorIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation for Fresnel Reflectors',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForFresnelReflectors = true;
      });
    }, 100);
  };

  const analyzeHeliostatDailyYield = () => {
    const heliostatCount = countElementsByType(ObjectType.Heliostat);
    if (heliostatCount === 0) {
      showInfo(i18n.t('analysisManager.NoHeliostatForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyHeliostatIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation for Heliostats',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForHeliostats = true;
      });
    }, 100);
  };

  const analyzeHeliostatYearlyYield = () => {
    const heliostatCount = countElementsByType(ObjectType.Heliostat);
    if (heliostatCount === 0) {
      showInfo(i18n.t('analysisManager.NoHeliostatForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyHeliostatIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation for Heliostats',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForHeliostats = true;
      });
    }, 100);
  };

  const analyzeSolarUpdraftTowerDailyYield = () => {
    const towerCount = useStore.getState().countSolarStructuresByType(SolarStructure.UpdraftTower);
    if (towerCount === 0) {
      showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyUpdraftTowerIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Daily Simulation for Solar Updraft Tower',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runDailySimulationForUpdraftTower = true;
      });
    }, 100);
  };

  const analyzeSolarUpdraftTowerYearlyYield = () => {
    const towerCount = useStore.getState().countSolarStructuresByType(SolarStructure.UpdraftTower);
    if (towerCount === 0) {
      showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
      return;
    }
    showInfo(i18n.t('message.SimulationStarted', lang));
    // give it 0.1 second for the info to show up
    setTimeout(() => {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyUpdraftTowerIndividualOutputs = false;
        if (loggable) {
          state.actionInfo = {
            name: 'Run Yearly Simulation for Solar Updraft Tower',
            timestamp: new Date().getTime(),
          };
        }
      });
      usePrimitiveStore.getState().set((state) => {
        state.simulationInProgress = true;
        state.runYearlySimulationForUpdraftTower = true;
      });
    }, 100);
  };

  // === physics-submenu ===
  const physicsOptionsItems: MenuProps['items'] = [];

  // solar-radiation-heatmap-grid-cell-size
  physicsOptionsItems.push({
    key: 'solar-radiation-heatmap-grid-cell-size',
    label: <EnergyGridCellSizeInput type={EnergyModelingType.BUILDING} />,
  });

  // solar-radiation-heatmap-max-value
  physicsOptionsItems.push({
    key: 'solar-radiation-heatmap-max-value',
    label: <SolarRadiationHeatmapMaxValueInput />,
  });

  // solar-radiation-heatmap-reflection-only
  if (Util.hasHeliostatOrFresnelReflectors(elements)) {
    physicsOptionsItems.push({
      key: 'solar-radiation-heatmap-reflection-only',
      label: (
        <MainMenuSwitch
          selector={Selector.viewState.solarRadiationHeatmapReflectionOnly}
          onChange={(checked) => {
            useStore.getState().set((state) => {
              state.world.noAnimationForHeatmapSimulation = checked;
            });
          }}
        >
          {i18n.t('menu.physics.ReflectionHeatmap', lang) + ':'}
        </MainMenuSwitch>
      ),
    });
  }

  // solar-radiation-heatmap-no-animation
  if (!hasMovingParts) {
    physicsOptionsItems.push({
      key: 'solar-radiation-heatmap-no-animation',
      label: (
        <MainMenuSwitch
          selector={Selector.world.noAnimationForHeatmapSimulation}
          onChange={(checked) => {
            useStore.getState().set((state) => {
              state.world.noAnimationForHeatmapSimulation = checked;
            });
          }}
        >
          {i18n.t('menu.physics.SolarRadiationHeatmapNoAnimation', lang) + ':'}
        </MainMenuSwitch>
      ),
    });
  }

  items.push({
    key: 'physics-submenu',
    label: <MenuItem noPadding>{i18n.t('menu.physicsSubMenu', lang)}</MenuItem>,
    children: [
      {
        key: 'daily-solar-radiation-heatmap',
        label: (
          <MenuItem noPadding onClick={handleDailySolarRadiationHeatmap}>
            {i18n.t('menu.physics.DailySolarRadiationHeatmap', lang)}
          </MenuItem>
        ),
      },
      {
        key: 'solar-radiation-heatmap-options',
        label: <MenuItem noPadding>{i18n.t('menu.physics.SolarRadiationHeatmapOptions', lang)}</MenuItem>,
        children: physicsOptionsItems,
      },
    ],
  });

  // === sensor-submenu ===
  const sensorSimulationOptionsItems: MenuProps['items'] = [];

  // sensor-simulation-sampling-frequency
  sensorSimulationOptionsItems.push({
    key: 'sensor-simulation-sampling-frequency',
    label: <SensorSimulationSamplingFrequencyInput />,
  });

  // sensor-simulation-no-animation
  if (!hasMovingParts) {
    sensorSimulationOptionsItems.push({
      key: 'sensor-simulation-no-animation',
      label: (
        <MainMenuSwitch
          selector={Selector.world.noAnimationForSensorDataCollection}
          onChange={(checked) => {
            useStore.getState().set((state) => {
              state.world.noAnimationForSensorDataCollection = checked;
            });
          }}
        >
          {i18n.t('menu.sensor.SensorSimulationNoAnimation', lang) + ':'}
        </MainMenuSwitch>
      ),
    });
  }

  if (elementCounter.sensorCount > 0) {
    items.push({
      key: 'sensor-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.sensorSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'sensor-collect-daily-data',
          label: (
            <MenuItem noPadding onClick={collectSensorDailyData}>
              {i18n.t('menu.sensor.CollectDailyData', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'sensor-collect-yearly-data',
          label: (
            <MenuItem noPadding onClick={collectSensorYearlyData}>
              {i18n.t('menu.sensor.CollectYearlyData', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'sensor-simulation-options-submenu-2',
          label: <MenuItem noPadding>{i18n.t('word.Options', lang)}</MenuItem>,
          children: sensorSimulationOptionsItems,
        },
      ],
    });
  }

  // === buildings-submenu ===
  if (elementCounter.wallCount > 0) {
    items.push({
      key: 'buildings-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.buildingSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'building-energy-daily-data',
          label: (
            <MenuItem noPadding onClick={handleBuildingEnergyDailyData}>
              {i18n.t('menu.building.AnalyzeDailyBuildingEnergy', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'building-energy-yearly-data',
          label: (
            <MenuItem noPadding onClick={handleBuildingEnergyYearlyData}>
              {i18n.t('menu.building.AnalyzeYearlyBuildingEnergy', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'building-energy-analysis-options-submenu',
          label: <MenuItem noPadding>{i18n.t('menu.building.EnergyAnalysisOptions', lang)}</MenuItem>,
          children: buildingEnergySimulationSettingsSubmenu(),
        },
      ],
    });
  }

  // === battery-storage-submenu ===
  if (elementCounter.batteryStorageCount > 0 && atLeastOneConnectedBatteryStorage()) {
    items.push({
      key: 'battery-storage-submenu',
      label: <MenuItem noPadding>{i18n.t('batteryStorageMenu.BatteryStorage', lang)}</MenuItem>,
      children: [
        {
          key: 'daily-charge-discharge',
          label: (
            <MenuItem noPadding onClick={analyzeBatteryStorageDailyYield}>
              {i18n.t('menu.storage.AnalyzeDailyChargeDischarge', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'yearly-storage',
          label: (
            <MenuItem noPadding onClick={analyzeBatteryStorageYearlyYield}>
              {i18n.t('menu.storage.AnalyzeYearlyStorage', lang)}
            </MenuItem>
          ),
        },
      ],
    });
  }

  // === solar-panels-submenu ===
  if (elementCounter.solarPanelCount > 0) {
    items.push({
      key: 'solar-panels-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.solarPanelSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-panel-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeSolarPanelDailyYield}>
              {i18n.t('menu.solarPanel.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'solar-panel-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeSolarPanelYearlyYield}>
              {i18n.t('menu.solarPanel.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'solar-panel-energy-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.solarPanel.EnergyAnalysisOptions', lang)}</MenuItem>,
          children: pvSimulationSettings(hasMovingParts),
        },
        {
          key: 'solar-panel-visibility',
          label: (
            <MenuItem noPadding onClick={solarPanelVisibility}>
              {i18n.t('menu.solarPanel.AnalyzeVisibility', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'solar-panel-visibility-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.solarPanel.VisibilityAnalysisOptions', lang)}</MenuItem>,
          children: [
            {
              key: 'solar-panel-visibility-grid-cell-size',
              label: <SolarPanelVisibilityGridCellSizeInput />,
            },
          ],
        },
      ],
    });
  }

  // === parabolic-troughs-submenu ===
  if (elementCounter.parabolicTroughCount > 0) {
    items.push({
      key: 'parabolic-troughs-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.parabolicTroughSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'parabolic-trough-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeParabolicTroughDailyYield}>
              {i18n.t('menu.parabolicTrough.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'parabolic-trough-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeParabolicTroughYearlyYield}>
              {i18n.t('menu.parabolicTrough.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'parabolic-trough-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.AnalysisOptions', lang)}</MenuItem>,
          children: cspSimulationSettings('parabolic-trough'),
        },
      ],
    });
  }

  // === parabolic-dishes-submenu ===
  if (elementCounter.parabolicDishCount > 0) {
    items.push({
      key: 'parabolic-dishes-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.parabolicDishSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'parabolic-dish-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeParabolicDishDailyYield}>
              {i18n.t('menu.parabolicDish.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'parabolic-dish-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeParabolicDishYearlyYield}>
              {i18n.t('menu.parabolicDish.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'parabolic-dish-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.AnalysisOptions', lang)}</MenuItem>,
          children: cspSimulationSettings('parabolic-dish'),
        },
      ],
    });
  }

  // === fresnel-reflector-submenu ===
  if (elementCounter.fresnelReflectorCount > 0) {
    items.push({
      key: 'fresnel-reflector-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.fresnelReflectorSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'fresnel-reflector-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeFresnelReflectorDailyYield}>
              {i18n.t('menu.fresnelReflector.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'fresnel-reflector-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeFresnelReflectorYearlyYield}>
              {i18n.t('menu.fresnelReflector.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'fresnel-reflector-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.AnalysisOptions', lang)}</MenuItem>,
          children: cspSimulationSettings('fresnel-reflector'),
        },
      ],
    });
  }

  // === heliostat-submenu ===
  if (elementCounter.heliostatCount > 0) {
    items.push({
      key: 'heliostat-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.heliostatSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'heliostat-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeHeliostatDailyYield}>
              {i18n.t('menu.heliostat.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'heliostat-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeHeliostatYearlyYield}>
              {i18n.t('menu.heliostat.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'heliostat-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.AnalysisOptions', lang)}</MenuItem>,
          children: cspSimulationSettings('heliostat-analysis'),
        },
      ],
    });
  }

  // === solar-updraft-tower-submenu ===
  if (elementCounter.solarUpdraftTowerCount > 0) {
    items.push({
      key: 'solar-updraft-tower-submenu',
      label: <MenuItem noPadding>{i18n.t('menu.solarUpdraftTowerSubMenu', lang)}</MenuItem>,
      children: [
        {
          key: 'solar-updraft-tower-daily-yield',
          label: (
            <MenuItem noPadding onClick={analyzeSolarUpdraftTowerDailyYield}>
              {i18n.t('menu.solarUpdraftTower.AnalyzeDailyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'solar-updraft-tower-yearly-yield',
          label: (
            <MenuItem noPadding onClick={analyzeSolarUpdraftTowerYearlyYield}>
              {i18n.t('menu.solarUpdraftTower.AnalyzeYearlyYield', lang)}
            </MenuItem>
          ),
        },
        {
          key: 'solar-updraft-tower-analysis-options',
          label: <MenuItem noPadding>{i18n.t('menu.AnalysisOptions', lang)}</MenuItem>,
          children: sutSimulationSettings(),
        },
      ],
    });
  }

  return items;
};
