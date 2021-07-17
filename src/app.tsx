/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {useStore} from "./stores/common";
import useKey from "./useKey";
import './app.css';
import {Util} from "./Util";
import {Euler} from "three";
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Sky from "./views/sky";
import Axes from "./views/axes";
import Compass from "./views/compass";
import ElementsRenderer from "./elementsRenderer";
import Ground from "./views/ground";
import Heliodon from "./views/heliodon";
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from "./mainMenu";
import MapPanel from "./panels/mapPanel";
import HeliodonPanel from "./panels/heliodonPanel";
import {VERSION, WORKSPACE_SIZE} from "./constants";
import {showInfo, visitHomepage, visitIFI} from "./helpers";
import AcceptCookie from "./acceptCookie";
import GroundImage from "./views/groundImage";
import {Modal} from "antd";
import DropdownContextMenu from "./contextMenu";
import WeatherPanel from "./panels/weatherPanel";
import {GraphDataType, ObjectType} from "./types";
import {computeDeclinationAngle, computeHourAngle, computeSunLocation} from "./analysis/sunTools";
import SensorSimulation from "./analysis/sensorSimulation";
import SolarPanelSimulation from "./analysis/solarPanelSimulation";
import YearlyLightSensorPanel from "./panels/yearlyLightSensorPanel";
import DailyLightSensorPanel from "./panels/dailyLightSensorPanel";
import MainToolBar from "./mainToolBar";
import Spinner from './components/spinner';
import StickyNotePanel from "./panels/stickyNotePanel";
import InfoPanel from "./panels/infoPanel";
import PvModelPanel from "./panels/pvModelPanel";
import YearlyPvYieldPanel from "./panels/yearlyPvYieldPanel";
import DailyPvYieldPanel from "./panels/dailyPvYieldPanel";
import Lights from './lights';

const App = () => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const loadWeatherData = useStore(state => state.loadWeatherData);
    const getClosestCity = useStore(state => state.getClosestCity);
    const loadPvModules = useStore(state => state.loadPvModules);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const deleteElementById = useStore(state => state.deleteElementById);
    const aabb = useStore(state => state.aabb);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);
    const countElementsByType = useStore(state => state.countElementsByType);

    const grid = useStore(state => state.grid);
    const enableOrbitController = useStore(state => state.enableOrbitController);
    const weatherData = useStore(state => state.weatherData);

    const sunlightDirection = useStore(state => state.sunlightDirection);
    const setSunlightDirection = useStore(state => state.setSunlightDirection);

    const [loading, setLoading] = useState(true);
    const [hourAngle, setHourAngle] = useState<number>(0);
    const [declinationAngle, setDeclinationAngle] = useState<number>(0);
    const [city, setCity] = useState<string | null>('Boston MA, USA');
    const [dailyLightSensorDataFlag, setDailyLightSensorDataFlag] = useState<boolean>(false);
    const [yearlyLightSensorDataFlag, setYearlyLightSensorDataFlag] = useState<boolean>(false);
    const [pvDailyYieldFlag, setPvDailyYieldFlag] = useState<boolean>(false);
    const [pvYearlyYieldFlag, setPvYearlyYieldFlag] = useState<boolean>(false);
    const [pvDailyIndividualOutputs, setPvDailyIndividualOutputs] = useState<boolean>(false);
    const [pvYearlyIndividualOutputs, setPvYearlyIndividualOutputs] = useState<boolean>(false);
    const [heliodonRadius, setHeliodonRadius] = useState<number>(10);
    const [pvModelDialogVisible, setPvModelDialogVisible] = useState<boolean>(false);

    const orbitControlsRef = useRef<OrbitControls>();
    const canvasRef = useRef<HTMLCanvasElement>();
    const now = useMemo(() => new Date(world.date), [world.date]);

    useEffect(() => {
        loadWeatherData();
        loadPvModules();
        setLoading(false);
    }, []);

    useEffect(() => {
        setSunlightDirection(computeSunLocation(heliodonRadius, hourAngle, declinationAngle, Util.toRadians(world.latitude))
            .applyEuler(new Euler(-Util.HALF_PI, 0, 0)));
    }, [world.latitude, hourAngle, declinationAngle, heliodonRadius]);

    useEffect(() => {
        const min = aabb.min;
        const max = aabb.max;
        let r = Math.abs(min.x);
        if (r < Math.abs(min.y)) r = Math.abs(min.y);
        if (r < Math.abs(min.z)) r = Math.abs(min.z);
        if (r < Math.abs(max.x)) r = Math.abs(max.x);
        if (r < Math.abs(max.y)) r = Math.abs(max.y);
        if (r < Math.abs(max.z)) r = Math.abs(max.z);
        if (!isNaN(r) && isFinite(r)) {
            setHeliodonRadius(r * 1.25); // make it 25% larger than the bounding box
        }
    }, [aabb]);

    useEffect(() => {
        setCity(getClosestCity(world.latitude, world.longitude));
    }, [world.latitude, world.longitude, weatherData]);

    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.style.cursor = objectTypeToAdd === ObjectType.None ? 'default' : 'crosshair';
        }
    }, [objectTypeToAdd]);

    const nowString = now.toString();
    useMemo(() => {
        setHourAngle(computeHourAngle(now));
        setDeclinationAngle(computeDeclinationAngle(now));
    }, [nowString]);

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
        setCommonStore(state => {
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
        setCommonStore(state => {
            state.viewState.showYearlyLightSensorPanel = true;
        });
    };

    const analyzeDailyPvYield = () => {
        const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
        if (solarPanelCount === 0) {
            showInfo('There is no solar panel for analysis.');
        }
        setPvDailyYieldFlag(!pvDailyYieldFlag);
        setCommonStore(state => {
            state.viewState.showDailyPvYieldPanel = true;
        });
    };

    const analyzeYearlyPvYield = () => {
        const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
        if (solarPanelCount === 0) {
            showInfo('There is no solar panel for analysis.');
        }
        setPvYearlyYieldFlag(!pvYearlyYieldFlag);
        setCommonStore(state => {
            state.viewState.showYearlyPvYieldPanel = true;
        });
    };

    // only these elements are allowed to be on the ground
    const legalOnGround = () => {
        const type = getSelectedElement()?.type;
        return (
            type === ObjectType.Foundation ||
            type === ObjectType.Cuboid ||
            type === ObjectType.Tree ||
            type === ObjectType.Human
        );
    };

    console.log('x')

    return (
        <div className="App">
            {loading && <Spinner/>}
            <div style={{
                backgroundColor: 'lightblue',
                height: '72px',
                paddingTop: '10px',
                textAlign: 'start',
                userSelect: 'none',
                fontSize: '30px'
            }}>
                <span style={{marginLeft: '120px', verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none'}}
                      title={'Visit Aladdin homepage'}
                      onClick={visitHomepage}>
                    Aladdin
                </span>
            </div>
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                zIndex: 999,
                fontSize: '12px',
                userSelect: 'none',
                color: 'antiquewhite'
            }}>
                <img alt='IFI Logo'
                     src={ifiLogo}
                     height='40px'
                     style={{verticalAlign: 'bottom', cursor: 'pointer'}}
                     title={'Go to Institute for Future Intelligence'}
                     onClick={visitIFI}/>
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
            <MainToolBar orbitControls={orbitControlsRef.current} heliodonRadius={heliodonRadius}/>
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
                <PvModelPanel/>
            </Modal>
            {viewState.showMapPanel && <MapPanel/>}
            {viewState.showHeliodonPanel && <HeliodonPanel/>}
            {viewState.showStickyNotePanel && <StickyNotePanel/>}
            {viewState.showInfoPanel && <InfoPanel city={city} />}
            {viewState.showWeatherPanel &&
            <WeatherPanel city={city} graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]}/>}
            {viewState.showYearlyLightSensorPanel &&
            <YearlyLightSensorPanel city={city}
                                    collectYearlyLightSensorData={collectYearlyLightSensorData}
            />}
            {viewState.showDailyLightSensorPanel &&
            <DailyLightSensorPanel city={city}
                                   collectDailyLightSensorData={collectDailyLightSensorData}
            />}
            {viewState.showYearlyPvYieldPanel &&
            <YearlyPvYieldPanel city={city}
                                individualOutputs={pvYearlyIndividualOutputs}
                                setIndividualOutputs={setPvYearlyIndividualOutputs}
                                analyzeYearlyPvYield={analyzeYearlyPvYield}
            />}
            {viewState.showDailyPvYieldPanel &&
            <DailyPvYieldPanel city={city}
                               individualOutputs={pvDailyIndividualOutputs}
                               setIndividualOutputs={setPvDailyIndividualOutputs}
                               analyzeDailyPvYield={analyzeDailyPvYield}
            />}
            <DropdownContextMenu
                city={city}
                canvas={canvasRef.current}
                setPvDialogVisible={setPvModelDialogVisible}
            >
                <div>
                    <Canvas shadows={true}
                            gl={{preserveDrawingBuffer: true}}
                            frameloop={'demand'}
                            camera={{
                                position: world.cameraPosition,
                                fov: 45,
                            }}
                            style={{height: 'calc(100vh - 70px)', backgroundColor: 'black'}}>
                        <OrbitController
                            enabled={enableOrbitController}
                            autoRotate={viewState.autoRotate}
                            panCenter={world.panCenter}
                            orbitControlsRef={orbitControlsRef}
                            canvasRef={canvasRef}
                        />
                        <Lights />

                        <ElementsRenderer heliodonRadius={heliodonRadius}/>
                        <Suspense fallback={null}>
                            {(grid || !enableOrbitController) && legalOnGround() && !viewState.groundImage &&
                            <gridHelper name={'Grid'} args={[WORKSPACE_SIZE, WORKSPACE_SIZE, 'gray', 'gray']}/>
                            }
                            <Compass/>
                            {/*<Obj/>*/}
                            <SensorSimulation city={city}
                                              dailyLightSensorDataFlag={dailyLightSensorDataFlag}
                                              yearlyLightSensorDataFlag={yearlyLightSensorDataFlag}/>
                            <SolarPanelSimulation city={city}
                                                  dailyIndividualOutputs={pvDailyIndividualOutputs}
                                                  yearlyIndividualOutputs={pvYearlyIndividualOutputs}
                                                  dailyPvYieldFlag={pvDailyYieldFlag}
                                                  yearlyPvYieldFlag={pvYearlyYieldFlag}/>
                            {viewState.axes && <Axes/>}
                            <Ground/>
                            {viewState.groundImage && <GroundImage/>}
                            <Sky theme={viewState.theme} />
                            {viewState.heliodon &&
                            <Heliodon
                                hourAngle={hourAngle}
                                declinationAngle={declinationAngle}
                                radius={Math.max(10, heliodonRadius)}
                                date={now}
                                latitude={Util.toRadians(world.latitude)}
                            />}
                        </Suspense>
                    </Canvas>
                </div>
            </DropdownContextMenu>
            <AcceptCookie/>
        </div>
    );
};

export default App;
