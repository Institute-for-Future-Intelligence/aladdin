/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie
 */

import React, {Suspense, useEffect, useMemo, useState} from 'react';
import './app.css';
import {Canvas} from '@react-three/fiber';
import OrbitController from "./orbitController";
import Sky from "./views/sky";
import Axes from "./views/axes";
import Compass from "./views/compass";
import SceneContent from "./sceneContent";
import Ground from "./views/ground";
import {useStore} from "./stores/common";
import {Euler, Vector3} from "three";
import Heliodon from "./views/heliodon";
import {Util} from "./util";
import {computeDeclinationAngle, computeHourAngle, computeSunLocation} from "./analysis/sunTools";
import aladdinLogo from './assets/aladdin-logo.png';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from "./mainMenu";
import GroundPanel from "./panels/groundPanel";
import HeliodonPanel from "./panels/heliodonPanel";
import {VERSION} from "./constants";
import {visitIFI} from "./helpers";
import AcceptCookie from "./acceptCookie";
import GroundImage from "./views/groundImage";
import {Dropdown} from "antd";
import ContextMenu from "./contextMenu";
import WeatherPanel from "./panels/weatherPanel";
import {GraphDataType} from "./types";
import YearlyLightSensorPanel from "./panels/yearlyLightSensorPanel";
import DailyLightSensorPanel from "./panels/dailyLightSensorPanel";
import Simulation from "./analysis/simulation";

const App = () => {

    const setCommonStore = useStore(state => state.set);
    const worlds = useStore(state => state.worlds);
    const getWorld = useStore(state => state.getWorld);
    const createNewWorld = useStore(state => state.createNewWorld);
    const loadWeatherData = useStore(state => state.loadWeatherData);
    const getClosestCity = useStore(state => state.getClosestCity);

    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const showDailyLightSensorPanel = useStore(state => state.showDailyLightSensorPanel);
    const showYearlyLightSensorPanel = useStore(state => state.showYearlyLightSensorPanel);

    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const enableOrbitController = useStore(state => state.enableOrbitController);
    const groundImage = useStore(state => state.groundImage);
    const groundColor = useStore(state => state.groundColor);
    const theme = useStore(state => state.theme);
    const heliodon = useStore(state => state.heliodon);
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const weatherData = useStore(state => state.weatherData);
    const now = new Date(useStore(state => state.date));

    const [hourAngle, setHourAngle] = useState<number>(0);
    const [declinationAngle, setDeclinationAngle] = useState<number>(0);
    const [sunlightDirection, setSunlightDirection] = useState<Vector3>(new Vector3(0, 2, 2));
    const [animateSun, setAnimateSun] = useState<boolean>(false);
    const [city, setCity] = useState<string | null>('Boston MA, USA');
    const [dailyLightSensorDataFlag, setDailyLightSensorDataFlag] = useState<boolean>(false);
    const [yearlyLightSensorDataFlag, setYearlyLightSensorDataFlag] = useState<boolean>(false);

    const world = worlds['default']; // currently we have only one world, which is default
    const radius = 10;

    useEffect(() => {
        const defaultWorld = getWorld('default');
        if (!defaultWorld) {
            createNewWorld();
        }
        loadWeatherData();
    }, []);

    useEffect(() => {
        setSunlightDirection(computeSunLocation(radius, hourAngle, declinationAngle, Util.toRadians(latitude))
            .applyEuler(new Euler(-Math.PI / 2, 0, 0)));
    }, [latitude, hourAngle, declinationAngle]);

    useEffect(() => {
        setCity(getClosestCity(latitude, longitude));
    }, [latitude, longitude, weatherData]);

    const nowString = now.toString();
    useMemo(() => {
        setHourAngle(computeHourAngle(now));
        setDeclinationAngle(computeDeclinationAngle(now));
    }, [nowString]);

    const cameraPosition = new Vector3(0, 0, 5);
    if (world) {
        cameraPosition.set(world.cameraPosition.x, world.cameraPosition.y, world.cameraPosition.z);
    }

    const setGrid = (on: boolean) => {
        setCommonStore(state => {
            state.grid = on;
        });
    };

    const setGroundImage = (on: boolean) => {
        setCommonStore(state => {
            state.groundImage = on;
        });
    };

    const setGroundColor = (color: string) => {
        setCommonStore(state => {
            state.groundColor = color;
        });
    };

    const setHeliodon = (on: boolean) => {
        setCommonStore(state => {
            state.heliodon = on;
        });
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
            state.date = d.toString();
        });
    };

    const changeTime = (date: Date) => {
        const d = new Date(now);
        d.setHours(date.getHours(), date.getMinutes());
        setCommonStore(state => {
            state.date = d.toString();
        });
    };

    const changeLatitude = (latitude: number) => {
        setCommonStore(state => {
            state.latitude = latitude;
        });
    };

    const changeLatitudeAndRemoveAddress = (latitude: number) => {
        setCommonStore(state => {
            state.latitude = latitude;
            state.address = '';
        });
    };

    const changeLongitude = (longitude: number) => {
        setCommonStore(state => {
            state.longitude = longitude;
        });
    };

    const changeMapZoom = (zoom: number) => {
        setCommonStore(state => {
            state.mapZoom = zoom;
        });
    };

    const changeMapTilt = (tilt: number) => {
        setCommonStore(state => {
            state.mapTilt = tilt;
        });
    };

    const changeMapType = (type: string) => {
        setCommonStore(state => {
            state.mapType = type;
        });
    };

    const sunAboveHorizon = sunlightDirection.y > 0;

    const collectDailyLightSensorData = () => {
        setCommonStore(state => {
            state.timesPerHour = 20;
        });
        setDailyLightSensorDataFlag(!dailyLightSensorDataFlag);
        setCommonStore(state => {
            state.showDailyLightSensorPanel = true;
        });
    };

    const collectYearlyLightSensorData = async () => {
        setCommonStore(state => {
            state.timesPerHour = 20;
        });
        setYearlyLightSensorDataFlag(!yearlyLightSensorDataFlag);
        setCommonStore(state => {
            state.showYearlyLightSensorPanel = true;
        });
    };

    console.log('x')

    return (
        <div className="App">
            <div style={{
                backgroundColor: 'lightblue',
                height: '72px',
                paddingTop: '10px',
                fontSize: '30px'
            }}>
                <img alt='Aladdin Logo' src={aladdinLogo} height='50px' style={{verticalAlign: 'middle'}}/>
                <span style={{paddingLeft: '20px', verticalAlign: 'middle'}}>Aladdin</span>
            </div>
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                zIndex: 999,
                fontSize: '12px',
                color: 'white'
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
                collectDailyLightSensorData={collectDailyLightSensorData}
                collectYearlyLightSensorData={collectYearlyLightSensorData}
            />
            {showGroundPanel &&
            <GroundPanel grid={grid}
                         groundImage={groundImage}
                         groundColor={groundColor}
                         setGrid={setGrid}
                         setGroundImage={setGroundImage}
                         setGroundColor={setGroundColor}
                         changeLatitude={changeLatitude}
                         changeLongitude={changeLongitude}
                         changeMapZoom={changeMapZoom}
                         changeMapTilt={changeMapTilt}
                         changeMapType={changeMapType}
            />}
            {showHeliodonPanel &&
            <HeliodonPanel latitude={latitude}
                           date={now}
                           heliodon={heliodon}
                           animateSun={animateSun}
                           changeDate={changeDate}
                           changeTime={changeTime}
                           changeLatitude={changeLatitudeAndRemoveAddress}
                           setHeliodon={setHeliodon}
                           setSunAnimation={setSunAnimation}
            />}
            {showYearlyLightSensorPanel && <YearlyLightSensorPanel city={city}/>}
            {showDailyLightSensorPanel && <DailyLightSensorPanel city={city}/>}
            {showWeatherPanel &&
            <WeatherPanel city={city}
                          graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]}
            />}
            <Dropdown key={'canvas-context-menu'}
                      trigger={['contextMenu']}
                      overlay={
                          <ContextMenu
                              city={city}
                              collectDailyLightSensorData={collectDailyLightSensorData}
                              collectYearlyLightSensorData={collectYearlyLightSensorData}
                          />
                      }>
                <div>
                    <Canvas shadows={true}
                            camera={{
                                position: cameraPosition,
                                fov: 90
                            }}
                            style={{height: 'calc(100vh - 70px)', backgroundColor: 'black'}}>
                        <OrbitController enabled={enableOrbitController}/>
                        <Suspense fallback={null}>
                            <ambientLight intensity={0.25} name={'Ambient Light'}/>
                            <directionalLight
                                name={'Directional Light'}
                                color='white'
                                position={[sunlightDirection.x, sunlightDirection.y, sunlightDirection.z]}
                                intensity={sunAboveHorizon ? 0.5 : 0}
                                castShadow
                                shadow-mapSize-height={512}
                                shadow-mapSize-width={512}
                            />
                            {grid && <gridHelper name={'Grid'} args={[500, 100, 'gray', 'gray']}/>}
                            <Compass/>
                            {/*<Obj/>*/}
                            <Simulation city={city}
                                        dailyLightSensorDataFlag={dailyLightSensorDataFlag}
                                        yearlyLightSensorDataFlag={yearlyLightSensorDataFlag}/>
                            {axes && <Axes/>}
                            <Ground/>
                            {groundImage && <GroundImage/>}
                            <Sky theme={theme} night={!sunAboveHorizon}/>
                            {heliodon &&
                            <Heliodon
                                hourAngle={hourAngle}
                                declinationAngle={declinationAngle}
                                radius={radius}
                                date={now}
                                latitude={Util.toRadians(latitude)}
                            />}
                            {world && <SceneContent world={world}/>}
                        </Suspense>
                    </Canvas>
                </div>
            </Dropdown>
            <AcceptCookie/>
        </div>
    );
};

export default App;
