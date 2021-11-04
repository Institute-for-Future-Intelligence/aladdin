/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
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
import { showError, showInfo, visitHomepage, visitIFI } from './helpers';
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
import * as Selector from 'src/stores/selector';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import ErrorPage from './ErrorPage';
import i18n from './i18n/i18n';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import KeyboardListener from './keyboardListener';
import { Vector3 } from 'three';
import { saveAs } from 'file-saver';

const App = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore((state) => state.language);
  const locale = useStore((state) => state.locale);
  const localFileName = useStore((state) => state.localFileName);
  const loadWeatherData = useStore(Selector.loadWeatherData);
  const getClosestCity = useStore(Selector.getClosestCity);
  const countElementsByType = useStore(Selector.countElementsByType);
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
  const exportContent = useStore((state) => state.exportContent);

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
  const [keyName, setKeyName] = useState<string | undefined>();
  const [keyDown, setKeyDown] = useState<boolean>(false);
  const [keyUp, setKeyUp] = useState<boolean>(false);
  const [keyFlag, setKeyFlag] = useState<boolean>(false);

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

  const handleKeyEvent = (key: string, down: boolean, e: KeyboardEvent) => {
    setKeyName(key);
    setKeyDown(down);
    setKeyUp(!down);
    setKeyFlag(!keyFlag);
  };

  const set2DView = (selected: boolean) => {
    setCommonStore((state) => {
      state.viewState.orthographic = selected;
      state.viewState.enableRotate = !selected;
      state.orthographicChanged = true;
      if (selected) {
        state.viewState.cameraPosition.x = 0;
        state.viewState.cameraPosition.y = 0;
        state.viewState.cameraPosition.z = Math.min(50, heliodonRadius * 4);
        state.viewState.panCenter.x = 0;
        state.viewState.panCenter.y = 0;
        state.viewState.panCenter.z = 0;
      }
    });
  };

  const readLocalFile = () => {
    document.body.onfocus = () => {
      setCommonStore((state) => {
        state.localFileDialogRequested = false;
      });
    };
    const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
    fileDialog.onchange = (e) => {
      if (fileDialog.files && fileDialog.files.length > 0) {
        const reader = new FileReader();
        reader.readAsText(fileDialog.files[0]);
        const fn = fileDialog.files[0].name;
        setCommonStore((state) => {
          state.localFileName = fn;
        });
        reader.onload = (e) => {
          if (reader.result) {
            const input = JSON.parse(reader.result.toString());
            setCommonStore((state) => {
              // remove old properties
              if (input.world.hasOwnProperty('cameraPosition')) delete input.world.cameraPosition;
              if (input.world.hasOwnProperty('panCenter')) delete input.world.panCenter;
              if (!input.view.hasOwnProperty('cameraPosition')) input.view.cameraPosition = new Vector3(0, -5, 0);
              if (!input.view.hasOwnProperty('panCenter')) input.view.panCenter = new Vector3(0, 0, 0);
              state.world = input.world;
              state.viewState = input.view;
              state.elements = input.elements;
              state.notes = input.notes ?? [];
            });
          }
          fileDialog.value = '';
        };
      }
    };
    fileDialog.click();
  };

  const writeLocalFile = () => {
    const fn = localFileName.trim();
    if (fn.length > 0) {
      const blob = new Blob([JSON.stringify(exportContent())], { type: 'application/json' });
      saveAs(blob, fn);
      return true;
    } else {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidFileName', lang) + '.');
      return false;
    }
  };

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
            readLocalFile={readLocalFile}
            writeLocalFile={writeLocalFile}
            set2DView={set2DView}
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
              <KeyboardListener
                keyFlag={keyFlag}
                keyName={keyName}
                keyDown={keyDown}
                keyUp={keyUp}
                canvas={canvasRef.current}
                readLocalFile={readLocalFile}
                writeLocalFile={writeLocalFile}
                set2DView={set2DView}
              />
              <KeyboardEventHandler
                handleKeys={[
                  'left',
                  'up',
                  'right',
                  'down',
                  'control+o',
                  'control+s',
                  'control+c',
                  'control+x',
                  'control+v',
                ]}
                handleEventType={'keydown'}
                onKeyEvent={(key, e) => {
                  e.preventDefault();
                  handleKeyEvent(key, true, e);
                }}
              />
              <KeyboardEventHandler
                handleKeys={['delete', 'f2']}
                handleEventType={'keyup'}
                onKeyEvent={(key, e) => {
                  e.preventDefault();
                  handleKeyEvent(key, false, e);
                }}
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
