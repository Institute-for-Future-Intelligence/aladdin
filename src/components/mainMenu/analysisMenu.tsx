/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Modal } from 'antd';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../../stores/selector';
import { Util } from 'src/Util';
import { showError, showInfo, showWarning } from 'src/helpers';
import { MainMenuItem, MainMenuSwitch, MainSubMenu } from './mainMenuItems';
import { ElementCounter } from 'src/stores/ElementCounter';
import { BuildingCompletionStatus, EnergyModelingType, ObjectType, SolarStructure } from 'src/types';
import { checkBuilding, CheckStatus } from 'src/analysis/heatTools';
import PvSimulationSettings from './pvSimulationSettings';
import CspSimulationSettings from './cspSimulationSettings';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { MAXIMUM_HEATMAP_CELLS } from '../../constants';
import { SolarRadiationHeatmapMaxValueInput } from './solarRadiationHeatmapMaxValueInput';
import { SensorSimulationSamplingFrequencyInput } from './sensorSimulationSamplingFrequencyInput';
import { SolarPanelVisibilityGridCellSizeInput } from './solarPanelVisibilityGridCellSizeInput';
import { EnergyGridCellSizeInput } from './energyGridCellSizeInput';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useLanguage } from 'src/hooks';
import { SamplingFrequencySelect } from './samplingFrequencySelect';
import { SimulationSamplingDaysSelect } from './simulationSamplingDaysSelect';

const AnalysisMenu = () => {
  const lang = useLanguage();
  const elements = useStore(Selector.elements);
  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType();

  if (!elementCounter.gotSome()) return null;

  const setPrimitiveStore = usePrimitiveStore.getState().setPrimitiveStore;
  const setCommonStore = useStore.getState().set;
  const selectNone = useStore.getState().selectNone;
  const countElementsByType = useStore.getState().countElementsByType;
  const countHeatmapCells = useStore.getState().countHeatmapCells;

  const runDynamicSimulation = usePrimitiveStore.getState().runDynamicSimulation;
  const runStaticSimulation = usePrimitiveStore.getState().runStaticSimulation;
  const noAnimationForHeatmapSimulation = useStore.getState().world.noAnimationForHeatmapSimulation;
  const loggable = useStore.getState().loggable;

  const hasMovingParts = Util.hasMovingParts(elements);

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

  const toggleSolarRadiationHeatmapReflectionOnly = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.solarRadiationHeatMapReflectionOnly = checked;
    });
  };

  const toggleNoAnimationForHeatmapSimulation = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.world.noAnimationForHeatmapSimulation = checked;
    });
  };

  const toggleNoAnimationForSensorDataCollection = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.world.noAnimationForSensorDataCollection = checked;
    });
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

  return (
    <MainSubMenu label={i18n.t('menu.analysisSubMenu', lang)}>
      {/* physics submenu */}
      <MainSubMenu label={i18n.t('menu.physicsSubMenu', lang)}>
        {/* daily solar radiation heatmap */}
        <MainMenuItem onClick={handleDailySolarRadiationHeatmap}>
          {i18n.t('menu.physics.DailySolarRadiationHeatmap', lang)}
        </MainMenuItem>
        {/* solar radiation heatmap options */}
        <MainSubMenu label={i18n.t('menu.physics.SolarRadiationHeatmapOptions', lang)}>
          {/* solar-radiation-heatmap-grid-cell-size */}
          <EnergyGridCellSizeInput type={EnergyModelingType.BUILDING} />
          {/* solar-radiation-heatmap-max-value */}
          <SolarRadiationHeatmapMaxValueInput />
          {/* solar-radiation-heatmap-reflection-only */}
          {Util.hasHeliostatOrFresnelReflectors(elements) && (
            <MainMenuSwitch
              selector={Selector.viewState.solarRadiationHeatmapReflectionOnly}
              onChange={toggleSolarRadiationHeatmapReflectionOnly}
            >
              {i18n.t('menu.physics.ReflectionHeatmap', lang) + ':'}
            </MainMenuSwitch>
          )}
          {/* solar-radiation-heatmap-no-animation */}
          {!hasMovingParts && (
            <MainMenuSwitch
              selector={Selector.world.noAnimationForHeatmapSimulation}
              onChange={toggleNoAnimationForHeatmapSimulation}
            >
              {i18n.t('menu.physics.SolarRadiationHeatmapNoAnimation', lang) + ':'}
            </MainMenuSwitch>
          )}
        </MainSubMenu>
      </MainSubMenu>

      {/* sensor submenu */}
      {elementCounter.sensorCount > 0 && (
        <MainSubMenu label={i18n.t('menu.sensorSubMenu', lang)}>
          {/* sensor-collect-daily-data */}
          <MainMenuItem onClick={collectSensorDailyData}>{i18n.t('menu.sensor.CollectDailyData', lang)}</MainMenuItem>
          {/* sensor-collect-yearly-data */}
          <MainMenuItem onClick={collectSensorYearlyData}>{i18n.t('menu.sensor.CollectYearlyData', lang)}</MainMenuItem>
          {/* sensor-simulation-options-submenu-2 */}
          <MainSubMenu label={i18n.t('word.Options', lang)}>
            {/* sensor-simulation-sampling-frequency */}
            <SensorSimulationSamplingFrequencyInput />
            {/* sensor-simulation-no-animation */}
            {!hasMovingParts && (
              <MainMenuSwitch
                selector={Selector.world.noAnimationForSensorDataCollection}
                onChange={toggleNoAnimationForSensorDataCollection}
              >
                {i18n.t('menu.sensor.SensorSimulationNoAnimation', lang) + ':'}
              </MainMenuSwitch>
            )}
          </MainSubMenu>
        </MainSubMenu>
      )}

      {/* building submenu */}
      {elementCounter.wallCount > 0 && (
        <MainSubMenu label={i18n.t('menu.buildingSubMenu', lang)}>
          {/* building-energy-daily-data */}
          <MainMenuItem onClick={handleBuildingEnergyDailyData}>
            {i18n.t('menu.building.AnalyzeDailyBuildingEnergy', lang)}
          </MainMenuItem>
          {/* building-energy-yearly-data */}
          <MainMenuItem onClick={handleBuildingEnergyYearlyData}>
            {i18n.t('menu.building.AnalyzeYearlyBuildingEnergy', lang)}
          </MainMenuItem>
          {/* building-energy-analysis-options-submenu */}
          <MainSubMenu label={i18n.t('menu.building.EnergyAnalysisOptions', lang)}>
            <SamplingFrequencySelect type={EnergyModelingType.BUILDING} />
            <SimulationSamplingDaysSelect type={EnergyModelingType.BUILDING} />
            <EnergyGridCellSizeInput type={EnergyModelingType.BUILDING} />
          </MainSubMenu>
        </MainSubMenu>
      )}

      {/* battery storage submenu */}
      {elementCounter.batteryStorageCount > 0 && atLeastOneConnectedBatteryStorage() && (
        <MainSubMenu label={i18n.t('batteryStorageMenu.BatteryStorage', lang)}>
          <MainMenuItem onClick={analyzeBatteryStorageDailyYield}>
            {i18n.t('menu.storage.AnalyzeDailyChargeDischarge', lang)}
          </MainMenuItem>
          <MainMenuItem onClick={analyzeBatteryStorageYearlyYield}>
            {i18n.t('menu.storage.AnalyzeYearlyStorage', lang)}
          </MainMenuItem>
        </MainSubMenu>
      )}

      {/* solar panels submenu */}
      {elementCounter.solarPanelCount > 0 && (
        <MainSubMenu label={i18n.t('menu.solarPanelSubMenu', lang)}>
          {/* solar panel daily yield */}
          <MainMenuItem onClick={analyzeSolarPanelDailyYield}>
            {i18n.t('menu.solarPanel.AnalyzeDailyYield', lang)}
          </MainMenuItem>

          {/* solar panel yearly yield */}
          <MainMenuItem onClick={analyzeSolarPanelYearlyYield}>
            {i18n.t('menu.solarPanel.AnalyzeYearlyYield', lang)}
          </MainMenuItem>

          {/* solar-panel-energy-analysis-options */}
          <PvSimulationSettings hasMovingParts={hasMovingParts} />

          {/* solar-panel-visibility */}
          <MainMenuItem onClick={solarPanelVisibility}>
            {i18n.t('menu.solarPanel.AnalyzeVisibility', lang)}
          </MainMenuItem>

          {/* solar-panel-visibility-analysis-options */}
          <MainSubMenu label={i18n.t('menu.solarPanel.VisibilityAnalysisOptions', lang)}>
            <SolarPanelVisibilityGridCellSizeInput />
          </MainSubMenu>
        </MainSubMenu>
      )}

      {/* parabolic troughs submenu */}
      {elementCounter.parabolicTroughCount > 0 && (
        <MainSubMenu label={i18n.t('menu.parabolicTroughSubMenu', lang)}>
          {/* parabolic-trough-daily-yield */}
          <MainMenuItem onClick={analyzeParabolicTroughDailyYield}>
            {i18n.t('menu.parabolicTrough.AnalyzeDailyYield', lang)}
          </MainMenuItem>
          {/* parabolic-trough-yearly-yield */}
          <MainMenuItem onClick={analyzeParabolicTroughYearlyYield}>
            {i18n.t('menu.parabolicTrough.AnalyzeYearlyYield', lang)}
          </MainMenuItem>
          {/* parabolic-trough-analysis-options */}
          <CspSimulationSettings />
        </MainSubMenu>
      )}

      {/* parabolic dishes submenu */}
      {elementCounter.parabolicDishCount > 0 && (
        <MainSubMenu label={i18n.t('menu.parabolicDishSubMenu', lang)}>
          {/* parabolic dish daily yield */}
          <MainMenuItem onClick={analyzeParabolicDishDailyYield}>
            {i18n.t('menu.parabolicDish.AnalyzeDailyYield', lang)}
          </MainMenuItem>

          {/* parabolic dish yearly yield */}
          <MainMenuItem onClick={analyzeParabolicDishYearlyYield}>
            {i18n.t('menu.parabolicDish.AnalyzeYearlyYield', lang)}
          </MainMenuItem>

          {/* parabolic dish analysis options */}
          <CspSimulationSettings />
        </MainSubMenu>
      )}

      {/* fresnel reflector submenu */}
      {elementCounter.fresnelReflectorCount > 0 && (
        <MainSubMenu label={i18n.t('menu.fresnelReflectorSubMenu', lang)}>
          {/* fresnel reflector daily yield */}
          <MainMenuItem onClick={analyzeFresnelReflectorDailyYield}>
            {i18n.t('menu.fresnelReflector.AnalyzeDailyYield', lang)}
          </MainMenuItem>

          {/* fresnel reflector yearly yield */}
          <MainMenuItem onClick={analyzeFresnelReflectorYearlyYield}>
            {i18n.t('menu.fresnelReflector.AnalyzeYearlyYield', lang)}
          </MainMenuItem>

          {/* fresnel-reflector-analysis-options */}
          <CspSimulationSettings />
        </MainSubMenu>
      )}

      {/* heliostat submenu */}
      {elementCounter.heliostatCount > 0 && (
        <MainSubMenu label={i18n.t('menu.heliostatSubMenu', lang)}>
          {/* heliostat daily yield */}
          <MainMenuItem onClick={analyzeHeliostatDailyYield}>
            {i18n.t('menu.heliostat.AnalyzeDailyYield', lang)}
          </MainMenuItem>

          {/* heliostat yearly yield */}
          <MainMenuItem onClick={analyzeHeliostatYearlyYield}>
            {i18n.t('menu.heliostat.AnalyzeYearlyYield', lang)}
          </MainMenuItem>

          {/* heliostat-analysis-options */}
          <CspSimulationSettings />
        </MainSubMenu>
      )}

      {/* solar updraft tower submenu */}
      {elementCounter.solarUpdraftTowerCount > 0 && (
        <MainSubMenu label={i18n.t('menu.solarUpdraftTowerSubMenu', lang)}>
          {/* solar updraft tower daily yield */}
          <MainMenuItem onClick={analyzeSolarUpdraftTowerDailyYield}>
            {i18n.t('menu.solarUpdraftTower.AnalyzeDailyYield', lang)}
          </MainMenuItem>

          {/* solar updraft tower yearly yield */}
          <MainMenuItem onClick={analyzeSolarUpdraftTowerYearlyYield}>
            {i18n.t('menu.solarUpdraftTower.AnalyzeYearlyYield', lang)}
          </MainMenuItem>

          {/* solar-updraft-tower-analysis-options */}
          <MainSubMenu label={i18n.t('menu.AnalysisOptions', lang)}>
            {/* SUT simulation sampling frequency */}
            <SamplingFrequencySelect type={EnergyModelingType.SUT} />

            {/* SUT simulation sampling days */}
            <SimulationSamplingDaysSelect type={EnergyModelingType.SUT} />

            {/* SUT simulation grid cell size */}
            <EnergyGridCellSizeInput type={EnergyModelingType.SUT} />
          </MainSubMenu>
        </MainSubMenu>
      )}
    </MainSubMenu>
  );
};

export default AnalysisMenu;
