/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import './app.css';
import { Camera, Canvas } from '@react-three/fiber';
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
import { DEFAULT_FAR, DEFAULT_FOV, VERSION } from './constants';
import { showInfo, visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import { Modal, ConfigProvider } from 'antd';
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
import CompassContainer from './compassContainer';
import { WallModel } from './models/WallModel';
import * as Selector from 'src/stores/selector';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import ErrorPage from './ErrorPage';
import i18n from './i18n/i18n';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import KeyboardEventHandler from 'react-keyboard-event-handler';

const App = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore((state) => state.language);
  const loadWeatherData = useStore(Selector.loadWeatherData);
  const getClosestCity = useStore(Selector.getClosestCity);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deleteElementById = useStore(Selector.deleteElementById);
  const countElementsByType = useStore(Selector.countElementsByType);
  const getElementById = useStore(Selector.getElementById);
  const updateElementById = useStore(Selector.updateElementById);
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const orthographic = useStore(Selector.viewstate.orthographic) ?? false;
  const orthographicChanged = useStore((state) => state.orthographicChanged);
  const simulationInProgress = useStore((state) => state.simulationInProgress);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const viewState = useStore((state) => state.viewState);
  const loadPvModules = useStore((state) => state.loadPvModules);
  const heliodonRadius = useStore((state) => state.heliodonRadius);
  const cameraZoom = useStore(Selector.viewstate.cameraZoom) ?? 20;

  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(false);
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
  const camRef = useRef<Camera>();

  useEffect(() => {
    loadWeatherData();
    loadPvModules();
    setLoading(false);
  }, []);

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude));
  }, [worldLatitude, worldLongitude]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = objectTypeToAdd === ObjectType.None ? 'default' : 'crosshair';
    }
  }, [objectTypeToAdd]);

  useEffect(() => {
    setUpdate(!update);
  }, [orthographic]);

  const onKeyDown = (key: string, e: KeyboardEvent) => {
    switch (key) {
      case 'Delete':
        const selectedElement = getSelectedElement();
        if (selectedElement) {
          if (selectedElement.type === ObjectType.Wall) {
            const currentWall = selectedElement as WallModel;
            if (currentWall.leftJoints.length > 0) {
              const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { rightOffset: 0, rightJoints: [] });
              }
            }
            if (currentWall.rightJoints.length > 0) {
              const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
              if (targetWall) {
                updateElementById(targetWall.id, { leftOffset: 0, leftJoints: [] });
              }
            }
            setCommonStore((state) => {
              state.deletedWallID = selectedElement.id;
            });
          }
          deleteElementById(selectedElement.id);
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default'; // if an element is deleted but the cursor is not default
          }
        }
        break;
    }
  };

  const onKeyUp = (key: string, e: KeyboardEvent) => {};

  const setTopView = () => {
    if (orbitControlsRef.current) {
      // I don't know why the reset method results in a black screen.
      // So we are resetting it here to a predictable position.
      const z = Math.min(50, heliodonRadius * 4);
      orbitControlsRef.current.object.position.set(0, 0, z);
      orbitControlsRef.current.target.set(0, 0, 0);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        // FIXME: why can't set function be used with a proxy?
        // Using set or copy will result in crash in run time.
        const v = state.viewState;
        v.cameraPosition.x = 0;
        v.cameraPosition.y = 0;
        v.cameraPosition.z = z;
        v.panCenter.x = 0;
        v.panCenter.y = 0;
        v.panCenter.z = 0;
      });
    }
  };

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

  const lang = { lng: language };
  let locale = enUS;
  if (language === 'zh_cn') {
    locale = zhCN;
  } else if (language === 'zh_tw') {
    locale = zhTW;
  } else if (language === 'es') {
    locale = esES;
  } else if (language === 'tr') {
    locale = trTR;
  }

  console.log('x');

  return (
    <ConfigProvider locale={locale}>
      <ErrorPage>
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
              title={i18n.t('tooltip.gotoIFI', lang)}
              onClick={visitIFI}
            />
            &nbsp;&nbsp; {i18n.t('name.IFI', lang)}, &copy;{new Date().getFullYear()}. &nbsp;
            {i18n.t('word.Version', lang) + ' ' + VERSION}
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
          <MainToolBar resetView={setTopView} />
          <Modal
            width={600}
            visible={pvModelDialogVisible}
            title={i18n.t('pvModelPanel.SolarPanelSpecs', lang)}
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
                orthographic={orthographic}
                camera={{ zoom: orthographic ? cameraZoom : 1, fov: DEFAULT_FOV, far: DEFAULT_FAR }}
                shadows={true}
                gl={{ preserveDrawingBuffer: true }}
                frameloop={'demand'}
                style={{ height: 'calc(100vh - 70px)', backgroundColor: 'black' }}
              >
                {/*
            The following is for switching camera between the orthographic and perspective modes from the menu.
            For some reason, the above code does not trigger the camera to change unless we reload the entire page,
             which is not desirable. So we have to do it this way.
             */}
                {orthographicChanged &&
                  (orthographic ? (
                    <OrthographicCamera
                      zoom={cameraZoom}
                      position={[0, 0, Math.min(50, heliodonRadius * 4)]}
                      makeDefault={true}
                      ref={camRef}
                    />
                  ) : (
                    <PerspectiveCamera zoom={1} fov={DEFAULT_FOV} far={DEFAULT_FAR} makeDefault={true} ref={camRef} />
                  ))}
                <OrbitController
                  orbitControlsRef={orbitControlsRef}
                  canvasRef={canvasRef}
                  currentCamera={camRef.current}
                />
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
              <KeyboardEventHandler
                handleKeys={['left', 'up', 'right', 'down']}
                handleEventType={'keydown'}
                onKeyEvent={(key, e) => onKeyDown(key, e)}
              />
              <KeyboardEventHandler
                handleKeys={['delete']}
                handleEventType={'keyup'}
                onKeyEvent={(key, e) => onKeyUp(key, e)}
              />
            </div>
          </DropdownContextMenu>
          <CompassContainer />
          <AcceptCookie />
        </div>
      </ErrorPage>
    </ConfigProvider>
  );
};

export default App;
