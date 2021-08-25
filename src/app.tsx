/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import useKey from './useKey';
import './app.css';
import { Canvas } from '@react-three/fiber';
import OrbitController from './orbitController';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Sky from './views/sky';
import Axes from './views/axes';
import ElementsRenderer from './elementsRenderer';
import Ground from './views/ground';
import Heliodon from './views/heliodon';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from './mainMenu';
import MapPanel from './panels/mapPanel';
import HeliodonPanel from './panels/heliodonPanel';
import { VERSION } from './constants';
import { showInfo, visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import { Modal } from 'antd';
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
import InfoPanel from './panels/infoPanel';
import PvModelPanel from './panels/pvModelPanel';
import YearlyPvYieldPanel from './panels/yearlyPvYieldPanel';
import DailyPvYieldPanel from './panels/dailyPvYieldPanel';
import Lights from './lights';
import { Grid } from './grid';
import CameraController from './cameraController';
import CompassContainer from './compassContainer';

const App = () => {
  const setCommonStore = useStore((state) => state.set);
  const worldLatitude = useStore((state) => state.world.latitude);
  const worldLongitude = useStore((state) => state.world.longitude);
  const viewState = useStore((state) => state.viewState);
  const loadWeatherData = useStore((state) => state.loadWeatherData);
  const getClosestCity = useStore((state) => state.getClosestCity);
  const loadPvModules = useStore((state) => state.loadPvModules);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const deleteElementById = useStore((state) => state.deleteElementById);
  const objectTypeToAdd = useStore((state) => state.objectTypeToAdd);
  const countElementsByType = useStore((state) => state.countElementsByType);

  const weatherData = useStore((state) => state.weatherData);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string | null>('Boston MA, USA');
  const [dailyLightSensorDataFlag, setDailyLightSensorDataFlag] = useState<boolean>(false);
  const [yearlyLightSensorDataFlag, setYearlyLightSensorDataFlag] = useState<boolean>(false);
  const [pvDailyYieldFlag, setPvDailyYieldFlag] = useState<boolean>(false);
  const [pvYearlyYieldFlag, setPvYearlyYieldFlag] = useState<boolean>(false);
  const [pvDailyIndividualOutputs, setPvDailyIndividualOutputs] = useState<boolean>(false);
  const [pvYearlyIndividualOutputs, setPvYearlyIndividualOutputs] = useState<boolean>(false);
  const [pvModelDialogVisible, setPvModelDialogVisible] = useState<boolean>(false);

  const orbitControlsRef = useRef<OrbitControls>();
  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    loadWeatherData();
    loadPvModules();
    setLoading(false);
  }, []);

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude));
  }, [worldLatitude, worldLongitude, weatherData]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = objectTypeToAdd === ObjectType.None ? 'default' : 'crosshair';
    }
  }, [objectTypeToAdd]);

  if (useKey('Delete')) {
    const selectedElement = getSelectedElement();
    if (selectedElement) {
      deleteElementById(selectedElement.id);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default'; // if an element is deleted but the cursor is not default
      }
    }
  }

  const collectDailyLightSensorData = () => {
    const sensorCount = countElementsByType(ObjectType.Sensor);
    if (sensorCount === 0) {
      showInfo('There is no sensor for collecting data.');
      return;
    }
    setDailyLightSensorDataFlag(!dailyLightSensorDataFlag);
    setCommonStore((state) => {
      state.viewState.showDailyLightSensorPanel = true;
    });
  };

  const collectYearlyLightSensorData = async () => {
    const sensorCount = countElementsByType(ObjectType.Sensor);
    if (sensorCount === 0) {
      showInfo('There is no sensor for collecting data.');
      return;
    }
    setYearlyLightSensorDataFlag(!yearlyLightSensorDataFlag);
    setCommonStore((state) => {
      state.viewState.showYearlyLightSensorPanel = true;
    });
  };

  const analyzeDailyPvYield = () => {
    const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
    if (solarPanelCount === 0) {
      showInfo('There is no solar panel for analysis.');
    }
    setPvDailyYieldFlag(!pvDailyYieldFlag);
    setCommonStore((state) => {
      state.viewState.showDailyPvYieldPanel = true;
    });
  };

  const analyzeYearlyPvYield = () => {
    const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
    if (solarPanelCount === 0) {
      showInfo('There is no solar panel for analysis.');
    }
    setPvYearlyYieldFlag(!pvYearlyYieldFlag);
    setCommonStore((state) => {
      state.viewState.showYearlyPvYieldPanel = true;
    });
  };

  console.log('x');

  return (
    <div className="App">
      {loading && <Spinner />}
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
          title={'Visit Aladdin homepage'}
          onClick={visitHomepage}
        >
          Aladdin
        </span>
      </div>
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
          title={'Go to Institute for Future Intelligence'}
          onClick={visitIFI}
        />
        &nbsp;&nbsp; Institute for Future Intelligence, &copy;{new Date().getFullYear()}. Version {VERSION}
      </div>
      <MainMenu
        canvas={canvasRef.current}
        collectDailyLightSensorData={collectDailyLightSensorData}
        collectYearlyLightSensorData={collectYearlyLightSensorData}
        setPvDailyIndividualOutputs={setPvDailyIndividualOutputs}
        analyzePvDailyYield={analyzeDailyPvYield}
        setPvYearlyIndividualOutputs={setPvYearlyIndividualOutputs}
        analyzePvYearlyYield={analyzeYearlyPvYield}
      />
      <MainToolBar orbitControls={orbitControlsRef.current} />
      <Modal
        width={600}
        visible={pvModelDialogVisible}
        title="Solar Panel Specs"
        onOk={() => {
          setPvModelDialogVisible(false);
        }}
        onCancel={() => {
          setPvModelDialogVisible(false);
        }}
      >
        <PvModelPanel />
      </Modal>
      {viewState.showMapPanel && <MapPanel />}
      {viewState.showHeliodonPanel && <HeliodonPanel />}
      {viewState.showStickyNotePanel && <StickyNotePanel />}
      {viewState.showInfoPanel && <InfoPanel city={city} />}
      {viewState.showWeatherPanel && (
        <WeatherPanel city={city} graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]} />
      )}
      {viewState.showYearlyLightSensorPanel && (
        <YearlyLightSensorPanel city={city} collectYearlyLightSensorData={collectYearlyLightSensorData} />
      )}
      {viewState.showDailyLightSensorPanel && (
        <DailyLightSensorPanel city={city} collectDailyLightSensorData={collectDailyLightSensorData} />
      )}
      {viewState.showYearlyPvYieldPanel && (
        <YearlyPvYieldPanel
          city={city}
          individualOutputs={pvYearlyIndividualOutputs}
          setIndividualOutputs={setPvYearlyIndividualOutputs}
          analyzeYearlyPvYield={analyzeYearlyPvYield}
        />
      )}
      {viewState.showDailyPvYieldPanel && (
        <DailyPvYieldPanel
          city={city}
          individualOutputs={pvDailyIndividualOutputs}
          setIndividualOutputs={setPvDailyIndividualOutputs}
          analyzeDailyPvYield={analyzeDailyPvYield}
        />
      )}
      <DropdownContextMenu setPvDialogVisible={setPvModelDialogVisible}>
        <div>
          <Canvas
            shadows={true}
            gl={{ preserveDrawingBuffer: true }}
            frameloop={'demand'}
            style={{ height: 'calc(100vh - 70px)', backgroundColor: 'black' }}
          >
            <CameraController />
            <OrbitController orbitControlsRef={orbitControlsRef} canvasRef={canvasRef} />
            <Lights />

            <ElementsRenderer />
            <Heliodon />
            {viewState.axes && <Axes />}

            <SensorSimulation
              city={city}
              dailyLightSensorDataFlag={dailyLightSensorDataFlag}
              yearlyLightSensorDataFlag={yearlyLightSensorDataFlag}
            />
            <SolarPanelSimulation
              city={city}
              dailyIndividualOutputs={pvDailyIndividualOutputs}
              yearlyIndividualOutputs={pvYearlyIndividualOutputs}
              dailyPvYieldFlag={pvDailyYieldFlag}
              yearlyPvYieldFlag={pvYearlyYieldFlag}
            />
            <Suspense fallback={null}>
              <Ground />
              <Grid />
              {viewState.groundImage && <GroundImage />}
              {/* <Obj/> */}
            </Suspense>
            <Suspense fallback={null}>
              <Sky theme={viewState.theme} />
            </Suspense>
          </Canvas>
        </div>
      </DropdownContextMenu>
      <CompassContainer />
      <AcceptCookie />
    </div>
  );
};

export default App;
