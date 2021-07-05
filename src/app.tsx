/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import './app.css';
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Sky from "./views/sky";
import Axes from "./views/axes";
import Compass from "./views/compass";
import ElementsRenderer from "./elementsRenderer";
import Ground from "./views/ground";
import {useStore} from "./stores/common";
import {Euler, Vector3} from "three";
import Heliodon from "./views/heliodon";
import {Util} from "./Util";
import {computeDeclinationAngle, computeHourAngle, computeSunLocation} from "./analysis/sunTools";
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from "./mainMenu";
import GroundPanel from "./panels/groundPanel";
import HeliodonPanel from "./panels/heliodonPanel";
import {VERSION} from "./constants";
import {showInfo, visitHomepage, visitIFI} from "./helpers";
import AcceptCookie from "./acceptCookie";
import GroundImage from "./views/groundImage";
import {Dropdown} from "antd";
import ContextMenu from "./contextMenu";
import WeatherPanel from "./panels/weatherPanel";
import {GraphDataType, ObjectType} from "./types";
import YearlyLightSensorPanel from "./panels/yearlyLightSensorPanel";
import DailyLightSensorPanel from "./panels/dailyLightSensorPanel";
import Simulation from "./analysis/simulation";
import MainToolBar from "./mainToolBar";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Spinner from './components/spinner';
import useKey from "./useKey";
import StickyNotePanel from "./panels/stickyNotePanel";
import InfoPanel from "./panels/infoPanel";

const App = () => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const loadWeatherData = useStore(state => state.loadWeatherData);
    const getClosestCity = useStore(state => state.getClosestCity);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const deleteElementById = useStore(state => state.deleteElementById);
    const aabb = useStore(state => state.aabb);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);
    const countElementsByType = useStore(state => state.countElementsByType);

    const grid = useStore(state => state.grid);
    const enableOrbitController = useStore(state => state.enableOrbitController);
    const weatherData = useStore(state => state.weatherData);

    const [loading, setLoading] = useState(true);
    const [updateFlag, setUpdateFlag] = useState<boolean>(false);
    const [hourAngle, setHourAngle] = useState<number>(0);
    const [declinationAngle, setDeclinationAngle] = useState<number>(0);
    const [sunlightDirection, setSunlightDirection] = useState<Vector3>(new Vector3(0, 2, 2));
    const [animateSun, setAnimateSun] = useState<boolean>(false);
    const [city, setCity] = useState<string | null>('Boston MA, USA');
    const [dailyLightSensorDataFlag, setDailyLightSensorDataFlag] = useState<boolean>(false);
    const [yearlyLightSensorDataFlag, setYearlyLightSensorDataFlag] = useState<boolean>(false);
    const [cameraPosition, setCameraPosition] = useState<Vector3>(new Vector3(0, 0, 5));
    const [panCenter, setPanCenter] = useState<Vector3>(new Vector3());
    const [heliodonRadius, setHeliodonRadius] = useState<number>(10);

    const orbitControlsRef = useRef<OrbitControls>();
    const canvasRef = useRef<HTMLCanvasElement>();
    const now = new Date(world.date);

    useEffect(() => {
        loadWeatherData();
        setLoading(false);
    }, []);

    useEffect(() => {
        setSunlightDirection(computeSunLocation(heliodonRadius, hourAngle, declinationAngle, Util.toRadians(world.latitude))
            .applyEuler(new Euler(-Util.HALF_PI, 0, 0)));
    }, [world.latitude, hourAngle, declinationAngle]);

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
        // we have to cache the camera position in the state from the common store world camera.
        setCameraPosition(new Vector3(world.cameraPosition.x, world.cameraPosition.y, world.cameraPosition.z));
        // we have to manually set the camera position
        if (orbitControlsRef.current) {
            orbitControlsRef.current.object.position.x = world.cameraPosition.x;
            orbitControlsRef.current.object.position.y = world.cameraPosition.y;
            orbitControlsRef.current.object.position.z = world.cameraPosition.z;
            orbitControlsRef.current.update();
        }
    }, [world.cameraPosition]);

    useEffect(() => {
        // we have to cache the target position in the state from the common store world pan center.
        setPanCenter(new Vector3(world.panCenter.x, world.panCenter.y, world.panCenter.z));
        if (orbitControlsRef.current) {
            // we have to manually set the target position
            orbitControlsRef.current.target.x = world.panCenter.x;
            orbitControlsRef.current.target.y = world.panCenter.y;
            orbitControlsRef.current.target.z = world.panCenter.z;
            orbitControlsRef.current.update();
        }
    }, [world.panCenter]);

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

    const requestUpdate = () => {
        setUpdateFlag(!updateFlag);
    };

    const setGrid = (on: boolean) => {
        setCommonStore(state => {
            state.grid = on;
        });
    };

    const setGroundImage = (on: boolean) => {
        setCommonStore(state => {
            state.viewState.groundImage = on;
        });
        requestUpdate();
    };

    const setGroundColor = (color: string) => {
        setCommonStore(state => {
            state.viewState.groundColor = color;
        });
        requestUpdate();
    };

    const setHeliodon = (on: boolean) => {
        setCommonStore(state => {
            state.viewState.heliodon = on;
        });
        requestUpdate();
    };

    // animation state should not be persisted
    const setSunAnimation = (on: boolean) => {
        setAnimateSun(on);
    };

    const changeDate = (date: Date) => {
        const d = new Date(now);
        d.setFullYear(date.getFullYear());
        d.setMonth(date.getMonth());
        d.setDate(date.getDate());
        setCommonStore(state => {
            state.world.date = d.toString();
        });
        requestUpdate();
    };

    const changeTime = (date: Date) => {
        const d = new Date(now);
        d.setHours(date.getHours(), date.getMinutes());
        setCommonStore(state => {
            state.world.date = d.toString();
        });
        requestUpdate();
    };

    const changeLatitude = (latitude: number) => {
        setCommonStore(state => {
            state.world.latitude = latitude;
        });
        requestUpdate();
    };

    const changeLatitudeAndRemoveAddress = (latitude: number) => {
        setCommonStore(state => {
            state.world.latitude = latitude;
            state.world.address = '';
        });
        requestUpdate();
    };

    const changeLongitude = (longitude: number) => {
        setCommonStore(state => {
            state.world.longitude = longitude;
        });
        requestUpdate();
    };

    const changeMapZoom = (zoom: number) => {
        setCommonStore(state => {
            state.viewState.mapZoom = zoom;
        });
        requestUpdate();
    };

    const changeMapTilt = (tilt: number) => {
        setCommonStore(state => {
            state.viewState.mapTilt = tilt;
        });
        requestUpdate();
    };

    const changeMapType = (type: string) => {
        setCommonStore(state => {
            state.viewState.mapType = type;
        });
        requestUpdate();
    };

    const sunAboveHorizon = sunlightDirection.y > 0;

    const collectDailyLightSensorData = () => {
        const sensorCount = countElementsByType(ObjectType.Sensor);
        if (sensorCount === 0) {
            showInfo('There is no sensor for collecting data.');
            return;
        }
        setCommonStore(state => {
            state.world.timesPerHour = 20;
        });
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
        setCommonStore(state => {
            state.world.timesPerHour = 20;
        });
        setYearlyLightSensorDataFlag(!yearlyLightSensorDataFlag);
        setCommonStore(state => {
            state.viewState.showYearlyLightSensorPanel = true;
        });
    };

    const contextMenu = (
        <ContextMenu
            city={city}
            requestUpdate={requestUpdate}
            canvas={canvasRef.current}
        />
    );

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
                requestUpdate={requestUpdate}
            />
            <MainToolBar orbitControls={orbitControlsRef.current}
                         requestUpdate={requestUpdate}/>
            {viewState.showGroundPanel &&
            <GroundPanel grid={grid}
                         groundImage={viewState.groundImage}
                         groundColor={viewState.groundColor}
                         setGrid={setGrid}
                         setGroundImage={setGroundImage}
                         setGroundColor={setGroundColor}
                         changeLatitude={changeLatitude}
                         changeLongitude={changeLongitude}
                         changeMapZoom={changeMapZoom}
                         changeMapTilt={changeMapTilt}
                         changeMapType={changeMapType}
                         requestUpdate={requestUpdate}
            />}
            {viewState.showHeliodonPanel &&
            <HeliodonPanel latitude={world.latitude}
                           date={now}
                           heliodon={viewState.heliodon}
                           animateSun={animateSun}
                           changeDate={changeDate}
                           changeTime={changeTime}
                           changeLatitude={changeLatitudeAndRemoveAddress}
                           setHeliodon={setHeliodon}
                           setSunAnimation={setSunAnimation}
                           requestUpdate={requestUpdate}
            />}
            {viewState.showYearlyLightSensorPanel &&
            <YearlyLightSensorPanel city={city} requestUpdate={requestUpdate}/>}
            {viewState.showDailyLightSensorPanel &&
            <DailyLightSensorPanel city={city} requestUpdate={requestUpdate}/>}
            {viewState.showWeatherPanel &&
            <WeatherPanel city={city}
                          requestUpdate={requestUpdate}
                          graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]}
            />}
            {viewState.showStickyNotePanel &&
            <StickyNotePanel requestUpdate={requestUpdate}
            />}
            {viewState.showInfoPanel && <InfoPanel city={city} daytime={sunAboveHorizon}/>}
            <Dropdown key={'canvas-context-menu'}
                      trigger={['contextMenu']}
                      overlay={contextMenu}
            >
                <div>
                    <Canvas shadows={true}
                            gl={{preserveDrawingBuffer: true}}
                            camera={{
                                position: cameraPosition,
                                fov: 45,
                            }}
                            style={{height: 'calc(100vh - 70px)', backgroundColor: 'black'}}>
                        <OrbitController
                            enabled={enableOrbitController}
                            autoRotate={viewState.autoRotate}
                            panCenter={panCenter}
                            orbitControlsRef={orbitControlsRef}
                            canvasRef={canvasRef}
                        />
                        <Suspense fallback={null}>
                            <ElementsRenderer/>
                            <ambientLight intensity={0.25} name={'Ambient Light'}/>
                            <directionalLight
                                name={'Directional Light'}
                                color='white'
                                position={[sunlightDirection.x, sunlightDirection.y, sunlightDirection.z]}
                                intensity={sunAboveHorizon ? 0.5 : 0}
                                castShadow
                                shadow-mapSize-height={4096}
                                shadow-mapSize-width={4096}
                                shadowCameraNear={1}
                                shadowCameraFar={100}
                                shadowCameraLeft={-100}
                                shadowCameraRight={100}
                                shadowCameraTop={100}
                                shadowCameraBottom={-100}
                            />
                            {(grid || !enableOrbitController) && legalOnGround() &&
                            <gridHelper name={'Grid'} args={[100, 100, 'gray', 'gray']}/>
                            }
                            <Compass/>
                            {/*<Obj/>*/}
                            <Simulation city={city}
                                        dailyLightSensorDataFlag={dailyLightSensorDataFlag}
                                        yearlyLightSensorDataFlag={yearlyLightSensorDataFlag}/>
                            {viewState.axes && <Axes/>}
                            <Ground/>
                            {viewState.groundImage && <GroundImage/>}
                            <Sky theme={viewState.theme} night={!sunAboveHorizon}/>
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
            </Dropdown>
            <AcceptCookie/>
        </div>
    );
};

export default App;
