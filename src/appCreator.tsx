/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { Canvas } from '@react-three/fiber';
import Sky from './views/sky';
import Axes from './views/axes';
import ElementsRenderer from './elementsRenderer';
import Ground from './views/ground';
import Heliodon from './views/heliodonWrapper';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from './mainMenu';
import MapPanel from './panels/mapPanel';
import HeliodonPanel from './panels/heliodonPanel';
import { VERSION } from './constants';
import { visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import DropdownContextMenu from './components/contextMenu';
import WeatherPanel from './panels/weatherPanel';
import { DesignProblem, EvolutionMethod, GraphDataType, ObjectType } from './types';
import SensorSimulation from './analysis/sensorSimulation';
import SolarPanelSimulation from './analysis/solarPanelSimulation';
import YearlyLightSensorPanel from './panels/yearlyLightSensorPanel';
import DailyLightSensorPanel from './panels/dailyLightSensorPanel';
import MainToolBar from './mainToolBar';
import ActionLogger from './actionLogger';
import Spinner from './components/spinner';
import StickyNotePanel from './panels/stickyNotePanel';
import InstructionPanel from './panels/instructionPanel';
import YearlyPvYieldPanel from './panels/yearlyPvYieldPanel';
import DailyPvYieldPanel from './panels/dailyPvYieldPanel';
import Lights from './lights';
import { Auxiliary } from './auxiliary';
import CompassContainer from './compassContainer';
import i18n from './i18n/i18n';
import KeyboardListener from './keyboardListener';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import SceneRadiusCalculator from './sceneRadiusCalculator';
import { UndoableChange } from './undo/UndoableChange';
import DesignInfoPanel from './panels/designInfoPanel';
import SiteInfoPanel from './panels/siteInfoPanel';
import CameraController from './cameraController';
import { useStoreRef } from './stores/commonRef';
import { UndoableCameraChange } from './undo/UndoableCameraChange';
import SolarPanelVisibility from './analysis/solarPanelVisibility';
import ShareLink from './shareLinks';
import HeatmapControlPanel from './panels/heatmapControlPanel';
import SimulationControlPanel from './panels/simulationControlPanel';
import VisibilityResultsPanel from './panels/visibilityResultsPanel';
import StaticSolarRadiationSimulation from './analysis/staticSolarRadiationSimulation';
import DynamicSolarRadiationSimulation from './analysis/dynamicSolarRadiationSimulation';
import YearlyParabolicTroughYieldPanel from './panels/yearlyParabolicTroughYieldPanel';
import DailyParabolicTroughYieldPanel from './panels/dailyParabolicTroughYieldPanel';
import ParabolicTroughSimulation from './analysis/parabolicTroughSimulation';
import DailyParabolicDishYieldPanel from './panels/dailyParabolicDishYieldPanel';
import YearlyParabolicDishYieldPanel from './panels/yearlyParabolicDishYieldPanel';
import ParabolicDishSimulation from './analysis/parabolicDishSimulation';
import FresnelReflectorSimulation from './analysis/fresnelReflectorSimulation';
import DailyFresnelReflectorYieldPanel from './panels/dailyFresnelReflectorYieldPanel';
import YearlyFresnelReflectorYieldPanel from './panels/yearlyFresnelReflectorYieldPanel';
import { Util } from './Util';
import DailyHeliostatYieldPanel from './panels/dailyHeliostatYieldPanel';
import YearlyHeliostatYieldPanel from './panels/yearlyHeliostatYieldPanel';
import HeliostatSimulation from './analysis/heliostatSimulation';
import SolarUpdraftTowerSimulation from './analysis/solarUpdraftTowerSimulation';
import DailySolarUpdraftTowerYieldPanel from './panels/dailySolarUpdraftTowerYieldPanel';
import DiurnalTemperaturePanel from './panels/diurnalTemperaturePanel';
import YearlySolarUpdraftTowerYieldPanel from './panels/yearlySolarUpdraftTowerYieldPanel';
import EvolutionControlPanel from './panels/evolutionControlPanel';
import SolarPanelTiltAngleGa from './ai/ga/solarPanelTiltAngleGa';
import SolarPanelArrayGa from './ai/ga/solarPanelArrayGa';
import SolarPanelTiltAnglePso from './ai/pso/solarPanelTiltAnglePso';
import SolarPanelOptimizationResult from './panels/solarPanelOptimizationResult';
import EconomicsPanel from './panels/economicsPanel';
import SolarPanelArrayPso from './ai/pso/solarPanelArrayPso';

export interface AppCreatorProps {
  viewOnly: boolean;
}

const AppCreator = ({ viewOnly = false }: AppCreatorProps) => {
  const user = useStore(Selector.user);
  const loggable = useStore(Selector.loggable);
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const language = useStore(Selector.language);
  const changed = useStore(Selector.changed);
  const addUndoable = useStore(Selector.addUndoable);
  const getClosestCity = useStore(Selector.getClosestCity);
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const simulationInProgress = useStore(Selector.simulationInProgress);
  const simulationPaused = useStore(Selector.simulationPaused);
  const evolutionInProgress = useStore(Selector.evolutionInProgress);
  const evolutionPaused = useStore(Selector.evolutionPaused);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const sceneRadius = useStore(Selector.sceneRadius);
  const cloudFile = useStore(Selector.cloudFile);
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const groundImage = useStore(Selector.viewState.groundImage);
  const showSiteInfoPanel = useStore(Selector.viewState.showSiteInfoPanel);
  const showDesignInfoPanel = useStore(Selector.viewState.showDesignInfoPanel);
  const showInstructionPanel = useStore(Selector.viewState.showInstructionPanel);
  const showMapPanel = useStore(Selector.viewState.showMapPanel);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const showStickyNotePanel = useStore(Selector.viewState.showStickyNotePanel);
  const showWeatherPanel = useStore(Selector.viewState.showWeatherPanel);
  const showDiurnalTemperaturePanel = useStore(Selector.viewState.showDiurnalTemperaturePanel);
  const showEconomicsPanel = useStore(Selector.viewState.showEconomicsPanel);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const noAnimationForHeatmapSimulation = useStore(Selector.world.noAnimationForHeatmapSimulation);
  const showDailyLightSensorPanel = useStore(Selector.viewState.showDailyLightSensorPanel);
  const showYearlyLightSensorPanel = useStore(Selector.viewState.showYearlyLightSensorPanel);
  const showDailyPvYieldPanel = useStore(Selector.viewState.showDailyPvYieldPanel);
  const showYearlyPvYieldPanel = useStore(Selector.viewState.showYearlyPvYieldPanel);
  const showVisibilityResultsPanel = useStore(Selector.viewState.showVisibilityResultsPanel);
  const showDailyParabolicTroughYieldPanel = useStore(Selector.viewState.showDailyParabolicTroughYieldPanel);
  const showYearlyParabolicTroughYieldPanel = useStore(Selector.viewState.showYearlyParabolicTroughYieldPanel);
  const showDailyParabolicDishYieldPanel = useStore(Selector.viewState.showDailyParabolicDishYieldPanel);
  const showYearlyParabolicDishYieldPanel = useStore(Selector.viewState.showYearlyParabolicDishYieldPanel);
  const showDailyFresnelReflectorYieldPanel = useStore(Selector.viewState.showDailyFresnelReflectorYieldPanel);
  const showYearlyFresnelReflectorYieldPanel = useStore(Selector.viewState.showYearlyFresnelReflectorYieldPanel);
  const showDailyHeliostatYieldPanel = useStore(Selector.viewState.showDailyHeliostatYieldPanel);
  const showYearlyHeliostatYieldPanel = useStore(Selector.viewState.showYearlyHeliostatYieldPanel);
  const showDailyUpdraftTowerYieldPanel = useStore(Selector.viewState.showDailyUpdraftTowerYieldPanel);
  const showYearlyUpdraftTowerYieldPanel = useStore(Selector.viewState.showYearlyUpdraftTowerYieldPanel);
  const showEvolutionPanel = useStore(Selector.viewState.showEvolutionPanel);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const evolutionaryAlgorithmState = useStore(Selector.evolutionaryAlgorithmState);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>('Boston MA, USA');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = { lng: language };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude) ?? 'Boston MA, USA');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldLatitude, worldLongitude]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor =
        objectTypeToAdd !== ObjectType.None || addedCuboidId || addedFoundationId ? 'crosshair' : 'default';
    }
  }, [objectTypeToAdd, addedCuboidId, addedFoundationId]);

  useEffect(() => {
    setCommonStore((state) => {
      state.loggable = user && user.uid ? !user.email?.endsWith('@intofuture.org') : false;
      if (user && user.noLogging) {
        state.loggable = false;
      }
    });
  }, [user]);

  const zoomView = (scale: number) => {
    if (orthographic) {
      // Previously, we declared this in the header: const cameraZoom = useStore(Selector.viewState.cameraZoom) ?? 20;
      // But it causes the app to be re-rendered every time zoom is called.
      const cameraZoom = useStore.getState().viewState.cameraZoom ?? 20;
      const oldZoom = cameraZoom;
      const newZoom = cameraZoom / scale;
      const undoableChange = {
        name: 'Zoom',
        timestamp: Date.now(),
        oldValue: oldZoom,
        newValue: newZoom,
        undo: () => {
          setCommonStore((state) => {
            state.viewState.cameraZoom = undoableChange.oldValue as number;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.viewState.cameraZoom = undoableChange.newValue as number;
          });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setCommonStore((state) => {
        state.viewState.cameraZoom = newZoom;
      });
    } else {
      const orbitControlsRef = useStoreRef.getState().orbitControlsRef;
      if (orbitControlsRef?.current) {
        const p = orbitControlsRef.current.object.position;
        const x = p.x * scale;
        const y = p.y * scale;
        const z = p.z * scale;
        const undoableCameraChange = {
          name: 'Zoom',
          timestamp: Date.now(),
          oldCameraPosition: [p.x, p.y, p.z],
          newCameraPosition: [x, y, z],
          undo: () => {
            const oldX = undoableCameraChange.oldCameraPosition[0];
            const oldY = undoableCameraChange.oldCameraPosition[1];
            const oldZ = undoableCameraChange.oldCameraPosition[2];
            orbitControlsRef.current?.object.position.set(oldX, oldY, oldZ);
            orbitControlsRef.current?.update();
            setCommonStore((state) => {
              state.viewState.cameraPosition = [oldX, oldY, oldZ];
            });
          },
          redo: () => {
            const newX = undoableCameraChange.newCameraPosition[0];
            const newY = undoableCameraChange.newCameraPosition[1];
            const newZ = undoableCameraChange.newCameraPosition[2];
            orbitControlsRef.current?.object.position.set(newX, newY, newZ);
            orbitControlsRef.current?.update();
            setCommonStore((state) => {
              state.viewState.cameraPosition = [newX, newY, newZ];
            });
          },
        } as UndoableCameraChange;
        addUndoable(undoableCameraChange);
        orbitControlsRef.current.object.position.set(x, y, z);
        orbitControlsRef.current.update();
        setCommonStore((state) => {
          state.viewState.cameraPosition = [x, y, z];
        });
      }
    }
  };

  const resetView = () => {
    const orbitControlsRef = useStoreRef.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      // I don't know why the reset method results in a black screen.
      // So we are resetting it here to a predictable position.
      const z = Math.min(50, sceneRadius * 4);
      orbitControlsRef.current.object.position.set(z, z, z);
      orbitControlsRef.current.target.set(0, 0, 0);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        const v = state.viewState;
        v.cameraPosition = [z, z, z];
        v.panCenter = [0, 0, 0];
      });
    }
  };

  const set2DView = (selected: boolean) => {
    setCommonStore((state) => {
      state.viewState.orthographic = selected;
      state.viewState.enableRotate = !selected;
    });
  };

  console.log('x');

  return (
    <div className="App">
      {(loading || simulationInProgress || evolutionInProgress) && (
        <>
          {simulationInProgress && (!noAnimationForHeatmapSimulation || Util.hasMovingParts(elements)) && (
            <SimulationControlPanel />
          )}
          {evolutionInProgress && <EvolutionControlPanel />}
          <Spinner spinning={!simulationPaused || !evolutionPaused} />
        </>
      )}
      <div
        style={{
          backgroundColor: 'lightblue',
          height: '72px',
          paddingTop: '10px',
          textAlign: 'start',
          userSelect: 'none',
          fontSize: '30px',
        }}
      >
        <span
          style={{
            marginLeft: '120px',
            verticalAlign: 'middle',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title={i18n.t('tooltip.visitAladdinHomePage', lang)}
          onClick={visitHomepage}
        >
          {i18n.t('name.Aladdin', lang)}
        </span>
        {cloudFile && (
          <span
            style={{
              marginLeft: '20px',
              fontSize: '14px',
              verticalAlign: 'center',
              userSelect: 'none',
            }}
            title={i18n.t('toolbar.CloudFile', lang)}
          >
            <FontAwesomeIcon
              title={i18n.t('toolbar.CloudFile', lang)}
              icon={faCloud}
              size={'lg'}
              color={'#888888'}
              style={{ paddingRight: '8px' }}
            />
            {cloudFile + (changed ? ' *' : '')}
          </span>
        )}
      </div>
      {viewOnly ? (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            zIndex: 999,
            fontSize: '8px',
            userSelect: 'none',
            color: 'antiquewhite',
          }}
        >
          <img
            alt="IFI Logo"
            src={ifiLogo}
            height="30px"
            style={{ verticalAlign: 'bottom', cursor: 'pointer' }}
            title={i18n.t('tooltip.gotoIFI', lang)}
            onClick={visitIFI}
          />
          {' V ' + VERSION}
        </div>
      ) : (
        <>
          <img
            alt="IFI Logo"
            src={ifiLogo}
            height="40px"
            style={{
              position: 'absolute',
              cursor: 'pointer',
              bottom: '6px',
              left: '6px',
              zIndex: 999,
              userSelect: 'none',
            }}
            title={i18n.t('tooltip.gotoIFI', lang)}
            onClick={visitIFI}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '44px',
              zIndex: 999,
              fontSize: '10px',
              userSelect: 'none',
              color: 'antiquewhite',
            }}
          >
            &nbsp;&nbsp; &copy;{new Date().getFullYear()} {i18n.t('name.IFI', lang)}
            &nbsp;
            {i18n.t('word.VersionInitial', lang) + VERSION + '. ' + i18n.t('word.AllRightsReserved', lang) + '. '}
          </div>
        </>
      )}
      {!viewOnly && (
        <ShareLink size={16} round={true} margin={'2px'} style={{ position: 'absolute', right: '0', top: '80px' }} />
      )}
      <MainMenu
        viewOnly={viewOnly}
        canvas={canvasRef.current}
        set2DView={set2DView}
        resetView={resetView}
        zoomView={zoomView}
      />
      <MainToolBar viewOnly={viewOnly} />
      {showMapPanel && <MapPanel />}
      {showHeliodonPanel && <HeliodonPanel />}
      {showStickyNotePanel && <StickyNotePanel />}
      {showSiteInfoPanel && <SiteInfoPanel city={city} />}
      {showDesignInfoPanel && <DesignInfoPanel />}
      {showInstructionPanel && <InstructionPanel />}
      {showWeatherPanel && (
        <WeatherPanel city={city} graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]} />
      )}
      {showDiurnalTemperaturePanel && <DiurnalTemperaturePanel city={city} />}
      {showEconomicsPanel && (
        <EconomicsPanel
          setDialogVisible={(visible) => {
            setCommonStore((state) => {
              state.viewState.showEconomicsPanel = visible;
            });
          }}
        />
      )}
      {showYearlyLightSensorPanel && <YearlyLightSensorPanel city={city} />}
      {showDailyLightSensorPanel && <DailyLightSensorPanel city={city} />}
      {showYearlyPvYieldPanel && <YearlyPvYieldPanel city={city} />}
      {showDailyPvYieldPanel && <DailyPvYieldPanel city={city} />}
      {showVisibilityResultsPanel && <VisibilityResultsPanel />}
      {showYearlyParabolicTroughYieldPanel && <YearlyParabolicTroughYieldPanel city={city} />}
      {showDailyParabolicTroughYieldPanel && <DailyParabolicTroughYieldPanel city={city} />}
      {showYearlyParabolicDishYieldPanel && <YearlyParabolicDishYieldPanel city={city} />}
      {showDailyParabolicDishYieldPanel && <DailyParabolicDishYieldPanel city={city} />}
      {showDailyFresnelReflectorYieldPanel && <DailyFresnelReflectorYieldPanel city={city} />}
      {showYearlyFresnelReflectorYieldPanel && <YearlyFresnelReflectorYieldPanel city={city} />}
      {showDailyHeliostatYieldPanel && <DailyHeliostatYieldPanel city={city} />}
      {showYearlyHeliostatYieldPanel && <YearlyHeliostatYieldPanel city={city} />}
      {showDailyUpdraftTowerYieldPanel && <DailySolarUpdraftTowerYieldPanel city={city} />}
      {showYearlyUpdraftTowerYieldPanel && <YearlySolarUpdraftTowerYieldPanel city={city} />}
      {showSolarRadiationHeatmap && <HeatmapControlPanel />}
      {showEvolutionPanel && <SolarPanelOptimizationResult />}
      <DropdownContextMenu>
        <div>
          <Canvas
            ref={canvasRef}
            shadows={true}
            gl={{ preserveDrawingBuffer: true }}
            frameloop={'demand'}
            style={{ height: 'calc(100vh - 72px)', backgroundColor: 'black' }}
          >
            <CameraController />
            <Lights />
            <Ground />
            <Auxiliary />
            {/* somehow we have to use two suspense wrappers as follows */}
            <Suspense fallback={null}>
              <ElementsRenderer />
            </Suspense>
            <Suspense fallback={null}>
              {axes && <Axes />}
              <Sky theme={theme} />
              <Heliodon />
              {groundImage && <GroundImage />}
              {/* <Obj/> */}
            </Suspense>
            <SceneRadiusCalculator />
            <StaticSolarRadiationSimulation city={city} />
            <DynamicSolarRadiationSimulation city={city} />
            <SensorSimulation city={city} />
            <SolarPanelSimulation city={city} />
            <SolarPanelVisibility />
            <ParabolicTroughSimulation city={city} />
            <ParabolicDishSimulation city={city} />
            <FresnelReflectorSimulation city={city} />
            <HeliostatSimulation city={city} />
            <SolarUpdraftTowerSimulation city={city} />
            {evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM &&
              evolutionaryAlgorithmState.geneticAlgorithmParams.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE && (
                <SolarPanelTiltAngleGa />
              )}
            {evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM &&
              evolutionaryAlgorithmState.geneticAlgorithmParams.problem === DesignProblem.SOLAR_PANEL_ARRAY && (
                <SolarPanelArrayGa />
              )}
            {evolutionMethod === EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION &&
              evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem ===
                DesignProblem.SOLAR_PANEL_TILT_ANGLE && <SolarPanelTiltAnglePso />}
            {evolutionMethod === EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION &&
              evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem ===
                DesignProblem.SOLAR_PANEL_ARRAY && <SolarPanelArrayPso />}
          </Canvas>
          <KeyboardListener
            canvas={canvasRef.current}
            set2DView={set2DView}
            resetView={resetView}
            zoomView={zoomView}
          />
        </div>
      </DropdownContextMenu>
      <CompassContainer visible={!orthographic} />
      {!viewOnly && <AcceptCookie />}
      {!viewOnly && loggable && <ActionLogger />}
    </div>
  );
};

export default React.memo(AppCreator);
