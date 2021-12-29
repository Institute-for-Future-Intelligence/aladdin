/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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
import { GraphDataType, ObjectType } from './types';
import SensorSimulation from './analysis/sensorSimulation';
import SolarPanelSimulation from './analysis/solarPanelSimulation';
import YearlyLightSensorPanel from './panels/yearlyLightSensorPanel';
import DailyLightSensorPanel from './panels/dailyLightSensorPanel';
import MainToolBar from './mainToolBar';
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

export interface AppCreatorProps {
  viewOnly: boolean;
}

const AppCreator = ({ viewOnly = false }: AppCreatorProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const changed = useStore(Selector.changed);
  const addUndoable = useStore(Selector.addUndoable);
  const getClosestCity = useStore(Selector.getClosestCity);
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const simulationInProgress = useStore(Selector.simulationInProgress);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const sceneRadius = useStore(Selector.sceneRadius);
  const cameraZoom = useStore(Selector.viewState.cameraZoom) ?? 20;
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
  const showDailyLightSensorPanel = useStore(Selector.viewState.showDailyLightSensorPanel);
  const showYearlyLightSensorPanel = useStore(Selector.viewState.showYearlyLightSensorPanel);
  const showDailyPvYieldPanel = useStore(Selector.viewState.showDailyPvYieldPanel);
  const showYearlyPvYieldPanel = useStore(Selector.viewState.showYearlyPvYieldPanel);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string | null>('Boston MA, USA');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = { lng: language };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldLatitude, worldLongitude]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor =
        objectTypeToAdd !== ObjectType.None || addedCuboidId || addedFoundationId ? 'crosshair' : 'default';
    }
  }, [objectTypeToAdd, addedCuboidId, addedFoundationId]);

  const zoomView = (scale: number) => {
    if (orthographic) {
      const oldZoom = cameraZoom;
      const newZoom = cameraZoom * scale;
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
        orbitControlsRef.current.object.position.set(x, y, z);
        orbitControlsRef.current.update();
        setCommonStore((state) => {
          const v = state.viewState;
          // FIXME: why can't set function be used with a proxy?
          // Using set or copy will result in crash in run time.
          v.cameraPosition = [x, y, z];
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
        // FIXME: why can't set function be used with a proxy?
        // Using set or copy will result in crash in run time.
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
      {(loading || simulationInProgress) && <Spinner />}
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
            bottom: '10px',
            left: '10px',
            zIndex: 999,
            fontSize: '12px',
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
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 999,
            fontSize: '12px',
            userSelect: 'none',
            color: 'antiquewhite',
          }}
        >
          <img
            alt="IFI Logo"
            src={ifiLogo}
            height="40px"
            style={{ verticalAlign: 'bottom', cursor: 'pointer' }}
            title={i18n.t('tooltip.gotoIFI', lang)}
            onClick={visitIFI}
          />
          &nbsp;&nbsp; &copy;{new Date().getFullYear()} {i18n.t('name.IFI', lang)}
          &nbsp;
          {i18n.t('word.Version', lang) + ' ' + VERSION + '. ' + i18n.t('word.AllRightsReserved', lang) + '. '}
        </div>
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
      {showYearlyLightSensorPanel && <YearlyLightSensorPanel city={city} />}
      {showDailyLightSensorPanel && <DailyLightSensorPanel city={city} />}
      {showYearlyPvYieldPanel && <YearlyPvYieldPanel city={city} />}
      {showDailyPvYieldPanel && <DailyPvYieldPanel city={city} />}
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

            <ElementsRenderer />
            <Ground />
            {axes && <Axes />}
            <SceneRadiusCalculator />
            <SensorSimulation city={city} />
            <SolarPanelSimulation city={city} />
            <Auxiliary />
            <Suspense fallback={null}>
              <Sky theme={theme} />
              <Heliodon />
              {groundImage && <GroundImage />}
              {/* <Obj/> */}
            </Suspense>
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
    </div>
  );
};

export default React.memo(AppCreator);
